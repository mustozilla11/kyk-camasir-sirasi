"use client";

import React from "react";
import { CheckCircle2, AlertCircle, Stethoscope, Sparkles } from "lucide-react";
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
    isHealthInternMachine?: boolean;
  } | null;
  onClose: () => void;
}

export function BookingSuccessModal({ booking, onClose }: BookingSuccessModalProps) {
  if (!booking) return null;

  const isHealth = booking.isHealthInternMachine || booking.machine_number >= 7;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white w-full max-w-md max-h-[92vh] flex flex-col rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Üst Onay Alanı */}
        <div
          className={`p-5 sm:p-6 text-center text-white flex-shrink-0 ${
            isHealth
              ? "bg-gradient-to-b from-cyan-700 to-blue-800"
              : "bg-gradient-to-b from-emerald-600 to-emerald-700"
          }`}
        >
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 shadow-inner">
            <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </div>
          <span className="text-[10px] sm:text-xs uppercase font-extrabold tracking-wider bg-black/20 px-3 py-1 rounded-full text-white border border-white/20">
            Sıra Başarıyla Kaydedildi
          </span>
          <h2 className="text-lg sm:text-xl font-black mt-1.5 sm:mt-2">Randevunuz Hazır!</h2>
        </div>

        {/* Detay Kartı */}
        <div className="p-5 sm:p-6 space-y-3.5 sm:space-y-4 overflow-y-auto flex-1">
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3">
            <div className="flex justify-between items-center text-xs border-b border-slate-200/60 pb-2">
              <span className="text-slate-500 font-medium">Tarih</span>
              <span className="font-bold text-slate-900">
                {formatTurkishDate(booking.booking_date)}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs border-b border-slate-200/60 pb-2">
              <span className="text-slate-500 font-medium">Saat Aralığı</span>
              <span className="font-bold text-slate-900">{booking.time_slot}</span>
            </div>

            <div className="flex justify-between items-center text-xs border-b border-slate-200/60 pb-2">
              <span className="text-slate-500 font-medium">Çamaşır Makinesi</span>
              <div className="text-right">
                <span
                  className={`font-black text-sm block ${
                    isHealth ? "text-cyan-800" : "text-emerald-700"
                  }`}
                >
                  Makine #{booking.machine_number}
                </span>
                {isHealth && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-cyan-700 bg-cyan-100 px-1.5 py-0.2 rounded">
                    <Stethoscope className="w-3 h-3" /> Stajyer / Sağlık
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Kat, Oda ve Yatak</span>
              <span className="font-extrabold text-slate-900 bg-slate-200/80 px-2 py-0.5 rounded">
                {booking.floor}. Kat • Oda {booking.room} — Yatak {booking.bed}
              </span>
            </div>
          </div>

          {/* Görevli Teşhis Açıklaması */}
          <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-200 text-xs text-slate-700 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-blue-900">
              <AlertCircle className="w-4 h-4 text-blue-600" />
              <span>Görevli Teyidi ve Teslim:</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Çamaşırhaneye gittiğinizde görevliye sadece <strong>Oda {booking.room}, Yatak {booking.bed}</strong> bilginizi söyleyiniz. Görevli elindeki resmi çizelgeden sıranızı kontrol edecektir.
            </p>
            {isHealth && (
              <p className="text-[11px] text-cyan-900 font-semibold bg-cyan-100/60 p-1.5 rounded border border-cyan-200">
                ⚠️ Makine #{booking.machine_number} sağlık/stajyer makinesi olduğu için görevli kimliğinizi kontrol edecektir.
              </p>
            )}
          </div>

          {/* İptal Edilemez Uyarısı */}
          <div className="text-center text-[11px] text-amber-800 font-medium bg-amber-50 py-2 px-3 rounded-xl border border-amber-200/80">
            📌 Yurt kuralı gereğince alınan çamaşır sırası iptal edilemez.
          </div>

          {/* Kapat Butonu */}
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs tracking-wider shadow-md transition-all active:scale-95 cursor-pointer"
          >
            Tamam, Anladım
          </button>
        </div>
      </div>
    </div>
  );
}
