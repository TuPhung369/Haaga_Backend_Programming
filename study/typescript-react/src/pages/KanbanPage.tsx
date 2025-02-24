import React from "react";
import { DndContext, closestCorners, DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import Column from "../components/ColumnKanban";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { Modal, Input } from "antd";
import { useSelector, useDispatch } from "react-redux";
import {
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
import { RootState, TaskKanban } from "../type/types";

const KanbanBoard: React.FC = () => {
  const { columns, editingTask } = useSelector(
    (state: RootState) => state.kanban
  );
  const dispatch = useDispatch();

  const [isNewTaskModalVisible, setIsNewTaskModalVisible] =
    React.useState(false);
  const [newTaskTitle, setNewTaskTitle] = React.useState("");
  const [selectedColumnId, setSelectedColumnId] = React.useState<string | null>(
    null
  );

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
    dispatch(addTask({ columnId, taskTitle }));
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

  const handleSaveTaskEdit = (taskId: string, newTitle: string) => {
    dispatch(saveTaskEdit({ taskId, newTitle }));
  };

  const handleClearBoard = () => {
    Modal.confirm({
      title: "Are you sure you want to clear the entire board?",
      onOk: () => {
        dispatch(clearKanbanData());
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
    if (newTaskTitle.trim() && selectedColumnId) {
      handleAddTask(selectedColumnId, newTaskTitle);
    }
    setIsNewTaskModalVisible(false);
    setNewTaskTitle("");
    setSelectedColumnId(null);
  };

  const handleNewTaskCancel = () => {
    setIsNewTaskModalVisible(false);
    setNewTaskTitle("");
    setSelectedColumnId(null);
  };

  const longestTitleLength = Math.max(
    ...columns.map((col) => col.title.length)
  );
  const columnWidth = `${Math.max(longestTitleLength * 15 + 70, 280)}px`;

  return (
    <div className="kanban-board-container h-screen bg-gray-100 flex flex-col">
      <DndContext collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <div className="flex justify-start items-center p-4 bg-white shadow-md">
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
        </div>
        <div className="flex flex-row gap-4 p-4 overflow-x-auto w-full h-[calc(100vh-120px)]">
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
          >
            <Input
              value={editingTask.title}
              onChange={(e) =>
                dispatch(
                  setEditingTask({ ...editingTask, title: e.target.value })
                )
              }
              className="mb-4"
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
                    handleSaveTaskEdit(editingTask.id, editingTask.title)
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
        >
          <Input
            placeholder="Enter task title"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
          />
        </Modal>
      </DndContext>
    </div>
  );
};

export default KanbanBoard;
