import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { nanoid } from "nanoid";
import {
  ColumnKanban,
  TaskKanban,
  KanbanState,
  Board,
  RootState,
} from "../type/types";
import KanbanService from "../services/KanbanService";

// Define initial state
const initialState: KanbanState = {
  columns: [],
  editingTask: null,
  isColumnsInvalidated: true,
  isEditingTaskInvalidated: true,
  userId: "",
  loading: false,
  error: null,
  boardId: null,
  isLoading: false,
  userBoards: [],
  boardData: null,
  activeBoard: null,
};

// Default columns generator
const getDefaultColumns = (boardId: string | null): ColumnKanban[] => [
  {
    id: nanoid(),
    title: "Back log",
    tasks: [],
    position: 0,
    boardId: boardId || "",
  },
  {
    id: nanoid(),
    title: "Pending",
    tasks: [],
    position: 1,
    boardId: boardId || "",
  },
  {
    id: nanoid(),
    title: "To Do",
    tasks: [],
    position: 2,
    boardId: boardId || "",
  },
  {
    id: nanoid(),
    title: "In Progress",
    tasks: [],
    position: 3,
    boardId: boardId || "",
  },
  {
    id: nanoid(),
    title: "Done",
    tasks: [],
    position: 4,
    boardId: boardId || "",
  },
];

// Async thunks
export const fetchUserBoards = createAsyncThunk(
  "kanban/fetchUserBoards",
  async (
    { userId, token }: { userId: string; token: string },
    { rejectWithValue }
  ) => {
    try {
      const boards = await KanbanService.getUserBoards(userId, token);
      return boards;
    } catch {
      return rejectWithValue("Failed to fetch user boards");
    }
  }
);

export const fetchBoardById = createAsyncThunk(
  "kanban/fetchBoardById",
  async (
    { boardId, token }: { boardId: string; token: string },
    { rejectWithValue }
  ) => {
    try {
      const board = await KanbanService.getBoardById(boardId, token);
      if (!board) return rejectWithValue("Board not found");
      return board;
    } catch {
      return rejectWithValue("Failed to fetch board");
    }
  }
);

export const createUserBoard = createAsyncThunk(
  "kanban/createUserBoard",
  async (
    { userId, token, title }: { userId: string; token: string; title?: string },
    { rejectWithValue }
  ) => {
    try {
      const board = await KanbanService.createBoard(userId, token, title);
      if (!board) return rejectWithValue("Failed to create board");
      return board;
    } catch {
      return rejectWithValue("Failed to create board");
    }
  }
);

export const saveUserBoard = createAsyncThunk(
  "kanban/saveUserBoard",
  async (
    {
      boardId,
      token,
      data,
    }: { boardId: string; token: string; data: Partial<Board> },
    { rejectWithValue }
  ) => {
    try {
      const board = await KanbanService.updateBoard(boardId, token, data);
      if (!board) return rejectWithValue("Failed to save board");
      return board;
    } catch {
      return rejectWithValue("Failed to save board");
    }
  }
);

export const resetBoardToDefaults = createAsyncThunk(
  "kanban/resetBoardToDefaults",
  async (
    { boardId, token }: { boardId: string; token: string },
    { rejectWithValue }
  ) => {
    try {
      const result = await KanbanService.resetBoard(boardId, token);

      if (!result) {
        return rejectWithValue(
          "Failed to reset board: No data returned from server"
        );
      }

      return result;
    } catch (error) {
      // Handle Error object properly
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to reset board: Unknown error";

      console.error("Error resetting board:", error);
      return rejectWithValue(errorMessage);
    }
  }
);

export const addColumn = createAsyncThunk(
  "kanban/addColumn",
  async (
    {
      boardId,
      token,
      title,
    }: { boardId: string; token: string; title: string },
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as RootState;
      const position = state.kanban.columns.length;
      const board = await KanbanService.createColumn(
        boardId,
        token,
        title,
        position
      );
      if (!board) return rejectWithValue("Failed to add column");
      return board;
    } catch {
      return rejectWithValue("Failed to add column");
    }
  }
);

export const editColumn = createAsyncThunk(
  "kanban/editColumn",
  async (
    {
      columnId,
      token,
      newTitle,
    }: { columnId: string; token: string; newTitle: string },
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as RootState;
      const column = state.kanban.columns.find((col) => col.id === columnId);
      const position = column?.position;
      const boardId = state.kanban.boardId; // Get boardId from state

      if (!boardId) {
        return rejectWithValue("Cannot edit column: missing board ID");
      }

      const board = await KanbanService.updateColumn(
        columnId,
        token,
        newTitle,
        boardId, // Pass boardId to the service
        position
      );

      if (!board) return rejectWithValue("Failed to edit column");
      return board;
    } catch {
      return rejectWithValue("Failed to edit column");
    }
  }
);

