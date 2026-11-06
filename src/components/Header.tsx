"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, ShieldCheck, Clock, XCircle, KeyRound } from "lucide-react";

interface HeaderProps {
  onOpenCancelModal: () => void;
}

export function Header({ onOpenCancelModal }: HeaderProps) {
  return (
    <header className="bg-gradient-to-r from-red-700 via-red-800 to-rose-900 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Logo & Başlık */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center shadow-inner">
              <span className="text-2xl" role="img" aria-label="çamaşır makinesi">
                🧺
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider bg-red-950/60 px-2 py-0.5 rounded text-red-200 border border-red-500/30">
                  GSB KYK Yurdu
                </span>
                <span className="text-xs bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 px-2 py-0.5 rounded flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Sıfır Kişisel Veri
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight mt-0.5">
                Çamaşırhane Randevu & Sıra Sistemi
              </h1>
            </div>
          </div>

          {/* Hızlı Aksiyon Butonları */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={onOpenCancelModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <XCircle className="w-4 h-4 text-red-300" />
              <span>Sıramı İptal Et</span>
            </button>
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold bg-white text-red-800 hover:bg-red-50 transition-all shadow-sm active:scale-95"
            >
              <KeyRound className="w-4 h-4 text-red-700" />
              <span>Yönetici / Görevli</span>
            </Link>
          </div>
        </div>

        {/* Bilgilendirme Rozetleri */}
        <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-red-100">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-medium">8 Adet Çamaşır Makinesi</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-red-200" />
            <span>Çalışma Saatleri: 13:30 - 21:30 (Slotlar: 1 Saat)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="bg-red-950/70 px-1.5 py-0.5 rounded text-[11px] font-semibold text-amber-300">
              Hafta Sonu Kapalı
            </span>
          </div>
          <div className="flex items-center gap-1.5 ml-auto text-amber-200 font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Kural: 1 yatak 7 günde en fazla 2 sıra alabilir</span>
          </div>
        </div>
      </div>
    </header>
  );
}
