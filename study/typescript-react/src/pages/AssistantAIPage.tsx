import React from "react";
import { Box } from "@mui/material";
import AssistantAI from "../components/AssistantAI";

const AssistantAIPage: React.FC = () => {
  return (
    <Box sx={{ height: "100%", overflow: "hidden" }}>
      <AssistantAI />
    </Box>
  );
};

export default AssistantAIPage;
