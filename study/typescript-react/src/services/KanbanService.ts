import axios from "axios";
import { AxiosError } from "axios";
import { ColumnKanban, Board, ExtendApiError } from "../type/types";

const API_BASE_URI =
  import.meta.env.VITE_API_BASE_URI || "http://localhost:9095/identify_service";

// Define interfaces for board data based on actual backend response
interface BoardData {
  id: string;
  title: string;
  userId: string;
  columns: ColumnKanban[];
  createdAt?: string;
  updatedAt?: string;
}

interface BoardsResponse {
  code: number;
  result: BoardData[];
}

interface SingleBoardResponse {
  code: number;
  result: BoardData;
}

// Define type for error data from the API
interface ApiErrorResponse {
  code?: number;
  message?: string;
  httpCode?: number;
  success?: boolean;
  severity?: string;
}

/**
 * Helper function to create a standardized error object
 */
const createErrorObject = (
  error: unknown,
  defaultMessage: string,
  errorType: ExtendApiError["errorType"]
): ExtendApiError => {
  const extendedError: ExtendApiError = {
    message: defaultMessage,
    errorType: errorType,
    originalError: error,
  };

  if (error && typeof error === "object" && "response" in error) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    if (axiosError.response?.data?.message) {
      extendedError.message = axiosError.response.data.message;
    }
    if (axiosError.response?.data?.code) {
      extendedError.code = axiosError.response.data.code;
    }
    if (axiosError.response?.status) {
      extendedError.httpCode = String(axiosError.response.status);
    }
  }

  return extendedError;
};

