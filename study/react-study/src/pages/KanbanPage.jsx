import React, { useState } from "react";
import { DndContext, closestCorners } from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import Column from "../components/ColumnKanban";
import { nanoid } from "nanoid";

const KanbanBoard = () => {
  const [columns, setColumns] = useState([
    { id: "todo", title: "To Do", tasks: [{ id: "1", title: "Task 1" }] },
    { id: "in_progress", title: "In Progress", tasks: [{ id: "2", title: "Task 2" }] },
    { id: "done", title: "Done", tasks: [] }, // Empty column for testing
  ]);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;

    // Ensure we’re dragging a task
    if (active.data.current?.type === "task") {
      const taskId = active.id;
      const sourceCol = columns.find((col) => col.tasks.some((task) => task.id === taskId));
      if (!sourceCol) return;

      // Determine the target column
      let targetCol;
      if (over.data.current?.type === "task") {
        // Dropped over another task
        const overTaskId = over.id;
        targetCol = columns.find((col) => col.tasks.some((task) => task.id === overTaskId));
      } else if (over.data.current?.type === "column") {
        // Dropped over a column
        targetCol = columns.find((col) => col.id === over.id);
      } else {
        // Default to source column (e.g., reordering at the end)
        targetCol = sourceCol;
      }

      if (!targetCol) return;

      if (sourceCol.id === targetCol.id) {
        // Reorder within the same column
        const oldIndex = sourceCol.tasks.findIndex((task) => task.id === taskId);
        const newIndex = over.data.current?.type === "task"
          ? targetCol.tasks.findIndex((task) => task.id === over.id)
          : targetCol.tasks.length; // Place at the end if not over a task

        if (oldIndex !== newIndex) {
          const updatedTasks = arrayMove(sourceCol.tasks, oldIndex, newIndex);
          setColumns((prevColumns) =>
            prevColumns.map((col) =>
              col.id === sourceCol.id ? { ...col, tasks: updatedTasks } : col
            )
          );
        }
      } else {
        // Move to a different column
        const movedTask = sourceCol.tasks.find((task) => task.id === taskId);
        const updatedSourceTasks = sourceCol.tasks.filter((task) => task.id !== taskId);
        let updatedTargetTasks;

        if (over.data.current?.type === "task") {
          // Insert at the position of the over task
          const overTaskIndex = targetCol.tasks.findIndex((task) => task.id === over.id);
          updatedTargetTasks = [
            ...targetCol.tasks.slice(0, overTaskIndex),
            movedTask,
            ...targetCol.tasks.slice(overTaskIndex),
          ];
        } else {
          // Append to the end of the target column (e.g., empty column)
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
    }
  };

  const addTask = (columnId, taskTitle) => {
    setColumns((prevColumns) =>
      prevColumns.map((col) =>
        col.id === columnId
          ? { ...col, tasks: [...col.tasks, { id: nanoid(), title: taskTitle }] }
          : col
      )
    );
  };

  const addColumn = (columnTitle) => {
    const newColumn = { id: nanoid(), title: columnTitle, tasks: [] };
    setColumns((prevColumns) => [...prevColumns, newColumn]);
  };

  const editColumn = (columnId, newTitle) => {
    setColumns((prevColumns) =>
      prevColumns.map((col) => (col.id === columnId ? { ...col, title: newTitle } : col))
    );
  };

  const deleteColumn = (columnId) => {
    setColumns((prevColumns) => prevColumns.filter((col) => col.id !== columnId));
  };

  return (
    <DndContext collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 p-4">
        <SortableContext
          items={columns.map((col) => col.id)}
          strategy={verticalListSortingStrategy}
        >
          {columns.map((column) => (
            <Column
              key={column.id}
              column={column}
              addTask={addTask}
              editColumn={editColumn}
              deleteColumn={deleteColumn}
            />
          ))}
        </SortableContext>
      </div>
      <button
        className="p-2 bg-blue-500 text-white"
        onClick={() => addColumn("New Column")}
      >
        Add Column
      </button>
    </DndContext>
  );
};

export default KanbanBoard;