import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "antd";
import { TaskKanban } from "../type/types";

interface TaskCardProps {
  task: TaskKanban;
  onEditTask: (task: TaskKanban) => void;
  onDeleteTask: (taskId: string) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onEditTask }) => {
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
      padding: "15px", // Override .ant-card-body padding
    },
  };

  const handleDoubleClick = () => {
    onEditTask(task);
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      styles={styles} // Use styles prop instead of bodyStyle
      {...attributes}
      {...listeners}
      onDoubleClick={handleDoubleClick}
      className="flex justify-between items-center"
    >
      <p className="m-0 flex-grow">{task.title}</p>
    </Card>
  );
};

export default TaskCard;