// API service for Kanban
const KanbanService = {
  getUserBoards: async (
    userId: string,
    token: string
  ): Promise<BoardData[]> => {
    try {
      const response = await axios.get<BoardsResponse>(
        `${API_BASE_URI}/kanban/boards?userId=${userId}`,
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        }
      );
      return response.data.result || [];
    } catch (error) {
      console.error("Error getting user boards:", error);
      const extendedError = createErrorObject(
        error,
        "Failed to fetch user boards",
        "FETCH"
      );
      throw extendedError;
    }
  },

  getBoardById: async (boardId: string, token: string): Promise<BoardData> => {
    try {
      const response = await axios.get<SingleBoardResponse>(
        `${API_BASE_URI}/kanban/boards/${boardId}`,
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        }
      );
      return response.data.result;
    } catch (error) {
      console.error("Error getting board:", error);
      const extendedError = createErrorObject(
        error,
        `Failed to fetch board ${boardId}`,
        "FETCH"
      );
      throw extendedError;
    }
  },

  createBoard: async (
    userId: string,
    token: string,
    title: string = "Kanban Board"
  ): Promise<BoardData> => {
    try {
      const response = await axios.post<SingleBoardResponse>(
        `${API_BASE_URI}/kanban/boards`,
        { userId, title },
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        }
      );
      return response.data.result;
    } catch (error) {
      console.error("Error creating board:", error);
      const extendedError = createErrorObject(
        error,
        "Failed to create board",
        "CREATE"
      );
      throw extendedError;
    }
  },

  updateBoard: async (
    boardId: string,
    token: string,
    data: Partial<Board>
  ): Promise<BoardData> => {
    try {
      const response = await axios.put<SingleBoardResponse>(
        `${API_BASE_URI}/kanban/boards/${boardId}`,
        data,
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        }
      );
      return response.data.result;
    } catch (error) {
      console.error("Error updating board:", error);
      const extendedError = createErrorObject(
        error,
        `Failed to update board ${boardId}`,
        "UPDATE"
      );
      throw extendedError;
    }
  },

  deleteBoard: async (boardId: string, token: string): Promise<boolean> => {
    try {
      await axios.delete(`${API_BASE_URI}/kanban/boards/${boardId}`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });
      return true;
    } catch (error) {
      console.error("Error deleting board:", error);
      const extendedError = createErrorObject(
        error,
        `Failed to delete board ${boardId}`,
        "DELETE"
      );
      throw extendedError;
    }
  },

  clearAllTasks: async (
    boardId: string,
    token: string
  ): Promise<BoardData | null> => {
    try {
      const response = await axios.post<SingleBoardResponse>(
        `${API_BASE_URI}/kanban/boards/${boardId}/clear-tasks`,
        {}, // Empty body since we're using path variable
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        }
      );
      return response.data.result;
    } catch (error) {
      console.error("Error clearing tasks:", error);
      const extendedError = createErrorObject(
        error,
        `Failed to clear tasks from board ${boardId}`,
        "UPDATE"
      );
      throw extendedError;
    }
  },

  resetBoard: async (
    boardId: string,
    token: string
  ): Promise<BoardData | null> => {
    try {
      const response = await axios.post<SingleBoardResponse>(
        `${API_BASE_URI}/kanban/boards/${boardId}/reset`,
        {}, // Empty body as we're not sending any data
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          timeout: 20000, // Increased timeout further
        }
      );
      return response.data.result;
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      const errorData = axiosError.response?.data || {};

      console.error("Error resetting board details:", {
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        data: errorData,
        message: axiosError.message,
      });

      // Create a structured error object
      const extendedError: ExtendApiError = {
        message: "Failed to reset board",
        errorType: "UPDATE",
        originalError: error,
        details: axiosError.message,
      };

      // Check for specific error codes from the API
      if ((errorData as { code?: number }).code === 5000) {
        extendedError.message =
          "The server encountered an error while resetting the board. " +
          "This might be due to server maintenance or high load. " +
          "Please try again in a few minutes or contact support if the issue persists.";
      } else if (axiosError.code === "ERR_NETWORK") {
        extendedError.message =
          "Network connection error. Please check your internet connection and try again.";
      } else if (axiosError.response?.status === 401) {
        extendedError.message = "Authentication error. Please log in again.";
      } else if (axiosError.response?.status === 403) {
        extendedError.message =
          "You do not have permission to reset this board.";
      } else if (axiosError.response?.status === 404) {
        extendedError.message = "Board not found. It may have been deleted.";
      }

      throw extendedError;
    }
  },

  createColumn: async (
    boardId: string,
    token: string,
    title: string,
    position: number
  ): Promise<BoardData> => {
    try {
      const response = await axios.post<SingleBoardResponse>(
        `${API_BASE_URI}/kanban/columns`,
        { boardId, title, position },
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        }
      );
      return response.data.result;
    } catch (error) {
      console.error("Error creating column:", error);
      const extendedError = createErrorObject(
        error,
        "Failed to create column",
        "CREATE"
      );
      throw extendedError;
    }
  },

  updateColumn: async (
    columnId: string,
    token: string,
    title: string,
    boardId: string,
    position?: number
  ): Promise<BoardData | null> => {
    try {
      const data: {
        title: string;
        boardId: string;
        position?: number;
      } = {
        title,
        boardId,
      };

      if (position !== undefined) {
        data.position = position;
      }

      const response = await axios.put<SingleBoardResponse>(
        `${API_BASE_URI}/kanban/columns/${columnId}`,
        data,
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        }
      );

      return response.data.result;
    } catch (error) {
      console.error("Error updating column:", error);
      const extendedError = createErrorObject(
        error,
        `Failed to update column ${columnId}`,
        "UPDATE"
      );
      throw extendedError;
    }
  },

  deleteColumn: async (columnId: string, token: string): Promise<BoardData> => {
    try {
      const response = await axios.delete<SingleBoardResponse>(
        `${API_BASE_URI}/kanban/columns/${columnId}`,
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        }
      );
      return response.data.result;
    } catch (error) {
      console.error("Error deleting column:", error);
      const extendedError = createErrorObject(
        error,
        `Failed to delete column ${columnId}`,
        "DELETE"
      );
      throw extendedError;
    }
  },

  createTask: async (
    columnId: string,
    token: string,
    title: string,
    description?: string,
    priority?: "High" | "Medium" | "Low"
  ): Promise<BoardData | null> => {
    try {
      const response = await axios.post<SingleBoardResponse>(
        `${API_BASE_URI}/kanban/tasks`,
        {
          columnId,
          title,
          description: description || "",
          priority: priority || "Medium",
        },
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        }
      );
      return response.data.result;
    } catch (error) {
      console.error("Error creating task:", error);
      const extendedError = createErrorObject(
        error,
        "Failed to create task",
        "CREATE"
      );
      throw extendedError;
    }
  },

  updateTask: async (
    taskId: string,
    token: string,
    title: string,
    priority: "High" | "Medium" | "Low",
    columnId?: string,
    position?: number
  ): Promise<BoardData> => {
    try {
      const data: {
        title: string;
        priority: string;
        columnId?: string;
        position?: number;
      } = { title, priority };

      if (columnId) data.columnId = columnId;
      if (position !== undefined) data.position = position;

      const response = await axios.put<SingleBoardResponse>(
        `${API_BASE_URI}/kanban/tasks/${taskId}`,
        data,
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        }
      );
      return response.data.result;
    } catch (error) {
      console.error("Error updating task:", error);
      const extendedError = createErrorObject(
        error,
        `Failed to update task ${taskId}`,
        "UPDATE"
      );
      throw extendedError;
    }
  },

  deleteTask: async (taskId: string, token: string): Promise<BoardData> => {
    try {
      const response = await axios.delete<SingleBoardResponse>(
        `${API_BASE_URI}/kanban/tasks/${taskId}`,
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        }
      );
      return response.data.result;
    } catch (error) {
      console.error("Error deleting task:", error);
      const extendedError = createErrorObject(
        error,
        `Failed to delete task ${taskId}`,
        "DELETE"
      );
      throw extendedError;
    }
  },

  moveTask: async ({
    taskId,
    token,
    targetColumnId,
    newPosition,
  }: {
    taskId: string;
    token: string;
    targetColumnId: string;
    newPosition: number;
  }): Promise<BoardData> => {
    try {
      const response = await axios.post<SingleBoardResponse>(
        `${API_BASE_URI}/kanban/tasks/move`,
        { taskId, targetColumnId, newPosition },
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        }
      );
      return response.data.result;
    } catch (error) {
      console.error("Error moving task:", error);
      const extendedError = createErrorObject(
        error,
        `Failed to move task ${taskId}`,
        "UPDATE"
      );
      throw extendedError;
    }
  },

  moveColumn: async ({
    columnId,
    token,
    newPosition,
  }: {
    columnId: string;
    token: string;
    newPosition: number;
  }): Promise<BoardData> => {
    try {
      const response = await axios.post<SingleBoardResponse>(
        `${API_BASE_URI}/kanban/columns/move`,
        { columnId, newPosition },
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        }
      );
      return response.data.result;
    } catch (error) {
      console.error("Error moving column:", error);
      const extendedError = createErrorObject(
        error,
        `Failed to move column ${columnId}`,
        "UPDATE"
      );
      throw extendedError;
    }
  },
};

export default KanbanService;


