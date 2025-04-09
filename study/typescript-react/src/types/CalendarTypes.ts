// src/types/CalendarTypes.ts
// Types related to calendar functionality

export interface CalendarEvent {
  id: string;
  seriesId?: string;
  title: string;
  start: string | Date;
  end: string | Date;
  date: string | Date;
  description?: string;
  color?: string;
  allDay?: boolean;
  repeat?: "none" | "daily" | "weekly" | "monthly" | "yearly";
  isEventsInvalidated?: boolean;
  userId?: string;
  exceptions?: { originalStart: string }[];
  createdAt?: string | Date;
}
