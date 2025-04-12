import React, { useState, useEffect } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Task from "./TaskCardKanban";
import { PlusOutlined } from "@ant-design/icons";
import { Input } from "antd";
import { TaskKanban, ColumnKanban } from "../types/KanbanTypes";
import { hexToRgba, invertColorWithContrast } from "../utils/function";

interface ColumnProps {
  column: ColumnKanban;
  index: number;
  minWidth?: string | number;
  maxWidth?: string | number;
  style?: React.CSSProperties; // Added to support background color
  addTask: (columnId: string) => void;
  deleteTask: (columnId: string, taskId: string) => void;
  editColumn: (columnId: string, newTitle: string) => void;
  deleteColumn: (columnId: string) => void;
  onEditTask: (task: TaskKanban) => void;
}

const ColumnKanban: React.FC<ColumnProps> = ({
  column,
  minWidth = "270px",
  maxWidth = "600px",
  style,
  addTask,
  deleteTask,
  editColumn,
  deleteColumn,
  onEditTask,
}) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState(column.title);

  useEffect(() => {
    setNewTitle(column.title);
  }, [column.title]);

  const { setNodeRef: setDroppableNodeRef } = useDroppable({
    id: column.id,
    data: { type: "column", columnId: column.id },
  });

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: column.id,
      data: { type: "column", columnId: column.id },
    });

  // Normalize minWidth and maxWidth to ensure they have units
  const normalizedMinWidth =
    typeof minWidth === "number" ? `${minWidth}px` : minWidth;
  const normalizedMaxWidth =
    typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth;

  const ColumnStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    minWidth: normalizedMinWidth,
    maxWidth: normalizedMaxWidth,
    height: "100%",
  };

  const handleAddTaskClick = () => {
    addTask(column.id);
  };

  const handleEditColumn = () => setIsEditModalOpen(true);

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setNewTitle(column.title);
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
    deleteColumn(column.id);
  };

  return (
    <div
      ref={setNodeRef as React.LegacyRef<HTMLDivElement>}
      style={ColumnStyle}
      className="bg-white rounded-lg shadow-md p-4 flex flex-col flex-1" // Changed flex-shrink-0 to flex-1
    >
      <div
        className="flex justify-between items-center mb-2 p-2 rounded-t-md whitespace-nowrap overflow-hidden text-ellipsis"
        style={style}
      >
        <h2
          {...attributes}
          {...listeners}
          className="text-base font-bold text-white flex-grow text-left cursor-move whitespace-nowrap overflow-hidden text-ellipsis"
          onDoubleClick={handleEditColumn}
        >
          {column.title}
          {column.tasks.length > 0 && (
            <>
              <span
                className="mx-1"
                style={{
                  color: invertColorWithContrast(
                    style?.backgroundColor as string
                  ),
                }}
              >
                {column.tasks.length}
              </span>
              {column.tasks.length === 1 ? "issue" : "issues"}
            </>
          )}
        </h2>

        <button
          className="text-white hover:text-gray-200 transition"
          onClick={handleAddTaskClick}
        >
          <PlusOutlined style={{ fontSize: "24px" }} />
        </button>
      </div>

      <div
        ref={setDroppableNodeRef as React.LegacyRef<HTMLDivElement>}
        className="flex-grow space-y-2 p-2 rounded-b-md overflow-y-auto"
        style={{
          backgroundColor: hexToRgba(style?.backgroundColor as string, 0.6),
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
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setNewTitle(e.target.value)
              }
              className="mb-4"
            />
            <div className="flex justify-between">
              <button
                className="bg-red-500 text-white p-2 rounded-md hover:bg-red-600 transition mr-2"
                onClick={handleDeleteColumn}
              >
                Delete
              </button>
              <div className="ml-auto flex">
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
        </div>
      )}
    </div>
  );
};

export default ColumnKanban;

