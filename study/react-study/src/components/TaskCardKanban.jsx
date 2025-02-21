import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "antd";

const TaskCard = ({ task }) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: task.id,
      data: { type: "task", taskId: task.id }, // Add custom data
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    marginBottom: "8px",
  };

  return (
    <Card ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <p>{task.title}</p>
    </Card>
  );
};

export default TaskCard;

