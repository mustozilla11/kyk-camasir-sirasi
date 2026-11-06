"use client";

import React from "react";
import { SlotStatus } from "@/lib/types";
import { APP_CONFIG } from "@/lib/config";
import { Lock, Wrench, Clock, CheckCircle2, User, Trash2 } from "lucide-react";

interface SlotGridProps {
  slots: SlotStatus[];
  selectedDate: string;
  isDateClosed: boolean;
  dateCloseReason?: string;
  isAdmin?: boolean;
  onSelectSlot: (timeSlot: string, machineNumber: number) => void;
  onAdminDeleteBooking?: (bookingId: string) => void;
}

export function SlotGrid({
  slots,
  selectedDate,
  isDateClosed,
  dateCloseReason,
  isAdmin = false,
  onSelectSlot,
  onAdminDeleteBooking,
}: SlotGridProps) {
  if (isDateClosed) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center text-amber-800 my-6 shadow-sm">
        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <Clock className="w-6 h-6 text-amber-700" />
        </div>
        <h3 className="text-lg font-bold">Çamaşırhane Bu Tarihte Kapalıdır</h3>
        <p className="text-sm mt-1 text-amber-700">
          {dateCloseReason || "Hafta sonu veya resmi tatil nedeniyle çamaşırhane hizmet vermemektedir."}
        </p>
        <p className="text-xs text-amber-600 mt-3 font-medium">
          Lütfen üst kısımdaki gün seçiciden açık olan bir hafta içi gününü seçiniz.
        </p>
      </div>
    );
  }

  // Create a 2D lookup map: `${time_slot}_${machine_number}` -> SlotStatus
  const slotMap = new Map<string, SlotStatus>();
  for (const s of slots) {
    slotMap.set(`${s.time_slot}_${s.machine_number}`, s);
  }

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200/80 overflow-hidden">
      {/* Tablo Üst Başlık & Açıklamalar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
        <div>
          <h3 className="font-bold text-slate-800 text-base sm:text-lg">
            Makineler ve Saat Tablosu
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Müsait bir slot seçerek oda ve yatak bilginizle sıranızı kaydedebilirsiniz.
          </p>
        </div>

        {/* Gösterge / Legend */}
        <div className="flex items-center gap-3 text-xs flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-400"></span>
            <span className="text-slate-600">Müsait</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-slate-200 border border-slate-300"></span>
            <span className="text-slate-600">Dolu</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-100 border border-amber-300"></span>
            <span className="text-slate-600">Arızalı / Bakım</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-slate-100 border border-slate-200"></span>
            <span className="text-slate-400">Geçmiş</span>
          </div>
        </div>
      </div>

      {/* Yatay kaydırılabilir tablo */}
      <div className="overflow-x-auto pb-2 -mx-4 sm:mx-0 px-4 sm:px-0">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="py-2.5 px-3 text-left font-semibold text-slate-500 text-xs w-28 bg-slate-50/70 rounded-l-lg">
                Saat Dilimi
              </th>
              {APP_CONFIG.machineNumbers.map((m) => (
                <th
                  key={m}
                  className="py-2.5 px-2 text-center font-bold text-slate-700 text-xs sm:text-sm bg-slate-50/70"
                >
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] uppercase font-normal text-slate-400">Makine</span>
                    <span className="font-extrabold text-slate-800">#{m}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {APP_CONFIG.timeSlots.map((timeSlot) => (
              <tr key={timeSlot} className="hover:bg-slate-50/40 transition-colors">
                {/* Saat Sütunu */}
                <td className="py-3 px-3 font-semibold text-slate-700 text-xs whitespace-nowrap bg-slate-50/30">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{timeSlot}</span>
                  </div>
                </td>

                {/* 8 Makine Sütunları */}
                {APP_CONFIG.machineNumbers.map((machineNumber) => {
                  const key = `${timeSlot}_${machineNumber}`;
                  const slot = slotMap.get(key);

                  if (!slot) {
                    return <td key={machineNumber} className="p-1"></td>;
                  }

                  // 1. Bakım / Arıza Durumu
                  if (slot.isMaintenance) {
                    return (
                      <td key={machineNumber} className="p-1.5">
                        <div
                          title={slot.maintenanceReason || "Bakımda"}
                          className="w-full h-14 rounded-xl bg-amber-50 border border-amber-200/80 flex flex-col items-center justify-center p-1 text-center cursor-not-allowed select-none"
                        >
                          <Wrench className="w-3.5 h-3.5 text-amber-600 mb-0.5" />
                          <span className="text-[10px] font-bold text-amber-800 leading-tight">
                            Arızalı
                          </span>
                        </div>
                      </td>
                    );
                  }

                  // 2. Dolu Durumu
                  if (slot.isBooked) {
                    return (
                      <td key={machineNumber} className="p-1.5">
                        <div className="w-full h-14 rounded-xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center p-1 text-center relative select-none">
                          {isAdmin && slot.bookingDetails ? (
                            // Yalnızca Admin Görünümü: Oda ve Yatak bilgisi
                            <div className="flex flex-col items-center justify-center w-full">
                              <span className="text-[11px] font-black text-slate-800">
                                Oda {slot.bookingDetails.room}
                              </span>
                              <span className="text-[10px] font-semibold text-red-600">
                                Yatak {slot.bookingDetails.bed}
                              </span>
                              {onAdminDeleteBooking && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onAdminDeleteBooking(slot.bookingDetails!.id);
                                  }}
                                  title="Bu sırayı iptal et"
                                  className="absolute top-1 right-1 p-0.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          ) : (
                            // Normal Öğrenci Görünümü: SADECE DOLU (Sıfır Kişisel Veri!)
                            <div className="flex flex-col items-center justify-center">
                              <Lock className="w-3.5 h-3.5 text-slate-400 mb-0.5" />
                              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                Dolu
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  }

                  // 3. Süresi Geçmiş Durum
                  if (slot.isPast) {
                    return (
                      <td key={machineNumber} className="p-1.5">
                        <div className="w-full h-14 rounded-xl bg-slate-50 border border-slate-200/50 flex flex-col items-center justify-center p-1 text-center text-slate-300 cursor-not-allowed select-none">
                          <Clock className="w-3.5 h-3.5 text-slate-300 mb-0.5" />
                          <span className="text-[10px] font-medium text-slate-400">
                            Geçti
                          </span>
                        </div>
                      </td>
                    );
                  }

                  // 4. Müsait Durum (Öğrenci Tıklayabilir)
                  return (
                    <td key={machineNumber} className="p-1.5">
                      <button
                        onClick={() => onSelectSlot(timeSlot, machineNumber)}
                        className="w-full h-14 rounded-xl bg-emerald-50/60 hover:bg-emerald-600 border border-emerald-300 hover:border-emerald-600 text-emerald-800 hover:text-white flex flex-col items-center justify-center p-1 transition-all duration-150 shadow-xs hover:shadow-md hover:scale-[1.03] cursor-pointer group"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 group-hover:text-white mb-0.5 transition-colors" />
                        <span className="text-[11px] font-bold group-hover:text-white">
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
