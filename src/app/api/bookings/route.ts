import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { APP_CONFIG } from "@/lib/config";
import {
  getIstanbulDate,
  formatDate,
  parseDate,
  isWeekend,
  isSlotPast,
  generateCancelCode,
  formatTurkishDate,
} from "@/lib/date-utils";
import crypto from "crypto";

export const dynamic = "force-dynamic";

async function verifyTurnstile(token?: string, ip?: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    // If not configured, bypass for smooth zero-config local dev
    return true;
  }
  if (!token) return false;

  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret,
          response: token,
          remoteip: ip || "",
        }),
      }
    );
    const data = await res.json();
    return Boolean(data.success);
  } catch (err) {
    console.error("Turnstile verification error:", err);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      booking_date,
      time_slot,
      machine_number,
      floor,
      room,
      bed,
      turnstileToken,
    } = body;

    // 1. Bot koruması kontrolü
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      "";
    const isBotValid = await verifyTurnstile(turnstileToken, clientIp);
    if (!isBotValid) {
      return NextResponse.json(
        { success: false, error: "Güvenlik doğrulaması (Bot koruması) başarısız oldu." },
        { status: 400 }
      );
    }

    // 2. Zorunlu alan kontrolü
    if (
      !booking_date ||
      !time_slot ||
      !machine_number ||
      !floor ||
      !room ||
      !bed
    ) {
      return NextResponse.json(
        { success: false, error: "Tüm alanların doldurulması zorunludur." },
        { status: 400 }
      );
    }

    const machineNum = Number(machine_number);
    const floorNum = Number(floor);
    const bedNum = Number(bed);
    const cleanRoom = String(room).trim().toUpperCase();

    // 3. Geçerlilik kontrolleri
    if (!APP_CONFIG.machineNumbers.includes(machineNum)) {
      return NextResponse.json(
        { success: false, error: "Geçersiz makine numarası seçildi (1-8 arası olmalıdır)." },
        { status: 400 }
      );
    }

    if (!APP_CONFIG.floors.includes(floorNum)) {
      return NextResponse.json(
        { success: false, error: "Geçersiz kat seçildi (1, 2 veya 3 olmalıdır)." },
        { status: 400 }
      );
    }

    if (!APP_CONFIG.bedsPerRoom.includes(bedNum)) {
      return NextResponse.json(
        { success: false, error: "Geçersiz yatak numarası seçildi (1-5 arası olmalıdır)." },
        { status: 400 }
      );
    }

    // Kat ve oda numarası uyumu (örnek: 2. kat ise oda 2 ile başlamalı)
    if (!cleanRoom.startsWith(String(floorNum))) {
      return NextResponse.json(
        {
          success: false,
          error: `${floorNum}. kat için girdiğiniz oda numarası (${cleanRoom}) kat numarasıyla başlamalıdır (örn: ${floorNum}101, ${floorNum}116).`,
        },
        { status: 400 }
      );
    }

    if (!APP_CONFIG.timeSlots.includes(time_slot)) {
      return NextResponse.json(
        { success: false, error: "Geçersiz saat aralığı seçildi." },
        { status: 400 }
      );
    }

    // 4. Tarih ve Hafta sonu kontrolleri
    const today = getIstanbulDate();
    const todayStr = formatDate(today);
    const targetDate = parseDate(booking_date);

    if (booking_date < todayStr) {
      return NextResponse.json(
        { success: false, error: "Geçmiş bir tarihe sıra alamazsınız." },
        { status: 400 }
      );
    }

    // 7 gün ileri sınırı
    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + APP_CONFIG.maxAdvanceDays);
    const maxDateStr = formatDate(maxDate);

    if (booking_date > maxDateStr) {
      return NextResponse.json(
        {
          success: false,
          error: `En fazla ${APP_CONFIG.maxAdvanceDays} gün sonrasına (${maxDateStr}) kadar sıra alabilirsiniz.`,
        },
        { status: 400 }
      );
    }

    if (isWeekend(targetDate)) {
      return NextResponse.json(
        {
          success: false,
          error: "Hafta sonu (Cumartesi / Pazar) çamaşırhane kapalıdır. Sıra alınamaz.",
        },
        { status: 400 }
      );
    }

    // Geçmiş saat kontrolü (bugün için)
    if (isSlotPast(booking_date, time_slot)) {
      return NextResponse.json(
        { success: false, error: "Seçilen saat dilimi geride kaldı, lütfen ileri bir saat seçin." },
        { status: 400 }
      );
    }

    const db = await getDb();

    // 5. Bakım veya kapalı gün kontrolü
    const maintenances = await db.getMaintenances();
    for (const m of maintenances) {
      if (m.type === "machine" && Number(m.target) === machineNum) {
        return NextResponse.json(
          {
            success: false,
            error: `Makine ${machineNum} şu anda arızalı veya bakımda: ${m.reason || "Kullanım dışı"}`,
          },
          { status: 400 }
        );
      }
      if (m.type === "date" && m.target === booking_date) {
        return NextResponse.json(
          {
            success: false,
            error: `Seçilen tarihte (${booking_date}) çamaşırhane kapalıdır: ${m.reason || "Kullanım dışı"}`,
          },
          { status: 400 }
        );
      }
    }

    // 6. Slot çakışması kontrolü (Concurrency / Double-booking)
    const existingSlot = await db.findBooking(booking_date, time_slot, machineNum);
    if (existingSlot) {
      return NextResponse.json(
        {
          success: false,
          error: "Bu makine ve saat için az önce başka bir öğrenci sıra aldı. Lütfen başka bir slot seçin.",
        },
        { status: 409 }
      );
    }

    // 7. Yatak Başına Aktif Randevu Kontrolü (En fazla 2 aktif randevu)
    const activeBookings = await db.getActiveBookingsForBed(cleanRoom, bedNum);
    if (activeBookings.length >= APP_CONFIG.maxBookingsPerBedIn7Days) {
      const activeSummary = activeBookings
        .map((b) => `${formatTurkishDate(b.booking_date)} ${b.time_slot} (Makine #${b.machine_number})`)
        .join(" ve ");
      return NextResponse.json(
        {
          success: false,
          error: `Oda ${cleanRoom}, Yatak ${bedNum} için sistemde zaten 2 aktif randevunuz bulunmaktadır: [${activeSummary}]. Yeni sıra alabilmek için bu sıralardan birinin tamamlanmasını bekleyin veya 'Sıramı İptal Et' menüsünden iptal edin.`,
        },
        { status: 400 }
      );
    }

    // 8. Sıra oluşturma
    const bookingId = crypto.randomUUID();
    const cancelCode = generateCancelCode();
    const newBooking = {
      id: bookingId,
      booking_date,
      time_slot,
      machine_number: machineNum,
      floor: floorNum,
      room: cleanRoom,
      bed: bedNum,
      cancel_code: cancelCode,
      created_at: new Date().toISOString(),
    };

    await db.createBooking(newBooking);

    return NextResponse.json({
      success: true,
      message: "Çamaşır sıranız başarıyla alındı!",
      booking: {
        id: newBooking.id,
        booking_date: newBooking.booking_date,
        time_slot: newBooking.time_slot,
        machine_number: newBooking.machine_number,
        floor: newBooking.floor,
        room: newBooking.room,
        bed: newBooking.bed,
        cancel_code: newBooking.cancel_code,
      },
    });
  } catch (error: any) {
    console.error("Booking creation error:", error);
    // Unique constraint violation handling
    if (error?.message?.includes("UNIQUE") || error?.code === "23505") {
      return NextResponse.json(
        {
          success: false,
          error: "Bu slot için aynı anda başka bir istek onaylandı. Lütfen başka bir slot seçin.",
        },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Sıra kaydı yapılırken bir hata oluştu." },
      { status: 500 }
    );
  }
}
