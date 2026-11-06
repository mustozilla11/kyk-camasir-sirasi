"use client";

import React, { useState } from "react";
import { X, ShieldAlert, Check, Loader2, Sparkles } from "lucide-react";
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
  const [floor, setFloor] = useState<number>(2);
  const [room, setRoom] = useState<string>("2116");
  const [bed, setBed] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Kat değiştiğinde örnek oda numarasını uyarla
  const handleFloorChange = (newFloor: number) => {
    setFloor(newFloor);
    // Otomatik oda başlangıcını güncelle
    if (room.length >= 2) {
      setRoom(`${newFloor}${room.slice(1)}`);
    } else {
      setRoom(`${newFloor}101`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const cleanRoom = room.trim().toUpperCase();

    if (!cleanRoom) {
      setErrorMessage("Lütfen oda numaranızı girin.");
      setIsLoading(false);
      return;
    }

    if (!cleanRoom.startsWith(String(floor))) {
      setErrorMessage(`${floor}. kat için oda numaranız ${floor} ile başlamalıdır (Örn: ${floor}116).`);
      setIsLoading(false);
      return;
    }

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

      // Success
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
        <div className="bg-gradient-to-r from-red-700 to-red-800 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-red-200">
              Sıra Alma Onayı
            </span>
            <h3 className="text-lg font-extrabold">Çamaşır Sırası Al</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-red-100 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Seçili Slot Özeti */}
        <div className="bg-red-50/70 border-b border-red-100 px-6 py-3 flex items-center justify-between text-xs text-red-950 font-medium">
          <div>
            <span className="text-slate-500 block text-[10px]">TARİH</span>
            <span className="font-bold">{formatTurkishDate(selectedDate)}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">SAAT</span>
            <span className="font-bold">{timeSlot}</span>
          </div>
          <div className="text-right">
            <span className="text-slate-500 block text-[10px]">MAKİNE</span>
            <span className="font-extrabold text-red-700 text-sm">Makine #{machineNumber}</span>
          </div>
        </div>

        {/* Form Alanı */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div>{errorMessage}</div>
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
                      ? "bg-red-700 text-white border-red-700 shadow-xs"
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
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-600/30 focus:border-red-600 transition-all"
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

          {/* Gizlilik & Kural Hatırlatması */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70 text-[11px] text-slate-600 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Önemli Kurallar:</span>
            </div>
            <p>• Bu yatak için son 7 günde en fazla 2 sıra alınabilir.</p>
            <p>• Ad, soyad, telefon veya TC gibi kişisel veriler sistemde tutulmaz.</p>
          </div>

          {/* Aksiyon Butonları */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="w-1/3 py-2.5 rounded-xl border border-slate-200 font-semibold text-xs text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="w-2/3 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-xs tracking-wide shadow-md shadow-red-700/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Kaydediliyor...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Sırayı Onayla</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
