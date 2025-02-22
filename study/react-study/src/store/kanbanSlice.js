// src/store/kanbanSlice.js
import { createSlice } from "@reduxjs/toolkit";
import { nanoid } from "nanoid";
import { arrayMove } from "@dnd-kit/sortable";

const initialState = {
  columns: [
    { id: "back_log", title: "Back Log", tasks: [] },
    { id: "pending", title: "Pending", tasks: [] },
    { id: "todo", title: "To Do", tasks: [] },
    {
      id: "in_progress",
      title: "In Progress",
      tasks: [],
    },
    { id: "done", title: "Done", tasks: [] },
  ],
  editingTask: null,
  isColumnsInvalidated: true, // Flag to track if columns need to be refetched/reset
  isEditingTaskInvalidated: true, // Flag to track if editingTask needs to be refetched/reset
};

const kanbanSlice = createSlice({
  name: "kanban",
  initialState,
  reducers: {
    // Set the entire columns state (e.g., from localStorage or initial load)
    setColumns: (state, action) => {
      state.columns = action.payload;
      state.isColumnsInvalidated = false;
    },

    // Set the editing task
    setEditingTask: (state, action) => {
      state.editingTask = action.payload;
      state.isEditingTaskInvalidated = false;
    },

    // Invalidate columns to trigger refetch/reset
    invalidateColumns: (state) => {
      state.isColumnsInvalidated = true;
    },

    // Invalidate editingTask to trigger refetch/reset
    invalidateEditingTask: (state) => {
      state.isEditingTaskInvalidated = true;
    },

    // Add a task to a column
    addTask: (state, action) => {
      const { columnId, taskTitle } = action.payload;
      const column = state.columns.find((col) => col.id === columnId);
      if (column) {
        column.tasks.push({ id: nanoid(), title: taskTitle });
      }
    },

    // Delete a task from a column
    deleteTask: (state, action) => {
      const { columnId, taskId } = action.payload;
      const column = state.columns.find((col) => col.id === columnId);
      if (column) {
        column.tasks = column.tasks.filter((task) => task.id !== taskId);
      }
    },

    // Add a new column
    addColumn: (state, action) => {
      state.columns.push({ id: nanoid(), title: action.payload, tasks: [] });
    },

    // Edit a column's title
    editColumn: (state, action) => {
      const { columnId, newTitle } = action.payload;
      const column = state.columns.find((col) => col.id === columnId);
      if (column) {
        column.title = newTitle;
      }
    },

    // Delete a column
    deleteColumn: (state, action) => {
      state.columns = state.columns.filter((col) => col.id !== action.payload);
    },

    // Save edits to a task
    saveTaskEdit: (state, action) => {
      const { taskId, newTitle } = action.payload;
      for (const column of state.columns) {
        const task = column.tasks.find((t) => t.id === taskId);
        if (task) {
          task.title = newTitle;
          break;
        }
      }
      state.editingTask = null; // Clear editing task after save
      state.isEditingTaskInvalidated = false;
    },

    // Handle task drag-and-drop
    dragEndTask: (state, action) => {
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
        if (overTaskIndex !== -1) {
          targetCol.tasks.splice(overTaskIndex, 0, movedTask);
        } else {
          targetCol.tasks.push(movedTask);
        }
      }
    },

    // Handle column drag-and-drop
    dragEndColumn: (state, action) => {
      const { activeId, overId } = action.payload;
      const oldIndex = state.columns.findIndex((col) => col.id === activeId);
      const newIndex = state.columns.findIndex((col) => col.id === overId);
      if (oldIndex !== newIndex) {
        state.columns = arrayMove(state.columns, oldIndex, newIndex);
      }
    },

    // Reset Kanban state (e.g., on logout or clear)
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

