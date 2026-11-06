export interface Booking {
  id: string;
  booking_date: string; // YYYY-MM-DD
  time_slot: string; // e.g. "13:30 - 14:30"
  machine_number: number; // 1-8
  floor: number; // 1-3
  room: string; // e.g. "2116"
  bed: number; // 1-5
  cancel_code?: string;
  created_at: string;
}

export interface Maintenance {
  id: string;
  type: "machine" | "date";
  target: string; // machine number string "4" or date string "YYYY-MM-DD"
  reason?: string;
  created_at: string;
}

export interface SlotStatus {
  time_slot: string;
  machine_number: number;
  isBooked: boolean;
  isMaintenance: boolean;
  maintenanceReason?: string;
  isPast: boolean;
  isHealthInternMachine: boolean; // Makine 7 ve 8 için true
  // Sadece admin görebilir:
  bookingDetails?: {
    floor: number;
    room: string;
    bed: number;
    id: string;
    created_at: string;
  };
}
