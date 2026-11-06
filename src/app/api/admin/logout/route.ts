import { NextResponse } from "next/server";
import { removeAdminSessionCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  await removeAdminSessionCookie();
  return NextResponse.json({
    success: true,
    message: "Çıkış yapıldı.",
  });
}
