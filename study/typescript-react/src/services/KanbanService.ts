import apiClient from "./authService";
import { handleServiceError } from "./baseService";
import { ColumnKanban, Board } from "../types/KanbanTypes";

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
      const response = await apiClient.get<BoardsResponse>(
        `/kanban/boards?userId=${userId}`,
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
      throw handleServiceError(error);
    }
  },

  getBoardById: async (boardId: string, token: string): Promise<BoardData> => {
    try {
      const response = await apiClient.get<SingleBoardResponse>(
        `/kanban/boards/${boardId}`,
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
      throw handleServiceError(error);
    }
  },

  createBoard: async (
    userId: string,
    token: string,
    title: string = "Kanban Board"
  ): Promise<BoardData> => {
    try {
      const response = await apiClient.post<SingleBoardResponse>(
        `/kanban/boards`,
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
      throw handleServiceError(error);
    }
  },

  updateBoard: async (
    boardId: string,
    token: string,
    data: Partial<Board>
  ): Promise<BoardData> => {
    try {
      const response = await apiClient.put<SingleBoardResponse>(
        `/kanban/boards/${boardId}`,
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
      throw handleServiceError(error);
    }
  },

  deleteBoard: async (boardId: string, token: string): Promise<boolean> => {
    try {
      await apiClient.delete(`/kanban/boards/${boardId}`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });
      return true;
    } catch (error) {
      console.error("Error deleting board:", error);
      throw handleServiceError(error);
    }
  },

  clearAllTasks: async (
    boardId: string,
    token: string
  ): Promise<BoardData | null> => {
    try {
      const response = await apiClient.post<SingleBoardResponse>(
        `/kanban/boards/${boardId}/clear-tasks`,
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
      throw handleServiceError(error);
    }
  },

  resetBoard: async (
    boardId: string,
    token: string
  ): Promise<BoardData | null> => {
    try {
      const response = await apiClient.post<SingleBoardResponse>(
        `/kanban/boards/${boardId}/reset`,
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
      console.error("Error resetting board:", error);
      throw handleServiceError(error); // Centralized error handling
    }
  },

  createColumn: async (
    boardId: string,
    token: string,
    title: string,
    position: number
  ): Promise<BoardData> => {
    try {
      const response = await apiClient.post<SingleBoardResponse>(
        `/kanban/columns`,
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
      throw handleServiceError(error);
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

      const response = await apiClient.put<SingleBoardResponse>(
        `/kanban/columns/${columnId}`,
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
      throw handleServiceError(error);
    }
  },

  deleteColumn: async (columnId: string, token: string): Promise<BoardData> => {
    try {
      const response = await apiClient.delete<SingleBoardResponse>(
        `/kanban/columns/${columnId}`,
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
      throw handleServiceError(error);
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
      const response = await apiClient.post<SingleBoardResponse>(
        `/kanban/tasks`,
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
      throw handleServiceError(error);
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

      const response = await apiClient.put<SingleBoardResponse>(
        `/kanban/tasks/${taskId}`,
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
      throw handleServiceError(error);
    }
  },

  deleteTask: async (taskId: string, token: string): Promise<BoardData> => {
    try {
      const response = await apiClient.delete<SingleBoardResponse>(
        `/kanban/tasks/${taskId}`,
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
      throw handleServiceError(error);
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
      const response = await apiClient.post<SingleBoardResponse>(
        `/kanban/tasks/move`,
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
      throw handleServiceError(error);
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
      const response = await apiClient.post<SingleBoardResponse>(
        `/kanban/columns/move`,
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
      throw handleServiceError(error);
    }
  },
};

export default KanbanService;

