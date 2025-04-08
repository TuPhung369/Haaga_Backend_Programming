// src/components/ChatMessage.tsx
import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Button,
  Paper // Keep necessary MUI imports
} from "@mui/material";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dracula } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import mermaid from "mermaid";
// Import types from the central types file
import { ChatMessageProps } from "../type/languageAI"; // ChatMessageData is implicitly used via ChatMessageProps

// --- Mermaid Diagram Components (Internal to ChatMessage) ---

interface MermaidDiagramProps {
  content: string;
  onRenderComplete?: (svg: string) => void; // Optional callback
}

// Renamed internal component to avoid conflict if exported elsewhere
const MermaidDiagramRenderer: React.FC<MermaidDiagramProps> = React.memo(
  ({ content, onRenderComplete }) => {
    const containerRef = useRef<HTMLDivElement>(null); // Define the ref
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [svgContent, setSvgContent] = useState<string>("");
    // Use a stable ID based on content hash or random ID per mount
    const renderIdRef = useRef(
      `mermaid-${Math.random().toString(36).substr(2, 9)}`
    );

    useEffect(() => {
      let isMounted = true;
      setLoading(true);
      setError(null);
      setSvgContent("");

      const initializeAndRender = async () => {
        try {
          // Ensure Mermaid config is suitable
          mermaid.initialize({
            startOnLoad: false,
            theme: "default",
            securityLevel: "loose",
            fontFamily: "sans-serif",
            gantt: {
              titleTopMargin: 25,
              barHeight: 20,
              barGap: 4,
              topPadding: 50,
              leftPadding: 75,
              gridLineStartPadding: 35,
              fontSize: 14,
              axisFormat: "%Y-%m-%d",
              useWidth: 1000
            }
          });
          const cleanedContent = content
            .trim()
            .replace(/^```mermaid\s*/, "")
            .replace(/```\s*$/, "");
          if (!isMounted) return;
          // Ensure rendering happens after mount
          await Promise.resolve(); // Yield to allow DOM updates if needed
          const { svg } = await mermaid.render(
            renderIdRef.current,
            cleanedContent
          );
          if (isMounted) {
            setSvgContent(svg);
            setLoading(false);
            if (onRenderComplete) onRenderComplete(svg);
          }
        } catch (err: unknown) {
          if (isMounted) {
            console.error("Mermaid render failed:", err);
            const message = err instanceof Error ? err.message : String(err);
            setError(`Diagram Error: ${message}`);
            setLoading(false);
          }
        }
      };
      // Delay rendering slightly can sometimes help with complex diagrams
      const timerId = setTimeout(initializeAndRender, 50);

      return () => {
        isMounted = false; // Cleanup on unmount
        clearTimeout(timerId);
      };
    }, [content, onRenderComplete]);

    // Conditional rendering based on state
    return (
      <Box
        className="mermaid-diagram-container"
        sx={{ my: 2, width: "100%", minHeight: "50px" }}
      >
        {loading && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              color: "text.secondary",
              p: 1
            }}
          >
            {" "}
            <CircularProgress size={16} /> Rendering Diagram...{" "}
          </Box>
        )}
        {error && (
          <Paper
            elevation={0}
            sx={{
              p: 1,
              border: "1px dashed",
              borderColor: "error.main",
              color: "error.dark",
              whiteSpace: "pre-wrap",
              fontSize: "0.8rem"
            }}
          >
            {" "}
            {error}{" "}
            <pre
              style={{
                marginTop: "8px",
                background: "#eee",
                padding: "5px",
                borderRadius: "4px",
                maxHeight: "100px",
                overflow: "auto"
              }}
            >
              {" "}
              <code>{content.substring(0, 300)}...</code>{" "}
            </pre>{" "}
          </Paper>
        )}
        {/* Use the ref here */}
        {svgContent && !error && (
          <Box
            ref={containerRef}
            sx={{
              overflowX: "auto",
              maxWidth: "100%",
              "& svg": {
                maxWidth: "none",
                height: "auto",
                display: "block",
                margin: "auto"
              }
            }}
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        )}
      </Box>
    );
  }
);

