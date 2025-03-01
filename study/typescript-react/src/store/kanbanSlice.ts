import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { nanoid } from "nanoid";
import { arrayMove } from "@dnd-kit/sortable";
import { ColumnKanban, TaskKanban, KanbanState, Board } from "../type/types";
import KanbanService from "../services/KanbanService";

// Define initial state with priority included
const initialState: KanbanState = {
  columns: [],
  editingTask: null,
  isColumnsInvalidated: true,
  isEditingTaskInvalidated: true,
  userId: "",
  loading: false,
  error: null,
  boardId: null,
  userBoards: [],
  activeBoard: null,
};

// Default columns generator
const getDefaultColumns = (boardId: string | null): ColumnKanban[] => [
  {
    id: nanoid(),
    title: "Backlog",
    tasks: [],
    position: 0,
    boardId: boardId || "",
  },
  {
    id: nanoid(),
    title: "To Do",
    tasks: [],
    position: 1,
    boardId: boardId || "",
  },
  {
    id: nanoid(),
    title: "In Progress",
    tasks: [],
    position: 2,
    boardId: boardId || "",
  },
  {
    id: nanoid(),
    title: "Done",
    tasks: [],
    position: 3,
    boardId: boardId || "",
  },
];

// Async thunk to fetch all user's boards
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

// Async thunk to fetch a specific board
export const fetchBoardById = createAsyncThunk(
  "kanban/fetchBoardById",
  async (
    { boardId, token }: { boardId: string; token: string },
    { rejectWithValue }
  ) => {
    try {
      const board = await KanbanService.getBoardById(boardId, token);
      if (!board) {
        return rejectWithValue("Board not found");
      }
      return board;
    } catch {
      return rejectWithValue("Failed to fetch board");
    }
  }
);

// Async thunk to create user's board
export const createUserBoard = createAsyncThunk(
  "kanban/createUserBoard",
  async (
    { userId, token, title }: { userId: string; token: string; title?: string },
    { rejectWithValue }
  ) => {
    try {
      const board = await KanbanService.createBoard(userId, token, title);
      if (!board) {
        return rejectWithValue("Failed to create board");
      }
      return board;
    } catch {
      return rejectWithValue("Failed to create board");
    }
  }
);

// Async thunk to save board state
export const saveUserBoard = createAsyncThunk(
  "kanban/saveUserBoard",
  async (
    {
      boardId,
      token,
      data,
    }: {
      boardId: string;
      token: string;
      data: Partial<Board>;
    },
    { rejectWithValue }
  ) => {
    try {
      const board = await KanbanService.updateBoard(boardId, token, data);
      if (!board) {
        return rejectWithValue("Failed to save board");
      }
      return board;
    } catch {
      return rejectWithValue("Failed to save board");
    }
  }
);

// Async thunk to delete a board
export const deleteUserBoard = createAsyncThunk(
  "kanban/deleteUserBoard",
  async (
    { boardId, token }: { boardId: string; token: string },
    { rejectWithValue }
  ) => {
    try {
      const success = await KanbanService.deleteBoard(boardId, token);
      if (!success) {
        return rejectWithValue("Failed to delete board");
      }
      return boardId;
    } catch {
      return rejectWithValue("Failed to delete board");
    }
  }
);

