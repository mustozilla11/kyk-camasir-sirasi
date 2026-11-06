import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GSB KYK Yurdu Çamaşır Sırası Sistemi",
  description: "GSB KYK Yurdu çamaşırhane sıra ve randevu sistemi.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="h-full">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 antialiased selection:bg-red-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
