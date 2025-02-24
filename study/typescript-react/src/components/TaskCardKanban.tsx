import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, Button } from "antd";
import { TaskKanban } from "../type/types"; // Import TaskKanban type

// Define props interface for TaskCard
interface TaskCardProps {
  task: TaskKanban;
  onEditTask: (task: TaskKanban) => void;
  onDeleteTask: (taskId: string) => void; // Added onDeleteTask
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onEditTask,
  onDeleteTask,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: task.id,
      data: { type: "task", taskId: task.id },
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    marginBottom: "8px",
  };

  const handleDoubleClick = () => {
    onEditTask(task);
  };

  const handleDelete = () => {
    onDeleteTask(task.id);
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onDoubleClick={handleDoubleClick}
      className="flex justify-between items-center"
    >
      <p className="m-0 flex-grow">{task.title}</p>
      <Button
        type="link"
        danger
        onClick={handleDelete}
        style={{ padding: 0, marginLeft: "8px" }}
      >
        Delete
      </Button>
    </Card>
  );
};

export default TaskCard;

