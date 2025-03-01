import React, { useRef, useEffect, useState } from "react";
import { DndContext, closestCorners, DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import Column from "../components/ColumnKanban";
import {
  PlusOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import { Modal, Input, InputRef, Select, Button, message, Spin } from "antd";
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
  fetchUserBoards,
  createUserBoard,
  saveUserBoard,
} from "../store/kanbanSlice";
import { RootState, TaskKanban } from "../type/types";
import { PriorityOptions } from "../utils/constant";
import { AppDispatch } from "../store/RootState";

const KanbanPage: React.FC = () => {
  const {
    columns,
    editingTask,
    loading,
    error,
    boardId,
    userBoards,
  } = useSelector((state: RootState) => state.kanban);
  const userId = useSelector(
    (state: RootState) => state.user.userInfo?.id || ""
  );
  // Use AppDispatch type
  const dispatch = useDispatch<AppDispatch>();
  const [newTaskPriority, setNewTaskPriority] = useState<
    "High" | "Medium" | "Low"
  >("Medium");
  const [isNewTaskModalVisible, setIsNewTaskModalVisible] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [selectedColumnId, setSelectedColumnId] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const inputRef = useRef<InputRef>(null);

  // Set userId in kanban state when it changes and fetch user's boards
  useEffect(() => {
    if (userId) {
      dispatch(setUserId(userId));

      // Fetch the user's boards
      dispatch(fetchUserBoards(userId))
        .unwrap()
        .then((boards) => {
          // If user has no boards, create one
          if (!boards || boards.length === 0) {
            dispatch(
              createUserBoard({
                userId,
                title: "My Kanban Board",
              })
            );
          }
        })
        .catch(() => {
          // If error fetching, create a new board
          dispatch(
            createUserBoard({
              userId,
              title: "My Kanban Board",
            })
          );
        });
    }
  }, [userId, dispatch]);

  // Mark board as having unsaved changes when columns are modified
  useEffect(() => {
    if (boardId) {
      setHasChanges(true);
    }
  }, [columns, boardId]);

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

  // Handle saving the board
  const handleSaveBoard = () => {
    if (userId && boardId) {
      dispatch(
        saveUserBoard({
          boardId,
          data: {
            columns,
            userId,
          },
        })
      )
        .unwrap()
        .then(() => {
          message.success("Board saved successfully");
          setHasChanges(false);
        })
        .catch(() => {
          message.error("Failed to save board");
        });
    } else {
      message.error("Unable to save: missing board ID or user ID");
    }
  };

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

  // Show loading state
  if (loading) {
    return (
      <div className="kanban-board-container h-screen bg-gray-100 flex flex-col items-center justify-center">
        <Spin size="large" tip="Loading Kanban Board..." />
      </div>
    );
  }

  // Show error state
  if (error && !columns.length) {
    return (
      <div className="kanban-board-container h-screen bg-gray-100 flex flex-col items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <h2 className="text-xl mb-4 text-red-500">
            Error loading Kanban board
          </h2>
          <p className="mb-4">{error}</p>
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={() => {
              if (userId) {
                dispatch(fetchUserBoards(userId));
              }
            }}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // If user has no boards
  if ((userBoards?.length ?? 0) === 0 && !loading) {
    return (
      <div className="kanban-board-container h-screen bg-gray-100 flex flex-col items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <h2 className="text-xl mb-4">No Kanban Board Found</h2>
          <p className="mb-4">
            You don't have any Kanban boards yet. Create one to get started.
          </p>
          <Button
            type="primary"
            onClick={() => {
              if (userId) {
                dispatch(
                  createUserBoard({
                    userId,
                    title: "My Kanban Board",
                  })
                );
              }
            }}
          >
            Create Board
          </Button>
        </div>
      </div>
    );
  }

  // Display warning if columns array is empty
  if (!columns || columns.length === 0) {
    return (
      <div className="kanban-board-container h-screen bg-gray-100 flex flex-col items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <h2 className="text-xl mb-4">Kanban board is empty</h2>
          <p className="mb-4">
            Your board has no columns. Click the button below to initialize it.
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

  // Main Kanban board UI
  return (
    <div className="kanban-board-container h-screen bg-gray-100 flex flex-col">
      <DndContext collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <div className="flex justify-between items-center p-4 bg-white shadow-md">
          <div className="flex">
            <h2 className="text-xl font-semibold mr-4">
              "My Kanban Board"
            </h2>
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
              <DeleteOutlined
                style={{ fontSize: "16px", marginRight: "5px" }}
              />
              Clear Tasks
            </button>
            <button
              className="p-2 bg-yellow-500 text-white rounded-full mr-2 hover:bg-yellow-600 transition"
              onClick={handleResetBoard}
            >
              <ReloadOutlined
                style={{ fontSize: "16px", marginRight: "5px" }}
              />
              Reset Board
            </button>
          </div>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSaveBoard}
            loading={loading}
            disabled={!hasChanges}
          >
            Save Board
          </Button>
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
              options={PriorityOptions}
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
            options={PriorityOptions}
          />
        </Modal>
      </DndContext>
    </div>
  );
};

export default KanbanPage;
