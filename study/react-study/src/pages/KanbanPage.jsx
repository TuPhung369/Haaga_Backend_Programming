import React, { useEffect } from "react";
import { DndContext, closestCorners } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import Column from "../components/ColumnKanban";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { Modal } from "antd";
import { useSelector, useDispatch } from "react-redux";
import {
  setColumns,
  setEditingTask,
  addTask,
  deleteTask,
  addColumn,
  editColumn,
  deleteColumn,
  saveTaskEdit,
  dragEndTask,
  dragEndColumn,
  clearKanbanData,
} from "../store/kanbanSlice";

const KanbanBoard = () => {
  const { columns, editingTask } = useSelector((state) => state.kanban);
  const dispatch = useDispatch();

  // Load columns from localStorage on mount
  useEffect(() => {
    const savedColumns = localStorage.getItem("kanbanColumns");
    if (savedColumns) {
      dispatch(setColumns(JSON.parse(savedColumns)));
    }
  }, [dispatch]);

  // Save columns to localStorage whenever they change
  useEffect(() => {
    if (columns.length > 0) {
      localStorage.setItem("kanbanColumns", JSON.stringify(columns));
    }
  }, [columns]);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;

    if (active.data.current?.type === "task") {
      dispatch(dragEndTask({ activeId: active.id, overId: over.id }));
    } else if (active.data.current?.type === "column") {
      dispatch(dragEndColumn({ activeId: active.id, overId: over.id }));
    }
  };

  const handleAddTask = (columnId, taskTitle) => {
    dispatch(addTask({ columnId, taskTitle }));
  };

  const handleDeleteTask = (columnId, taskId) => {
    Modal.confirm({
      title: "Are you sure you want to delete this task?",
      onOk: () => {
        dispatch(deleteTask({ columnId, taskId }));
      },
      okText: "Yes",
      cancelText: "No",
    });
  };

  const handleAddColumn = (columnTitle) => {
    dispatch(addColumn(columnTitle));
  };

  const handleEditColumn = (columnId, newTitle) => {
    dispatch(editColumn({ columnId, newTitle }));
  };

  const handleDeleteColumn = (columnId) => {
    Modal.confirm({
      title: "Are you sure you want to delete this column?",
      onOk: () => {
        dispatch(deleteColumn(columnId));
      },
      okText: "Yes",
      cancelText: "No",
    });
  };

  const handleEditTask = (task) => {
    dispatch(setEditingTask(task));
  };

  const handleSaveTaskEdit = (taskId, newTitle) => {
    dispatch(saveTaskEdit({ taskId, newTitle }));
  };

  const handleClearBoard = () => {
    Modal.confirm({
      title: "Are you sure you want to clear the entire board?",
      onOk: () => {
        dispatch(clearKanbanData());
        localStorage.removeItem("kanbanColumns");
      },
      okText: "Yes",
      cancelText: "No",
    });
  };

  const longestTitleLength = Math.max(
    ...columns.map((col) => col.title.length)
  );
  const columnWidth = `${Math.max(longestTitleLength * 15 + 70, 320)}px`;

  return (
    <DndContext collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      <div className="flex justify-start items-center p-2">
        <button
          className="p-2 bg-blue-500 text-white rounded-full ml-2 mt-2 mr-2"
          onClick={() => handleAddColumn("New Column")}
        >
          Add Column
          <PlusOutlined style={{ fontSize: "16px", marginLeft: "5px" }} />
        </button>
        <button
          className="p-2 bg-red-400 text-white rounded-full mr-2 mt-2"
          onClick={handleClearBoard}
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
              addTask={handleAddTask}
              deleteTask={handleDeleteTask}
              editColumn={handleEditColumn}
              deleteColumn={handleDeleteColumn}
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
                dispatch(
                  setEditingTask({ ...editingTask, title: e.target.value })
                )
              }
              className="p-2 border border-gray-300 rounded-md mb-4 w-full"
            />
            <div className="flex justify-between">
              <button
                className="delete-button bg-red-500 text-white p-2 rounded-md mr-5"
                onClick={() => {
                  const columnId = columns.find((col) =>
                    col.tasks.some((task) => task.id === editingTask.id)
                  )?.id;
                  handleDeleteTask(columnId, editingTask.id);
                  dispatch(setEditingTask(null));
                }}
              >
                Delete
              </button>
              <button
                className="cancel-button bg-gray-400 text-white p-2 rounded-md mr-2"
                onClick={() => dispatch(setEditingTask(null))}
              >
                Cancel
              </button>
              <button
                className="save-button bg-blue-500 text-white p-2 rounded-md"
                onClick={() =>
                  handleSaveTaskEdit(editingTask.id, editingTask.title)
                }
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

