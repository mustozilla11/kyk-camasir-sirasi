import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { isAuthenticatedAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const isAuthed = await isAuthenticatedAdmin();
    if (!isAuthed) {
      return NextResponse.json({ success: false, error: "Yetkisiz erişim" }, { status: 401 });
    }
    const db = await getDb();
    const maintenances = await db.getMaintenances();
    return NextResponse.json({ success: true, maintenances });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Hata" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAuthed = await isAuthenticatedAdmin();
    if (!isAuthed) {
      return NextResponse.json({ success: false, error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { type, target, reason } = await request.json();
    if (!type || !target) {
      return NextResponse.json({ success: false, error: "Tip ve hedef zorunlu" }, { status: 400 });
    }

    const db = await getDb();
    await db.addMaintenance(type, String(target), reason);

    return NextResponse.json({ success: true, message: "Bakım/Kapatma durumu güncellendi." });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Hata oluştu" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const isAuthed = await isAuthenticatedAdmin();
    if (!isAuthed) {
      return NextResponse.json({ success: false, error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { type, target } = await request.json();
    const db = await getDb();
    await db.removeMaintenance(type, String(target));

    return NextResponse.json({ success: true, message: "Bakım durumu kaldırıldı." });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Hata oluştu" }, { status: 500 });
  }
}
