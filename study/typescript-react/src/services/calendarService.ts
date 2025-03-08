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
    return response.data;
  } catch (error) {
    console.error("Error fetching events:", error);
    throw handleServiceError(error); // Use centralized error handling
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

