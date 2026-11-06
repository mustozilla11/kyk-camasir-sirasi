"use client";

import React, { useState } from "react";
import { X, AlertTriangle, Loader2, CheckCircle2 } from "lucide-react";
import { APP_CONFIG } from "@/lib/config";

interface CancelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CancelModal({ isOpen, onClose, onSuccess }: CancelModalProps) {
  const [room, setRoom] = useState("");
  const [bed, setBed] = useState<number>(1);
  const [cancelCode, setCancelCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanRoom = room.trim().toUpperCase();
    const cleanCode = cancelCode.trim().toUpperCase();

    if (!cleanRoom || !cleanCode) {
      setErrorMessage("Oda numarası ve İptal Kodu zorunludur.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/bookings/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room: cleanRoom,
          bed,
          cancel_code: cleanCode,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || "İptal işlemi gerçekleştirilemedi.");
        setIsLoading(false);
        return;
      }

      setSuccessMessage(data.message);
      setIsLoading(false);

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1800);
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Bağlantı hatası oluştu.");
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Başlık */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
              Sıra Yönetimi
            </span>
            <h3 className="text-lg font-extrabold">Çamaşır Sıranı İptal Et</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div>{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>{successMessage}</div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Oda Numarası
            </label>
            <input
              type="text"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="Örn: 2116"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500/30 focus:border-slate-600 transition-all uppercase"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Yatak Numarası
            </label>
            <div className="grid grid-cols-5 gap-2">
              {APP_CONFIG.bedsPerRoom.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBed(b)}
                  className={`py-2 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                    bed === b
                      ? "bg-slate-800 text-white border-slate-800 shadow-xs"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  Yatak {b}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Sıra Alırken Verilen İptal Kodu
            </label>
            <input
              type="text"
              value={cancelCode}
              onChange={(e) => setCancelCode(e.target.value)}
              placeholder="Örn: K7A9X2"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500/30 focus:border-slate-600 transition-all font-mono uppercase"
              required
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Sıra aldığınızda size verilen 6 haneli kod.
            </span>
          </div>

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
              className="w-2/3 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-xs tracking-wide shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>İptal Ediliyor...</span>
                </>
              ) : (
                <span>Sırayı İptal Et</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
