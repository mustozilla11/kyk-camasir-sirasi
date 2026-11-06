import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { isAuthenticatedAdmin } from "@/lib/auth";
import { getIstanbulDate, formatDate } from "@/lib/date-utils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const isAuthed = await isAuthenticatedAdmin();
    if (!isAuthed) {
      return NextResponse.json(
        { success: false, error: "Yetkisiz erişim. Lütfen admin girişi yapın." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") || formatDate(getIstanbulDate());
    const query = searchParams.get("query") || "";

    const db = await getDb();

    let bookings;
    if (query.trim()) {
      const onlySelectedDate = searchParams.get("onlyDate") === "true";
      bookings = await db.searchBookings(query, onlySelectedDate ? date : undefined);
    } else {
      bookings = await db.getBookingsForDate(date);
    }

    return NextResponse.json({
      success: true,
      date,
      count: bookings.length,
      bookings,
    });
  } catch (error: any) {
    console.error("Admin bookings fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Kayıtlar getirilemedi." },
      { status: 500 }
    );
  }
}
