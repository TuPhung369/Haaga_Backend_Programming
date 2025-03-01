import React, { useRef, useEffect, useState } from "react";
import { DndContext, closestCorners, DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import Column from "../components/ColumnKanban";
import KanbanBoardSelector from "../components/KanbanBoardSelector";
import {
  PlusOutlined,
  DeleteOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { Modal, Input, InputRef, Select, Button, message } from "antd";
import { useSelector, useDispatch } from "react-redux";
import {
  setEditingTask,
  setUserId,
  addTask,
  deleteTask,
  addColumn,
  editColumn,
  deleteColumn,
  saveTaskEdit,
  dragEndTask,
  dragEndColumn,
  clearKanbanData,
  resetToDefaultColumns,
} from "../store/kanbanSlice";
import { RootState, TaskKanban } from "../type/types";
import { PriorityOptions } from "../utils/constant";

const KanbanPage: React.FC = () => {
  const { columns, editingTask, activeBoard } = useSelector(
    (state: RootState) => state.kanban
  );
  const userId = useSelector(
    (state: RootState) => state.user.userInfo?.id || ""
  );
  const dispatch = useDispatch();
  const [newTaskPriority, setNewTaskPriority] = useState<
    "High" | "Medium" | "Low"
  >("Medium");
  const [isNewTaskModalVisible, setIsNewTaskModalVisible] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [selectedColumnId, setSelectedColumnId] = useState<string | null>(null);
  const inputRef = useRef<InputRef>(null);

  // Set userId in kanban state when it changes
  useEffect(() => {
    if (userId) {
      dispatch(setUserId(userId));
    }
  }, [userId, dispatch]);

  useEffect(() => {
    if ((isNewTaskModalVisible || editingTask) && inputRef.current) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    } else if (!isNewTaskModalVisible && !editingTask && inputRef.current) {
      inputRef.current.blur();
    }
  }, [isNewTaskModalVisible, editingTask]);

  // Check if columns are empty and initialize if needed
  useEffect(() => {
    if (!columns || columns.length === 0) {
      console.log("Initializing Kanban board with default columns");
      dispatch(resetToDefaultColumns());
      message.info("Initialized Kanban board with default columns");
    }
  }, [columns, dispatch]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    if (active.data.current?.type === "task") {
      dispatch(
        dragEndTask({
          activeId: active.id as string,
          overId: over.id as string,
        })
      );
    } else if (active.data.current?.type === "column") {
      dispatch(
        dragEndColumn({
          activeId: active.id as string,
          overId: over.id as string,
        })
      );
    }
  };

  const handleAddTask = (columnId: string, taskTitle: string) => {
    dispatch(addTask({ columnId, taskTitle, priority: newTaskPriority }));
  };

  const handleDeleteTask = (columnId: string, taskId: string) => {
    Modal.confirm({
      title: "Are you sure you want to delete this task?",
      onOk: () => {
        dispatch(deleteTask({ columnId, taskId }));
      },
      okText: "Yes",
      cancelText: "No",
    });
  };

  const handleAddColumn = (columnTitle: string) => {
    dispatch(addColumn(columnTitle));
  };

  const handleEditColumn = (columnId: string, newTitle: string) => {
    dispatch(editColumn({ columnId, newTitle }));
  };

  const handleDeleteColumn = (columnId: string) => {
    Modal.confirm({
      title: "Are you sure you want to delete this column?",
      onOk: () => {
        dispatch(deleteColumn(columnId));
      },
      okText: "Yes",
      cancelText: "No",
    });
  };

  const handleEditTask = (task: TaskKanban) => {
    dispatch(setEditingTask(task));
  };

  const handleSaveTaskEdit = (
    taskId: string,
    newTitle: string,
    priority: "High" | "Medium" | "Low"
  ) => {
    dispatch(saveTaskEdit({ taskId, newTitle, priority }));
  };

  const handleClearBoard = () => {
    Modal.confirm({
      title: "Are you sure you want to clear all tasks?",
      content: "This will remove all tasks but keep your columns.",
      onOk: () => {
        dispatch(clearKanbanData());
        message.success("All tasks have been cleared");
      },
      okText: "Yes",
      cancelText: "No",
    });
  };

  const handleResetBoard = () => {
    Modal.confirm({
      title: "Reset Kanban Board",
      content:
        "This will reset the board to default columns and remove all tasks. Are you sure?",
      onOk: () => {
        dispatch(resetToDefaultColumns());
        message.success("Kanban board has been reset to defaults");
      },
      okText: "Yes",
      cancelText: "No",
    });
  };

  const showNewTaskModal = (columnId: string) => {
    setSelectedColumnId(columnId);
    setNewTaskTitle("");
    setIsNewTaskModalVisible(true);
  };

  const handleNewTaskOk = () => {
    if (!newTaskTitle.trim() || !selectedColumnId) {
      return;
    }
    handleAddTask(selectedColumnId, newTaskTitle);
    setIsNewTaskModalVisible(false);
    setNewTaskTitle("");
    setNewTaskPriority("Medium");
    setSelectedColumnId(null);
  };

  const handleNewTaskCancel = () => {
    setIsNewTaskModalVisible(false);
    setNewTaskTitle("");
    setSelectedColumnId(null);
  };

  const longestTitleLength = Math.max(
    ...(columns.length > 0 ? columns.map((col) => col.title.length) : [10])
  );
  const columnWidth = `${Math.max(longestTitleLength * 15 + 70, 280)}px`;

  // Display warning if columns array is empty
  if (!columns || columns.length === 0) {
    return (
      <div className="kanban-board-container h-screen bg-gray-100 flex flex-col items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <h2 className="text-xl mb-4">Kanban board is empty</h2>
          <p className="mb-4">
            The board has no columns. Click the button below to initialize it.
          </p>
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={() => dispatch(resetToDefaultColumns())}
          >
            Initialize Board
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="kanban-board-container h-screen bg-gray-100 flex flex-col">
      {/* Add the Board Selector at the top */}
      <div className="p-4">
        <KanbanBoardSelector />
      </div>

      <DndContext collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <div className="flex justify-start items-center p-4 bg-white shadow-md">
          <div className="mr-4">
            {activeBoard ? (
              <span className="font-bold">{activeBoard.name}</span>
            ) : (
              <span className="text-gray-400">No board selected</span>
            )}
          </div>
          <button
            className="p-2 bg-blue-500 text-white rounded-full ml-2 mr-2 hover:bg-blue-600 transition"
            onClick={() => handleAddColumn("New Column")}
          >
            <PlusOutlined style={{ fontSize: "16px", marginRight: "5px" }} />
            Add Column
          </button>
          <button
            className="p-2 bg-red-400 text-white rounded-full mr-2 hover:bg-red-500 transition"
            onClick={handleClearBoard}
          >
            <DeleteOutlined style={{ fontSize: "16px", marginRight: "5px" }} />
            Clear All Tasks
          </button>
          <button
            className="p-2 bg-yellow-500 text-white rounded-full mr-2 hover:bg-yellow-600 transition"
            onClick={handleResetBoard}
          >
            <ReloadOutlined style={{ fontSize: "16px", marginRight: "5px" }} />
            Reset Board
          </button>
        </div>
        <div className="flex flex-row gap-4 p-4 overflow-x-auto w-full h-[calc(100vh-180px)]">
          <SortableContext
            items={columns.map((col) => col.id)}
            strategy={verticalListSortingStrategy}
          >
            {columns.map((column, index) => (
              <Column
                key={column.id}
                column={column}
                index={index}
                addTask={showNewTaskModal}
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
          <Modal
            title="Edit Task"
            open={true}
            width={400}
            onCancel={() => dispatch(setEditingTask(null))}
            footer={null}
            zIndex={1000}
            afterClose={() => {
              if (inputRef.current) {
                inputRef.current.blur();
              }
            }}
          >
            <Input
              ref={inputRef}
              value={editingTask.title}
              onChange={(e) =>
                dispatch(
                  setEditingTask({ ...editingTask, title: e.target.value })
                )
              }
              className="mb-4"
              placeholder="Edit task title"
            />
            <Select
              value={editingTask.priority}
              onChange={(value) =>
                dispatch(setEditingTask({ ...editingTask, priority: value }))
              }
              className="mb-4 w-full"
              options={PriorityOptions} // Use PriorityOptions here
            />
            <div className="flex justify-between">
              <button
                className="bg-red-500 text-white p-2 rounded-md mr-2 hover:bg-red-600 transition"
                onClick={() => {
                  const columnId = columns.find((col) =>
                    col.tasks.some((task) => task.id === editingTask.id)
                  )?.id;
                  if (columnId) handleDeleteTask(columnId, editingTask.id);
                  dispatch(setEditingTask(null));
                }}
              >
                Delete
              </button>
              <div className="ml-auto flex">
                <button
                  className="bg-gray-400 text-white p-2 rounded-md mr-2 hover:bg-gray-500 transition"
                  onClick={() => dispatch(setEditingTask(null))}
                >
                  Cancel
                </button>
                <button
                  className="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 transition"
                  onClick={() =>
                    handleSaveTaskEdit(
                      editingTask.id,
                      editingTask.title,
                      editingTask.priority as "High" | "Medium" | "Low"
                    )
                  }
                >
                  Update
                </button>
              </div>
            </div>
          </Modal>
        )}

        <Modal
          title="Create New Task"
          open={isNewTaskModalVisible}
          onOk={handleNewTaskOk}
          onCancel={handleNewTaskCancel}
          zIndex={1000}
          afterClose={() => {
            if (inputRef.current) {
              inputRef.current.blur();
            }
          }}
        >
          <Input
            ref={inputRef}
            placeholder="Enter task title"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            className="mb-4"
          />
          <Select
            value={newTaskPriority}
            onChange={setNewTaskPriority}
            className="w-full"
            options={PriorityOptions} // Use PriorityOptions here
          />
        </Modal>
      </DndContext>
    </div>
  );
};

export default KanbanPage;

