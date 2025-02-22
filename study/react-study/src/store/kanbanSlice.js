import { createSlice } from "@reduxjs/toolkit";
import { nanoid } from "nanoid";
import { arrayMove } from "@dnd-kit/sortable";

const initialState = {
  columns: [
    { id: "todo", title: "To Do", tasks: [{ id: "1", title: "Task 1" }] },
    {
      id: "in_progress",
      title: "In Progress",
      tasks: [{ id: "2", title: "Task 2" }],
    },
    { id: "done", title: "Done", tasks: [] },
  ],
  editingTask: null,
};

const kanbanSlice = createSlice({
  name: "kanban",
  initialState,
  reducers: {
    addTask: (state, action) => {
      const { columnId, taskTitle } = action.payload;
      const column = state.columns.find((col) => col.id === columnId);
      if (column) {
        column.tasks.push({ id: nanoid(), title: taskTitle });
      }
    },
    deleteTask: (state, action) => {
      const { columnId, taskId } = action.payload;
      const column = state.columns.find((col) => col.id === columnId);
      if (column) {
        column.tasks = column.tasks.filter((task) => task.id !== taskId);
      }
    },
    addColumn: (state, action) => {
      state.columns.push({ id: nanoid(), title: action.payload, tasks: [] });
    },
    editColumn: (state, action) => {
      const { columnId, newTitle } = action.payload;
      const column = state.columns.find((col) => col.id === columnId);
      if (column) {
        column.title = newTitle;
      }
    },
    deleteColumn: (state, action) => {
      state.columns = state.columns.filter((col) => col.id !== action.payload);
    },
    saveTaskEdit: (state, action) => {
      const { taskId, newTitle } = action.payload;
      for (const column of state.columns) {
        const task = column.tasks.find((t) => t.id === taskId);
        if (task) {
          task.title = newTitle;
          break;
        }
      }
    },
    setEditingTask: (state, action) => {
      state.editingTask = action.payload;
    },
    logout: (state) => {
      state.columns = [
        { id: "todo", title: "To Do", tasks: [{ id: "1", title: "Task 1" }] },
        {
          id: "in_progress",
          title: "In Progress",
          tasks: [{ id: "2", title: "Task 2" }],
        },
        { id: "done", title: "Done", tasks: [] },
      ]; // Optional: Reset Kanban state on logout
      state.editingTask = null;
    },
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
          targetCol.tasks.findIndex((task) => task.id === overId) ||
          targetCol.tasks.length;
        sourceCol.tasks = arrayMove(sourceCol.tasks, oldIndex, newIndex);
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
    dragEndColumn: (state, action) => {
      const { activeId, overId } = action.payload;
      const oldIndex = state.columns.findIndex((col) => col.id === activeId);
      const newIndex = state.columns.findIndex((col) => col.id === overId);
      if (oldIndex !== newIndex) {
        state.columns = arrayMove(state.columns, oldIndex, newIndex);
      }
    },
  },
});

export const {
  addTask,
  deleteTask,
  addColumn,
  editColumn,
  deleteColumn,
  saveTaskEdit,
  setEditingTask,
  logout,
  dragEndTask,
  dragEndColumn,
} = kanbanSlice.actions;

export default kanbanSlice.reducer;

