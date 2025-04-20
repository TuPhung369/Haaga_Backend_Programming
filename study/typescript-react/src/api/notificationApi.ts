import axiosInstance from "../utils/axios-customize";

// Types
export interface SubscriberResponse {
  subscriberId: string;
  success: boolean;
  message?: string;
}

export interface Notification {
  id: string;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  type: string;
}

// Register the current user as a Novu subscriber
export const registerAsSubscriber = async (): Promise<SubscriberResponse> => {
  try {
    console.log("API: Registering as subscriber - making request");
    const response = await axiosInstance.post<SubscriberResponse>(
      "/api/notifications/register"
    );
    console.log("API: Register subscriber response:", response);
    // Since our axios interceptor extracts the data, we can safely cast to the expected type
    return response as unknown as SubscriberResponse;
  } catch (error) {
    console.error("API ERROR: Error registering as subscriber:", error);
    throw error;
  }
};

// Get the subscriber ID for the current user
export const getSubscriberId = async (): Promise<string> => {
  try {
    console.log("API: Getting subscriber ID - making request");
    const response = await axiosInstance.get<SubscriberResponse>(
      "/api/notifications/subscriber-id"
    );
    console.log("API: Get subscriber ID response:", response);
    // The axios interceptor returns the data directly
    const subscriberData = response as unknown as SubscriberResponse;

    if (!subscriberData || !subscriberData.subscriberId) {
      console.error(
        "API ERROR: Invalid subscriber data received:",
        subscriberData
      );
      throw new Error("Invalid subscriber data received");
    }

    console.log("API: Extracted subscriber ID:", subscriberData.subscriberId);
    return subscriberData.subscriberId;
  } catch (error) {
    console.error("API ERROR: Error getting subscriber ID:", error);
    throw error;
  }
};

// Mark a notification as read
export const markNotificationAsRead = async (
  notificationId: string
): Promise<void> => {
  try {
    await axiosInstance.post(`/api/notifications/${notificationId}/read`);
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw error;
  }
};

// Get all notifications for the current user
export const getNotifications = async (): Promise<Notification[]> => {
  try {
    const response = await axiosInstance.get<Notification[]>(
      "/api/notifications"
    );
    // Since our axios interceptor extracts the data, we can safely cast to the expected type
    return response as unknown as Notification[];
  } catch (error) {
    console.error("Error getting notifications:", error);
    throw error;
  }
};