export const deleteColumn = createAsyncThunk(
  "kanban/deleteColumn",
  async (
    { columnId, token }: { columnId: string; token: string },
    { rejectWithValue }
  ) => {
    try {
      const board = await KanbanService.deleteColumn(columnId, token);
      if (!board) return rejectWithValue("Failed to delete column");
      return board;
    } catch {
      return rejectWithValue("Failed to delete column");
    }
  }
);

export const addTask = createAsyncThunk(
  "kanban/addTask",
  async (
    {
      columnId,
      token,
      title,
      priority,
    }: {
      columnId: string;
      token: string;
      title: string;
      priority: "High" | "Medium" | "Low";
    },
    { rejectWithValue }
  ) => {
    try {
      const board = await KanbanService.createTask(
        columnId,
        token,
        title,
        priority
      );
      if (!board) return rejectWithValue("Failed to add task");
      return board;
    } catch {
      return rejectWithValue("Failed to add task");
    }
  }
);

export const deleteTask = createAsyncThunk(
  "kanban/deleteTask",
  async (
    { taskId, token }: { taskId: string; token: string },
    { rejectWithValue }
  ) => {
    try {
      const board = await KanbanService.deleteTask(taskId, token);
      if (!board) return rejectWithValue("Failed to delete task");
      return board;
    } catch {
      return rejectWithValue("Failed to delete task");
    }
  }
);

export const saveTaskEdit = createAsyncThunk(
  "kanban/saveTaskEdit",
  async (
    {
      taskId,
      token,
      newTitle,
      priority,
    }: {
      taskId: string;
      token: string;
      newTitle: string;
      priority: "High" | "Medium" | "Low";
    },
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as RootState;
      const column = state.kanban.columns.find((col) =>
        col.tasks.some((task) => task.id === taskId)
      );
      const task = column?.tasks.find((t) => t.id === taskId);
      const board = await KanbanService.updateTask(
        taskId,
        token,
        newTitle,
        priority,
        column?.id,
        task?.position
      );
      if (!board) return rejectWithValue("Failed to save task edit");
      return board;
    } catch {
      return rejectWithValue("Failed to save task edit");
    }
  }
);

export const dragEndTask = createAsyncThunk(
  "kanban/dragEndTask",
  async (
    {
      activeId,
      overId,
      token,
    }: { activeId: string; overId: string; token: string },
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as RootState;
      const sourceCol = state.kanban.columns.find((col) =>
        col.tasks.some((task) => task.id === activeId)
      );
      const targetCol = state.kanban.columns.find(
        (col) =>
          col.id === overId || col.tasks.some((task) => task.id === overId)
      );

      if (!sourceCol || !targetCol)
        return rejectWithValue("Invalid drag operation");

      const sourceTasks = sourceCol.tasks;
      const targetTasks = targetCol.tasks;
      const movedTask = sourceTasks.find((task) => task.id === activeId);
      if (!movedTask) return rejectWithValue("Task not found");

      const newPosition =
        targetCol.id === overId
          ? targetTasks.length
          : targetTasks.findIndex((task) => task.id === overId);

      const board = await KanbanService.moveTask({
        taskId: activeId,
        token,
        targetColumnId: targetCol.id,
        newPosition,
      });

      if (!board) return rejectWithValue("Failed to move task");
      return board;
    } catch {
      return rejectWithValue("Failed to move task");
    }
  }
);

export const dragEndColumn = createAsyncThunk(
  "kanban/dragEndColumn",
  async (
    {
      activeId,
      overId,
      token,
    }: { activeId: string; overId: string; token: string },
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as RootState;
      const oldIndex = state.kanban.columns.findIndex(
        (col) => col.id === activeId
      );
      const newIndex = state.kanban.columns.findIndex(
        (col) => col.id === overId
      );

      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex)
        return rejectWithValue("Invalid column drag operation");

      const board = await KanbanService.moveColumn({
        columnId: activeId,
        token,
        newPosition: newIndex,
      });

      if (!board) return rejectWithValue("Failed to move column");
      return board;
    } catch {
      return rejectWithValue("Failed to move column");
    }
  }
);

export const clearKanbanData = createAsyncThunk(
  "kanban/clearKanbanData",
  async (
    { boardId, token }: { boardId: string; token: string },
    { rejectWithValue }
  ) => {
    try {
      const board = await KanbanService.clearAllTasks(boardId, token);
      if (!board) return rejectWithValue("Failed to clear tasks");
      return board;
    } catch {
      return rejectWithValue("Failed to clear tasks");
    }
  }
);

