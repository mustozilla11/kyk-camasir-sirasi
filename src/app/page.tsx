"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/Header";
import { DateSelector } from "@/components/DateSelector";
import { SlotGrid } from "@/components/SlotGrid";
import { BookingModal } from "@/components/BookingModal";
import { BookingSuccessModal } from "@/components/BookingSuccessModal";
import { SlotStatus } from "@/lib/types";
import { getSelectableDays, getIstanbulDate, formatDate } from "@/lib/date-utils";
import { Loader2, RefreshCw, ShieldCheck, Info } from "lucide-react";

export default function HomePage() {
  const [days, setDays] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [slots, setSlots] = useState<SlotStatus[]>([]);
  const [isDateClosed, setIsDateClosed] = useState(false);
  const [dateCloseReason, setDateCloseReason] = useState("");
  const [availableSlotsCount, setAvailableSlotsCount] = useState<number>(0);
  const [isLoadingSlots, setIsLoadingSlots] = useState(true);

  // Modal states
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedSlotForBooking, setSelectedSlotForBooking] = useState<{
    timeSlot: string;
    machineNumber: number;
  } | null>(null);

  const [confirmedBooking, setConfirmedBooking] = useState<any | null>(null);

  // Initialize selectable days
  useEffect(() => {
    const selectable = getSelectableDays(7);
    setDays(selectable);
    if (selectable.length > 0) {
      setSelectedDate(selectable[0].date);
    } else {
      const today = getIstanbulDate();
      setSelectedDate(formatDate(today));
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
    loadSlots(selectedDate);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100/70">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
                3. Kat, Oda ve Yatak numaranızı girerek sıranızı kesinleştirin.
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
            onSelectSlot={handleSelectSlot}
          />
        )}
      </main>

      {/* Footer / KVKK & Bilgilendirme */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-700 font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Kişisel Veri Güvenliği: Ad, Soyad, TC veya Telefon verisi tutulmaz.</span>
          </div>
          <div>
            T.C. Gençlik ve Spor Bakanlığı KYK Yurdu Çamaşırhane Hizmeti
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
