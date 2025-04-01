import React from "react";
import { Card, CardContent, Typography } from "@mui/material";
import LanguagePracticeAI from "../components/LanguagePracticeAI";

const LanguageAIPage: React.FC = () => {
  return (
    <div className="content-container">
      <Card className="page-card">
        <CardContent>
          <Typography variant="h4" className="page-title" gutterBottom>
            Language Practice AI
          </Typography>
          <Typography variant="body1" paragraph>
            Practice your language skills with our AI assistant. You can speak
            in your target language and receive feedback from our AI to improve
            your pronunciation and fluency.
          </Typography>

          <LanguagePracticeAI />
        </CardContent>
      </Card>
    </div>
  );
};

export default LanguageAIPage;