const kanbanSlice = createSlice({
  name: "kanban",
  initialState,
  reducers: {
    setEditingTask: (state, action: PayloadAction<TaskKanban | null>) => {
      state.editingTask = action.payload;
      state.isEditingTaskInvalidated = false;
    },
    setUserId: (state, action: PayloadAction<string>) => {
      state.userId = action.payload;
    },
    setBoardId: (state, action: PayloadAction<string | null>) => {
      state.boardId = action.payload;
    },
    setActiveBoard: (state, action: PayloadAction<Board | null>) => {
      state.activeBoard = action.payload;
      if (action.payload) {
        state.boardId = action.payload.id;
        state.columns =
          action.payload.columns && action.payload.columns.length > 0
            ? action.payload.columns
            : getDefaultColumns(action.payload.id || null);
      }
    },
    resetToDefaultColumns: (state) => {
      state.columns = getDefaultColumns(state.boardId || null);
      state.editingTask = null;
      state.isColumnsInvalidated = false;
      state.isEditingTaskInvalidated = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserBoards.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserBoards.fulfilled, (state, action) => {
        state.loading = false;
        state.userBoards = action.payload || [];
        if (action.payload && action.payload.length > 0 && !state.activeBoard) {
          const firstBoard = action.payload[0];
          state.activeBoard = firstBoard;
          state.boardId = firstBoard.id;
          state.columns =
            firstBoard.columns && firstBoard.columns.length > 0
              ? firstBoard.columns
              : getDefaultColumns(firstBoard.id);
        }
      })
      .addCase(fetchUserBoards.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchBoardById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBoardById.fulfilled, (state, action) => {
        state.loading = false;
        state.activeBoard = action.payload;
        state.boardId = action.payload.id;
        state.columns =
          action.payload.columns && action.payload.columns.length > 0
            ? action.payload.columns
            : getDefaultColumns(action.payload.id);
      })
      .addCase(fetchBoardById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createUserBoard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createUserBoard.fulfilled, (state, action) => {
        state.loading = false;
        if (!state.userBoards) state.userBoards = [];
        state.userBoards.push(action.payload);
        state.activeBoard = action.payload;
        state.boardId = action.payload.id;
        state.columns =
          action.payload.columns && action.payload.columns.length > 0
            ? action.payload.columns
            : getDefaultColumns(action.payload.id);
      })
      .addCase(createUserBoard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(saveUserBoard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(saveUserBoard.fulfilled, (state, action) => {
        state.loading = false;
        if (state.userBoards) {
          const boardIndex = state.userBoards.findIndex(
            (b) => b.id === action.payload.id
          );
          if (boardIndex !== -1) state.userBoards[boardIndex] = action.payload;
        }
        if (state.activeBoard?.id === action.payload.id) {
          state.activeBoard = action.payload;
          state.columns = action.payload.columns || state.columns;
        }
      })
      .addCase(saveUserBoard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(addColumn.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addColumn.fulfilled, (state, action) => {
        state.loading = false;
        state.columns = action.payload.columns || state.columns;
        if (state.activeBoard) state.activeBoard.columns = state.columns;
      })
      .addCase(addColumn.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(editColumn.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(editColumn.fulfilled, (state, action) => {
        state.loading = false;
        state.columns = action.payload.columns || state.columns;
        if (state.activeBoard) state.activeBoard.columns = state.columns;
      })
      .addCase(editColumn.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteColumn.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteColumn.fulfilled, (state, action) => {
        state.loading = false;
        state.columns = action.payload.columns || state.columns;
        if (state.activeBoard) state.activeBoard.columns = state.columns;
      })
      .addCase(deleteColumn.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(addTask.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addTask.fulfilled, (state, action) => {
        state.loading = false;
        state.columns = action.payload.columns || state.columns;
        if (state.activeBoard) state.activeBoard.columns = state.columns;
      })
      .addCase(addTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteTask.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.loading = false;
        state.columns = action.payload.columns || state.columns;
        if (state.activeBoard) state.activeBoard.columns = state.columns;
      })
      .addCase(deleteTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(saveTaskEdit.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(saveTaskEdit.fulfilled, (state, action) => {
        state.loading = false;
        state.columns = action.payload.columns || state.columns;
        state.editingTask = null;
        if (state.activeBoard) state.activeBoard.columns = state.columns;
      })
      .addCase(saveTaskEdit.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(dragEndTask.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(dragEndTask.fulfilled, (state, action) => {
        state.loading = false;
        state.columns = action.payload.columns || state.columns;
        if (state.activeBoard) state.activeBoard.columns = state.columns;
      })
      .addCase(dragEndTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(dragEndColumn.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(dragEndColumn.fulfilled, (state, action) => {
        state.loading = false;
        state.columns = action.payload.columns || state.columns;
        if (state.activeBoard) state.activeBoard.columns = state.columns;
      })
      .addCase(dragEndColumn.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(clearKanbanData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(clearKanbanData.fulfilled, (state, action) => {
        state.loading = false;
        state.columns = action.payload.columns || state.columns;
        if (state.activeBoard) state.activeBoard.columns = state.columns;
      })
      .addCase(clearKanbanData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(resetBoardToDefaults.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resetBoardToDefaults.fulfilled, (state, action) => {
        state.isLoading = false;
        state.boardData = action.payload;
        state.error = null;
      })
      .addCase(resetBoardToDefaults.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || "Failed to reset board";
        console.log("Board reset failed:", state.error);
      });
  },
});

export const {
  setEditingTask,
  setUserId,
  setBoardId,
  setActiveBoard,
  resetToDefaultColumns,
} = kanbanSlice.actions;

export default kanbanSlice.reducer;

