// src/store/kanbanSlice.ts
import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { nanoid } from "nanoid";
import { arrayMove } from "@dnd-kit/sortable";
import { ColumnKanban, TaskKanban, KanbanState, Board } from "../type/types";
import axios from "../utils/axios-customize";

// Define initial state with priority included
const initialState: KanbanState = {
  columns: [
    { id: "back_log", title: "Back Log", tasks: [] },
    { id: "pending", title: "Pending", tasks: [] },
    { id: "todo", title: "To Do", tasks: [] },
    { id: "in_progress", title: "In Progress", tasks: [] },
    { id: "done", title: "Done", tasks: [] },
  ],
  editingTask: null,
  isColumnsInvalidated: true,
  isEditingTaskInvalidated: true,
  userId: "",
  userBoards: [],
  activeBoard: null,
  loading: false,
  error: null,
};

// Async thunks
export const fetchUserBoards = createAsyncThunk(
  "kanban/fetchUserBoards",
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/kanban/boards/${userId}`);
      return response.data;
    } catch {
      return rejectWithValue("Failed to fetch user boards");
    }
  }
);

export const createBoardThunk = createAsyncThunk(
  "kanban/createBoard",
  async (boardData: { name: string; userId: string }, { rejectWithValue }) => {
    try {
      const response = await axios.post("/kanban/boards", boardData);
      return response.data;
    } catch {
      return rejectWithValue("Failed to create board");
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
      } else {
        // If payload is empty, reset to initialState columns
        state.columns = initialState.columns;
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
          // Add the missing properties
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
      state.columns.push({ id: nanoid(), title: action.payload, tasks: [] });
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
      }
    },
    clearKanbanData: (state) => {
      // Keep the column structure but clear the tasks
      state.columns = state.columns.map((column) => ({
        ...column,
        tasks: [],
      }));
      // If columns array is empty for some reason, reset to initial state
      if (state.columns.length === 0) {
        state.columns = initialState.columns;
      }
      state.editingTask = null;
      state.isColumnsInvalidated = false;
      state.isEditingTaskInvalidated = false;
    },
    resetToDefaultColumns: (state) => {
      state.columns = initialState.columns;
      state.editingTask = null;
      state.isColumnsInvalidated = false;
      state.isEditingTaskInvalidated = false;
    },
    // Add missing actions
    setActiveBoard: (state, action: PayloadAction<Board | null>) => {
      state.activeBoard = action.payload;
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
        state.userBoards = action.payload;
      })
      .addCase(fetchUserBoards.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Handle createBoardThunk async thunk
    builder
      .addCase(createBoardThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createBoardThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.userBoards.push(action.payload);
      })
      .addCase(createBoardThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setColumns,
  setEditingTask,
  setUserId,
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
  setActiveBoard,
  resetError,
} = kanbanSlice.actions;

export default kanbanSlice.reducer;

