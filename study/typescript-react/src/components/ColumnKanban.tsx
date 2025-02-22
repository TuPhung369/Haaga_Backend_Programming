// src/components/ColumnKanban.tsx
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
import { Input } from "antd";

interface Task {
  id: string;
  title: string;
}

interface ColumnProps {
  column: {
    id: string;
    title: string;
    tasks: Task[];
  };
  index: number;
  width: string;
  addTask: (columnId: string) => void; // Updated to match KanbanBoard’s showNewTaskModal
  deleteTask: (columnId: string, taskId: string) => void;
  editColumn: (columnId: string, newTitle: string) => void;
  deleteColumn: (columnId: string) => void;
  onEditTask: (task: Task) => void;
}

const ColumnKanban: React.FC<ColumnProps> = ({
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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState(column.title);

  const { setNodeRef: setDroppableNodeRef } = useDroppable({
    id: column.id,
    data: { type: "column", columnId: column.id },
  });

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: column.id,
    data: { type: "column", columnId: column.id },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    width,
    minWidth: "250px",
    maxWidth: "400px",
    height: "100%",
  };

  const columnColor = COLORS[index % COLORS.length];

  const handleAddTaskClick = () => {
    addTask(column.id); // Call showNewTaskModal from KanbanBoard
  };

  const handleEditColumn = () => setIsEditModalOpen(true);

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setNewTitle(column.title); // Reset to current title on cancel
  };

  const handleSubmitEdit = () => {
    if (newTitle.trim()) {
      editColumn(column.id, newTitle);
      handleCloseEditModal();
    } else {
      alert("Column title cannot be empty!");
    }
  };

  const handleDeleteColumn = () => {
    deleteColumn(column.id); // Trigger confirmation in KanbanBoard
  };

  const hexToRgba = (hex: string, alpha = 1): string => {
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
      style={style}
      className="bg-white rounded-lg shadow-md p-4 flex flex-col flex-shrink-0"
    >
      <div
        className="flex justify-between items-center mb-4 p-2 rounded-t-md whitespace-nowrap overflow-hidden text-ellipsis"
        style={{ backgroundColor: columnColor }}
      >
        <h2
          {...attributes}
          {...listeners}
          className="text-lg font-bold text-white flex-grow text-center cursor-move whitespace-nowrap overflow-hidden text-ellipsis"
          onDoubleClick={handleEditColumn}
        >
          {column.title}
        </h2>
        <button
          className="text-white hover:text-gray-200 transition"
          onClick={handleAddTaskClick}
        >
          <PlusOutlined style={{ fontSize: "24px" }} />
        </button>
      </div>

      <div
        ref={setDroppableNodeRef}
        className="flex-grow space-y-2 p-4 rounded-b-md overflow-y-auto"
        style={{ backgroundColor: hexToRgba(columnColor, 0.1) }}
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
                onDeleteTask={(taskId: string) => deleteTask(column.id, taskId)}
              />
            ))
          ) : (
            <div className="text-gray-500 text-center">No tasks yet</div>
          )}
        </SortableContext>
      </div>

      {isEditModalOpen && (
        <div className="fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-50 z-50">
          <div className="bg-white p-4 rounded-md shadow-lg w-96">
            <h3 className="text-lg font-bold mb-4">Edit Column</h3>
            <Input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="mb-4"
            />
            <div className="flex justify-between">
              <button
                className="bg-red-500 text-white p-2 rounded-md hover:bg-red-600 transition mr-2"
                onClick={handleDeleteColumn}
              >
                Delete
              </button>
              <button
                className="bg-gray-400 text-white p-2 rounded-md hover:bg-gray-500 transition mr-2"
                onClick={handleCloseEditModal}
              >
                Cancel
              </button>
              <button
                className="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 transition"
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

export default ColumnKanban;