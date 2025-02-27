import React, { forwardRef } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "antd";
import { TaskKanban } from "../type/types";
import { PriorityOptions } from "../utils/constant";

interface TaskCardProps {
  task: TaskKanban;
  onEditTask: (task: TaskKanban) => void;
  onDeleteTask: (taskId: string) => void;
}

// Custom forwardRef component for TaskCard to handle the ref properly
const TaskCard = forwardRef<HTMLDivElement, TaskCardProps>(
  ({ task, onEditTask }, ref) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
    } = useSortable({
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

    // Custom Wifi Icon component
    const CustomWifiIcon = ({
      priority,
    }: {
      priority: "High" | "Medium" | "Low";
    }) => {
      let barCount: number;
      let filledCount: number;
      let colorClass: string;

      switch (priority) {
        case "High":
          barCount = 7;
          filledCount = 7;
          colorClass = "text-red-700";
          break;
        case "Medium":
          barCount = 7;
          filledCount = 6;
          colorClass = "text-blue-600";
          break;
        case "Low":
        default:
          barCount = 7;
          filledCount = 5;
          colorClass = "text-black";
          break;
      }

      const bars: JSX.Element[] = [];
      for (let i = 0; i < barCount; i++) {
        const width = 2 + i * 3;
        const isFilled = i < filledCount;
        bars.push(
          <path
            key={i}
            d={`M${12 - width / 2} ${18 - i * 2} h${width} v2 h-${width} z`}
            fill={isFilled ? "currentColor" : "none"}
            stroke={isFilled ? "currentColor" : "gray"}
            strokeWidth={isFilled ? 0 : 1}
          />
        );
      }

      return (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          className={colorClass}
        >
          {bars}
        </svg>
      );
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
          <div className="mb-1 mr-2 flex-shrink-0">
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

