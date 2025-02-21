import React, { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import Task from "./TaskCardKanban";

const Column = ({ column, addTask, editColumn, deleteColumn, onEditTask }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState(column.title);

  const { setNodeRef: setDroppableNodeRef } = useDroppable({
    id: column.id,
    data: { type: "column", columnId: column.id },
  });

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
    deleteColumn(column.id);
    handleCloseEditModal();
  };

  return (
    <div className="column bg-gray-100 p-4 rounded-md shadow-md">
      <div className="column-header flex justify-between items-center mb-4 bg-blue-500 text-white p-2 rounded-t-md">
        <h2 className="text-lg font-bold" onClick={handleEditColumn}>
          {column.title}
        </h2>
        <button
          className="add-task-button text-2xl font-bold"
          onClick={handleAddTaskClick}
        >
          +
        </button>
      </div>

      <div
        ref={setDroppableNodeRef}
        className="tasks space-y-2 bg-white p-4 rounded-b-md min-h-[100px]"
      >
        <SortableContext
          items={column.tasks.map((task) => task.id)}
          strategy={verticalListSortingStrategy}
        >
          {column.tasks.length > 0 ? (
            column.tasks.map((task) => (
              <Task key={task.id} task={task} onEditTask={onEditTask} />
            ))
          ) : (
            <div className="text-gray-500 text-center"></div>
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
