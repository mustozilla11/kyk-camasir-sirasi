import { APP_CONFIG } from "./config";

const TIMEZONE = "Europe/Istanbul";

/**
 * Returns current Date in Europe/Istanbul timezone
 */
export function getIstanbulDate(): Date {
  const now = new Date();
  const istanbulString = now.toLocaleString("en-US", { timeZone: TIMEZONE });
  return new Date(istanbulString);
}

/**
 * Formats a Date to YYYY-MM-DD string
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Parses a YYYY-MM-DD string into a Date object
 */
export function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

/**
 * Checks if a given date is weekend (Saturday or Sunday)
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return APP_CONFIG.closedDaysOfWeek.includes(day);
}

/**
 * Gets a human-readable Turkish date label (e.g. "9 Kasım Pazartesi")
 */
export function formatTurkishDate(dateStr: string): string {
  if (!dateStr) return "";
  const date = parseDate(dateStr);
  return date.toLocaleDateString("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

/**
 * Generates selectable days for booking:
 * Starts from today, spans up to maxAdvanceDays (7 days).
 * Excludes weekends (Saturday/Sunday) since laundry is closed on weekends.
 */
export function getSelectableDays(advanceDays = APP_CONFIG.maxAdvanceDays): Array<{
  date: string;
  label: string;
  dayName: string;
  isToday: boolean;
}> {
  const result = [];
  const today = getIstanbulDate();
  const todayStr = formatDate(today);

  for (let i = 0; i < advanceDays; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);

    if (isWeekend(d)) {
      continue; // Hafta sonu kapalı, listeye dahil etmiyoruz veya işaretliyoruz
    }

    const dateStr = formatDate(d);
    result.push({
      date: dateStr,
      label: d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" }),
      dayName: d.toLocaleDateString("tr-TR", { weekday: "long" }),
      isToday: dateStr === todayStr,
    });
  }

  return result;
}

/**
 * Checks if a time slot has already passed for a given date.
 * Allows booking ongoing slots as long as there is enough time left to wash (up to 20 mins before slot ends).
 * E.g. For "18:30 - 19:30", student can book at 18:30, 18:45, up until 19:10!
 */
export function isSlotPast(dateStr: string, timeSlot: string): boolean {
  const today = getIstanbulDate();
  const todayStr = formatDate(today);

  if (dateStr < todayStr) {
    return true; // Past day
  }

  if (dateStr > todayStr) {
    return false; // Future day
  }

  // Same day: check based on slot end time minus 20 minutes buffer
  const parts = timeSlot.split("-");
  const endPart = (parts[1] || parts[0]).trim(); // "19:30"
  const [endHour, endMin] = endPart.split(":").map(Number);

  // Cutoff is 20 minutes before the slot ends
  let cutoffHour = endHour;
  let cutoffMin = endMin - 20;
  if (cutoffMin < 0) {
    cutoffHour -= 1;
    cutoffMin += 60;
  }

  const currentHour = today.getHours();
  const currentMin = today.getMinutes();

  if (currentHour > cutoffHour) return true;
  if (currentHour === cutoffHour && currentMin >= cutoffMin) return true;

  return false;
}

/**
 * Generates an easy-to-read 6-character cancel code (e.g. "K7A9X2")
 */
export function generateCancelCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No easily confused 0, O, 1, I
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
