"use client";

import React, { useState } from "react";
import { CheckCircle2, Copy, Check, Sparkles, AlertCircle } from "lucide-react";
import { formatTurkishDate } from "@/lib/date-utils";

interface BookingSuccessModalProps {
  booking: {
    id: string;
    booking_date: string;
    time_slot: string;
    machine_number: number;
    floor: number;
    room: string;
    bed: number;
    cancel_code: string;
  } | null;
  onClose: () => void;
}

export function BookingSuccessModal({ booking, onClose }: BookingSuccessModalProps) {
  const [copied, setCopied] = useState(false);

  if (!booking) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(booking.cancel_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Üst Onay Alanı */}
        <div className="bg-gradient-to-b from-emerald-600 to-emerald-700 text-white p-6 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <span className="text-xs uppercase font-extrabold tracking-wider bg-emerald-800/60 px-3 py-1 rounded-full text-emerald-100 border border-emerald-400/30">
            Sıra Başarıyla Alındı
          </span>
          <h2 className="text-xl font-black mt-2">Randevunuz Hazır!</h2>
        </div>

        {/* Detay Kartı */}
        <div className="p-6 space-y-4">
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3">
            <div className="flex justify-between items-center text-xs border-b border-slate-200/60 pb-2">
              <span className="text-slate-500 font-medium">Tarih</span>
              <span className="font-bold text-slate-800">
                {formatTurkishDate(booking.booking_date)}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs border-b border-slate-200/60 pb-2">
              <span className="text-slate-500 font-medium">Saat Aralığı</span>
              <span className="font-bold text-slate-800">{booking.time_slot}</span>
            </div>

            <div className="flex justify-between items-center text-xs border-b border-slate-200/60 pb-2">
              <span className="text-slate-500 font-medium">Çamaşır Makinesi</span>
              <span className="font-extrabold text-emerald-700 text-sm">
                Makine #{booking.machine_number}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Oda ve Yatak</span>
              <span className="font-extrabold text-slate-900 bg-slate-200/80 px-2 py-0.5 rounded">
                Oda {booking.room} — Yatak {booking.bed}
              </span>
            </div>
          </div>

          {/* İptal Kodu Kutusu */}
          <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 text-center">
            <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Sıra İptal Kodunuz</span>
            </div>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="text-2xl font-black tracking-widest text-slate-900 bg-white px-4 py-1.5 rounded-xl border border-amber-300 font-mono shadow-xs">
                {booking.cancel_code}
              </span>
              <button
                onClick={handleCopyCode}
                title="Kodu Kopyala"
                className="p-2.5 rounded-xl bg-white border border-amber-300 text-amber-800 hover:bg-amber-100 transition-colors cursor-pointer"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-[11px] text-amber-700 mt-2">
              Sıranızı iptal etmek isterseniz bu koda ihtiyacınız olacak.
            </p>
          </div>

          {/* Görevli Hatırlatması */}
          <div className="flex items-start gap-2.5 text-xs text-slate-600 bg-blue-50/70 p-3 rounded-xl border border-blue-200/70">
            <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-blue-900">Görevliye Teşhis: </span>
              Çamaşırhaneye gittiğinizde görevliye sadece{" "}
              <strong>Oda: {booking.room}, Yatak: {booking.bed}</strong> bilginizi
              söylemeniz yeterlidir. Görevli dökümandan teyit edecektir.
            </div>
          </div>

          {/* Kapat Butonu */}
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs tracking-wider shadow-md transition-all active:scale-95 cursor-pointer"
          >
            Tamam, Ekran Görüntüsü Aldım
          </button>
        </div>
      </div>
    </div>
  );
}
