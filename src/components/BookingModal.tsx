"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  ShieldAlert,
  Check,
  Loader2,
  Stethoscope,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  HelpCircle,
} from "lucide-react";
import { APP_CONFIG } from "@/lib/config";
import { formatTurkishDate } from "@/lib/date-utils";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  timeSlot: string;
  machineNumber: number;
  onSuccess: (bookingData: any) => void;
}

export function BookingModal({
  isOpen,
  onClose,
  selectedDate,
  timeSlot,
  machineNumber,
  onSuccess,
}: BookingModalProps) {
  const [step, setStep] = useState<"input" | "confirm">("input");
  const [floor, setFloor] = useState<number>(2);
  const [room, setRoom] = useState<string>("2116");
  const [bed, setBed] = useState<number>(1);
  const [isHealthConfirmed, setIsHealthConfirmed] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Cihazda kayıtlı oda/yatak bilgisi varsa otomatik doldur
  useEffect(() => {
    try {
      const saved = localStorage.getItem("kyk_saved_room");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.floor) setFloor(Number(parsed.floor));
        if (parsed.room) setRoom(String(parsed.room));
        if (parsed.bed) setBed(Number(parsed.bed));
      }
    } catch (e) {}
  }, []);

  if (!isOpen) return null;

  const isHealthInternMachine = APP_CONFIG.healthInternMachines.includes(machineNumber);

  const handleFloorChange = (newFloor: number) => {
    setFloor(newFloor);
    if (room.length >= 2) {
      setRoom(`${newFloor}${room.slice(1)}`);
    } else {
      setRoom(`${newFloor}101`);
    }
  };

  // 1. Adım: Giriş doğrulaması ve onay ekranına geçiş
  const handleProceedToConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanRoom = room.trim().toUpperCase();

    if (!cleanRoom) {
      setErrorMessage("Lütfen oda numaranızı girin.");
      return;
    }

    if (!cleanRoom.startsWith(String(floor))) {
      setErrorMessage(
        `${floor}. kat için oda numaranız ${floor} ile başlamalıdır (Örn: ${floor}116).`
      );
      return;
    }

    // Onay adımına geç
    setStep("confirm");
  };

  // 2. Adım: Kesinleştirme ve API isteği
  const handleFinalSubmit = async () => {
    if (isHealthInternMachine && !isHealthConfirmed) {
      setErrorMessage("Lütfen sağlık öğrencisi veya stajyer olduğunuzu onaylayınız.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const cleanRoom = room.trim().toUpperCase();

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_date: selectedDate,
          time_slot: timeSlot,
          machine_number: machineNumber,
          floor,
          room: cleanRoom,
          bed,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || "Sıra alınırken bir hata oluştu.");
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      onSuccess(data.booking);
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Bağlantı hatası oluştu. Lütfen tekrar deneyin.");
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Başlık */}
        <div
          className={`text-white px-6 py-4 flex items-center justify-between ${
            isHealthInternMachine
              ? "bg-gradient-to-r from-cyan-700 to-blue-800"
              : "bg-gradient-to-r from-red-700 to-red-800"
          }`}
        >
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">
                {step === "input" ? "1. Adım: Bilgiler" : "2. Adım: Onay & Kesinleştirme"}
              </span>
              {isHealthInternMachine && (
                <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded font-bold">
                  Stajyer & Sağlık
                </span>
              )}
            </div>
            <h3 className="text-lg font-extrabold">
              {step === "input" ? "Çamaşır Sırası Al" : "Emin Misiniz?"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Seçili Slot Özeti */}
        <div className="bg-slate-50 border-b border-slate-200/80 px-6 py-3 flex items-center justify-between text-xs text-slate-800 font-medium">
          <div>
            <span className="text-slate-400 block text-[10px]">TARİH</span>
            <span className="font-bold">{formatTurkishDate(selectedDate)}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">SAAT</span>
            <span className="font-bold">{timeSlot}</span>
          </div>
          <div className="text-right">
            <span className="text-slate-400 block text-[10px]">MAKİNE</span>
            <span
              className={`font-black text-sm ${
                isHealthInternMachine ? "text-cyan-800" : "text-red-700"
              }`}
            >
              Makine #{machineNumber}
            </span>
          </div>
        </div>

        {/* Hata Mesajı Alanı */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <div>{errorMessage}</div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* ADIM 1: KAT, ODA VE YATAK SEÇİM EKRANI                         */}
        {/* ------------------------------------------------------------- */}
        {step === "input" && (
          <form onSubmit={handleProceedToConfirm} className="p-6 space-y-4">
            {/* Stajyer & Sağlık Özel Uyarısı */}
            {isHealthInternMachine && (
              <div className="bg-cyan-50 border border-cyan-200 p-3 rounded-xl text-xs text-cyan-950 flex items-start gap-2">
                <Stethoscope className="w-4 h-4 text-cyan-700 flex-shrink-0 mt-0.5" />
                <div className="text-[11px] leading-snug">
                  <span className="font-bold text-cyan-900">Stajyer / Sağlık Makinesi: </span>
                  Bu makine (#7 ve #8) sağlık öğrencilerine ve stajyerlere ayrılmıştır.
                </div>
              </div>
            )}

            {/* Kat Seçimi */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Kat Seçimi
              </label>
              <div className="grid grid-cols-3 gap-2">
                {APP_CONFIG.floors.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => handleFloorChange(f)}
                    className={`py-2 px-3 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                      floor === f
                        ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {f}. Kat
                  </button>
                ))}
              </div>
            </div>

            {/* Oda Numarası */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Oda Numarası
              </label>
              <input
                type="text"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                placeholder={`Örn: ${floor}116, ${floor}105`}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500/30 focus:border-slate-600 transition-all uppercase"
                required
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                {floor}. kat için oda numaranız {floor} ile başlamalıdır.
              </span>
            </div>

            {/* Yatak Numarası */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Yatak Numarası (Odadaki 1-5)
              </label>
              <div className="grid grid-cols-5 gap-2">
                {APP_CONFIG.bedsPerRoom.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBed(b)}
                    className={`py-2 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                      bed === b
                        ? "bg-red-700 text-white border-red-700 shadow-xs scale-105"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    Yatak {b}
                  </button>
                ))}
              </div>
            </div>

            {/* Aksiyon Butonları */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-1/3 py-2.5 rounded-xl border border-slate-200 font-semibold text-xs text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="submit"
                className={`w-2/3 py-2.5 rounded-xl text-white font-bold text-xs tracking-wide shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer ${
                  isHealthInternMachine
                    ? "bg-cyan-700 hover:bg-cyan-800 shadow-cyan-700/20"
                    : "bg-red-700 hover:bg-red-800 shadow-red-700/20"
                }`}
              >
                <span>Devam Et</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* ------------------------------------------------------------- */}
        {/* ADIM 2: BİLGİ VE EMİN MİSİNİZ ONAY EKRANI                     */}
        {/* ------------------------------------------------------------- */}
        {step === "confirm" && (
          <div className="p-6 space-y-4 animate-in fade-in">
            {/* Özet Kartı */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2.5 text-xs">
              <div className="font-bold text-slate-700 text-[11px] uppercase tracking-wider border-b border-slate-200/80 pb-1 flex items-center justify-between">
                <span>Seçilen Sıra Bilgisi</span>
                <span className="font-black text-slate-900">
                  {isHealthInternMachine ? "Stajyer/Sağlık" : "Genel"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-700">
                <div>
                  <span className="text-slate-400 text-[10px] block">TARİH</span>
                  <span className="font-bold">{formatTurkishDate(selectedDate)}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">SAAT</span>
                  <span className="font-bold">{timeSlot}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">MAKİNE</span>
                  <span className="font-extrabold text-red-700">Makine #{machineNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">ODA VE YATAK</span>
                  <span className="font-extrabold text-slate-900">
                    Oda {room} — Yatak {bed}
                  </span>
                </div>
              </div>
            </div>

            {/* SAĞLIK VE STAJYER ÖĞRENCİ EKSTRA SORUSU */}
            {isHealthInternMachine && (
              <div className="bg-cyan-50/90 border-2 border-cyan-400 p-4 rounded-xl text-xs space-y-2.5">
                <div className="flex items-center gap-2 text-cyan-950 font-extrabold text-sm">
                  <Stethoscope className="w-5 h-5 text-cyan-700 flex-shrink-0" />
                  <span>Sağlık Öğrencisi veya Stajyer misiniz?</span>
                </div>
                <p className="text-cyan-900 text-xs leading-relaxed">
                  Makine #{machineNumber} yalnızca sağlık öğrencilerine ve stajyerlere tahsis edilmiştir. 
                  Çamaşır tesliminde <strong>yurt görevlisi öğrenci/staj kimliğinizi kontrol edecektir.</strong>
                </p>
                <label className="flex items-start gap-2.5 pt-1.5 cursor-pointer select-none bg-white p-2.5 rounded-lg border border-cyan-200">
                  <input
                    type="checkbox"
                    checked={isHealthConfirmed}
                    onChange={(e) => {
                      setIsHealthConfirmed(e.target.checked);
                      setErrorMessage(null);
                    }}
                    className="w-4 h-4 mt-0.5 text-cyan-700 rounded border-cyan-300 focus:ring-cyan-500 cursor-pointer"
                  />
                  <span className="font-bold text-cyan-950 text-xs leading-snug">
                    Evet, Sağlık Öğrencisiyim / Stajyerim. Görevliye kimliğimi göstereceğimi onaylıyorum.
                  </span>
                </label>
              </div>
            )}

            {/* EMİN MİSİNİZ UYARISI */}
            <div className="bg-amber-50 rounded-xl p-3.5 border border-amber-200 text-xs text-amber-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-950 text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0" />
                <span>Sırayı almak istediğinize emin misiniz?</span>
              </div>
              <p className="text-[11px] leading-relaxed pt-1">
                • <strong>Alınan çamaşır sırası iptal edilemez.</strong>
              </p>
              <p className="text-[11px] leading-relaxed">
                • Seçtiğiniz saatte çamaşırhanede bulunamayacaksanız lütfen sırayı almayınız.
              </p>
              {isHealthInternMachine && (
                <p className="text-[11px] leading-relaxed font-semibold text-cyan-950">
                  • Sağlık öğrencisi değilseniz çamaşırınız görevli tarafından teslim alınmayacaktır.
                </p>
              )}
            </div>

            {/* Onay Aksiyon Butonları */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setStep("input");
                  setErrorMessage(null);
                }}
                disabled={isLoading}
                className="w-1/3 py-2.5 rounded-xl border border-slate-200 font-semibold text-xs text-slate-600 hover:bg-slate-100 flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Düzenle</span>
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isLoading || (isHealthInternMachine && !isHealthConfirmed)}
                className={`w-2/3 py-2.5 rounded-xl text-white font-bold text-xs tracking-wide shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer ${
                  isHealthInternMachine
                    ? "bg-cyan-700 hover:bg-cyan-800 shadow-cyan-700/20"
                    : "bg-red-700 hover:bg-red-800 shadow-red-700/20"
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Kaydediliyor...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Evet, Sıramı Kesinleştir</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
