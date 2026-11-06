"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  KeyRound,
  Printer,
  Search,
  Trash2,
  LogOut,
  RefreshCw,
  Wrench,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Lock,
  Loader2,
  FileSpreadsheet,
} from "lucide-react";
import { APP_CONFIG } from "@/lib/config";
import { formatTurkishDate, getIstanbulDate, formatDate } from "@/lib/date-utils";
import { Booking, Maintenance, SlotStatus } from "@/lib/types";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Dashboard state
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [slots, setSlots] = useState<SlotStatus[]>([]);
  const [bookingsList, setBookingsList] = useState<Booking[]>([]);
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Yurt Şifresi Yönetim State
  const [currentYurtPin, setCurrentYurtPin] = useState<string>("KYK2026");
  const [newYurtPin, setNewYurtPin] = useState<string>("");
  const [suggestedPin, setSuggestedPin] = useState<string>("");
  const [isUpdatingPin, setIsUpdatingPin] = useState<boolean>(false);

  // Set today's date on mount
  useEffect(() => {
    setSelectedDate(formatDate(getIstanbulDate()));
  }, []);

  // Check auth status on load
  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/slots?date=" + selectedDate);
      const data = await res.json();
      setIsAuthenticated(Boolean(data.isAdmin));
    } catch (err) {
      setIsAuthenticated(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Load admin data
  const loadAdminData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const [slotsRes, bookingsRes, maintRes, settingsRes] = await Promise.all([
        fetch(`/api/slots?date=${selectedDate}`),
        fetch(`/api/admin/bookings?date=${selectedDate}&query=${encodeURIComponent(searchQuery)}`),
        fetch("/api/admin/maintenance"),
        fetch("/api/admin/settings"),
      ]);

      const slotsData = await slotsRes.json();
      const bookingsData = await bookingsRes.json();
      const maintData = await maintRes.json();
      const settingsData = await settingsRes.json();

      if (slotsData.success) {
        setSlots(slotsData.slots || []);
      }
      if (bookingsData.success) {
        setBookingsList(bookingsData.bookings || []);
      }
      if (maintData.success) {
        setMaintenances(maintData.maintenances || []);
      }
      if (settingsData.success) {
        setCurrentYurtPin(settingsData.yurtPin || "KYK2026");
        setSuggestedPin(settingsData.suggestedPin || "");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingData(false);
    }
  }, [selectedDate, searchQuery]);

  useEffect(() => {
    if (isAuthenticated) {
      loadAdminData();
    }
  }, [isAuthenticated, selectedDate, loadAdminData]);

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setLoginError(data.error || "Giriş başarısız.");
        setIsLoggingIn(false);
        return;
      }

      setIsAuthenticated(true);
      setIsLoggingIn(false);
      loadAdminData();
    } catch (err) {
      setLoginError("Bağlantı hatası.");
      setIsLoggingIn(false);
    }
  };

  // Logout handler
  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setIsAuthenticated(false);
  };

  // Delete booking handler
  const handleDeleteBooking = async (id: string) => {
    if (!confirm("Bu randevuyu silmek istediğinize emin misiniz? Öğrencinin sırası iptal edilecek ve hak geri verilecektir.")) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/bookings/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        showSuccessBadge("Randevu başarıyla silindi.");
        loadAdminData();
      } else {
        alert(data.error || "Silinemedi.");
      }
    } catch (err) {
      alert("Hata oluştu.");
    }
  };

  // Toggle machine maintenance
  const handleToggleMaintenance = async (machineNum: number, currentReason?: string) => {
    const isUnderMaintenance = Boolean(currentReason);
    try {
      if (isUnderMaintenance) {
        // Remove maintenance
        await fetch("/api/admin/maintenance", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "machine", target: machineNum }),
        });
        showSuccessBadge(`Makine #${machineNum} tekrar aktif edildi.`);
      } else {
        // Add maintenance
        const reason = prompt(`Makine #${machineNum} için arıza/bakım sebebi:`, "Arızalı / Bakımda") || "Arızalı";
        await fetch("/api/admin/maintenance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "machine", target: machineNum, reason }),
        });
        showSuccessBadge(`Makine #${machineNum} arızalı olarak işaretlendi.`);
      }
      loadAdminData();
    } catch (err) {
      alert("Hata oluştu.");
    }
  };

  // Yurt şifresi güncelleme handler
  const handleUpdateYurtPin = async (pinToSet?: string) => {
    const targetPin = (pinToSet || newYurtPin).trim().toUpperCase();
    if (!targetPin || targetPin.length < 3) {
      alert("Yurt şifresi en az 3 karakter olmalıdır.");
      return;
    }
    setIsUpdatingPin(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ yurtPin: targetPin }),
      });
      const data = await res.json();
      if (data.success) {
        setCurrentYurtPin(data.yurtPin);
        setNewYurtPin("");
        showSuccessBadge(`Yurt şifresi başarıyla "${data.yurtPin}" olarak güncellendi! Panoya asabilirsiniz.`);
      } else {
        alert(data.error || "Şifre güncellenemedi.");
      }
    } catch (e) {
      alert("Bağlantı hatası oluştu.");
    } finally {
      setIsUpdatingPin(false);
    }
  };

  const showSuccessBadge = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 3000);
  };

  // 1. Loading state while checking auth
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <Loader2 className="w-8 h-8 animate-spin text-red-700" />
      </div>
    );
  }

  // 2. Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-100">
        <div className="bg-white w-full max-w-md rounded-3xl shadow-xl border border-slate-200/80 p-8">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-red-700">
              <KeyRound className="w-7 h-7" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-red-600 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
              Yetkili Girişi
            </span>
            <h1 className="text-2xl font-black text-slate-900 mt-2">
              Çamaşırhane Yönetimi
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Görevli teyidi, döküman çıktısı ve sıra yönetimi için giriş yapın.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {loginError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Yönetici Şifresi
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Şifrenizi girin..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-red-600/30 focus:border-red-600 transition-all"
                required
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Varsayılan şifre: <code className="bg-slate-100 px-1 py-0.5 rounded">kykadmin123</code>
              </span>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-sm tracking-wide shadow-md shadow-red-700/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Kontrol Ediliyor...</span>
                </>
              ) : (
                <span>Giriş Yap</span>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Öğrenci Sayfasına Dön</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. Authenticated Admin Dashboard
  const bookedSlotsCount = slots.filter((s) => s.isBooked).length;
  const maintenanceMap = new Map<number, string>();
  for (const m of maintenances) {
    if (m.type === "machine") maintenanceMap.set(Number(m.target), m.reason || "Arızalı");
  }

  // Create slot lookup for 2D matrix
  const slotMap = new Map<string, SlotStatus>();
  for (const s of slots) {
    slotMap.set(`${s.time_slot}_${s.machine_number}`, s);
  }

  return (
    <div className="min-h-screen bg-slate-100/70 pb-12">
      {/* ------------------------------------------------------------- */}
      {/* YAZDIRILABİLİR RESMİ A4 DÖKÜMANI (YALNIZCA BASKIDA GÖRÜNÜR)   */}
      {/* ------------------------------------------------------------- */}
      <div className="hidden print:block p-6 bg-white text-black font-sans">
        <div className="text-center border-b-2 border-slate-900 pb-4 mb-4">
          <div className="text-sm font-bold tracking-wider uppercase text-slate-700">
            T.C. GENÇLİK VE SPOR BAKANLIĞI
          </div>
          <h1 className="text-xl font-black uppercase tracking-tight mt-1">
            KYK YURDU ÇAMAŞIRHANE GÜNLÜK SIRA VE TESLİM ÇİZELGESİ
          </h1>
          <div className="text-sm font-semibold mt-1">
            TARİH: <span className="underline">{formatTurkishDate(selectedDate)}</span>
          </div>
        </div>

        {/* Tablo Çıktısı */}
        <table className="print-table w-full border border-black text-xs text-center">
          <thead>
            <tr className="bg-slate-200 font-bold border-b border-black">
              <th className="border border-black p-2 w-28">SAAT DİLİMİ</th>
              {APP_CONFIG.machineNumbers.map((m) => {
                const isHealth = APP_CONFIG.healthInternMachines.includes(m);
                return (
                  <th key={m} className={`border border-black p-2 ${isHealth ? "bg-slate-300" : ""}`}>
                    <div>MAKİNE #{m}</div>
                    {isHealth && (
                      <div className="text-[8px] font-black tracking-tighter text-black uppercase">
                        STAJYER / SAĞLIK
                      </div>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {APP_CONFIG.timeSlots.map((timeSlot) => (
              <tr key={timeSlot} className="border-b border-black">
                <td className="border border-black p-2 font-bold bg-slate-50 text-left whitespace-nowrap">
                  {timeSlot}
                </td>
                {APP_CONFIG.machineNumbers.map((m) => {
                  const s = slotMap.get(`${timeSlot}_${m}`);
                  if (s?.isMaintenance) {
                    return (
                      <td key={m} className="border border-black p-2 bg-slate-100 font-medium text-[10px]">
                        ARIZALI
                      </td>
                    );
                  }
                  if (s?.isBooked && s.bookingDetails) {
                    return (
                      <td key={m} className="border border-black p-2 font-bold text-xs bg-slate-50">
                        <div>ODA: {s.bookingDetails.room}</div>
                        <div className="text-[10px] text-slate-700">YATAK: {s.bookingDetails.bed}</div>
                      </td>
                    );
                  }
                  return (
                    <td key={m} className="border border-black p-2 text-slate-300">
                      -
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {/* İmza ve Tutanak Alanı */}
        <div className="mt-8 flex justify-between items-end text-xs font-semibold px-4">
          <div className="space-y-1">
            <p className="font-bold">• Görevli Talimatı: Öğrenciler sadece Kat, Oda ve Yatak numarasını beyan eder; bu dökümandan teyit edilerek makine teslim edilir.</p>
            <p className="text-slate-800">• <strong>Makine #7 ve #8:</strong> Stajyer ve sağlık öğrencilerine aittir. Görevli teslimde öğrenci/staj kimliğini kontrol eder.</p>
            <p className="text-slate-500 text-[10px]">T.C. GSB KYK Yurdu Çamaşırhane Sistemi tarafından üretilmiştir.</p>
          </div>
          <div className="text-center w-60 border-t border-black pt-2">
            <div>Nöbetçi Yurt Görevlisi</div>
            <div className="text-slate-500 text-[10px] mt-1">Ad, Soyad ve İmza</div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* EKRAN GÖRÜNÜMÜ (BASKIDA GİZLENİR: no-print)                  */}
      {/* ------------------------------------------------------------- */}
      <div className="no-print">
        {/* Üst Yönetici Başlığı */}
        <header className="bg-slate-900 text-white shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center font-bold text-white shadow-md">
                KYK
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-red-400">
                    Yönetici & Görevli Paneli
                  </span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-1.5 py-0.2 rounded font-semibold">
                    Yetkili Oturumu
                  </span>
                </div>
                <h1 className="text-lg font-black tracking-tight">
                  Çamaşırhane Sıra Denetim & Teyit Masası
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              {/* Yazdır / Döküman Butonu */}
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-red-700 hover:bg-red-800 text-white shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Günlük Çıktı Al (A4 / PDF)</span>
              </button>

              <Link
                href="/"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Siteye Git</span>
              </Link>

              <button
                onClick={handleLogout}
                title="Çıkış Yap"
                className="p-2 rounded-xl bg-slate-800 hover:bg-red-950/60 text-slate-400 hover:text-red-400 border border-slate-700 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Başarı Bildirimi */}
        {actionSuccess && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 animate-in fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span className="font-semibold">{actionSuccess}</span>
            </div>
          </div>
        )}

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Kontrol Çubuğu: Tarih Seçimi & Hızlı Öğrenci/Oda Arama */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Tarih Seçici */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
              <label className="block text-xs font-bold text-slate-600 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-red-600" />
                <span>İncelenen Gün</span>
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-red-600/30"
              />
              <span className="text-[11px] text-slate-500 font-medium mt-1 block">
                {formatTurkishDate(selectedDate)}
              </span>
            </div>

            {/* 2. Görevli Hızlı Arama (Öğrenci Yatak Teyidi İçin!) */}
            <div className="md:col-span-2 bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
              <label className="block text-xs font-bold text-slate-600 mb-1.5 flex items-center gap-1.5">
                <Search className="w-4 h-4 text-red-600" />
                <span>Öğrenci / Oda / Yatak Teyit Arama (Örn: 2116 veya 2116-3)</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Oda no veya yatak yazın (örn: 2116, 2116-3)..."
                  className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-600/30"
                />
                <button
                  onClick={loadAdminData}
                  disabled={isLoadingData}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingData ? "animate-spin" : ""}`} />
                  <span>Sorgula</span>
                </button>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Öğrenci çamaşırhaneye geldiğinde söylediği oda ve yatak numarasını buraya yazarak anında teyit edin.
              </span>
            </div>
          </div>

          {/* Hızlı Arama Sonuçları Kartı (Görevli Masası) */}
          {searchQuery.trim() && (
            <div className="bg-red-50/60 rounded-2xl p-4 border border-red-200 animate-in fade-in">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-red-900">
                  &ldquo;{searchQuery}&rdquo; Arama Sonuçları ({bookingsList.length} kayıt):
                </span>
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-[11px] text-red-700 font-bold hover:underline cursor-pointer"
                >
                  Aramayı Temizle
                </button>
              </div>
              {bookingsList.length === 0 ? (
                <p className="text-xs text-slate-500 py-2">
                  Bu oda/yatak için herhangi bir aktif randevu bulunamadı.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {bookingsList.map((b) => (
                    <div
                      key={b.id}
                      className="bg-white p-3.5 rounded-xl border border-red-200/80 shadow-xs flex items-center justify-between"
                    >
                      <div>
                        <div className="font-extrabold text-slate-900 text-sm">
                          Oda {b.room} — Yatak {b.bed}
                        </div>
                        <div className="text-xs text-slate-600 mt-0.5">
                          {formatTurkishDate(b.booking_date)}
                        </div>
                        <div className="text-xs font-bold text-red-700 mt-0.5">
                          {b.time_slot} • Makine #{b.machine_number}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteBooking(b.id)}
                        className="p-2 rounded-lg text-slate-400 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Randevuyu sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* İstatistik Özet Kartları */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 block">Tarih</span>
              <span className="text-sm font-black text-slate-900 mt-0.5 block truncate">
                {formatTurkishDate(selectedDate)}
              </span>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 block">Alınan Sıra Sayısı</span>
              <span className="text-2xl font-black text-red-700 mt-0.5 block">
                {bookedSlotsCount} <span className="text-xs font-normal text-slate-500">adet</span>
              </span>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 block">Boş Kapasite</span>
              <span className="text-2xl font-black text-emerald-700 mt-0.5 block">
                {slots.filter((s) => !s.isBooked && !s.isMaintenance).length}{" "}
                <span className="text-xs font-normal text-slate-500">slot</span>
              </span>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 block">Arızalı Makine</span>
              <span className="text-2xl font-black text-amber-700 mt-0.5 block">
                {maintenances.filter((m) => m.type === "machine").length}{" "}
                <span className="text-xs font-normal text-slate-500">adet</span>
              </span>
            </div>
          </div>

          {/* Makine Durumları & Bakım Açma/Kapama */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
            <h3 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-amber-600" />
              <span>Makine Durumları (Arıza Aç / Kapat)</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2.5">
              {APP_CONFIG.machineNumbers.map((m) => {
                const reason = maintenanceMap.get(m);
                const isDown = Boolean(reason);
                return (
                  <button
                    key={m}
                    onClick={() => handleToggleMaintenance(m, reason)}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      isDown
                        ? "bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Makine
                    </span>
                    <span className="block text-lg font-black my-0.5">#{m}</span>
                    <span
                      className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        isDown
                          ? "bg-amber-200 text-amber-900"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {isDown ? "Arızalı" : "Çalışıyor"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Aylık Yurt Şifresi Yönetimi (Dışarıdan Sıra Almayı Önleme) */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-amber-600" />
                  <span>Aylık Yurt Şifresi (Dışarıdan Giriş & Troll Koruması)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Yurtta kalmayan yabancıların internetten sıra almasını önler. Şifreyi her ay değiştirip yurt panosuna asabilirsiniz.
                </p>
              </div>

              {/* Güncel Şifre Rozeti */}
              <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-200/80 px-3.5 py-2 rounded-xl">
                <span className="text-[11px] font-bold text-amber-900 uppercase">Aktif Şifre:</span>
                <span className="font-black text-amber-950 text-base tracking-wider bg-white px-2.5 py-0.5 rounded-lg border border-amber-300 shadow-xs">
                  {currentYurtPin}
                </span>
              </div>
            </div>

            {/* Yeni Şifre Belirleme Alanı */}
            <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  value={newYurtPin}
                  onChange={(e) => setNewYurtPin(e.target.value.toUpperCase())}
                  placeholder="Yeni yurt şifresi yazın (örn: KYK2026, YURT74)..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-bold tracking-wider uppercase text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                />
              </div>

              <button
                type="button"
                onClick={() => handleUpdateYurtPin()}
                disabled={isUpdatingPin || !newYurtPin.trim()}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
              >
                {isUpdatingPin ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                <span>Şifreyi Değiştir</span>
              </button>

              {suggestedPin && suggestedPin !== currentYurtPin && (
                <button
                  type="button"
                  onClick={() => handleUpdateYurtPin(suggestedPin)}
                  disabled={isUpdatingPin}
                  className="px-3 py-2 bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold text-xs rounded-xl border border-amber-300 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  title="Tek tıkla bu ayın şifresini ata"
                >
                  <span>📅 Bu Ayın Kodu Yap ({suggestedPin})</span>
                </button>
              )}
            </div>

            <p className="text-[11px] text-slate-400 mt-2">
              * Öğrenciler şifreyi ilk sıra alırken bir kez girer ve telefonları hatırlar. Siz şifreyi güncellediğinizde eski şifreyle dışarıdan kimse sıra alamaz.
            </p>
          </div>

          {/* Görevli Detay Tablosu (Oda ve Yatak Numaraları Görünür) */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Günün Randevu Çizelgesi ({formatTurkishDate(selectedDate)})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Her slotta kayıt yaptıran öğrencinin Kat, Oda ve Yatak bilgisi yer alır.
                </p>
              </div>

              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Yazıcıya Gönder</span>
              </button>
            </div>

            {/* Matrix View */}
            <div className="overflow-x-auto pb-2">
              <table className="w-full min-w-[760px] border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="py-2.5 px-3 text-left font-bold text-slate-500 w-28">Saat</th>
                    {APP_CONFIG.machineNumbers.map((m) => {
                      const isHealth = APP_CONFIG.healthInternMachines.includes(m);
                      return (
                        <th
                          key={m}
                          className={`py-2 px-2 text-center ${
                            isHealth ? "bg-cyan-50/80 border-x border-cyan-200" : ""
                          }`}
                        >
                          <div className="flex flex-col items-center">
                            {isHealth && (
                              <span className="text-[9px] font-extrabold text-cyan-800 bg-cyan-100 px-1 py-0.2 rounded mb-0.5">
                                Stajyer/Sağlık
                              </span>
                            )}
                            <span className="font-black text-slate-800">
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
                    <tr key={timeSlot} className="hover:bg-slate-50/50">
                      <td className="py-3 px-3 font-bold text-slate-700 whitespace-nowrap bg-slate-50/50">
                        {timeSlot}
                      </td>

                      {APP_CONFIG.machineNumbers.map((machineNumber) => {
                        const s = slotMap.get(`${timeSlot}_${machineNumber}`);

                        if (!s) return <td key={machineNumber} className="p-1"></td>;

                        if (s.isMaintenance) {
                          return (
                            <td key={machineNumber} className="p-1">
                              <div className="h-16 rounded-xl bg-amber-50 border border-amber-200 flex flex-col items-center justify-center p-1 text-center">
                                <Wrench className="w-3.5 h-3.5 text-amber-600 mb-0.5" />
                                <span className="text-[10px] font-bold text-amber-800">ARIZALI</span>
                              </div>
                            </td>
                          );
                        }

                        if (s.isBooked && s.bookingDetails) {
                          const isMatch =
                            searchQuery.trim() &&
                            (s.bookingDetails.room.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              `${s.bookingDetails.room}-${s.bookingDetails.bed}`.includes(searchQuery));

                          return (
                            <td key={machineNumber} className="p-1">
                              <div
                                className={`h-16 rounded-xl border flex flex-col items-center justify-center p-1 relative text-center transition-all ${
                                  isMatch
                                    ? "bg-red-100 border-red-500 ring-2 ring-red-400"
                                    : "bg-red-50/80 border-red-200"
                                }`}
                              >
                                <span className="text-xs font-black text-slate-900">
                                  Oda {s.bookingDetails.room}
                                </span>
                                <span className="text-[11px] font-bold text-red-700">
                                  Yatak {s.bookingDetails.bed}
                                </span>
                                <button
                                  onClick={() => handleDeleteBooking(s.bookingDetails!.id)}
                                  title="Bu sırayı iptal et / sil"
                                  className="absolute top-1 right-1 p-1 rounded text-slate-400 hover:text-red-700 hover:bg-white transition-colors"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </td>
                          );
                        }

                        return (
                          <td key={machineNumber} className="p-1">
                            <div className="h-16 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 text-[11px]">
                              Boş
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