// --- DiagramViewer Component ---
interface DiagramViewerProps {
  mermaidContent: string; // Use this prop
}

const DiagramViewer: React.FC<DiagramViewerProps> = React.memo(
  ({ mermaidContent }) => {
    // Destructure and use the prop
    const [viewMode, setViewMode] = useState<"diagram" | "code">("diagram");

    return (
      <Box
        className="diagram-viewer-container"
        sx={{
          my: 2,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 1
        }}
      >
        {/* Toolbar */}
        <Box
          sx={{
            p: 1,
            borderBottom: "1px solid",
            borderColor: "divider",
            display: "flex",
            gap: 1
          }}
        >
          <Button
            variant={viewMode === "diagram" ? "contained" : "outlined"}
            size="small"
            onClick={() => setViewMode("diagram")}
            sx={{ textTransform: "none", fontSize: "0.8rem" }}
          >
            {" "}
            Diagram{" "}
          </Button>
          <Button
            variant={viewMode === "code" ? "contained" : "outlined"}
            size="small"
            onClick={() => setViewMode("code")}
            sx={{ textTransform: "none", fontSize: "0.8rem" }}
          >
            {" "}
            Code{" "}
          </Button>
        </Box>
        {/* Content */}
        <Box sx={{ p: 1, maxHeight: "60vh", overflowY: "auto" }}>
          {/* Conditional rendering based on viewMode */}
          {viewMode === "diagram" && (
            <MermaidDiagramRenderer content={mermaidContent} />
          )}
          {viewMode === "code" && (
            <SyntaxHighlighter language="mermaid" style={dracula} PreTag="div">
              {/* Clean the content for code view too */}
              {mermaidContent
                .replace(/^```mermaid\s*/, "")
                .replace(/```\s*$/, "")}
            </SyntaxHighlighter>
          )}
        </Box>
      </Box>
    );
  }
);

// --- ChatMessage Component ---

const preprocessMarkdown = (markdown: string): string => {
  // Basic preprocessing is fine, ReactMarkdown handles most things
  markdown = markdown.replace(/^>\s*(.*)$/gm, "> $1\n");
  return markdown;
};

// ChatMessageProps is imported from types file

