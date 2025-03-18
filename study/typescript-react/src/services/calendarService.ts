import apiClient from "./authService";
import { handleServiceError } from "./baseService";
import { CalendarEvent } from "../type/types";

// Define interface for response from API (based on ApiResponse structure from backend)
interface CalendarEventResponse {
  code: number;
  result: CalendarEvent;
}

interface CalendarEventsResponse {
  code: number;
  result: CalendarEvent[];
}

export const fetchEventsByUserId = async (
  userId: string,
  token: string
): Promise<CalendarEventsResponse> => {
  try {
    const response = await apiClient.get<CalendarEventsResponse>(
      `/events?userId=${userId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const adjustDateArray = (dateArray: number[] | undefined): string => {
      if (!dateArray || !Array.isArray(dateArray) || dateArray.length < 5) {
        return new Date().toISOString();
      }
      const [year, month, day, hour, minute, second = 0, nanoseconds = 0] = dateArray;
      return new Date(year, month - 1, day, hour, minute, second, Math.floor(nanoseconds / 1000000)).toISOString();
    };

    const adjustedEvents = response.data.result
      .map((event: CalendarEvent) => {
        const adjustedStart = typeof event.start === "object" && Array.isArray(event.start)
          ? adjustDateArray(event.start)
          : (event.start as string | Date | number[]);
        const adjustedEnd = typeof event.end === "object" && Array.isArray(event.end)
          ? adjustDateArray(event.end)
          : (event.end as string | Date | number[]);
        const adjustedDate = typeof event.date === "object" && Array.isArray(event.date)
          ? adjustDateArray(event.date)
          : (event.date as string | Date | number[]);
        const adjustedCreatedAt = typeof event.createdAt === "object" && Array.isArray(event.createdAt)
          ? adjustDateArray(event.createdAt)
          : (event.createdAt as string | Date | number[] | undefined);

        if (
          (typeof adjustedStart === "string" || Array.isArray(adjustedStart) || adjustedStart instanceof Date) &&
          (typeof adjustedEnd === "string" || Array.isArray(adjustedEnd) || adjustedEnd instanceof Date) &&
          (typeof adjustedDate === "string" || Array.isArray(adjustedDate) || adjustedDate instanceof Date)
        ) {
          return {
            ...event,
            start: adjustedStart,
            end: adjustedEnd,
            date: adjustedDate,
            createdAt: adjustedCreatedAt,
          } as CalendarEvent;
        }
        console.warn("Skipping invalid event:", event);
        return null;
      })
      .filter((event): event is CalendarEvent => event !== null);

    return {
      ...response.data,
      result: adjustedEvents,
    };
  } catch (error) {
    console.error("Error fetching events:", error);
    throw handleServiceError(error);
  }
};

export const createEvent = async (
  eventData: Omit<CalendarEvent, "id" | "createdAt">, // ID and createdAt are server-generated
  token: string
): Promise<CalendarEventResponse> => {
  try {
    const response = await apiClient.post<CalendarEventResponse>(
      "/events",
      eventData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error creating event:", error);
    throw handleServiceError(error); // Use centralized error handling
  }
};

export const updateEvent = async (
  eventId: string,
  eventData: Partial<CalendarEvent>,
  token: string
): Promise<CalendarEventResponse> => {
  try {
    if (!token) throw new Error("No authentication token provided");
    const response = await apiClient.put<CalendarEventResponse>(
      `/events/${eventId}`,
      eventData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating event:", error);
    throw handleServiceError(error); // Use centralized error handling
  }
};

export const updateEventSeries = async (
  seriesId: string,
  eventData: Partial<CalendarEvent>,
  token: string
): Promise<CalendarEventsResponse> => {
  try {
    const response = await apiClient.put<CalendarEventsResponse>(
      `/events/series/${seriesId}`,
      eventData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating event series:", error);
    throw handleServiceError(error); // Use centralized error handling
  }
};

export const deleteEvent = async (
  eventId: string,
  token: string
): Promise<void> => {
  try {
    await apiClient.delete(`/events/${eventId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    console.error("Error deleting event:", error);
    throw handleServiceError(error); // Use centralized error handling
  }
};