import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Optional CRON_SECRET verification if configured on Vercel
    const authHeader = request.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    const deletedCount = await db.cleanupOldBookings(7);

    return NextResponse.json({
      success: true,
      message: `${deletedCount} adet 7 günden eski randevu temizlendi.`,
      deletedCount,
    });
  } catch (error: any) {
    console.error("Cron cleanup error:", error);
    return NextResponse.json({ success: false, error: "Temizleme hatası" }, { status: 500 });
  }
}
