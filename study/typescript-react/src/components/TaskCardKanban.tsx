import React, { forwardRef } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "antd";
import { TaskKanban } from "../type/types";
import { PriorityOptions } from "../utils/constant";
import CustomWifiIcon from "./CustomWifiIcon"; // Import the new component

interface TaskCardProps {
  task: TaskKanban;
  onEditTask: (task: TaskKanban) => void;
  onDeleteTask: (taskId: string) => void;
}

// Custom forwardRef component for TaskCard to handle the ref properly
const TaskCard = forwardRef<HTMLDivElement, TaskCardProps>(
  ({ task, onEditTask }, ref) => {
    const { attributes, listeners, setNodeRef, transform, transition } =
      useSortable({
        id: task.id,
        data: { type: "task", taskId: task.id },
      });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      marginBottom: "0px",
    };

    const styles = {
      body: {
        padding: "15px",
      },
    };

    // Map PriorityOptions to a lookup object for easier access
    const priorityColorMap = PriorityOptions.reduce(
      (acc, option) => ({
        ...acc,
        [option.value]: option.textColor,
      }),
      {} as Record<string, string>
    );

    const handleDoubleClick = () => {
      onEditTask(task);
    };

    return (
      <Card
        ref={(node) => {
          setNodeRef(node);
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        style={style}
        styles={styles}
        {...attributes}
        {...listeners}
        onDoubleClick={handleDoubleClick}
        className="flex items-center justify-between"
      >
        <div className="flex items-center justify-between w-full">
          <div className="mr-1">
            <CustomWifiIcon priority={task.priority || "Low"} />
          </div>
          <span
            className={`${
              priorityColorMap[task.priority || "Low"] || "text-black"
            }`}
          >
            {task.title}
          </span>
        </div>
      </Card>
    );
  }
);

export default TaskCard;
