import { NextRequest, NextResponse } from "next/server";
import { setAdminSessionCookie } from "@/lib/auth";
import { APP_CONFIG } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { success: false, error: "Şifre alanı boş bırakılamaz." },
        { status: 400 }
      );
    }

    // Compare with configured admin password
    const expectedPassword = process.env.ADMIN_PASSWORD || APP_CONFIG.defaultAdminPassword;

    if (password !== expectedPassword) {
      return NextResponse.json(
        { success: false, error: "Hatalı yönetici şifresi." },
        { status: 401 }
      );
    }

    await setAdminSessionCookie();

    return NextResponse.json({
      success: true,
      message: "Yönetici girişi başarılı.",
    });
  } catch (error: any) {
    console.error("Admin login error:", error);
    return NextResponse.json(
      { success: false, error: "Giriş yapılırken bir hata oluştu." },
      { status: 500 }
    );
  }
}
