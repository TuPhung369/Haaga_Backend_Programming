import axios from "axios";
import { ColumnKanban } from "../type/types";

const API_BASE_URI =
  import.meta.env.VITE_API_BASE_URI || "http://localhost:8080/api";

// Define interfaces for board data based on actual backend response
interface BoardData {
  id: string;
  title: string;
  userId: string;
  columns: ColumnKanban[];
  createdAt?: string;
}

interface BoardsResponse {
  code: number;
  result: BoardData[];
}

interface SingleBoardResponse {
  code: number;
  result: BoardData;
}

// API service for Kanban with token authentication
export const KanbanService = {
  /**
   * Get all boards for a user
   * @param userId The ID of the user
   * @param token JWT token for authentication
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
      throw error; // Throw to let thunk handle rejection
    }
  },

  /**
   * Get a specific board by ID
   * @param boardId The ID of the board
   * @param token JWT token for authentication
   * @returns The board data
   */
  getBoardById: async (
    boardId: string,
    token: string
  ): Promise<BoardData | null> => {
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
   * @param token JWT token for authentication
   * @param title The title of the board
   * @returns The created board
   */
  createBoard: async (
    userId: string,
    token: string,
    title: string = "Kanban Board"
  ): Promise<BoardData | null> => {
    try {
      const response = await axios.post<SingleBoardResponse>(
        `${API_BASE_URI}/kanban/boards`,
        {
          userId,
          title,
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
      console.error("Error creating board:", error);
      throw error;
    }
  },

  /**
   * Update a board
   * @param boardId The ID of the board
   * @param token JWT token for authentication
   * @param data The updated board data
   * @returns The updated board
   */
  updateBoard: async (
    boardId: string,
    token: string,
    data: Partial<BoardData>
  ): Promise<BoardData | null> => {
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
   * @param token JWT token for authentication
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
};

export default KanbanService;

