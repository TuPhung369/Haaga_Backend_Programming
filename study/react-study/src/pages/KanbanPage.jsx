import React, { useState } from "react";
import { DndContext, closestCorners } from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import Column from "../components/ColumnKanban";
import { nanoid } from "nanoid";

const KanbanBoard = () => {
  const [columns, setColumns] = useState([
    { id: "todo", title: "To Do", tasks: [{ id: "1", title: "Task 1" }] },
    {
      id: "in_progress",
      title: "In Progress",
      tasks: [{ id: "2", title: "Task 2" }],
    },
    { id: "done", title: "Done", tasks: [] },
  ]);
  const [editingTask, setEditingTask] = useState(null);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;

    if (active.data.current?.type === "task") {
      // Logic hiện tại cho nhiệm vụ (task)
      const taskId = active.id;
      const sourceCol = columns.find((col) =>
        col.tasks.some((task) => task.id === taskId)
      );
      if (!sourceCol) return;

      let targetCol;
      if (over.data.current?.type === "task") {
        const overTaskId = over.id;
        targetCol = columns.find((col) =>
          col.tasks.some((task) => task.id === overTaskId)
        );
      } else if (over.data.current?.type === "column") {
        targetCol = columns.find((col) => col.id === over.id);
      } else {
        targetCol = sourceCol;
      }

      if (!targetCol) return;

      if (sourceCol.id === targetCol.id) {
        const oldIndex = sourceCol.tasks.findIndex(
          (task) => task.id === taskId
        );
        const newIndex =
          over.data.current?.type === "task"
            ? targetCol.tasks.findIndex((task) => task.id === over.id)
            : targetCol.tasks.length;

        if (oldIndex !== newIndex) {
          const updatedTasks = arrayMove(sourceCol.tasks, oldIndex, newIndex);
          setColumns((prevColumns) =>
            prevColumns.map((col) =>
              col.id === sourceCol.id ? { ...col, tasks: updatedTasks } : col
            )
          );
        }
      } else {
        const movedTask = sourceCol.tasks.find((task) => task.id === taskId);
        const updatedSourceTasks = sourceCol.tasks.filter(
          (task) => task.id !== taskId
        );
        let updatedTargetTasks;

        if (over.data.current?.type === "task") {
          const overTaskIndex = targetCol.tasks.findIndex(
            (task) => task.id === over.id
          );
          updatedTargetTasks = [
            ...targetCol.tasks.slice(0, overTaskIndex),
            movedTask,
            ...targetCol.tasks.slice(overTaskIndex),
          ];
        } else {
          updatedTargetTasks = [...targetCol.tasks, movedTask];
        }

        setColumns((prevColumns) =>
          prevColumns.map((col) =>
            col.id === sourceCol.id
              ? { ...col, tasks: updatedSourceTasks }
              : col.id === targetCol.id
              ? { ...col, tasks: updatedTargetTasks }
              : col
          )
        );
      }
    } else if (active.data.current?.type === "column") {
      // Logic mới cho cột (column)
      const oldIndex = columns.findIndex((col) => col.id === active.id);
      const newIndex = columns.findIndex((col) => col.id === over.id);

      if (oldIndex !== newIndex) {
        const updatedColumns = arrayMove(columns, oldIndex, newIndex);
        setColumns(updatedColumns);
      }
    }
  };

  const addTask = (columnId, taskTitle) => {
    setColumns((prevColumns) =>
      prevColumns.map((col) =>
        col.id === columnId
          ? {
              ...col,
              tasks: [...col.tasks, { id: nanoid(), title: taskTitle }],
            }
          : col
      )
    );
  };

  const addColumn = (columnTitle) => {
    const newColumn = { id: nanoid(), title: columnTitle, tasks: [] };
    setColumns((prevColumns) => [...prevColumns, newColumn]);
  };

  const editColumn = (columnId, newTitle) => {
    setColumns((prevColumns) =>
      prevColumns.map((col) =>
        col.id === columnId ? { ...col, title: newTitle } : col
      )
    );
  };

  const deleteColumn = (columnId) => {
    setColumns((prevColumns) =>
      prevColumns.filter((col) => col.id !== columnId)
    );
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
  };

  const saveTaskEdit = (taskId, newTitle) => {
    setColumns((prevColumns) =>
      prevColumns.map((col) => ({
        ...col,
        tasks: col.tasks.map((task) =>
          task.id === taskId ? { ...task, title: newTitle } : task
        ),
      }))
    );
    setEditingTask(null);
  };
  const longestTitleLength = Math.max(
    ...columns.map((col) => col.title.length)
  );
  const columnWidth = `${longestTitleLength * 15 + 70}px`;
  return (
    <DndContext collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 p-4 overflow-x-auto w-full">
        <SortableContext
          items={columns.map((col) => col.id)}
          strategy={verticalListSortingStrategy}
        >
          {columns.map((column, index) => (
            <Column
              key={column.id}
              column={column}
              index={index}
              addTask={addTask}
              editColumn={editColumn}
              deleteColumn={deleteColumn}
              onEditTask={handleEditTask}
              width={columnWidth}
            />
          ))}
        </SortableContext>
      </div>
      <button
        className="p-2 bg-blue-500 text-white"
        onClick={() => addColumn("New Column")}
      >
        Add Column
      </button>
      {editingTask && (
        <div className="modal fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-50">
          <div className="modal-content bg-white p-4 rounded-md shadow-lg">
            <h3 className="text-lg font-bold mb-4">Edit Task</h3>
            <input
              type="text"
              value={editingTask.title}
              onChange={(e) =>
                setEditingTask({ ...editingTask, title: e.target.value })
              }
              className="p-2 border border-gray-300 rounded-md mb-4 w-full"
            />
            <div className="flex justify-between">
              <button
                className="cancel-button bg-gray-400 text-white p-2 rounded-md"
                onClick={() => setEditingTask(null)}
              >
                Cancel
              </button>
              <button
                className="save-button bg-blue-500 text-white p-2 rounded-md"
                onClick={() => saveTaskEdit(editingTask.id, editingTask.title)}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </DndContext>
  );
};

export default KanbanBoard;

