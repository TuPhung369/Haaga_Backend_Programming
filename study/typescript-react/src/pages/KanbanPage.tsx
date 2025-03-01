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
  fetchUserBoards,
  createUserBoard,
  saveUserBoard,
  resetBoardToDefaults,
} from "../store/kanbanSlice";
import { RootState, TaskKanban } from "../type/types";
import { AppDispatch } from "../store/store";
import { PriorityOptions } from "../utils/constant";
import LoadingState from "../components/LoadingState";

const KanbanPage: React.FC = () => {
  const { columns, editingTask, loading, error, boardId, activeBoard } =
    useSelector((state: RootState) => state.kanban);
  const token = useSelector((state: RootState) => state.auth.token || "");
  const userId = useSelector(
    (state: RootState) => state.user.userInfo?.id || ""
  );
  const dispatch = useDispatch<AppDispatch>();
  const [newTaskPriority, setNewTaskPriority] = useState<
    "High" | "Medium" | "Low"
  >("Medium");
  const [isNewTaskModalVisible, setIsNewTaskModalVisible] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [selectedColumnId, setSelectedColumnId] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const inputRef = useRef<InputRef>(null);
  const hasFetchedBoardsRef = useRef(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    if (userId && token && !hasFetchedBoardsRef.current) {
      hasFetchedBoardsRef.current = true;
      dispatch(setUserId(userId));
      dispatch(fetchUserBoards({ userId, token }))
        .unwrap()
        .then((boards) => {
          if (!boards || boards.length === 0) {
            dispatch(createUserBoard({ userId, token, title: "Kanban Board" }))
              .unwrap()
              .then(() => console.log("Board created successfully"))
              .catch((err) => {
                console.error("Failed to create board:", err);
                message.warning("Offline mode: Changes will be saved locally");
                dispatch(resetToDefaultColumns());
              });
          }
        })
        .catch((err) => {
          console.error("Error fetching boards:", err);
          message.warning("Offline mode: Starting with default columns");
          dispatch(resetToDefaultColumns());
        });
    }
  }, [userId, token, dispatch]);

  useEffect(() => {
    if (boardId && columns.length > 0) {
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

  const handleSaveBoard = () => {
    if (!userId) {
      message.error("Unable to save: missing user ID");
      return;
    }
    if (!token) {
      message.error("Unable to save: missing authentication token");
      return;
    }
    if (!boardId) {
      message.warning("No board ID available, saving locally only");
      localStorage.setItem(`kanban_board_${userId}`, JSON.stringify(columns));
      message.success("Board saved locally");
      setHasChanges(false);
      return;
    }

    dispatch(
      saveUserBoard({
        boardId,
        token,
        data: {
          columns,
          userId,
          title: activeBoard?.title || "My Kanban Board",
        },
      })
    )
      .unwrap()
      .then(() => {
        message.success("Board saved successfully");
        setHasChanges(false);
        localStorage.setItem(`kanban_board_${userId}`, JSON.stringify(columns));
      })
      .catch((error) => {
        console.error("Error saving board:", error);
        message.warning("Failed to save to server - saving locally");
        localStorage.setItem(`kanban_board_${userId}`, JSON.stringify(columns));
        message.success("Board saved locally");
        setHasChanges(false);
      });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    if (!token) {
      message.error(
        "Cannot perform drag operation: missing authentication token"
      );
      return;
    }

    if (active.data.current?.type === "task") {
      dispatch(
        dragEndTask({
          activeId: active.id as string,
          overId: over.id as string,
          token,
        })
      )
        .unwrap()
        .catch((err) => {
          console.error("Failed to move task:", err);
          message.error("Failed to move task on server");
        });
    } else if (active.data.current?.type === "column") {
      dispatch(
        dragEndColumn({
          activeId: active.id as string,
          overId: over.id as string,
          token,
        })
      )
        .unwrap()
        .catch((err) => {
          console.error("Failed to move column:", err);
          message.error("Failed to move column on server");
        });
    }
  };

  const handleAddTask = (columnId: string, title: string) => {
    if (!boardId || !token) {
      message.error("Cannot add task: missing board ID or token");
      return;
    }
    dispatch(
      addTask({ columnId, token, title: title, priority: newTaskPriority })
    )
      .unwrap()
      .catch((err) => {
        console.error("Failed to add task:", err);
        message.error("Failed to add task to server");
      });
  };

  const handleDeleteTask = (columnId: string, taskId: string) => {
    if (!token) {
      message.error("Cannot delete task: missing token");
      return;
    }
    Modal.confirm({
      title: "Are you sure you want to delete this task?",
      onOk: () => {
        dispatch(deleteTask({ taskId, token }))
          .unwrap()
          .catch((err) => {
            console.error("Failed to delete task:", err);
            message.error("Failed to delete task from server");
          });
      },
      okText: "Yes",
      cancelText: "No",
    });
  };

  const handleAddColumn = (columnTitle: string) => {
    if (!boardId || !token) {
      message.error("Cannot add column: missing board ID or token");
      return;
    }
    dispatch(addColumn({ boardId, token, title: columnTitle }))
      .unwrap()
      .catch((err) => {
        console.error("Failed to add column:", err);
        message.error("Failed to add column to server");
      });
  };

  const handleEditColumn = (columnId: string, newTitle: string) => {
    if (!token) {
      message.error("Cannot edit column: missing token");
      return;
    }
    if (!boardId) {
      message.error("Cannot edit column: missing board ID");
      return;
    }
    dispatch(editColumn({ columnId, token, newTitle }))
      .unwrap()
      .catch((err) => {
        console.error("Failed to edit column:", err);
        message.error("Failed to edit column on server");
      });
  };

  const handleDeleteColumn = (columnId: string) => {
    if (!token) {
      message.error("Cannot delete column: missing token");
      return;
    }
    Modal.confirm({
      title: "Are you sure you want to delete this column?",
      onOk: () => {
        dispatch(deleteColumn({ columnId, token }))
          .unwrap()
          .catch((err) => {
            console.error("Failed to delete column:", err);
            message.error("Failed to delete column from server");
          });
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
    if (!token) {
      message.error("Cannot save task edit: missing token");
      return;
    }
    dispatch(saveTaskEdit({ taskId, token, newTitle, priority }))
      .unwrap()
      .catch((err) => {
        console.error("Failed to save task edit:", err);
        message.error("Failed to save task edit on server");
      });
  };

  const handleClearBoard = () => {
    if (!boardId || !token) {
      message.error("Cannot clear tasks: missing board ID or token");
      return;
    }

    // Create modal instance
    const modal = Modal.confirm({
      title: "Are you sure you want to clear all tasks?",
      content: "This will remove all tasks but keep your columns.",
      okText: "Yes",
      cancelText: "No",
      okButtonProps: { loading: false },
      onOk: () => {
        // Show loading immediately
        modal.update({ okButtonProps: { loading: true } });

        // Return undefined to let Modal handle the promise internally
        dispatch(clearKanbanData({ boardId, token }))
          .unwrap()
          .then(() => {
            message.success("All tasks have been cleared");
            // Close modal on success
            modal.destroy();
          })
          .catch((err) => {
            console.error("Failed to clear tasks:", err);
            message.error("Failed to clear tasks on server");
            // Keep modal open on error, but stop loading
            modal.update({ okButtonProps: { loading: false } });

            // *Important*: Return a resolved promise to prevent the uncaught rejection
            return Promise.resolve();
          });

        // Return false to prevent Modal from automatically closing
        return false;
      },
    });
  };

  const handleResetBoard = async () => {
    if (!boardId) {
      message.error("Board ID is required");
      return;
    }

    setIsResetting(true);

    // Add retry logic with longer delays
    let retryCount = 0;
    const maxRetries = 2;
    const delays = [2000, 5000]; // Increasing delays between retries

    const attemptReset = async (): Promise<boolean> => {
      try {
        await dispatch(resetBoardToDefaults({ boardId, token })).unwrap();
        message.success("Board has been reset to default settings");
        return true;
      } catch (error) {
        const errorMessage =
          typeof error === "string" ? error : "Failed to reset board";

        if (retryCount < maxRetries) {
          const delay = delays[retryCount];
          retryCount++;
          console.log(
            `Retry attempt ${retryCount} of ${maxRetries} after ${delay}ms...`
          );

          message.info(
            `Retrying reset operation (${retryCount}/${maxRetries})...`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          return attemptReset();
        }

        // If all retries fail, offer manual reset option
        message.error(errorMessage);
        console.error("Failed to reset board after retries:", errorMessage);

        // Show a modal with alternative options
        Modal.confirm({
          title: "Reset Board Failed",
          content: (
            <div>
              <p>
                We couldn't automatically reset your board due to a server
                error.
              </p>
              <p>Would you like to try these alternatives:</p>
              <ul>
                <li>Refresh the page and try again</li>
                <li>Try manual board configuration</li>
                <li>Contact support if the issue persists</li>
              </ul>
            </div>
          ),
          okText: "Refresh Page",
          cancelText: "Cancel",
          onOk: () => {
            window.location.reload();
          },
        });

        return false;
      }
    };

    try {
      await attemptReset();
    } finally {
      setIsResetting(false);
    }
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

  // Add back the loading condition check
  if (loading) {
    return (
      <LoadingState
        size="large"
        tip="Loading Kanban Board..."
        fullscreen={true}
      />
    );
  }

  if (error && !columns.length) {
    return (
      <div className="kanban-board-container h-screen bg-gray-100 flex flex-col items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <h2 className="text-xl mb-4 text-red-500">
            Error connecting to Kanban server
          </h2>
          <p className="mb-4">Unable to reach the server. You can:</p>
          <div className="flex flex-col gap-4 items-center">
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={() => {
                if (userId && token) {
                  hasFetchedBoardsRef.current = false;
                  dispatch(fetchUserBoards({ userId, token }))
                    .unwrap()
                    .then((boards) => {
                      if (!boards || boards.length === 0) {
                        dispatch(
                          createUserBoard({
                            userId,
                            token,
                            title: "Kanban Board",
                          })
                        );
                      }
                    })
                    .catch(() => {
                      dispatch(
                        createUserBoard({
                          userId,
                          token,
                          title: "Kanban Board",
                        })
                      );
                    });
                }
              }}
            >
              Try Again
            </Button>
            <Button
              onClick={() => {
                dispatch(resetToDefaultColumns());
                message.info(
                  "Working in offline mode. Your changes will be saved locally."
                );
              }}
            >
              Continue in Offline Mode
            </Button>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            In offline mode, your board will be saved to your browser's local
            storage.
          </p>
        </div>
      </div>
    );
  }

  if (!columns || columns.length === 0) {
    return (
      <div className="kanban-board-container h-screen bg-gray-100 flex flex-col items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <h2 className="text-xl mb-4">No Kanban Board Data</h2>
          <p className="mb-4">
            No columns found. Click below to add a column or reset to defaults.
          </p>
          <div className="flex gap-4 justify-center">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleAddColumn("New Column")}
            >
              Add Column
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                dispatch(resetToDefaultColumns());
                message.info("Board initialized with default columns");
              }}
            >
              Reset to Defaults
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="kanban-board-container h-screen bg-gray-100 flex flex-col">
      <DndContext collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <div className="flex justify-between items-center p-4 bg-white shadow-md">
          <div className="flex">
            <h2 className="text-xl font-semibold mr-4">
              {activeBoard?.title || "Kanban Board"}
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
            <Button
              style={{ height: "60px", paddingTop: 0, paddingBottom: 0 }}
              className="p-2 bg-yellow-500 text-white rounded-full mr-2 hover:bg-yellow-600 transition"
              onClick={handleResetBoard}
              loading={isResetting}
            >
              <ReloadOutlined
                style={{ fontSize: "16px", marginRight: "5px" }}
              />
              Reset Board
            </Button>
          </div>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSaveBoard}
            loading={loading}
            disabled={!hasChanges}
          >
            {boardId ? "Save Board" : "Save Locally"}
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

