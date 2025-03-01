// src/services/kanbanService.ts
import axios from "axios";
import { ColumnKanban } from "../type/types";

const API_BASE_URI = import.meta.env.VITE_API_BASE_URI;

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

// API service for Kanban
export const KanbanService = {
  /**
   * Get all boards for a user
   * @param userId The ID of the user
   * @returns The user's boards
   */
  getUserBoards: async (userId: string): Promise<BoardData[]> => {
    try {
      const response = await axios.get<BoardsResponse>(
        `${API_BASE_URI}/kanban/boards?userId=${userId}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      return response.data.result || [];
    } catch (error) {
      console.error("Error getting user boards:", error);
      return [];
    }
  },

  /**
   * Get a specific board by ID
   * @param boardId The ID of the board
   * @returns The board data
   */
  getBoardById: async (boardId: string): Promise<BoardData | null> => {
    try {
      const response = await axios.get<SingleBoardResponse>(
        `${API_BASE_URI}/kanban/boards/${boardId}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      return response.data.result;
    } catch (error) {
      console.error("Error getting board:", error);
      return null;
    }
  },

  /**
   * Create a new board for a user
   * @param userId The ID of the user
   * @param title The title of the board
   * @returns The created board
   */
  createBoard: async (
    userId: string,
    title: string = "My Kanban Board"
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
          },
        }
      );
      return response.data.result;
    } catch (error) {
      console.error("Error creating board:", error);
      return null;
    }
  },

  /**
   * Update a board
   * @param boardId The ID of the board
   * @param data The updated board data
   * @returns The updated board
   */
  updateBoard: async (
    boardId: string,
    data: Partial<BoardData>
  ): Promise<BoardData | null> => {
    try {
      const response = await axios.put<SingleBoardResponse>(
        `${API_BASE_URI}/kanban/boards/${boardId}`,
        data,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      return response.data.result;
    } catch (error) {
      console.error("Error updating board:", error);
      return null;
    }
  },

  /**
   * Delete a board
   * @param boardId The ID of the board
   * @returns Success status
   */
  deleteBoard: async (boardId: string): Promise<boolean> => {
    try {
      await axios.delete(`${API_BASE_URI}/kanban/boards/${boardId}`, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      return true;
    } catch (error) {
      console.error("Error deleting board:", error);
      return false;
    }
  },
};

export default KanbanService;

