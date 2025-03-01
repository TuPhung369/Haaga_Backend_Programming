import axios from "axios";
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
  /**
   * Get all boards for a user
   * @param userId The ID of the user
   * @param token Authentication token
   * @returns The user's boards
   */
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

  /**
   * Get a specific board by ID
   * @param boardId The ID of the board
   * @param token Authentication token
   * @returns The board data
   */
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

  /**
   * Create a new board for a user
   * @param userId The ID of the user
   * @param token Authentication token
   * @param title Optional title for the board
   * @returns The created board
   */
  createBoard: async (
    userId: string,
    token: string,
    title: string = "My Kanban Board"
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

  /**
   * Update a board
   * @param boardId The ID of the board
   * @param token Authentication token
   * @param data The updated board data
   * @returns The updated board
   */
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

  /**
   * Delete a board
   * @param boardId The ID of the board
   * @param token Authentication token
   * @returns Success status
   */
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

  /**
   * Create a new column in a board
   * @param boardId The board ID
   * @param token Authentication token
   * @param title The column title
   * @param position The position of the column
   * @returns Updated board with the new column
   */
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

  /**
   * Update a column
   * @param columnId The column ID
   * @param token Authentication token
   * @param title The new title
   * @param position Optional position update
   * @returns Updated board with the modified column
   */
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

      console.log("Updating column with:", {
        url: `${API_BASE_URI}/kanban/columns/${columnId}`,
        data,
      });

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

      console.log("Update column response:", response.data);
      return response.data.result;
    } catch (error) {
      console.error("Error updating column:", error);
      throw error;
    }
  },

  /**
   * Delete a column
   * @param columnId The column ID
   * @param token Authentication token
   * @returns Updated board without the deleted column
   */
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

  /**
   * Create a new task
   * @param columnId The column ID
   * @param token Authentication token
   * @param title The task title
   * @param priority The task priority
   * @param position The position of the task
   * @returns Updated board with the new task
   */
  createTask: async (
    columnId: string,
    token: string,
    title: string,
    priority: "High" | "Medium" | "Low",
    position: number
  ): Promise<BoardData> => {
    try {
      const response = await axios.post<SingleBoardResponse>(
        `${API_BASE_URI}/kanban/tasks`,
        { columnId, title, priority, position },
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

  /**
   * Update a task
   * @param taskId The task ID
   * @param token Authentication token
   * @param title The new title
   * @param priority The new priority
   * @param columnId Optional new column ID
   * @param position Optional new position
   * @returns Updated board with the modified task
   */
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

  /**
   * Delete a task
   * @param taskId The task ID
   * @param token Authentication token
   * @returns Updated board without the deleted task
   */
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

  /**
   * Move a task to a different column or position
   * @param params Object containing taskId, token, targetColumnId, and newPosition
   * @returns Updated board with the moved task
   */
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

  /**
   * Move a column to a different position
   * @param params Object containing columnId, token, and newPosition
   * @returns Updated board with the moved column
   */
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

