import {
  format,
  parse,
  isValid,
  addMinutes,
  differenceInMinutes,
} from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Format date for display in Brazilian Portuguese
 */
export function formatDateBR(
  date: Date,
  pattern: string = "dd/MM/yyyy"
): string {
  return format(date, pattern, { locale: ptBR });
}

/**
 * Format time for display (HH:mm format)
 */
export function formatTime(date: Date): string {
  return format(date, "HH:mm");
}

/**
 * Parse time string (HH:mm or HH:mm:ss) to Date object for today
 */
export function parseTimeString(timeStr: string): Date | null {
  try {
    const today = new Date();
    const patterns = ["HH:mm:ss", "HH:mm"];

    for (const pattern of patterns) {
      const parsed = parse(timeStr, pattern, today);
      if (isValid(parsed)) {
        return parsed;
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Calculate end time based on start time and duration in minutes
 */
export function calculateEndTime(
  startTime: string,
  durationMinutes: number
): string {
  const start = parseTimeString(startTime);
  if (!start) return "";

  const end = addMinutes(start, durationMinutes);
  return formatTime(end);
}

/**
 * Calculate duration between two time strings in minutes
 */
export function calculateDuration(startTime: string, endTime: string): number {
  const start = parseTimeString(startTime);
  const end = parseTimeString(endTime);

  if (!start || !end) return 0;

  return differenceInMinutes(end, start);
}

/**
 * Get current time as HH:mm string
 */
export function getCurrentTime(): string {
  return formatTime(new Date());
}

/**
 * Check if a time string is valid
 */
export function isValidTimeString(timeStr: string): boolean {
  return parseTimeString(timeStr) !== null;
}

/**
 * Convert minutes to HH:mm format
 */
export function minutesToTimeString(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins
    .toString()
    .padStart(2, "0")}`;
}

/**
 * Convert time string to total minutes since midnight
 */
export function timeStringToMinutes(timeStr: string): number {
  const time = parseTimeString(timeStr);
  if (!time) return 0;

  return time.getHours() * 60 + time.getMinutes();
}
