"use client";

import React from "react";
import { Calendar, ChevronRight } from "lucide-react";

interface DateOption {
  date: string;
  label: string;
  dayName: string;
  isToday: boolean;
}

interface DateSelectorProps {
  days: DateOption[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  availableCount?: number;
}

export function DateSelector({
  days,
  selectedDate,
  onSelectDate,
  availableCount,
}: DateSelectorProps) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-red-600" />
          <h2 className="font-bold text-slate-800 text-sm sm:text-base">
            Gün Seçimi <span className="text-xs font-normal text-slate-500">(En fazla 7 gün ileriye)</span>
          </h2>
        </div>
        {availableCount !== undefined && (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            {availableCount} Müsait Sıra
          </span>
        )}
      </div>

      <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-thin">
        {days.map((day) => {
          const isSelected = day.date === selectedDate;
          return (
            <button
              key={day.date}
              onClick={() => onSelectDate(day.date)}
              className={`flex-shrink-0 flex flex-col items-center justify-center min-w-[105px] py-2.5 px-3 rounded-xl border text-center transition-all cursor-pointer ${
                isSelected
                  ? "bg-red-700 text-white border-red-700 shadow-sm shadow-red-700/20 scale-[1.02]"
                  : "bg-slate-50 hover:bg-slate-100/80 text-slate-700 border-slate-200 hover:border-slate-300"
              }`}
            >
              <span className={`text-[11px] font-medium uppercase tracking-wider ${isSelected ? "text-red-100" : "text-slate-500"}`}>
                {day.dayName}
              </span>
              <span className="text-base font-extrabold my-0.5">
                {day.label}
              </span>
              {day.isToday && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                    isSelected ? "bg-white text-red-700" : "bg-red-100 text-red-700"
                  }`}
                >
                  Bugün
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
