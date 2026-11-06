import { NextRequest, NextResponse } from "next/server";
import { getYurtPin, setYurtPin } from "@/lib/db";
import { isAuthenticatedAdmin } from "@/lib/auth";
import { getSuggestedMonthlyPin } from "@/lib/date-utils";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const isAuthed = await isAuthenticatedAdmin();
    if (!isAuthed) {
      return NextResponse.json({ success: false, error: "Yetkisiz erişim" }, { status: 401 });
    }

    const yurtPin = await getYurtPin();
    const suggestedPin = getSuggestedMonthlyPin();

    return NextResponse.json({
      success: true,
      yurtPin,
      suggestedPin,
    });
  } catch (error: any) {
    console.error("Settings GET error:", error);
    return NextResponse.json({ success: false, error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAuthed = await isAuthenticatedAdmin();
    if (!isAuthed) {
      return NextResponse.json({ success: false, error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { yurtPin } = await request.json();
    const cleanPin = String(yurtPin || "").trim().toUpperCase();

    if (!cleanPin || cleanPin.length < 3) {
      return NextResponse.json(
        { success: false, error: "Yurt şifresi en az 3 karakter olmalıdır." },
        { status: 400 }
      );
    }

    await setYurtPin(cleanPin);

    return NextResponse.json({
      success: true,
      message: "Yurt giriş şifresi başarıyla güncellendi.",
      yurtPin: cleanPin,
    });
  } catch (error: any) {
    console.error("Settings POST error:", error);
    return NextResponse.json({ success: false, error: "Sunucu hatası" }, { status: 500 });
  }
}
