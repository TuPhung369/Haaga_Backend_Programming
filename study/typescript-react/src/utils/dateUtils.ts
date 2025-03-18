import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import duration from 'dayjs/plugin/duration';

// Extend dayjs with plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(localizedFormat);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.extend(duration);

// Export the configured dayjs instance
export { dayjs };

// Get browser timezone
export const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

// Format dates for display
export const formatDisplayDate = (date: string | Date | null | undefined): string => {
  if (!date) return '';
  return dayjs(date).format('YYYY-MM-DD');
};

// Format date and time for display
export const formatDisplayDateTime = (date: string | Date | null | undefined): string => {
  if (!date) return '';
  return dayjs(date).format('YYYY-MM-DD HH:mm');
};

// Convert local date to ISO string for API
export const toISOString = (date: string | Date | null | undefined): string => {
  if (!date) return '';
  return dayjs(date).toISOString();
};

// Parse ISO string from API to local date
export const fromISOString = (isoString: string | null | undefined): dayjs.Dayjs => {
  if (!isoString) return dayjs();
  return dayjs(isoString);
};

// Add duration to date
export const addDuration = (
  date: string | Date,
  amount: number,
  unit: dayjs.ManipulateType
): dayjs.Dayjs => {
  return dayjs(date).add(amount, unit);
};

// Calculate duration between dates in minutes
export const getDurationMinutes = (start: Date | string, end: Date | string): number => {
  return dayjs(end).diff(dayjs(start), 'minute');
};

// Create a date object from local input format
export const parseLocalDate = (dateString: string): dayjs.Dayjs => {
  return dayjs(dateString);
}; 