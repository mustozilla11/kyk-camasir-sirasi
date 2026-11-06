"use client";

import React, { useState } from "react";
import { SlotStatus } from "@/lib/types";
import { APP_CONFIG } from "@/lib/config";
import { Lock, Wrench, Clock, CheckCircle2, Stethoscope, Trash2, Sparkles, Filter } from "lucide-react";

interface SlotGridProps {
  slots: SlotStatus[];
  selectedDate: string;
  isDateClosed: boolean;
  dateCloseReason?: string;
  isAdmin?: boolean;
  myBookings?: any[];
  onSelectSlot: (timeSlot: string, machineNumber: number) => void;
  onViewMyBooking?: (booking: any) => void;
  onAdminDeleteBooking?: (bookingId: string) => void;
}

export function SlotGrid({
  slots,
  selectedDate,
  isDateClosed,
  dateCloseReason,
  isAdmin = false,
  myBookings = [],
  onSelectSlot,
  onViewMyBooking,
  onAdminDeleteBooking,
}: SlotGridProps) {
  // Mobil Hızlı Makine Filtresi (Telefonda yatay kaydırmayı azaltır)
  const [machineFilter, setMachineFilter] = useState<"all" | "regular" | "health">("all");

  if (isDateClosed) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 sm:p-8 text-center text-amber-800 my-6 shadow-sm">
        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <Clock className="w-6 h-6 text-amber-700" />
        </div>
        <h3 className="text-base sm:text-lg font-bold">Çamaşırhane Bu Tarihte Kapalıdır</h3>
        <p className="text-xs sm:text-sm mt-1 text-amber-700">
          {dateCloseReason || "Hafta sonu veya resmi tatil nedeniyle çamaşırhane hizmet vermemektedir."}
        </p>
        <p className="text-[11px] sm:text-xs text-amber-600 mt-3 font-medium">
          Lütfen üst kısımdaki gün seçiciden açık olan bir hafta içi gününü seçiniz.
        </p>
      </div>
    );
  }

  // Create lookup map: `${time_slot}_${machine_number}`
  const slotMap = new Map<string, SlotStatus>();
  for (const s of slots) {
    slotMap.set(`${s.time_slot}_${s.machine_number}`, s);
  }

  // Create lookup for my own bookings: `${date}_${time_slot}_${machine_number}`
  const myBookingMap = new Map<string, any>();
  for (const b of myBookings) {
    myBookingMap.set(`${b.booking_date}_${b.time_slot}_${b.machine_number}`, b);
  }

  // Filtreye göre gösterilecek makineler
  const displayedMachines = APP_CONFIG.machineNumbers.filter((m) => {
    if (machineFilter === "regular") return APP_CONFIG.regularMachines.includes(m);
    if (machineFilter === "health") return APP_CONFIG.healthInternMachines.includes(m);
    return true;
  });

  return (
    <div className="bg-white rounded-2xl p-3.5 sm:p-6 shadow-xs border border-slate-200/80 overflow-hidden">
      {/* Tablo Üst Başlık & Hızlı Filtre */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 sm:pb-4 mb-3 sm:mb-4 border-b border-slate-100">
        <div>
          <h3 className="font-bold text-slate-800 text-sm sm:text-lg">
            Makineler ve Saat Tablosu
          </h3>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
            Müsait bir slot seçerek sıranızı kaydedebilirsiniz.
          </p>
        </div>

        {/* Mobil & Masaüstü Hızlı Makine Filtresi */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-semibold self-stretch sm:self-auto">
          <button
            onClick={() => setMachineFilter("all")}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg transition-all cursor-pointer text-center text-[11px] sm:text-xs ${
              machineFilter === "all"
                ? "bg-white text-slate-900 shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Tümü (8)
          </button>
          <button
            onClick={() => setMachineFilter("regular")}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg transition-all cursor-pointer text-center text-[11px] sm:text-xs ${
              machineFilter === "regular"
                ? "bg-white text-slate-900 shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Genel (#1-#6)
          </button>
          <button
            onClick={() => setMachineFilter("health")}
            className={`flex-1 sm:flex-initial px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 text-[11px] sm:text-xs ${
              machineFilter === "health"
                ? "bg-cyan-700 text-white shadow-xs font-bold"
                : "text-cyan-800 hover:text-cyan-950 font-semibold"
            }`}
          >
            <Stethoscope className="w-3 h-3 flex-shrink-0" />
            <span>Sağlık (#7-#8)</span>
          </button>
        </div>
      </div>

      {/* Gösterge / Legend (Mobilde kompakt) */}
      <div className="flex items-center gap-3 text-[11px] sm:text-xs flex-wrap mb-3 text-slate-600">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-indigo-600"></span>
          <span className="font-bold text-indigo-900">Senin Sıran</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-emerald-100 border border-emerald-400"></span>
          <span>Genel</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-cyan-100 border border-cyan-400"></span>
          <span className="text-cyan-900 font-semibold">Stajyer/Sağlık</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-slate-200 border border-slate-300"></span>
          <span>Dolu</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-amber-100 border border-amber-300"></span>
          <span>Arızalı</span>
        </div>
      </div>

      {/* Yatay kaydırılabilir tablo (Sticky saat sütunu ile!) */}
      <div className="overflow-x-auto pb-2 -mx-3.5 sm:mx-0 px-3.5 sm:px-0 scrollbar-thin">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              {/* STICKY SAAT SÜTUNU: Mobilde sağa kaydırırken saat sabit kalır! */}
              <th className="py-2.5 px-2.5 sm:px-3 text-left font-bold text-slate-600 text-xs w-24 sm:w-28 bg-slate-50 sticky left-0 z-20 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.06)]">
                Saat
              </th>
              {displayedMachines.map((m) => {
                const isHealth = APP_CONFIG.healthInternMachines.includes(m);
                return (
                  <th
                    key={m}
                    className={`py-2 px-1.5 sm:px-2 text-center text-xs min-w-[76px] sm:min-w-[88px] transition-colors ${
                      isHealth
                        ? "bg-cyan-50/90 border-x border-cyan-200/60"
                        : "bg-slate-50/70"
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      {isHealth ? (
                        <span className="inline-flex items-center gap-0.5 text-[8px] sm:text-[9px] font-extrabold uppercase tracking-tight text-cyan-800 bg-cyan-100 px-1 py-0.2 rounded mb-0.5">
                          <Stethoscope className="w-2.5 h-2.5" /> Sağlık
                        </span>
                      ) : (
                        <span className="text-[9px] uppercase font-normal text-slate-400">
                          Genel
                        </span>
                      )}
                      <span className={`font-black ${isHealth ? "text-cyan-950 text-xs sm:text-sm" : "text-slate-800 text-xs sm:text-sm"}`}>
                        Makine #{m}
                      </span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {APP_CONFIG.timeSlots.map((timeSlot) => (
              <tr key={timeSlot} className="hover:bg-slate-50/40 transition-colors">
                {/* STICKY SAAT HÜCRESİ: Mobilde yatay kaydırırken sol kenarda kilitli kalır */}
                <td className="py-2.5 px-2.5 sm:px-3 font-semibold text-slate-800 text-[11px] sm:text-xs whitespace-nowrap bg-white/95 sticky left-0 z-20 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.06)]">
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 flex-shrink-0" />
                    <span>{timeSlot}</span>
                  </div>
                </td>

                {/* Makineler */}
                {displayedMachines.map((machineNumber) => {
                  const key = `${timeSlot}_${machineNumber}`;
                  const slot = slotMap.get(key);
                  const isHealth = APP_CONFIG.healthInternMachines.includes(machineNumber);

                  if (!slot) {
                    return <td key={machineNumber} className="p-1"></td>;
                  }

                  // 1. Bakım / Arıza
                  if (slot.isMaintenance) {
                    return (
                      <td key={machineNumber} className="p-1 sm:p-1.5">
                        <div
                          title={slot.maintenanceReason || "Bakımda"}
                          className="w-full h-12 sm:h-14 rounded-xl bg-amber-50 border border-amber-200/80 flex flex-col items-center justify-center p-0.5 text-center cursor-not-allowed select-none"
                        >
                          <Wrench className="w-3 h-3 text-amber-600 mb-0.5" />
                          <span className="text-[9px] sm:text-[10px] font-bold text-amber-800 leading-tight">
                            Arızalı
                          </span>
                        </div>
                      </td>
                    );
                  }

                  // 2. KULLANICININ KENDİ SIRASI ("SENİN SIRAN")
                  const myBooking = myBookingMap.get(`${selectedDate}_${key}`);
                  if (slot.isBooked && myBooking && !isAdmin) {
                    return (
                      <td key={machineNumber} className="p-1 sm:p-1.5">
                        <button
                          onClick={() => onViewMyBooking && onViewMyBooking(myBooking)}
                          title="Sıra detaylarını gör"
                          className="w-full h-12 sm:h-14 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white border border-indigo-400 shadow-xs flex flex-col items-center justify-center p-0.5 text-center transition-all active:scale-95 cursor-pointer"
                        >
                          <div className="flex items-center gap-0.5 text-[9px] font-black uppercase text-amber-300">
                            <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                            <span>Sıran</span>
                          </div>
                          <span className="text-[9px] sm:text-[10px] font-bold text-indigo-100 leading-tight truncate max-w-full px-0.5">
                            Oda {myBooking.room} (Yt.{myBooking.bed})
                          </span>
                        </button>
                      </td>
                    );
                  }

                  // 3. Dolu Durumu
                  if (slot.isBooked) {
                    return (
                      <td key={machineNumber} className="p-1 sm:p-1.5">
                        <div className="w-full h-12 sm:h-14 rounded-xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center p-0.5 text-center relative select-none">
                          {isAdmin && slot.bookingDetails ? (
                            <div className="flex flex-col items-center justify-center w-full">
                              <span className="text-[10px] sm:text-[11px] font-black text-slate-900 leading-tight">
                                Oda {slot.bookingDetails.room}
                              </span>
                              <span className="text-[9px] sm:text-[10px] font-bold text-red-700 leading-tight">
                                Yatak {slot.bookingDetails.bed}
                              </span>
                              {onAdminDeleteBooking && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onAdminDeleteBooking(slot.bookingDetails!.id);
                                  }}
                                  title="Bu sırayı sil"
                                  className="absolute top-0.5 right-0.5 p-0.5 text-slate-400 hover:text-red-600"
                                >
                                  <Trash2 className="w-2.5 h-2.5" />
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center">
                              <Lock className="w-3 h-3 text-slate-400 mb-0.5" />
                              <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                Dolu
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  }

                  // 4. Süresi Geçmiş
                  if (slot.isPast) {
                    return (
                      <td key={machineNumber} className="p-1 sm:p-1.5">
                        <div className="w-full h-12 sm:h-14 rounded-xl bg-slate-50 border border-slate-200/50 flex flex-col items-center justify-center p-0.5 text-center text-slate-300 cursor-not-allowed select-none">
                          <Clock className="w-3 h-3 text-slate-300 mb-0.5" />
                          <span className="text-[9px] sm:text-[10px] font-medium text-slate-400">
                            Geçti
                          </span>
                        </div>
                      </td>
                    );
                  }

                  // 5. Müsait (Dokunmatik Sıra Al)
                  return (
                    <td key={machineNumber} className="p-1 sm:p-1.5">
                      <button
                        onClick={() => onSelectSlot(timeSlot, machineNumber)}
                        className={`w-full h-12 sm:h-14 rounded-xl border flex flex-col items-center justify-center p-0.5 transition-all duration-150 active:scale-95 cursor-pointer ${
                          isHealth
                            ? "bg-cyan-50/70 hover:bg-cyan-600 border-cyan-300 hover:border-cyan-600 text-cyan-900 hover:text-white"
                            : "bg-emerald-50/70 hover:bg-emerald-600 border-emerald-300 hover:border-emerald-600 text-emerald-800 hover:text-white"
                        }`}
                      >
                        <CheckCircle2
                          className={`w-3.5 h-3.5 sm:w-4 sm:h-4 mb-0.5 ${
                            isHealth ? "text-cyan-700" : "text-emerald-600"
                          }`}
                        />
                        <span className="text-[10px] sm:text-[11px] font-bold leading-tight">
                          Sıra Al
                        </span>
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