export const ChatMessage: React.FC<ChatMessageProps> = React.memo(
  ({ message, username, formatTimestamp }) => {
    const isUser = message.sender === "User";

    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: isUser ? "flex-end" : "flex-start",
          maxWidth: "85%",
          alignSelf: isUser ? "flex-end" : "flex-start"
        }}
      >
        <Box
          sx={{
            p: 1.5,
            background: isUser
              ? "linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)"
              : "#ffffff",
            borderRadius: isUser ? "18px 18px 0 18px" : "18px 18px 18px 0",
            border: "1px solid",
            borderColor: isUser ? "#7dd3fc" : "#e0e0e0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
            wordBreak: "break-word",
            overflow: "hidden"
          }}
        >
          {/* Sender Name */}
          <Typography
            variant="caption"
            sx={{
              fontWeight: "bold",
              color: isUser ? "primary.dark" : "secondary.dark",
              mb: 0.5,
              display: "block",
              textAlign: isUser ? "right" : "left",
              fontSize: "0.9rem"
            }}
          >
            {isUser ? username : message.sender}
          </Typography>

          {/* Message Content */}
          <Box
            className="markdown-content"
            sx={{
              color: "text.primary",
              fontSize: "0.95rem",
              "& p": { my: 0.5 },
              "& ul": { pl: 2.5, my: 1 },
              "& ol": { pl: 2.5, my: 1 },
              "& li": { mb: 0.5 }
            }}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              children={preprocessMarkdown(message.content)}
              components={{
                // FIX: Prefix unused node parameter
                code({ node: _node, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || "");
                  const codeContent = String(children).replace(/\n$/, "");

                  if (match && match[1]?.toLowerCase() === "mermaid") {
                    return <DiagramViewer mermaidContent={codeContent} />;
                  }

                  const language = match ? match[1] : undefined; // Use undefined if no match
                  const isInline =
                    !_node?.position ||
                    _node.position.start.line === _node.position.end.line;

                  if (!className && isInline) {
                    return (
                      <code
                        style={{
                          background: "#f0f0f0",
                          color: "#333",
                          padding: "2px 5px",
                          borderRadius: "4px",
                          fontSize: "0.875em",
                          fontFamily: "monospace"
                        }}
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  }

                  return language ? (
                    <SyntaxHighlighter
                      style={dracula}
                      language={language}
                      PreTag="div"
                      customStyle={{ margin: "8px 0", fontSize: "0.875rem" }}
                      {...props}
                    >
                      {codeContent}
                    </SyntaxHighlighter>
                  ) : (
                    <pre
                      style={{
                        background: "#282a36",
                        color: "#f8f8f2",
                        padding: "10px",
                        borderRadius: "4px",
                        overflowX: "auto",
                        margin: "8px 0",
                        fontSize: "0.875rem"
                      }}
                    >
                      <code className={className || "language-text"} {...props}>
                        {children}
                      </code>
                    </pre>
                  );
                },
                // FIX: Destructure node, pass valid props to Box
                p: ({ node: _node, ...props }) => (
                  // Use Typography for better paragraph semantics & styling control if desired
                  // Or keep Box if div semantics are preferred
                  <Typography
                    component="div"
                    variant="body2"
                    sx={{ my: 0.5 }}
                    {...props}
                  />
                  // <Box component="div" sx={{ my: 0.5 }} {...props} />
                ),
                table: ({ ...props }) => (
                  <Box
                    sx={{
                      overflowX: "auto",
                      my: 2,
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 1
                    }}
                  >
                    <table
                      style={{ width: "100%", borderCollapse: "collapse" }}
                      {...props}
                    />
                  </Box>
                ),
                thead: ({ ...props }) => (
                  <thead
                    style={{ backgroundColor: "action.hover" }}
                    {...props}
                  />
                ),
                th: ({ ...props }) => (
                  <th
                    style={{
                      padding: "8px 12px",
                      textAlign: "left",
                      borderBottom: "2px solid",
                      borderColor: "divider",
                      fontWeight: 600
                    }}
                    {...props}
                  />
                ),
                td: ({ ...props }) => (
                  <td
                    style={{
                      padding: "8px 12px",
                      borderBottom: "1px solid",
                      borderColor: "divider"
                    }}
                    {...props}
                  />
                ),
                a: ({ ...props }) => (
                  <a
                    style={{
                      color: "primary.main",
                      textDecoration: "underline"
                    }}
                    target="_blank"
                    rel="noopener noreferrer"
                    {...props}
                  />
                ) // Add target blank for external links
                // Use MUI Typography for lists for consistent styling, or keep raw elements
                // ul: ({ ...props }) => <Typography component="ul" sx={{ pl: 2.5, my: 1 }} {...props} />,
                // ol: ({ ...props }) => <Typography component="ol" sx={{ pl: 2.5, my: 1 }} {...props} />,
                // li: ({ ...props }) => <Typography component="li" sx={{ mb: 0.5 }} {...props} />,
              }}
            />
          </Box>

          {/* Timestamp */}
          <Typography
            variant="caption"
            sx={{
              display: "block",
              textAlign: "right",
              mt: 1,
              opacity: 0.7,
              fontSize: "0.7rem"
            }}
          >
            {formatTimestamp(message.timestamp)}
          </Typography>
        </Box>
      </Box>
    );
  }
);
