import React, { useState, useEffect } from "react";
import { DndContext, closestCorners } from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import Column from "../components/ColumnKanban";
import { nanoid } from "nanoid";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { Modal } from "antd";

const KanbanBoard = () => {
  // Initialize state from localStorage if it exists, otherwise use default
  const [columns, setColumns] = useState(() => {
    const savedColumns = localStorage.getItem("kanbanColumns");
    return savedColumns
      ? JSON.parse(savedColumns)
      : [
          { id: "todo", title: "To Do", tasks: [{ id: "1", title: "Task 1" }] },
          {
            id: "in_progress",
            title: "In Progress",
            tasks: [{ id: "2", title: "Task 2" }],
          },
          { id: "done", title: "Done", tasks: [] },
        ];
  });
  const [editingTask, setEditingTask] = useState(null);

  // Save columns to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("kanbanColumns", JSON.stringify(columns));
  }, [columns]);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;

    if (active.data.current?.type === "task") {
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

  const deleteTask = (columnId, taskId) => {
    Modal.confirm({
      title: "Are you sure you want to delete this task?",
      onOk: () => {
        setColumns((prevColumns) => {
          const updatedColumns = prevColumns.map((col) =>
            col.id === columnId
              ? {
                  ...col,
                  tasks: col.tasks.filter((task) => task.id !== taskId),
                }
              : col
          );
          return updatedColumns;
        });
      },
      okText: "Yes",
      cancelText: "No",
    });
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
    Modal.confirm({
      title: "Are you sure you want to delete this column?",
      onOk: () => {
        setColumns((prevColumns) =>
          prevColumns.filter((col) => col.id !== columnId)
        );
      },
      okText: "Yes",
      cancelText: "No",
    });
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

  // Optional: Add a function to clear localStorage
  const clearBoard = () => {
    Modal.confirm({
      title: "Are you sure you want to clear the entire board?",
      onOk: () => {
        localStorage.removeItem("kanbanColumns");
        setColumns([
          { id: "todo", title: "To Do", tasks: [] },
          { id: "in_progress", title: "In Progress", tasks: [] },
          { id: "done", title: "Done", tasks: [] },
        ]);
      },
      okText: "Yes",
      cancelText: "No",
    });
  };

  const longestTitleLength = Math.max(
    ...columns.map((col) => col.title.length)
  );
  const columnWidth = `${Math.max(longestTitleLength * 15 + 70, 320)}px`;
  console.log("Longest title length:", longestTitleLength);
  console.log("Computed column width:", longestTitleLength * 15 + 70);
  console.log("Final column width:", columnWidth);

  return (
    <DndContext collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      <div className="flex justify-start items-center p-2">
        <button
          className="p-2 bg-blue-500 text-white rounded-full ml-2 mt-2 mr-2"
          onClick={() => addColumn("New Column")}
        >
          Add Column
          <PlusOutlined style={{ fontSize: "16px", marginLeft: "5px" }} />
        </button>
        <button
          className="p-2 bg-red-500 text-white rounded-full mr-2 mt-2"
          onClick={clearBoard}
        >
          Clear All Tasks
          <DeleteOutlined style={{ fontSize: "16px", marginLeft: "5px" }} />
        </button>
      </div>
      <div className="flex gap-4 p-4 overflow-x-auto w-full items-stretch">
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
              deleteTask={(taskId) => deleteTask(column.id, taskId)}
              editColumn={editColumn}
              deleteColumn={deleteColumn}
              onEditTask={handleEditTask}
              width={columnWidth}
            />
          ))}
        </SortableContext>
      </div>

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
                className="delete-button bg-red-500 text-white p-2 rounded-md mr-5"
                onClick={() => {
                  deleteTask(
                    columns.find((col) =>
                      col.tasks.some((task) => task.id === editingTask.id)
                    )?.id,
                    editingTask.id
                  );
                  setEditingTask(null);
                }}
              >
                Delete
              </button>
              <button
                className="cancel-button bg-gray-400 text-white p-2 rounded-md mr-2"
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

