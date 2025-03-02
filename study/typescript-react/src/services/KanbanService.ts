import axios from "axios";
import { AxiosError } from "axios";
import { ColumnKanban, Board } from "../type/types";

const API_BASE_URI = import.meta.env.VITE_API_BASE_URI;

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
      throw error;
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
      throw error;
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
      throw error;
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
      throw error;
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
      throw error;
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
      throw error;
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
      const axiosError = error as AxiosError<unknown>;
      const errorData = axiosError.response?.data || {};

      console.error("Error resetting board details:", {
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        data: errorData,
        message: axiosError.message,
      });

      // Check for specific error codes from the API
      if ((errorData as { code: number }).code === 5000) {
        console.error("Server error details:", errorData);

        // If it's the generic server error, provide more helpful message
        throw new Error(
          "The server encountered an error while resetting the board. " +
            "This might be due to server maintenance or high load. " +
            "Please try again in a few minutes or contact support if the issue persists."
        );
      } else if (axiosError.code === "ERR_NETWORK") {
        throw new Error(
          "Network connection error. Please check your internet connection and try again."
        );
      } else if (axiosError.response?.status === 401) {
        throw new Error("Authentication error. Please log in again.");
      } else if (axiosError.response?.status === 403) {
        throw new Error("You do not have permission to reset this board.");
      } else if (axiosError.response?.status === 404) {
        throw new Error("Board not found. It may have been deleted.");
      } else {
        throw new Error(axiosError.message || "Failed to reset board");
      }
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
      throw error;
    }
  },

  updateColumn: async (
    columnId: string,
    token: string,
    title: string,
    boardId: string, // Add this parameter
    position?: number
  ): Promise<BoardData | null> => {
    try {
      const data: {
        title: string;
        boardId: string; // Include this in your data object
        position?: number;
      } = {
        title,
        boardId, // Set the boardId
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
      throw error;
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
      throw error;
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
          columnId, // Make sure this is a valid UUID
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
      throw error;
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
      throw error;
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
      throw error;
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
      throw error;
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
      throw error;
    }
  },
};

export default KanbanService;

