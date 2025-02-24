export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  date: Date;
  description?: string;
  color: string;
  allDay?: boolean;
  resource?: unknown;
}
