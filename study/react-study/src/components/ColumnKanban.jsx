import React, { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { COLORS } from "../utils/constant";
import Task from "./TaskCardKanban";
import { PlusOutlined } from "@ant-design/icons";

const Column = ({
  column,
  index,
  width,
  addTask,
  deleteTask,
  editColumn,
  deleteColumn,
  onEditTask,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState(column.title);

  const { setNodeRef: setDroppableNodeRef } = useDroppable({
    id: column.id,
    data: { type: "column", columnId: column.id },
  });

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: column.id,
      data: { type: "column", columnId: column.id },
    });

  const style = transform
    ? {
        transform: CSS.Transform.toString(transform),
        transition,
      }
    : undefined;

  const columnColor = COLORS[index % COLORS.length];

  const handleAddTaskClick = () => setIsModalOpen(true);
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setNewTaskTitle("");
  };
  const handleSubmitTask = () => {
    if (newTaskTitle.trim()) {
      addTask(column.id, newTaskTitle);
      handleCloseModal();
    } else {
      alert("Task title cannot be empty!");
    }
  };
  const handleEditColumn = () => setIsEditModalOpen(true);
  const handleCloseEditModal = () => setIsEditModalOpen(false);
  const handleSubmitEdit = () => {
    if (newTitle.trim()) {
      editColumn(column.id, newTitle);
      handleCloseEditModal();
    } else {
      alert("Column title cannot be empty!");
    }
  };
  const handleDeleteColumn = () => {
    deleteColumn(column.id); // Call deleteColumn directly (confirmation handled in KanbanBoard)
  };

  const hexToRgba = (hex, alpha = 1) => {
    let r = 0,
      g = 0,
      b = 0;
    if (hex.length === 4) {
      r = parseInt(hex[1] + hex[1], 16);
      g = parseInt(hex[2] + hex[2], 16);
      b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
      r = parseInt(hex[1] + hex[2], 16);
      g = parseInt(hex[3] + hex[4], 16);
      b = parseInt(hex[5] + hex[6], 16);
    }
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, width }}
      className="column bg-gray-100 p-4 rounded-md shadow-md flex-shrink-0 flex flex-col"
    >
      <div
        className="column-header flex justify-between mb-4 bg-blue-500 text-white p-2 rounded-t-md whitespace-nowrap overflow-hidden text-ellipsis"
        style={{ backgroundColor: columnColor }}
      >
        <h2
          {...attributes}
          {...listeners}
          className="text-lg font-bold mr-2 flex justify-center items-center text-center whitespace-nowrap overflow-hidden text-ellipsis w-full"
          onDoubleClick={handleEditColumn}
        >
          {column.title}
        </h2>
        <button
          className="add-task-button text-white"
          onClick={handleAddTaskClick}
        >
          <PlusOutlined style={{ fontSize: "24px" }} />
        </button>
      </div>

      <div
        ref={setDroppableNodeRef}
        className="tasks space-y-2 bg-white p-4 rounded-b-md w-full"
        style={{
          backgroundColor: hexToRgba(COLORS[index % COLORS.length], 0.7),
        }}
      >
        <SortableContext
          items={column.tasks.map((task) => task.id)}
          strategy={verticalListSortingStrategy}
        >
          {column.tasks.length > 0 ? (
            column.tasks.map((task) => (
              <Task
                key={task.id}
                task={task}
                onEditTask={onEditTask}
                onDeleteTask={deleteTask}
              />
            ))
          ) : (
            <div className="text-gray-500 text-left w-fit"></div>
          )}
        </SortableContext>
      </div>

      {isModalOpen && (
        <div className="modal fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-50">
          <div className="modal-content bg-white p-4 rounded-md shadow-lg">
            <h3 className="text-lg font-bold mb-4">Add New Task</h3>
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Enter task title"
              className="p-2 border border-gray-300 rounded-md mb-4 w-full"
            />
            <div className="flex justify-between">
              <button
                className="cancel-button bg-gray-400 text-white p-2 rounded-md"
                onClick={handleCloseModal}
              >
                Cancel
              </button>
              <button
                className="submit-button bg-blue-500 text-white p-2 rounded-md"
                onClick={handleSubmitTask}
              >
                Add Task
              </button>
            </div>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <div className="modal fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-50">
          <div className="modal-content bg-white p-4 rounded-md shadow-lg">
            <h3 className="text-lg font-bold mb-4">Edit Column</h3>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="p-2 border border-gray-300 rounded-md mb-4 w-full"
            />
            <div className="flex justify-between">
              <button
                className="delete-button bg-red-500 text-white p-2 rounded-md mr-5"
                onClick={handleDeleteColumn}
              >
                Delete
              </button>
              <button
                className="cancel-button bg-gray-400 text-white p-2 rounded-md mr-1"
                onClick={handleCloseEditModal}
              >
                Cancel
              </button>
              <button
                className="ok-button bg-blue-500 text-white p-2 rounded-md"
                onClick={handleSubmitEdit}
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Column;


