export const APP_CONFIG = {
  appName: "GSB KYK Yurdu Çamaşırhane Sıra Sistemi",
  totalMachines: 8,
  machineNumbers: [1, 2, 3, 4, 5, 6, 7, 8],
  // Makinelerin türleri: 1-6 Genel, 7-8 Stajyer ve Sağlık Öğrencileri
  regularMachines: [1, 2, 3, 4, 5, 6],
  healthInternMachines: [7, 8],
  floors: [1, 2, 3],
  bedsPerRoom: [1, 2, 3, 4, 5],
  maxBookingsPerBedIn7Days: 2,
  maxAdvanceDays: 7,
  timeSlots: [
    "13:30 - 14:30",
    "14:30 - 15:30",
    "15:30 - 16:30",
    "16:30 - 17:30",
    "17:30 - 18:30",
    "18:30 - 19:30",
    "19:30 - 20:30",
    "20:30 - 21:30",
  ],
  // Hafta sonu günleri (0: Pazar, 6: Cumartesi)
  closedDaysOfWeek: [0, 6],
  defaultAdminPassword: process.env.ADMIN_PASSWORD || "kykadmin123",
  jwtSecret: process.env.JWT_SECRET || "kyk-super-secret-key-2026",
};
