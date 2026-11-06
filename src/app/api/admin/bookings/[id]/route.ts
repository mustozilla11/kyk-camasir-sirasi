import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { isAuthenticatedAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuthed = await isAuthenticatedAdmin();
    if (!isAuthed) {
      return NextResponse.json(
        { success: false, error: "Yetkisiz erişim." },
        { status: 401 }
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Kayıt ID'si belirtilmedi." },
        { status: 400 }
      );
    }

    const db = await getDb();
    const success = await db.deleteBooking(id);

    if (!success) {
      return NextResponse.json(
        { success: false, error: "Silinecek kayıt bulunamadı." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Randevu başarıyla silindi.",
    });
  } catch (error: any) {
    console.error("Admin booking delete error:", error);
    return NextResponse.json(
      { success: false, error: "Silme işlemi sırasında hata oluştu." },
      { status: 500 }
    );
  }
}
