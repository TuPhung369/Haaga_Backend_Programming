// src/components/ChatControls.tsx
import React from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  IconButton,
  Collapse
} from "@mui/material"; // Added SelectChangeEvent
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import StopIcon from "@mui/icons-material/Stop";
import ReplayIcon from "@mui/icons-material/Replay";

// Import VoiceRecorder here
import VoiceRecorder from "./VoiceRecorder";
// Import types from parent
import { ProficiencyLevel, ChatControlsProps } from "../type/languageAI";

export const ChatControls: React.FC<ChatControlsProps> = React.memo(
  ({
    language,
    proficiencyLevel,
    selectedVoice,
    supportedLanguages,
    supportedVoices,
    isProcessingAudio,
    isGeneratingResponse,
    isSpeaking,
    backendAvailable,
    error,
    aiResponse,
    showDebugInfo,
    responseMetadata,
    onLanguageChange,
    onProficiencyChange,
    onVoiceChange,
    onAudioRecorded,
    onSpeechRecognized,
    onSpeakLastResponse,
    onStopSpeaking,
    onToggleDebugInfo
  }) => {
    const isBusy = isProcessingAudio || isGeneratingResponse || isSpeaking;
    return (
      <Paper
        elevation={2}
        sx={{
          width: { xs: "100%", md: "300px", lg: "350px" }, // Fixed width on larger screens
          minWidth: { md: "300px" }, // Prevent getting too small
          p: 2.5, // Increased padding
          display: "flex",
          flexDirection: "column",
          borderRadius: 3, // Slightly more rounded
          border: "1px solid",
          borderColor: "divider",
          height: { xs: "auto", md: "100%" }, // Full height on medium+ screens
          overflowY: "auto" // Allow scrolling if content overflows
        }}
      >
        {/* Header */}
        <Typography
          variant="h6"
          component="h2" // Better semantics
          sx={{
            textAlign: "center",
            mb: 3, // More margin bottom
            pb: 1.5, // Padding bottom
            borderBottom: "1px solid",
            borderColor: "divider",
            color: "primary.main", // Use theme color
            fontWeight: 600
          }}
        >
          Controls
        </Typography>

        {/* Status Alerts */}
        {!backendAvailable && (
          <Alert severity="warning" sx={{ mb: 2 }} variant="outlined">
            Backend unavailable.
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} variant="outlined">
            {error}
          </Alert>
        )}

        {/* Configuration Section */}
        <Box sx={{ mb: 3 }}>
          <FormControl fullWidth sx={{ mb: 2.5 }} size="small">
            <InputLabel id="language-select-label">Language</InputLabel>
            <Select
              labelId="language-select-label"
              value={language}
              label="Language"
              onChange={onLanguageChange}
              disabled={isBusy}
              MenuProps={{ PaperProps: { sx: { maxHeight: 200 } } }}
            >
              {supportedLanguages.map((lang) => (
                <MenuItem key={lang.code} value={lang.code}>
                  {lang.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2.5 }} size="small">
            <InputLabel id="proficiency-level-label">
              Proficiency Level
            </InputLabel>
            <Select
              labelId="proficiency-level-label"
              value={proficiencyLevel}
              label="Proficiency Level"
              onChange={onProficiencyChange}
              disabled={isBusy}
            >
              {Object.entries(ProficiencyLevel).map(([key, value]) => (
                <MenuItem key={value} value={value}>
                  {key}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 0.5 }} size="small">
            <InputLabel id="voice-select-label">Voice</InputLabel>
            <Select
              labelId="voice-select-label"
              value={selectedVoice}
              label="Voice"
              onChange={onVoiceChange}
              disabled={isBusy || supportedVoices.length === 0}
              MenuProps={{ PaperProps: { sx: { maxHeight: 200 } } }}
            >
              {supportedVoices.length === 0 && (
                <MenuItem value="" disabled>
                  No voices for {language}
                </MenuItem>
              )}
              {supportedVoices.map((voice) => (
                <MenuItem key={voice.id} value={voice.id}>
                  {voice.name}
                  {voice.description ? ` (${voice.description})` : ""}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Spacer */}
        <Box sx={{ flexGrow: 1 }} />

        {/* Voice Recorder & TTS Controls */}
        <Box
          sx={{
            borderTop: "1px solid",
            borderColor: "divider",
            pt: 2.5,
            mt: 2
          }}
        >
          {/* Use VoiceRecorder here */}
          <Box sx={{ mb: 2 }}>
            <VoiceRecorder
              onAudioRecorded={onAudioRecorded}
              onSpeechRecognized={onSpeechRecognized}
              language={language}
              disabled={isBusy || !backendAvailable}
            />
          </Box>

          {isSpeaking && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                py: 1,
                gap: 1,
                height: "40px"
              }}
            >
              <CircularProgress size={20} thickness={4} />
              <Typography variant="body2" color="text.secondary">
                Speaking...
              </Typography>
              <IconButton
                color="error"
                onClick={onStopSpeaking}
                size="small"
                aria-label="Stop speaking"
              >
                <StopIcon fontSize="small" />
              </IconButton>
            </Box>
          )}

          <Box
            sx={{
              minHeight: "56px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              py: 1
            }}
          >
            {!isSpeaking &&
              !isGeneratingResponse &&
              !isProcessingAudio &&
              aiResponse && (
                <Button
                  variant="outlined"
                  size="medium" // Slightly larger button
                  startIcon={<ReplayIcon />}
                  onClick={onSpeakLastResponse}
                  disabled={isBusy}
                  sx={{ width: "100%", textTransform: "none" }} // Make full width
                >
                  Speak Last Response
                </Button>
              )}
          </Box>
        </Box>

        {/* Debug/Metadata Section */}
        {responseMetadata && Object.keys(responseMetadata).length > 0 && (
          <Box sx={{ mt: 2, borderTop: "1px solid #e0e0e0", pt: 1 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer"
              }}
              onClick={onToggleDebugInfo}
              role="button"
              aria-expanded={showDebugInfo}
              aria-controls="debug-info-collapse"
            >
              <Typography variant="caption" color="text.secondary">
                Response Details
              </Typography>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleDebugInfo();
                }}
                aria-label={showDebugInfo ? "Hide details" : "Show details"}
              >
                {showDebugInfo ? (
                  <KeyboardArrowUpIcon fontSize="small" />
                ) : (
                  <KeyboardArrowDownIcon fontSize="small" />
                )}
              </IconButton>
            </Box>
            <Collapse in={showDebugInfo} id="debug-info-collapse">
              <Paper
                sx={{ p: 1, mt: 1, bgcolor: "#f5f5f5" }}
                variant="outlined"
              >
                <Typography
                  variant="caption"
                  component="div"
                  sx={{
                    fontFamily: "monospace",
                    fontSize: "0.7rem",
                    wordBreak: "break-all"
                  }}
                >
                  Source: {responseMetadata.responseSource ?? "N/A"}
                  <br />
                  Time: {responseMetadata.responseTime ?? "N/A"}ms
                </Typography>
              </Paper>
            </Collapse>
          </Box>
        )}
      </Paper>
    );
  }
);
