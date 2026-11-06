import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { APP_CONFIG } from "@/lib/config";
import {
  getIstanbulDate,
  formatDate,
  isWeekend,
  parseDate,
  isSlotPast,
} from "@/lib/date-utils";
import { isAuthenticatedAdmin } from "@/lib/auth";
import { SlotStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");

    const today = getIstanbulDate();
    const todayStr = formatDate(today);
    const selectedDateStr = dateParam || todayStr;

    // Hafta sonu kontrolü
    const selectedDate = parseDate(selectedDateStr);
    const isClosedWeekend = isWeekend(selectedDate);

    const db = await getDb();
    const isAdmin = await isAuthenticatedAdmin();

    const [bookings, maintenances] = await Promise.all([
      db.getBookingsForDate(selectedDateStr),
      db.getMaintenances(),
    ]);

    // Bakımdaki makineler ve kapalı günler haritası
    const machineMaintenanceMap = new Map<number, string>();
    let isDateClosed = isClosedWeekend;
    let dateCloseReason = isClosedWeekend ? "Hafta sonu çamaşırhane kapalıdır." : "";

    for (const m of maintenances) {
      if (m.type === "machine") {
        machineMaintenanceMap.set(Number(m.target), m.reason || "Arızalı / Bakımda");
      } else if (m.type === "date" && m.target === selectedDateStr) {
        isDateClosed = true;
        dateCloseReason = m.reason || "Özel kapalı gün / Resmi tatil";
      }
    }

    // Bookings haritası: `${time_slot}_${machine_number}`
    const bookingsMap = new Map<string, any>();
    for (const b of bookings) {
      bookingsMap.set(`${b.time_slot}_${b.machine_number}`, b);
    }

    // Slot grid'i oluştur
    const slots: SlotStatus[] = [];

    for (const timeSlot of APP_CONFIG.timeSlots) {
      const isPast = isSlotPast(selectedDateStr, timeSlot);

      for (const machineNumber of APP_CONFIG.machineNumbers) {
        const bookingKey = `${timeSlot}_${machineNumber}`;
        const booking = bookingsMap.get(bookingKey);
        const maintenanceReason = machineMaintenanceMap.get(machineNumber);
        const isMaintenance = Boolean(maintenanceReason) || isDateClosed;

        const slotStatus: SlotStatus = {
          time_slot: timeSlot,
          machine_number: machineNumber,
          isBooked: Boolean(booking),
          isMaintenance,
          maintenanceReason: isDateClosed ? dateCloseReason : maintenanceReason,
          isPast,
          isHealthInternMachine: APP_CONFIG.healthInternMachines.includes(machineNumber),
        };

        // Eğer admin ise oda/yatak bilgisini ekle, DEĞİLSE ASLA EKLEME (KVKK / Gizlilik)
        if (isAdmin && booking) {
          slotStatus.bookingDetails = {
            id: booking.id,
            floor: booking.floor,
            room: booking.room,
            bed: booking.bed,
            created_at: booking.created_at,
          };
        }

        slots.push(slotStatus);
      }
    }

    const availableSlotsCount = slots.filter(
      (s) => !s.isBooked && !s.isMaintenance && !s.isPast
    ).length;

    return NextResponse.json({
      success: true,
      date: selectedDateStr,
      isDateClosed,
      dateCloseReason,
      availableSlotsCount,
      totalMachines: APP_CONFIG.totalMachines,
      isAdmin,
      slots,
    });
  } catch (error: any) {
    console.error("Slots API error:", error);
    return NextResponse.json(
      { success: false, error: "Slotlar yüklenirken bir hata oluştu." },
      { status: 500 }
    );
  }
}
