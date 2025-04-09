// src/types/KanbanTypes.ts
// Types related to Kanban board functionality

export interface TaskKanban {
  id: string;
  title: string;
  description?: string;
  priority?: "High" | "Medium" | "Low";
  position: number;
  columnId: string;
  createdAt?: string;
}

export interface ColumnKanban {
  id: string;
  title: string;
  tasks: TaskKanban[];
  position?: number;
  boardId?: string;
}

export interface Board {
  id: string;
  title?: string;
  columns?: ColumnKanban[];
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface KanbanState {
  columns: ColumnKanban[];
  editingTask: TaskKanban | null;
  userBoards?: Board[];
  isColumnsInvalidated: boolean;
  isEditingTaskInvalidated: boolean;
  userId: string;
  loading?: boolean;
  error?: string | null;
  activeBoard?: Board | null;
  boardId?: string | null;
  isLoading?: boolean;
  boardData?: KanbanBoardResponse | null;
}

export interface KanbanBoardResponse {
  id: string;
  title: string;
  userId: string;
  columns: ColumnKanban[];
  createdAt?: string;
}
