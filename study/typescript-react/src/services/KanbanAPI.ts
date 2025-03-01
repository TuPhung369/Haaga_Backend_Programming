// src/services/KanbanAPI.ts
import axios from "axios";
import { KanbanBoardResponse } from "../type/types";

const API_BASE_URI = import.meta.env.VITE_API_BASE_URI + "/api/kanban";

// Define request types needed for API calls
interface KanbanBoardRequest {
  title: string;
  userId: string;
}

interface KanbanColumnRequest {
  title: string;
  boardId: string;
  position?: number;
}

interface KanbanTaskRequest {
  title: string;
  description?: string;
  priority: "High" | "Medium" | "Low";
  columnId: string;
  position?: number;
}

interface KanbanMoveTaskRequest {
  taskId: string;
  targetColumnId: string;
  newPosition: number;
}

interface KanbanMoveColumnRequest {
  columnId: string;
  newPosition: number;
}

// API service methods
export const KanbanAPI = {
  // Board operations
  getBoards: async (userId: string): Promise<KanbanBoardResponse[]> => {
    const response = await axios.get(`${API_BASE_URI}/boards?userId=${userId}`);
    return response.data.result;
  },

  getBoard: async (boardId: string): Promise<KanbanBoardResponse> => {
    const response = await axios.get(`${API_BASE_URI}/boards/${boardId}`);
    return response.data.result;
  },

  createBoard: async (
    request: KanbanBoardRequest
  ): Promise<KanbanBoardResponse> => {
    const response = await axios.post(`${API_BASE_URI}/boards`, request);
    return response.data.result;
  },

  updateBoard: async (
    boardId: string,
    request: KanbanBoardRequest
  ): Promise<KanbanBoardResponse> => {
    const response = await axios.put(
      `${API_BASE_URI}/boards/${boardId}`,
      request
    );
    return response.data.result;
  },

  deleteBoard: async (boardId: string): Promise<void> => {
    await axios.delete(`${API_BASE_URI}/boards/${boardId}`);
  },

  // Column operations
  createColumn: async (
    request: KanbanColumnRequest
  ): Promise<KanbanBoardResponse> => {
    const response = await axios.post(`${API_BASE_URI}/columns`, request);
    return response.data.result;
  },

  updateColumn: async (
    columnId: string,
    request: KanbanColumnRequest
  ): Promise<KanbanBoardResponse> => {
    const response = await axios.put(
      `${API_BASE_URI}/columns/${columnId}`,
      request
    );
    return response.data.result;
  },

  deleteColumn: async (columnId: string): Promise<KanbanBoardResponse> => {
    const response = await axios.delete(`${API_BASE_URI}/columns/${columnId}`);
    return response.data.result;
  },

  moveColumn: async (
    request: KanbanMoveColumnRequest
  ): Promise<KanbanBoardResponse> => {
    const response = await axios.post(`${API_BASE_URI}/columns/move`, request);
    return response.data.result;
  },

  // Task operations
  createTask: async (
    request: KanbanTaskRequest
  ): Promise<KanbanBoardResponse> => {
    const response = await axios.post(`${API_BASE_URI}/tasks`, request);
    return response.data.result;
  },

  updateTask: async (
    taskId: string,
    request: KanbanTaskRequest
  ): Promise<KanbanBoardResponse> => {
    const response = await axios.put(
      `${API_BASE_URI}/tasks/${taskId}`,
      request
    );
    return response.data.result;
  },

  deleteTask: async (taskId: string): Promise<KanbanBoardResponse> => {
    const response = await axios.delete(`${API_BASE_URI}/tasks/${taskId}`);
    return response.data.result;
  },

  moveTask: async (
    request: KanbanMoveTaskRequest
  ): Promise<KanbanBoardResponse> => {
    const response = await axios.post(`${API_BASE_URI}/tasks/move`, request);
    return response.data.result;
  },
};

