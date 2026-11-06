"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/Header";
import { DateSelector } from "@/components/DateSelector";
import { SlotGrid } from "@/components/SlotGrid";
import { BookingModal } from "@/components/BookingModal";
import { BookingSuccessModal } from "@/components/BookingSuccessModal";
import { SlotStatus } from "@/lib/types";
import { getSelectableDays, getIstanbulDate, formatDate, formatTurkishDate } from "@/lib/date-utils";
import { Loader2, RefreshCw, Info, Sparkles, Stethoscope, Eye } from "lucide-react";

export default function HomePage() {
  const [days, setDays] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [slots, setSlots] = useState<SlotStatus[]>([]);
  const [isDateClosed, setIsDateClosed] = useState(false);
  const [dateCloseReason, setDateCloseReason] = useState("");
  const [availableSlotsCount, setAvailableSlotsCount] = useState<number>(0);
  const [isLoadingSlots, setIsLoadingSlots] = useState(true);

  // Bu cihazda alınan sıralar (Kullanıcıya özel "SENİN SIRAN" görünümü için)
  const [myBookings, setMyBookings] = useState<any[]>([]);

  // Modal states
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedSlotForBooking, setSelectedSlotForBooking] = useState<{
    timeSlot: string;
    machineNumber: number;
  } | null>(null);

  const [confirmedBooking, setConfirmedBooking] = useState<any | null>(null);

  // Initialize selectable days & load myBookings from localStorage
  useEffect(() => {
    const selectable = getSelectableDays(7);
    setDays(selectable);
    if (selectable.length > 0) {
      setSelectedDate(selectable[0].date);
    } else {
      const today = getIstanbulDate();
      setSelectedDate(formatDate(today));
    }

    try {
      const saved = localStorage.getItem("kyk_my_bookings");
      if (saved) {
        const parsed = JSON.parse(saved);
        const todayStr = formatDate(getIstanbulDate());
        // Geçmiş günleri temizle
        const active = parsed.filter((b: any) => b.booking_date >= todayStr);
        setMyBookings(active);
        localStorage.setItem("kyk_my_bookings", JSON.stringify(active));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Fetch slots for selected date
  const loadSlots = useCallback(async (date: string) => {
    if (!date) return;
    setIsLoadingSlots(true);
    try {
      const res = await fetch(`/api/slots?date=${date}`);
      const data = await res.json();
      if (data.success) {
        setSlots(data.slots || []);
        setIsDateClosed(data.isDateClosed || false);
        setDateCloseReason(data.dateCloseReason || "");
        setAvailableSlotsCount(data.availableSlotsCount || 0);
      }
    } catch (err) {
      console.error("Failed to load slots:", err);
    } finally {
      setIsLoadingSlots(false);
    }
  }, []);

  useEffect(() => {
    if (selectedDate) {
      loadSlots(selectedDate);
    }
  }, [selectedDate, loadSlots]);

  const handleSelectSlot = (timeSlot: string, machineNumber: number) => {
    setSelectedSlotForBooking({ timeSlot, machineNumber });
    setIsBookingOpen(true);
  };

  const handleBookingSuccess = (booking: any) => {
    setIsBookingOpen(false);
    setConfirmedBooking(booking);

    // Cihaza kaydet (Sadece bu öğrencinin cihazında "SENİN SIRAN" olarak gözükecek)
    try {
      const updated = [...myBookings, booking];
      setMyBookings(updated);
      localStorage.setItem("kyk_my_bookings", JSON.stringify(updated));
      localStorage.setItem(
        "kyk_saved_room",
        JSON.stringify({ floor: booking.floor, room: booking.room, bed: booking.bed })
      );
    } catch (e) {
      console.error(e);
    }

    loadSlots(selectedDate);
  };

  // En yakın yaklaşan sıra
  const upcomingBooking = myBookings.length > 0 ? myBookings[0] : null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-100/70">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* KULLANICININ AKTİF SIRASI VARSA ÖZEL BİLDİRİM KARTI */}
        {upcomingBooking && (
          <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-lg border border-indigo-700/60 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-amber-300 shadow-inner flex-shrink-0">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-indigo-500/40 text-amber-300 px-2 py-0.5 rounded border border-indigo-400/30">
                    Senin Aktif Sıran
                  </span>
                  {upcomingBooking.machine_number >= 7 && (
                    <span className="text-[10px] font-bold text-cyan-200 bg-cyan-900/80 px-2 py-0.5 rounded border border-cyan-400/30 flex items-center gap-1">
                      <Stethoscope className="w-3 h-3" /> Stajyer / Sağlık
                    </span>
                  )}
                </div>
                <h3 className="text-base sm:text-lg font-black mt-1 text-white">
                  {formatTurkishDate(upcomingBooking.booking_date)} • {upcomingBooking.time_slot}
                </h3>
                <p className="text-xs text-indigo-200 mt-0.5">
                  <strong className="text-white">Makine #{upcomingBooking.machine_number}</strong> • Oda {upcomingBooking.room}, Yatak {upcomingBooking.bed}
                </p>
              </div>
            </div>

            <button
              onClick={() => setConfirmedBooking(upcomingBooking)}
              className="self-start sm:self-auto inline-flex items-center gap-1.5 px-4 py-2.5 bg-white text-indigo-950 hover:bg-indigo-50 rounded-xl text-xs font-extrabold shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <Eye className="w-4 h-4 text-indigo-700" />
              <span>Sıra Detayını Gör</span>
            </button>
          </div>
        )}

        {/* Bilgilendirme Kartı */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200/80 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-red-50 text-red-700 flex-shrink-0">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Çamaşır Sırası Nasıl Alınır?
              </h2>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                1. Günü seçin. &nbsp;•&nbsp; 
                2. Boş bir makineye tıklayın (Makine #7 ve #8 Stajyer/Sağlık öğrencilerine ayrılmıştır). &nbsp;•&nbsp; 
                3. Kat, Oda ve Yatak bilginizi girip onaylayarak sıranızı kesinleştirin.
              </p>
            </div>
          </div>

          <button
            onClick={() => loadSlots(selectedDate)}
            disabled={isLoadingSlots}
            className="self-start md:self-auto inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSlots ? "animate-spin" : ""}`} />
            <span>Tabloyu Yenile</span>
          </button>
        </div>

        {/* Gün Seçici */}
        <DateSelector
          days={days}
          selectedDate={selectedDate}
          onSelectDate={(d) => setSelectedDate(d)}
          availableCount={availableSlotsCount}
        />

        {/* Slot Tablosu */}
        {isLoadingSlots ? (
          <div className="bg-white rounded-2xl p-16 shadow-xs border border-slate-200 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-red-600 mb-2" />
            <span className="text-xs font-semibold">Müsaitlik durumu yükleniyor...</span>
          </div>
        ) : (
          <SlotGrid
            slots={slots}
            selectedDate={selectedDate}
            isDateClosed={isDateClosed}
            dateCloseReason={dateCloseReason}
            myBookings={myBookings}
            onSelectSlot={handleSelectSlot}
            onViewMyBooking={(b) => setConfirmedBooking(b)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="font-semibold text-slate-700">
            T.C. Gençlik ve Spor Bakanlığı KYK Yurdu Çamaşırhane Hizmeti
          </div>
          <div className="text-slate-400">
            8 Çamaşır Makinesi • 13:30 - 21:30
          </div>
        </div>
      </footer>

      {/* Booking Modal */}
      {selectedSlotForBooking && (
        <BookingModal
          isOpen={isBookingOpen}
          onClose={() => setIsBookingOpen(false)}
          selectedDate={selectedDate}
          timeSlot={selectedSlotForBooking.timeSlot}
          machineNumber={selectedSlotForBooking.machineNumber}
          onSuccess={handleBookingSuccess}
        />
      )}

      {/* Success Modal */}
      {confirmedBooking && (
        <BookingSuccessModal
          booking={confirmedBooking}
          onClose={() => setConfirmedBooking(null)}
        />
      )}
    </div>
  );
}
