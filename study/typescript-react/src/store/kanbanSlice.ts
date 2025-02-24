import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { nanoid } from "nanoid";
import { arrayMove } from "@dnd-kit/sortable";
import { ColumnKanban, TaskKanban, KanbanState } from "../type/types";

// Define initial state
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
};

// Create the slice
const kanbanSlice = createSlice({
  name: "kanban",
  initialState,
  reducers: {
    setColumns: (state, action: PayloadAction<ColumnKanban[]>) => {
      state.columns = action.payload;
      state.isColumnsInvalidated = false;
    },
    setEditingTask: (state, action: PayloadAction<TaskKanban | null>) => {
      state.editingTask = action.payload;
      state.isEditingTaskInvalidated = false;
    },
    invalidateColumns: (state) => {
      state.isColumnsInvalidated = true;
    },
    invalidateEditingTask: (state) => {
      state.isEditingTaskInvalidated = true;
    },
    addTask: (
      state,
      action: PayloadAction<{ columnId: string; taskTitle: string }>
    ) => {
      const { columnId, taskTitle } = action.payload;
      const column = state.columns.find((col) => col.id === columnId);
      if (column) {
        column.tasks.push({ id: nanoid(), title: taskTitle });
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
      action: PayloadAction<{ taskId: string; newTitle: string }>
    ) => {
      const { taskId, newTitle } = action.payload;
      for (const column of state.columns) {
        const task = column.tasks.find((t) => t.id === taskId);
        if (task) {
          task.title = newTitle;
          break;
        }
      }
      state.editingTask = null;
      state.isEditingTaskInvalidated = false;
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
        }
      } else {
        const movedTask = sourceCol.tasks.find((task) => task.id === activeId);
        sourceCol.tasks = sourceCol.tasks.filter(
          (task) => task.id !== activeId
        );
        const overTaskIndex = targetCol.tasks.findIndex(
          (task) => task.id === overId
        );
        if (overTaskIndex !== -1 && movedTask) {
          targetCol.tasks.splice(overTaskIndex, 0, movedTask);
        } else if (movedTask) {
          targetCol.tasks.push(movedTask);
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
      state.columns = [
        { id: "todo", title: "To Do", tasks: [{ id: "1", title: "Task 1" }] },
        {
          id: "in_progress",
          title: "In Progress",
          tasks: [{ id: "2", title: "Task 2" }],
        },
        { id: "done", title: "Done", tasks: [] },
      ];
      state.editingTask = null;
      state.isColumnsInvalidated = true;
      state.isEditingTaskInvalidated = true;
    },
  },
});

// Export actions and reducer
export const {
  setColumns,
  setEditingTask,
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
} = kanbanSlice.actions;

export default kanbanSlice.reducer;