const kanbanSlice = createSlice({
  name: "kanban",
  initialState,
  reducers: {
    setColumns: (state, action: PayloadAction<ColumnKanban[]>) => {
      if (action.payload && action.payload.length > 0) {
        state.columns = action.payload;
      }
      state.isColumnsInvalidated = false;
    },
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
            : getDefaultColumns(action.payload.id);
      }
    },
    invalidateColumns: (state) => {
      state.isColumnsInvalidated = true;
    },
    invalidateEditingTask: (state) => {
      state.isEditingTaskInvalidated = true;
    },
    addTask: (
      state,
      action: PayloadAction<{
        columnId: string;
        taskTitle: string;
        priority: "High" | "Medium" | "Low";
      }>
    ) => {
      const { columnId, taskTitle, priority } = action.payload;
      const column = state.columns.find((col) => col.id === columnId);
      if (column) {
        column.tasks.push({
          id: nanoid(),
          title: taskTitle,
          priority,
          position: column.tasks.length,
          columnId: columnId,
        });
      }
    },
    deleteTask: (
      state,
      action: PayloadAction<{ columnId: string; taskId: string }>
    ) => {
      const { columnId, taskId } = action.payload;
      const column = state.columns.find((col) => col.id === columnId);
      if (column) {
        column.tasks = column.tasks.filter((task) => task.id !== taskId);
      }
    },
    addColumn: (state, action: PayloadAction<string>) => {
      const newColumn = {
        id: nanoid(),
        title: action.payload,
        tasks: [],
        position: state.columns.length,
        boardId: state.boardId || "",
      };
      state.columns.push(newColumn);
    },
    editColumn: (
      state,
      action: PayloadAction<{ columnId: string; newTitle: string }>
    ) => {
      const { columnId, newTitle } = action.payload;
      const column = state.columns.find((col) => col.id === columnId);
      if (column) {
        column.title = newTitle;
      }
    },
    deleteColumn: (state, action: PayloadAction<string>) => {
      state.columns = state.columns.filter((col) => col.id !== action.payload);
    },
    saveTaskEdit: (
      state,
      action: PayloadAction<{
        taskId: string;
        newTitle: string;
        priority: "High" | "Medium" | "Low";
      }>
    ) => {
      const { taskId, newTitle, priority } = action.payload;
      for (const column of state.columns) {
        const task = column.tasks.find((t) => t.id === taskId);
        if (task) {
          task.title = newTitle;
          task.priority = priority;
          break;
        }
      }
      state.editingTask = null;
    },
    dragEndTask: (
      state,
      action: PayloadAction<{ activeId: string; overId: string }>
    ) => {
      const { activeId, overId } = action.payload;
      const sourceCol = state.columns.find((col) =>
        col.tasks.some((task) => task.id === activeId)
      );
      const targetCol = state.columns.find(
        (col) =>
          col.id === overId || col.tasks.some((task) => task.id === overId)
      );

      if (!sourceCol || !targetCol) return;

      if (sourceCol.id === targetCol.id) {
        const oldIndex = sourceCol.tasks.findIndex(
          (task) => task.id === activeId
        );
        const newIndex =
          targetCol.tasks.findIndex((task) => task.id === overId) !== -1
            ? targetCol.tasks.findIndex((task) => task.id === overId)
            : targetCol.tasks.length;
        if (oldIndex !== newIndex) {
          sourceCol.tasks = arrayMove(sourceCol.tasks, oldIndex, newIndex);
          sourceCol.tasks.forEach((task, index) => {
            task.position = index;
          });
        }
      } else {
        const movedTask = sourceCol.tasks.find((task) => task.id === activeId);
        sourceCol.tasks = sourceCol.tasks.filter(
          (task) => task.id !== activeId
        );
        const overTaskIndex = targetCol.tasks.findIndex(
          (task) => task.id === overId
        );

        if (movedTask) {
          movedTask.columnId = targetCol.id;
          if (overTaskIndex !== -1) {
            targetCol.tasks.splice(overTaskIndex, 0, movedTask);
          } else {
            targetCol.tasks.push(movedTask);
          }
          targetCol.tasks.forEach((task, index) => {
            task.position = index;
          });
          sourceCol.tasks.forEach((task, index) => {
            task.position = index;
          });
        }
      }
    },
    dragEndColumn: (
      state,
      action: PayloadAction<{ activeId: string; overId: string }>
    ) => {
      const { activeId, overId } = action.payload;
      const oldIndex = state.columns.findIndex((col) => col.id === activeId);
      const newIndex = state.columns.findIndex((col) => col.id === overId);
      if (oldIndex !== newIndex) {
        state.columns = arrayMove(state.columns, oldIndex, newIndex);
        state.columns.forEach((column, index) => {
          column.position = index;
        });
      }
    },
    clearKanbanData: (state) => {
      state.columns = state.columns.map((column) => ({
        ...column,
        tasks: [],
      }));
      state.editingTask = null;
      state.isColumnsInvalidated = false;
      state.isEditingTaskInvalidated = false;
    },
    resetToDefaultColumns: (state) => {
      state.columns = getDefaultColumns(state.boardId ?? null);
      state.editingTask = null;
      state.isColumnsInvalidated = false;
      state.isEditingTaskInvalidated = false;
    },
    resetError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Handle fetchUserBoards async thunk
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

      // Handle fetchBoardById async thunk
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

      // Handle createUserBoard async thunk
      .addCase(createUserBoard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createUserBoard.fulfilled, (state, action) => {
        state.loading = false;
        if (!state.userBoards) {
          state.userBoards = [];
        }
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

      // Handle saveUserBoard async thunk
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
          if (boardIndex !== -1) {
            state.userBoards[boardIndex] = action.payload;
          }
        }
        if (state.activeBoard?.id === action.payload.id) {
          state.activeBoard = action.payload;
        }
      })
      .addCase(saveUserBoard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Handle deleteUserBoard async thunk
      .addCase(deleteUserBoard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteUserBoard.fulfilled, (state, action) => {
        state.loading = false;
        if (state.userBoards) {
          state.userBoards = state.userBoards.filter(
            (board) => board.id !== action.payload
          );
        }
        if (state.activeBoard?.id === action.payload) {
          state.activeBoard = null;
          state.boardId = null;
          state.columns = [];
        }
      })
      .addCase(deleteUserBoard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setColumns,
  setEditingTask,
  setUserId,
  setBoardId,
  setActiveBoard,
  invalidateColumns,
  invalidateEditingTask,
  addTask,
  deleteTask,
  addColumn,
  editColumn,
  deleteColumn,
  saveTaskEdit,
  dragEndTask,
  dragEndColumn,
  clearKanbanData,
  resetToDefaultColumns,
  // Removed resetError since it wasn't defined
} = kanbanSlice.actions;

export default kanbanSlice.reducer;

