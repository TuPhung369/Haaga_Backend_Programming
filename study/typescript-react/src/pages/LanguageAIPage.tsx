import React from "react";
import { Card, CardContent } from "@mui/material";
import LanguageAIComponent from "../components/LanguageAIComponent";

const LanguageAIPage: React.FC = () => {
  return (
    <div className="content-container">
      <Card className="page-card">
        <CardContent>
          <LanguageAIComponent />
        </CardContent>
      </Card>
    </div>
  );
};

export default LanguageAIPage;
