import axios from "axios";
import type { AxiosError } from "axios";
import { CalendarEvent, ApiError } from "../type/types";

const API_BASE_URI = import.meta.env.VITE_API_BASE_URI;

// Axios instance with default headers
const apiClient = axios.create({
  baseURL: API_BASE_URI,
  headers: {
    "Content-Type": "application/json",
  },
});

// Định nghĩa interface cho response từ API (dựa trên cấu trúc ApiResponse từ backend)
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
    throw error as AxiosError<ApiError>;
  }
};

export const createEvent = async (
  eventData: Omit<CalendarEvent, "id" | "createdAt">, // ID và createdAt do server tạo
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
    throw error as AxiosError<ApiError>;
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
    throw error as AxiosError<ApiError>;
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
    throw error as AxiosError<ApiError>;
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
    throw error as AxiosError<ApiError>;
  }
};


