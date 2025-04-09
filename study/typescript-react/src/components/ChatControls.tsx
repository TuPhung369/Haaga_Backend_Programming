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
  Alert,
  IconButton,
  Collapse,
} from "@mui/material"; // Added SelectChangeEvent
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import StopIcon from "@mui/icons-material/Stop";
import ReplayIcon from "@mui/icons-material/Replay";

// Import VoiceRecorder here
import VoiceRecorder from "./VoiceRecorder";
// Import types from the new types structure
import { ProficiencyLevel, ChatControlsProps } from "../types/LanguageAITypes";

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
    onToggleDebugInfo,
  }) => {
    const isBusy = isProcessingAudio || isGeneratingResponse || isSpeaking;
    return (
      <Paper
        elevation={3}
        sx={{
          width: { xs: "100%", md: "25%" },
          minWidth: { md: "250px" },
          display: "flex",
          flexDirection: "column",
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
          height: { xs: "auto", md: "100%" },
          overflowY: "auto",
          bgcolor: "#FAFBFC",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
          position: "relative",
          maxHeight: { md: "100vh" }, // Ensure it doesn't overflow viewport
        }}
      >
        {/* Header */}
        <Box
          sx={{
            bgcolor: "primary.main",
            color: "white",
            py: 2,
            px: 2.5,
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8,
            position: "sticky",
            top: 0,
            zIndex: 10,
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
          }}
        >
          <Typography
            variant="h6"
            component="h2"
            sx={{
              fontWeight: 600,
              letterSpacing: 0.5,
              textAlign: "center",
              fontSize: { xs: "1.1rem", md: "1.2rem" },
            }}
          >
            Language Settings
          </Typography>
        </Box>

        {/* Main Content Container */}
        <Box
          sx={{ p: 1.5, display: "flex", flexDirection: "column", gap: 1.5 }}
        >
          {/* Status Alerts */}
          {!backendAvailable && (
            <Alert
              severity="warning"
              variant="filled"
              sx={{
                borderRadius: 1.5,
                "& .MuiAlert-icon": { fontSize: "1.2rem" },
              }}
            >
              Backend service unavailable
            </Alert>
          )}
          {error && (
            <Alert
              severity="error"
              variant="filled"
              sx={{
                borderRadius: 1.5,
                "& .MuiAlert-icon": { fontSize: "1.2rem" },
              }}
            >
              {error}
            </Alert>
          )}

          {/* Configuration Section */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
              mt: 0.5,
            }}
          >
            <Box sx={{ mb: 0.5 }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 600, color: "text.secondary" }}
                >
                  Language:
                </Typography>
              </Box>
              <FormControl
                fullWidth
                variant="outlined"
                size="small"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                    bgcolor: "white",
                    fontSize: "0.875rem",
                    height: "32px",
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "primary.main",
                      borderWidth: "1px",
                    },
                  },
                }}
              >
                <Select
                  value={language}
                  onChange={onLanguageChange}
                  disabled={isBusy}
                  displayEmpty
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        maxHeight: 250,
                        borderRadius: 1.5,
                        mt: 0.5,
                        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
                      },
                    },
                  }}
                  renderValue={(selected) => {
                    const selectedLang = supportedLanguages.find(
                      (lang) => lang.code === selected
                    );
                    return selectedLang ? selectedLang.name : "Select language";
                  }}
                  size="small"
                >
                  {supportedLanguages.map((lang) => (
                    <MenuItem key={lang.code} value={lang.code}>
                      {lang.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ mb: 0.5 }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 600, color: "text.secondary" }}
                >
                  Level:
                </Typography>
              </Box>
              <FormControl
                fullWidth
                variant="outlined"
                size="small"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                    bgcolor: "white",
                    fontSize: "0.875rem",
                    height: "32px",
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "primary.main",
                      borderWidth: "1px",
                    },
                  },
                }}
              >
                <Select
                  value={proficiencyLevel}
                  onChange={onProficiencyChange}
                  disabled={isBusy}
                  displayEmpty
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        maxHeight: 250,
                        borderRadius: 1.5,
                        mt: 0.5,
                        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
                      },
                    },
                  }}
                  size="small"
                >
                  {Object.entries(ProficiencyLevel).map(([key, value]) => (
                    <MenuItem key={value} value={value}>
                      {key}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ mb: 0.5 }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 600, color: "text.secondary" }}
                >
                  Voice:
                </Typography>
              </Box>
              <FormControl
                fullWidth
                variant="outlined"
                size="small"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                    bgcolor: "white",
                    fontSize: "0.875rem",
                    height: "32px",
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "primary.main",
                      borderWidth: "1px",
                    },
                  },
                }}
              >
                <Select
                  value={selectedVoice}
                  onChange={onVoiceChange}
                  disabled={isBusy || supportedVoices.length === 0}
                  displayEmpty
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        maxHeight: 250,
                        borderRadius: 1.5,
                        mt: 0.5,
                        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
                      },
                    },
                  }}
                  renderValue={(selected) => {
                    if (!selected || selected === "") {
                      return "No voices available";
                    }
                    const selectedVoiceObj = supportedVoices.find(
                      (voice) => voice.id === selected
                    );
                    return selectedVoiceObj
                      ? selectedVoiceObj.name
                      : "Select voice";
                  }}
                  size="small"
                >
                  {supportedVoices.length === 0 && (
                    <MenuItem value="" disabled>
                      No voices for {language}
                    </MenuItem>
                  )}
                  {supportedVoices.map((voice) => (
                    <MenuItem key={voice.id} value={voice.id}>
                      <Box sx={{ display: "flex", flexDirection: "column" }}>
                        <Typography variant="body2">{voice.name}</Typography>
                        {voice.description && (
                          <Typography variant="caption" color="text.secondary">
                            {voice.description}
                          </Typography>
                        )}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>
        </Box>

        {/* Transcript Area - will take most available space */}
        <Box
          sx={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
            my: 1,
            mx: 1,
            borderRadius: 1,
            bgcolor: "rgba(0, 0, 0, 0.01)",
            border: "1px dashed",
            borderColor: "divider",
            minHeight: "100px",
          }}
          id="transcript-container"
        >
          {/* This area will be filled by the transcript from VoiceRecorder */}
        </Box>

        {/* Voice Recorder & TTS Controls - Fixed at bottom */}
        <Box
          sx={{
            borderTop: "1px solid",
            borderColor: "divider",
            p: 1,
            mt: "auto", // Push to bottom
            bgcolor: "rgba(0, 0, 0, 0.02)",
            display: "flex",
            flexDirection: "column",
            gap: 0.5,
          }}
        >
          {/* Voice Recorder */}
          <Paper
            elevation={0}
            sx={{
              p: 0.75,
              borderRadius: 1.5,
              bgcolor: "white",
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <VoiceRecorder
              onAudioRecorded={onAudioRecorded}
              onSpeechRecognized={onSpeechRecognized}
              language={language}
              disabled={isBusy || !backendAvailable}
            />
          </Paper>

          {isSpeaking && (
            <Paper
              elevation={0}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                py: 0.75,
                px: 1.5,
                gap: 1,
                borderRadius: 1.5,
                bgcolor: "primary.light",
                color: "primary.contrastText",
                border: "1px solid",
                borderColor: "primary.main",
              }}
            >
              <CircularProgress size={14} thickness={4} color="inherit" />
              <Typography variant="caption" sx={{ fontWeight: 500 }}>
                Speaking
              </Typography>
              <IconButton
                color="inherit"
                onClick={onStopSpeaking}
                size="small"
                aria-label="Stop speaking"
                sx={{
                  ml: "auto",
                  bgcolor: "rgba(255, 255, 255, 0.2)",
                  "&:hover": {
                    bgcolor: "rgba(255, 255, 255, 0.3)",
                  },
                }}
              >
                <StopIcon fontSize="small" />
              </IconButton>
            </Paper>
          )}

          {!isSpeaking &&
            !isGeneratingResponse &&
            !isProcessingAudio &&
            aiResponse && (
              <Button
                variant="contained"
                color="primary"
                size="small"
                startIcon={<ReplayIcon fontSize="small" />}
                onClick={onSpeakLastResponse}
                disabled={isBusy}
                sx={{
                  width: "100%",
                  textTransform: "none",
                  borderRadius: 1.5,
                  py: 0.5,
                  fontSize: "0.75rem",
                  boxShadow: "0 1px 4px rgba(0, 0, 0, 0.15)",
                  "&:hover": {
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
                  },
                }}
              >
                Replay Response
              </Button>
            )}
        </Box>

        {/* Debug/Metadata Section - Always at bottom */}
        {responseMetadata && Object.keys(responseMetadata).length > 0 && (
          <Box
            sx={{
              borderTop: "1px solid",
              borderColor: "divider",
              bgcolor: "rgba(0, 0, 0, 0.01)",
              px: 1.5,
              py: 0.75,
              mt: 0, // No margin needed as Voice Controls has mt: auto
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
                borderRadius: 1.5,
                px: 1,
                py: 0.5,
                "&:hover": {
                  bgcolor: "rgba(0, 0, 0, 0.04)",
                },
                transition: "background-color 0.2s ease",
              }}
              onClick={onToggleDebugInfo}
              role="button"
              aria-expanded={showDebugInfo}
              aria-controls="debug-info-collapse"
            >
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                }}
              >
                <Box
                  component="span"
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    bgcolor: "success.main",
                    display: "inline-block",
                  }}
                />
                Details
              </Typography>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleDebugInfo();
                }}
                aria-label={showDebugInfo ? "Hide details" : "Show details"}
                sx={{
                  p: 0.5,
                  color: "text.secondary",
                  "&:hover": {
                    bgcolor: "rgba(0, 0, 0, 0.08)",
                  },
                }}
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
                sx={{
                  p: 1,
                  mt: 0.5,
                  bgcolor: "#f8f9fa",
                  borderRadius: 1,
                  border: "1px solid",
                  borderColor: "divider",
                  fontSize: "0.7rem",
                }}
                elevation={0}
              >
                <Box
                  sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}
                >
                  <Box
                    sx={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontSize="inherit"
                    >
                      Source
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        fontFamily: "monospace",
                        color: "primary.main",
                        fontSize: "inherit",
                      }}
                    >
                      {responseMetadata.responseSource ?? "N/A"}
                    </Typography>
                  </Box>
                  <Box
                    sx={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontSize="inherit"
                    >
                      Time
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        fontFamily: "monospace",
                        color: "success.main",
                        fontSize: "inherit",
                      }}
                    >
                      {responseMetadata.responseTime ?? "N/A"}ms
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Collapse>
          </Box>
        )}
      </Paper>
    );
  }
);

