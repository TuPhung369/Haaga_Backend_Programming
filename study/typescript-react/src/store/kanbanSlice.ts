// src/store/kanbanSlice.ts
import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { nanoid } from "nanoid";
import { arrayMove } from "@dnd-kit/sortable";
import { ColumnKanban, TaskKanban, KanbanState, Board } from "../type/types";
import kanbanService from "../services/KanbanService";

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

// Async thunk to fetch all user's boards
export const fetchUserBoards = createAsyncThunk(
  "kanban/fetchUserBoards",
  async (userId: string, { rejectWithValue }) => {
    try {
      const boards = await kanbanService.getUserBoards(userId);
      return boards;
    } catch {
      return rejectWithValue("Failed to fetch user boards");
    }
  }
);

// Async thunk to fetch a specific board
export const fetchBoardById = createAsyncThunk(
  "kanban/fetchBoardById",
  async (boardId: string, { rejectWithValue }) => {
    try {
      const board = await kanbanService.getBoardById(boardId);
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
    { userId, title }: { userId: string; title?: string },
    { rejectWithValue }
  ) => {
    try {
      const board = await kanbanService.createBoard(userId, title);
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
      data,
    }: {
      boardId: string;
      data: Partial<Board & { columns: ColumnKanban[] }>;
    },
    { rejectWithValue }
  ) => {
    try {
      const board = await kanbanService.updateBoard(boardId, data);
      if (!board) {
        return rejectWithValue("Failed to save board");
      }
      return board;
    } catch {
      return rejectWithValue("Failed to save board");
    }
  }
);

const kanbanSlice = createSlice({
  name: "kanban",
  initialState,
  reducers: {
    setColumns: (state, action: PayloadAction<ColumnKanban[]>) => {
      // Ensure we don't set empty columns array
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
        if (action.payload.columns && action.payload.columns.length > 0) {
          state.columns = action.payload.columns;
        }
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

          // Update positions after reordering
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
          // Update columnId of the moved task
          movedTask.columnId = targetCol.id;

          if (overTaskIndex !== -1) {
            targetCol.tasks.splice(overTaskIndex, 0, movedTask);
          } else {
            targetCol.tasks.push(movedTask);
          }

          // Update positions in the target column
          targetCol.tasks.forEach((task, index) => {
            task.position = index;
          });

          // Update positions in the source column
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

        // Update positions after reordering
        state.columns.forEach((column, index) => {
          column.position = index;
        });
      }
    },
    clearKanbanData: (state) => {
      // Keep the column structure but clear the tasks
      state.columns = state.columns.map((column) => ({
        ...column,
        tasks: [],
      }));
      state.editingTask = null;
      state.isColumnsInvalidated = false;
      state.isEditingTaskInvalidated = false;
    },
    resetToDefaultColumns: (state) => {
      // Create default columns with boardId
      if (state.boardId) {
        state.columns = [
          {
            id: nanoid(),
            title: "Backlog",
            tasks: [],
            position: 0,
            boardId: state.boardId,
          },
          {
            id: nanoid(),
            title: "To Do",
            tasks: [],
            position: 1,
            boardId: state.boardId,
          },
          {
            id: nanoid(),
            title: "In Progress",
            tasks: [],
            position: 2,
            boardId: state.boardId,
          },
          {
            id: nanoid(),
            title: "Done",
            tasks: [],
            position: 3,
            boardId: state.boardId,
          },
        ];
      }
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

        // If we have boards and no active board, set the first one as active
        if (action.payload && action.payload.length > 0 && !state.activeBoard) {
          const firstBoard = action.payload[0];
          state.activeBoard = firstBoard;
          state.boardId = firstBoard.id;
          if (firstBoard.columns && firstBoard.columns.length > 0) {
            state.columns = firstBoard.columns;
          }
        }
      })
      .addCase(fetchUserBoards.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Handle fetchBoardById async thunk
    builder
      .addCase(fetchBoardById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBoardById.fulfilled, (state, action) => {
        state.loading = false;
        state.activeBoard = action.payload;
        state.boardId = action.payload.id;
        if (action.payload.columns && action.payload.columns.length > 0) {
          state.columns = action.payload.columns;
        }
      })
      .addCase(fetchBoardById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Handle createUserBoard async thunk
    builder
      .addCase(createUserBoard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createUserBoard.fulfilled, (state, action) => {
        state.loading = false;

        // Add to user boards
        if (!state.userBoards) {
          state.userBoards = [];
        }
        state.userBoards.push(action.payload);

        // Set as active board
        state.activeBoard = action.payload;
        state.boardId = action.payload.id;

        // If the board has columns, use them, otherwise reset to defaults
        if (action.payload.columns && action.payload.columns.length > 0) {
          state.columns = action.payload.columns;
        } else {
          // Create default columns with the new boardId
          state.columns = [
            {
              id: nanoid(),
              title: "Backlog",
              tasks: [],
              position: 0,
              boardId: action.payload.id,
            },
            {
              id: nanoid(),
              title: "To Do",
              tasks: [],
              position: 1,
              boardId: action.payload.id,
            },
            {
              id: nanoid(),
              title: "In Progress",
              tasks: [],
              position: 2,
              boardId: action.payload.id,
            },
            {
              id: nanoid(),
              title: "Done",
              tasks: [],
              position: 3,
              boardId: action.payload.id,
            },
          ];
        }
      })
      .addCase(createUserBoard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Handle saveUserBoard async thunk
    builder
      .addCase(saveUserBoard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(saveUserBoard.fulfilled, (state, action) => {
        state.loading = false;

        // Update board in userBoards array
        if (state.userBoards) {
          const boardIndex = state.userBoards.findIndex(
            (b) => b.id === action.payload.id
          );
          if (boardIndex !== -1) {
            state.userBoards[boardIndex] = action.payload;
          }
        }

        // Update active board
        if (state.activeBoard?.id === action.payload.id) {
          state.activeBoard = action.payload;
        }
      })
      .addCase(saveUserBoard.rejected, (state, action) => {
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
  resetError,
} = kanbanSlice.actions;

export default kanbanSlice.reducer;

