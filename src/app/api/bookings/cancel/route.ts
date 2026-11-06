import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { room, bed, cancel_code } = body;

    if (!room || !bed || !cancel_code) {
      return NextResponse.json(
        { success: false, error: "Oda numarası, yatak numarası ve İptal Kodu zorunludur." },
        { status: 400 }
      );
    }

    const cleanRoom = String(room).trim().toUpperCase();
    const bedNum = Number(bed);
    const cleanCode = String(cancel_code).trim().toUpperCase();

    const db = await getDb();
    const deleted = await db.deleteBookingWithCode(cleanRoom, bedNum, cleanCode);

    if (!deleted) {
      return NextResponse.json(
        {
          success: false,
          error: "Eşleşen aktif bir randevu bulunamadı. Lütfen oda, yatak ve iptal kodunuzu kontrol edin.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${deleted.booking_date} tarihindeki (${deleted.time_slot}) sıranız iptal edilmiştir. Sıra hakkınız geri tanımlandı.`,
      deletedBooking: {
        booking_date: deleted.booking_date,
        time_slot: deleted.time_slot,
        machine_number: deleted.machine_number,
      },
    });
  } catch (error: any) {
    console.error("Cancel booking error:", error);
    return NextResponse.json(
      { success: false, error: "İptal işlemi sırasında bir hata oluştu." },
      { status: 500 }
    );
  }
}
