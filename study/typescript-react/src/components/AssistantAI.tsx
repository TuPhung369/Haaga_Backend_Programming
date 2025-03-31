import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo
} from "react";
import {
  Button,
  TextField,
  Paper,
  Box,
  CircularProgress,
  Typography,
  Fab
} from "@mui/material";
import "reactflow/dist/style.css";
import { PlayCircleOutlined } from "@mui/icons-material";
import KeyboardArrowDown from "@mui/icons-material/KeyboardArrowDown";
import { v4 as uuidv4 } from "uuid";
import axios, { AxiosError } from "axios";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../type/types";
import ReactMarkdown, { Components } from "react-markdown";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import { dracula } from "react-syntax-highlighter/dist/esm/styles/prism";
import rehypeRaw from "rehype-raw";
// import remarkGfm from 'remark-gfm'; // Commented out as we'll handle tables via custom renderers
import "../styles/AssistantAI.css";
import store from "../store/store";
import {
  setMessages,
  addMessage,
  addAIResponse,
  setLoading,
  setHasMore,
  incrementPage
} from "../store/assistantAISlice";
import { ChatMessage } from "../types/assistantAI";
import mermaid from "mermaid";
import FlowDiagram from "./FlowDiagram";
import { MarkerType, Edge } from "reactflow";

// Custom function to preprocess markdown text and convert tables to HTML
const preprocessMarkdown = (markdown: string): string => {
  // First, handle common cases where pipe characters aren't meant to be tables
  // For example, convert lines with a single pipe that aren't table rows to escaped pipes
  const processedContent = markdown
    // If a line has a single pipe and it's not surrounded by spaces like in a table, escape it
    // This helps with Vietnamese text that uses pipes as separators
    .replace(/^([^|\n]+)\|([^|\n]+)$/gm, (match, p1, p2) => {
      // If this looks like single-pipe text (not a table row), escape the pipe
      if (
        p1.trim().length > 0 &&
        p2.trim().length > 0 &&
        !match.includes("|--|")
      ) {
        return `${p1}\\|${p2}`;
      }
      return match;
    });

  // Regular expression to find markdown tables - must have 3+ rows (header, separator, data)
  // and must have proper separator row with dashes
  const tableRegex = /^\|(.+)\|\r?\n\|([\s-:]+\|)+\r?\n(\|(?:.+\|)+\r?\n)+/gm;

  // Process tables: transform markdown table to HTML
  return processedContent.replace(tableRegex, (tableMatch) => {
    // Check if this is a true table (has header separator with dashes)
    const rows = tableMatch.trim().split("\n");

    // Verify the second row contains separator cells with dashes (---)
    const separatorRow = rows[1];
    const validSeparator = separatorRow
      .split("|")
      .filter((cell) => cell.trim().length > 0)
      .every((cell) => /^[\s:-]+$/.test(cell.trim()));

    if (!validSeparator || rows.length < 3) {
      // Not a proper table, return unchanged
      return tableMatch;
    }

    // Process table rows
    // Extract headers (first row)
    const headers = rows[0]
      .split("|")
      .filter((cell) => cell.trim().length > 0)
      .map((cell) => cell.trim());

    // Process alignment row (second row)
    const alignments = separatorRow
      .split("|")
      .filter((cell) => cell.trim().length > 0)
      .map((align) => {
        if (align.startsWith(":") && align.endsWith(":")) return "center";
        if (align.endsWith(":")) return "right";
        return "left";
      });

    // Build table HTML with more defensive processing
    let tableHtml = '<table class="markdown-table">\n<thead>\n<tr>\n';

    // Add headers
    headers.forEach((header, index) => {
      const alignment = index < alignments.length ? alignments[index] : "left";
      tableHtml += `<th class="markdown-th" style="text-align: ${alignment}">${header}</th>\n`;
    });

    tableHtml += "</tr>\n</thead>\n<tbody>\n";

    // Add data rows (skip header and alignment rows)
    for (let i = 2; i < rows.length; i++) {
      if (!rows[i].trim()) continue; // Skip empty rows

      const cells = rows[i]
        .split("|")
        .filter(
          (cell, idx, arr) =>
            // Keep cells that have content or are between cells with content
            // This ensures empty cells in the middle of a row aren't filtered out
            idx === 0 ||
            idx === arr.length - 1 ||
            cell.trim().length > 0 ||
            arr[idx - 1].trim().length > 0
        )
        .map((cell) => cell.trim());

      if (cells.length <= 1) continue; // Skip invalid rows

      tableHtml += '<tr class="markdown-tr">\n';
      cells.forEach((cell, index) => {
        // Skip first and last empty cells (from split operation)
        if ((index === 0 || index === cells.length - 1) && cell.length === 0)
          return;

        const alignment =
          index < alignments.length ? alignments[index] : "left";
        tableHtml += `<td class="markdown-td" style="text-align: ${alignment}">${cell}</td>\n`;
      });
      tableHtml += "</tr>\n";
    }

    tableHtml += "</tbody>\n</table>";

    // Wrap in responsive container
    return `<div class="table-responsive">${tableHtml}</div>`;
  });
};

// Initialize mermaid configuration globally
mermaid.initialize({
  startOnLoad: false,
  theme: "default",
  securityLevel: "loose",
  flowchart: {
    htmlLabels: true,
    curve: "basis"
  },
  sequence: {
    diagramMarginX: 50,
    diagramMarginY: 10,
    actorMargin: 50,
    width: 150,
    height: 65
  }
});

// Update the RootState type by extending it
declare module "../type/types" {
  interface RootState {
    assistantAI: {
      messages: ChatMessage[];
      loading: boolean;
      hasMore: boolean;
      page: number;
      size: number;
    };
  }
}

// Create a Mermaid component to render diagrams
interface MermaidDiagramProps {
  content: string;
  className?: string;
  onRenderComplete?: (svg: string) => void;
}

const MermaidDiagram: React.FC<MermaidDiagramProps> = ({
  content,
  className,
  onRenderComplete
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRendered, setIsRendered] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentRef = useRef<string>(content);

  // Log when component mounts with content
  useEffect(() => {
    console.log(
      "MermaidDiagram received content:",
      content.substring(0, 50) + "..."
    );
    // Only update contentRef if the content has actually changed
    if (contentRef.current !== content) {
      contentRef.current = content;
      setIsRendered(false);
    }
  }, [content]);

  // Create a deterministic ID based on content hash
  const getDiagramId = useCallback(() => {
    // Simple hash function for generating a stable ID
    let hash = 0;
    for (let i = 0; i < contentRef.current.length; i++) {
      const char = contentRef.current.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `mermaid-${Math.abs(hash).toString(16)}`;
  }, []);

  const diagramId = useRef(getDiagramId());

  useEffect(() => {
    // Skip if already rendered or no container
    if (isRendered || !containerRef.current) return;

    const renderDiagram = async () => {
      if (!containerRef.current) return;

      try {
        // Clear any previous content
        containerRef.current.innerHTML = "";
        setError(null);

        // Trim and clean up the content
        const cleanedContent = contentRef.current.trim();
        console.log(
          "Rendering mermaid with content:",
          cleanedContent.substring(0, 50) + "..."
        );

        if (!cleanedContent) {
          setError("Empty diagram content");
          return;
        }

        // Initialize mermaid with best settings
        mermaid.initialize({
          startOnLoad: false,
          theme: "default",
          securityLevel: "loose",
          flowchart: {
            htmlLabels: true,
            curve: "basis",
            useMaxWidth: false // Prevent width limitation
          },
          sequence: {
            diagramMarginX: 50,
            diagramMarginY: 10,
            actorMargin: 80, // Increased actor margin
            width: 250, // Increased width
            height: 100, // Increased height
            boxMargin: 10,
            boxTextMargin: 5,
            noteMargin: 10,
            messageMargin: 35
          },
          fontSize: 16, // Increase font size
          fontFamily: "Roboto, sans-serif" // Consistent font
        });

        // Use the modern render method instead of deprecated init
        const uniqueId = `${diagramId.current}-${Date.now()}`;
        console.log("Calling mermaid.render with ID:", uniqueId);
        const { svg } = await mermaid.render(uniqueId, cleanedContent);
        console.log("Mermaid render successful, got SVG");

        // Create container and insert SVG
        const container = document.createElement("div");
        container.className = "mermaid-svg-container";

        // Modify SVG for better sizing
        let modifiedSvg = svg;
        if (!modifiedSvg.includes("width=")) {
          modifiedSvg = modifiedSvg.replace("<svg ", '<svg width="100%" ');
        }
        if (!modifiedSvg.includes("height=")) {
          modifiedSvg = modifiedSvg.replace("<svg ", '<svg height="auto" ');
        }

        container.innerHTML = modifiedSvg;

        // Append to DOM
        if (containerRef.current) {
          containerRef.current.appendChild(container);
          console.log("Appended SVG to container");

          // Add event listener to ensure diagram is properly sized
          const svgElement = containerRef.current.querySelector("svg");
          if (svgElement) {
            svgElement.setAttribute(
              "style",
              "width: 100%; min-width: 300px; min-height: 200px;"
            );
            svgElement.setAttribute("preserveAspectRatio", "xMidYMid meet");
          }

          // Call the callback with the rendered SVG
          if (onRenderComplete) {
            console.log("Calling onRenderComplete");
            onRenderComplete(modifiedSvg);
          }

          // Mark as rendered to prevent future renders of this instance
          setIsRendered(true);
        } else {
          console.warn("MermaidDiagram containerRef became null during render");
          setError("Container disappeared during rendering");
        }
      } catch (err) {
        console.error("Failed to render mermaid diagram:", err);
        setError(
          err instanceof Error ? err.message : "Failed to render diagram"
        );
      }
    };

    // Use a timeout to ensure the DOM is stable before rendering
    // Clear previous timeout if exists
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      renderDiagram();
    }, 150); // Reduced timeout slightly

    // Cleanup timeout on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isRendered, onRenderComplete]); // Re-run if isRendered changes or callback changes

  // No longer reset rendered state on every content change
  // Only update diagramId if content changes (managed in the first useEffect)

  return (
    <div className={`mermaid-diagram-container ${className || ""}`}>
      <div ref={containerRef} className="mermaid-render-target" />
      {error && (
        <div className="mermaid-error">
          Diagram rendering failed: {error}
          <div className="mermaid-source-code">
            <pre>{contentRef.current}</pre>
          </div>
        </div>
      )}
    </div>
  );
};

// Create a DiagramViewer component to handle diagrams with toggle options
interface DiagramViewerProps {
  mermaidContent: string;
  reactFlowContent?: string;
}

// DiagramViewer component for toggling between Mermaid, ReactFlow and source code view
const DiagramViewer: React.FC<DiagramViewerProps> = React.memo(
  ({ mermaidContent, reactFlowContent }) => {
    // Generate a stable ID based on the content for localStorage key
    const diagramId = useMemo(() => {
      // Simple hash function to create a stable ID for this diagram content
      let hash = 0;
      const content = mermaidContent + (reactFlowContent || "");
      for (let i = 0; i < content.length; i++) {
        const char = content.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      return `diagram-${Math.abs(hash).toString(16).substring(0, 8)}`;
    }, [mermaidContent, reactFlowContent]);

    // Get the stored view mode from localStorage or use default
    const getStoredViewMode = useCallback(() => {
      try {
        const stored = localStorage.getItem(`viewMode-${diagramId}`);
        if (
          stored &&
          ["mermaid", "reactflow", "mermaid-code", "reactflow-code"].includes(
            stored
          )
        ) {
          return stored as
            | "mermaid"
            | "reactflow"
            | "mermaid-code"
            | "reactflow-code";
        }
      } catch (e) {
        console.warn(
          "Failed to retrieve stored view mode from localStorage",
          e
        );
      }
      return "mermaid"; // Default view
    }, [diagramId]);

    // State for the current view mode, initialized from storage
    const [viewMode, setViewMode] = useState<
      "mermaid" | "reactflow" | "mermaid-code" | "reactflow-code"
    >(getStoredViewMode);

    // Store the viewMode in localStorage when it changes
    useEffect(() => {
      try {
        localStorage.setItem(`viewMode-${diagramId}`, viewMode);
      } catch (e) {
        console.warn("Failed to store view mode in localStorage", e);
      }
    }, [viewMode, diagramId]);

    // Debug information when the component mounts or changes props - keep for troubleshooting
    useEffect(() => {
      console.log("DiagramViewer rendering with:", {
        hasMermaid: !!mermaidContent,
        hasReactFlow: !!reactFlowContent,
        viewMode,
        diagramId
      });
    }, [mermaidContent, reactFlowContent, viewMode, diagramId]);

    // Process ReactFlow data if available
    const parsedData = useMemo(() => {
      if (!reactFlowContent) return null;
      try {
        return JSON.parse(reactFlowContent);
      } catch (err) {
        console.error("Failed to parse ReactFlow data:", err);
        return null;
      }
    }, [reactFlowContent]);

    // Wrap the nodes assignment in its own useMemo to fix the linter warning
    const nodes = useMemo(() => parsedData?.nodes || [], [parsedData]);

    // Modify edges to include arrow markers before passing them to FlowDiagram
    const edgesWithArrows = useMemo(() => {
      return (parsedData?.edges || []).map((edge: Edge) => ({
        ...edge,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: "#007bff"
        },
        style: { stroke: "#007bff", strokeWidth: 2 },
        animated: false
      }));
    }, [parsedData?.edges]);

    // Check if diagram has been rendered already and cache SVG
    const [renderCache, setRenderCache] = useState(() => {
      try {
        const cached = localStorage.getItem(`diagram-cache-${diagramId}`);
        return cached ? JSON.parse(cached) : { rendered: false, svg: null };
      } catch {
        return { rendered: false, svg: null };
      }
    });

    // Save rendering state and SVG to localStorage
    useEffect(() => {
      if (renderCache.rendered && renderCache.svg) {
        try {
          localStorage.setItem(
            `diagram-cache-${diagramId}`,
            JSON.stringify(renderCache)
          );
        } catch (error) {
          console.warn("Failed to store diagram cache in localStorage", error);
        }
      }
    }, [renderCache, diagramId]);

    // Callback to receive the rendered SVG from MermaidDiagram
    const handleMermaidRenderComplete = useCallback(
      (svg: string) => {
        console.log(`Received SVG for ${diagramId}, setting cache.`);
        setRenderCache({ rendered: true, svg: svg });
      },
      [diagramId]
    );

    // Memoize the diagram content to prevent unnecessary re-renders
    const mermaidDiagram = useMemo(() => {
      if (viewMode !== "mermaid") return null;

      // If already rendered and we have the SVG, display it directly
      if (renderCache.rendered && renderCache.svg) {
        console.log(`Using cached SVG for ${diagramId}`);
        return (
          <div
            className="mermaid-diagram-container mermaid-centered"
            dangerouslySetInnerHTML={{ __html: renderCache.svg }}
          />
        );
      }

      // Otherwise, render the MermaidDiagram component to generate the SVG
      console.log(
        `Rendering MermaidDiagram component for ${diagramId} to get SVG`
      );
      return (
        <MermaidDiagram
          content={mermaidContent}
          className="mermaid-centered"
          onRenderComplete={handleMermaidRenderComplete}
        />
      );
    }, [
      mermaidContent,
      viewMode,
      renderCache,
      handleMermaidRenderComplete,
      diagramId
    ]);

    const reactFlowDiagram = useMemo(() => {
      if (viewMode !== "reactflow" || !reactFlowContent) return null;
      return (
        <div className="react-flow-container">
          <FlowDiagram initialNodes={nodes} initialEdges={edgesWithArrows} />
        </div>
      );
    }, [viewMode, reactFlowContent, nodes, edgesWithArrows]);

    const mermaidCodeView = useMemo(() => {
      if (viewMode !== "mermaid-code") return null;
      return (
        <div className="code-container">
          <SyntaxHighlighter language="markdown" style={dracula}>
            {mermaidContent}
          </SyntaxHighlighter>
        </div>
      );
    }, [mermaidContent, viewMode]);

    const reactFlowCodeView = useMemo(() => {
      if (viewMode !== "reactflow-code" || !reactFlowContent) return null;
      return (
        <div className="code-container">
          <SyntaxHighlighter language="json" style={dracula}>
            {reactFlowContent}
          </SyntaxHighlighter>
        </div>
      );
    }, [reactFlowContent, viewMode]);

    // Stop render cycles for diagrams after initial rendering
    const diagramContent = useMemo(() => {
      // We no longer need the hasRendered logic here as individual components handle caching
      return (
        <>
          {mermaidDiagram}
          {reactFlowDiagram}
          {mermaidCodeView}
          {reactFlowCodeView}
        </>
      );
    }, [mermaidDiagram, reactFlowDiagram, mermaidCodeView, reactFlowCodeView]);

    return (
      <div className="diagram-viewer-container">
        <div className="diagram-toolbar">
          <Button
            variant={viewMode === "mermaid" ? "contained" : "outlined"}
            color="primary"
            size="small"
            onClick={() => setViewMode("mermaid")}
            sx={{ mr: 1 }}
          >
            Mermaid
          </Button>

          {reactFlowContent && (
            <Button
              variant={viewMode === "reactflow" ? "contained" : "outlined"}
              color="primary"
              size="small"
              onClick={() => setViewMode("reactflow")}
              sx={{ mr: 1 }}
            >
              Flow Diagram
            </Button>
          )}

          <Button
            variant={viewMode === "mermaid-code" ? "contained" : "outlined"}
            color="primary"
            size="small"
            onClick={() => setViewMode("mermaid-code")}
            sx={{ mr: 1 }}
          >
            Mermaid Code
          </Button>

          {reactFlowContent && (
            <Button
              variant={viewMode === "reactflow-code" ? "contained" : "outlined"}
              color="primary"
              size="small"
              onClick={() => setViewMode("reactflow-code")}
            >
              Flow Data
            </Button>
          )}
        </div>

        <div className="diagram-content">{diagramContent}</div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function to prevent unnecessary re-renders
    return (
      prevProps.mermaidContent === nextProps.mermaidContent &&
      prevProps.reactFlowContent === nextProps.reactFlowContent
    );
  }
);

const AssistantAI: React.FC = () => {
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<number | null>(null);
  const dispatch = useDispatch();
  const { token } = useSelector((state: RootState) => state.auth);
  const { userInfo } = useSelector((state: RootState) => state.user);
  const { messages, loading, hasMore, page, size } = useSelector(
    (state: RootState) => state.assistantAI
  );

  // Check for valid authentication on component mount and token changes
  useEffect(() => {
    if (!token && userInfo?.id) {
      console.warn(
        "Token is missing but user info exists - possible session expiration"
      );
      // You can add a redirect to login page or show a message here
      dispatch(
        addAIResponse({
          content:
            "Your session appears to have expired. Please refresh the page and log in again.",
          sender: "AI",
          sessionId: sessionId || uuidv4(),
          timestamp: new Date().toISOString()
        })
      );
    }
  }, [token, userInfo, sessionId, dispatch]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChatHistory = useCallback(
    async (pageToLoad = 0) => {
      if (!userInfo?.id || loading || (pageToLoad > 0 && !hasMore)) return;

      try {
        dispatch(setLoading(true));
        const { getRecaptchaToken } = await import("../utils/recaptchaUtils");
        const recaptchaToken = getRecaptchaToken();

        console.log(`Loading chat history: page=${pageToLoad}, size=${size}`);

        const response = await axios.get(
          `/api/assistant/${
            userInfo.id
          }?page=${pageToLoad}&size=${size}&recaptchaToken=${encodeURIComponent(
            recaptchaToken
          )}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        console.log("API Response:", response.data);

        if (
          response.data &&
          Array.isArray(response.data) &&
          response.data.length > 0
        ) {
          if (pageToLoad === 0) {
            // For first page, replace all messages
            console.log("Setting messages from API:", response.data);
            dispatch(setMessages(response.data));
            const lastMessage = response.data[response.data.length - 1];
            if (lastMessage.sessionId) {
              setSessionId(lastMessage.sessionId);
            }
          } else {
            // Prepend older messages when loading more
            console.log("Adding older messages:", response.data);
            // We need to concatenate in the correct order: older messages first, then existing messages
            const currentMessages = store.getState().assistantAI.messages;
            dispatch(setMessages([...response.data, ...currentMessages]));
          }

          dispatch(setHasMore(response.data.length === size));
        } else if (pageToLoad === 0) {
          // If it's the first load and no messages, set default welcome message
          console.log("No messages found, setting welcome message");
          const newSessionId = uuidv4();
          setSessionId(newSessionId);
          dispatch(
            setMessages([
              {
                content:
                  "Hello! I am your AI assistant. How can I help you today?",
                sender: "AI",
                sessionId: newSessionId,
                timestamp: new Date().toISOString()
              }
            ])
          );
          dispatch(setHasMore(false));
        } else {
          console.log("No more messages to load");
          dispatch(setHasMore(false));
        }
      } catch (error) {
        console.error("Error loading chat history:", error);
        if (pageToLoad === 0) {
          // Only set welcome message on first load error
          const newSessionId = uuidv4();
          setSessionId(newSessionId);
          dispatch(
            setMessages([
              {
                content:
                  "Hello! I am your AI assistant. How can I help you today?",
                sender: "AI",
                sessionId: newSessionId,
                timestamp: new Date().toISOString()
              }
            ])
          );
        }
        dispatch(setHasMore(false));
      } finally {
        dispatch(setLoading(false));
      }
    },
    // Remove 'messages' from the dependency array to break the loop
    [token, userInfo?.id, loading, hasMore, size, dispatch]
  );

  // Initial data load - only runs once when component mounts
  useEffect(() => {
    // Force initial data load on component mount only if the messages array is empty
    const currentState = store.getState().assistantAI;

    // Ensure we have a session ID even if there are no messages
    if (!sessionId) {
      const newSessionId = uuidv4();
      console.log("Initializing new session:", newSessionId);
      setSessionId(newSessionId);
    }

    if (
      userInfo?.id &&
      (!currentState.messages || currentState.messages.length === 0)
    ) {
      console.log(
        "Component mounted with empty messages, loading initial chat data"
      );
      loadChatHistory(0);
    } else {
      console.log(
        "Using cached messages from store:",
        currentState.messages?.length || 0
      );

      // If we have messages, make sure we have set the session ID from the last message
      if (currentState.messages && currentState.messages.length > 0) {
        const lastMessage =
          currentState.messages[currentState.messages.length - 1];
        if (lastMessage.sessionId) {
          console.log(
            "Using existing session from last message:",
            lastMessage.sessionId
          );
          setSessionId(lastMessage.sessionId);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only on mount

  // Handle user changes - runs only when userInfo changes, not on every render
  useEffect(() => {
    // Only load chat history if userInfo changes and there are no messages
    const currentMessages = store.getState().assistantAI.messages;

    if (userInfo?.id && (!currentMessages || currentMessages.length === 0)) {
      console.log("User changed or no messages in store, loading chat data");
      loadChatHistory(0);
    } else if (!userInfo?.id) {
      // Set default welcome message if no user is logged in
      const newSessionId = uuidv4();
      setSessionId(newSessionId);
      dispatch(
        setMessages([
          {
            content: "Hello! I am your AI assistant. How can I help you today?",
            sender: "AI",
            sessionId: newSessionId,
            timestamp: new Date().toISOString()
          }
        ])
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userInfo?.id]); // Only depend on userInfo.id changing

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  };

  const handleScroll = useCallback(() => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } =
        chatContainerRef.current;

      // Show/hide scroll button based on position
      const isScrolledUp = scrollHeight - scrollTop - clientHeight > 100;
      setShowScrollButton(isScrolledUp);

      // Check if user scrolled to top to load more messages
      if (scrollTop < 100 && !loading && hasMore) {
        // Use a debounce technique to avoid multiple rapid calls
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
          console.log("Scroll reached top, loading more messages");
          dispatch(incrementPage());
          loadChatHistory(page + 1);
          debounceTimerRef.current = null;
        }, 300) as unknown as number; // 300ms debounce
      }
    }
  }, [loading, hasMore, page, dispatch, loadChatHistory]);

  useEffect(() => {
    const chatContainer = chatContainerRef.current;
    if (chatContainer) {
      chatContainer.addEventListener("scroll", handleScroll);
      return () => chatContainer.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll]);

  const handleSendMessage = async () => {
    if (!input.trim() || !userInfo?.id) return;

    // Verify token exists before proceeding
    if (!token) {
      console.error("Authentication token is missing");
      dispatch(
        addAIResponse({
          content:
            "You are not properly authenticated. Please try logging in again.",
          sender: "AI",
          sessionId: sessionId || uuidv4(),
          timestamp: new Date().toISOString()
        })
      );
      return;
    }

    // Generate new sessionId if it doesn't exist
    if (!sessionId) {
      const newId = uuidv4();
      setSessionId(newId);
      console.log("Created new sessionId:", newId);
    }

    // Use a local variable to ensure consistent sessionId throughout this function call
    const currentSessionId = sessionId || uuidv4();
    console.log("Sending message with sessionId:", currentSessionId);
    console.log("Using auth token:", token ? "Token exists" : "Token missing");

    const currentMessage = input.trim(); // Save current input
    const userMessage: ChatMessage = {
      content: currentMessage,
      sender: "USER",
      sessionId: currentSessionId,
      timestamp: new Date().toISOString()
    };

    dispatch(addMessage(userMessage));
    setInput("");
    dispatch(setLoading(true));
    setAiThinking(true);

    try {
      // Try to refresh token if needed (implement based on your auth system)
      const currentToken = token;
      try {
        // This is a placeholder - implement according to your auth system
        // For example, you might check token expiration and refresh if needed
        // const tokenData = await checkAndRefreshToken(token);
        // if (tokenData.refreshed) currentToken = tokenData.newToken;
      } catch (tokenError) {
        console.error("Error refreshing token:", tokenError);
      }

      const { getRecaptchaToken } = await import("../utils/recaptchaUtils");
      const recaptchaToken = getRecaptchaToken();

      console.log("Sending API request with data:", {
        userId: userInfo.id,
        message: currentMessage,
        sessionId: currentSessionId
      });

      // Ensure authorization header is properly formatted with token
      const authHeader = currentToken.trim()
        ? `Bearer ${currentToken.trim()}`
        : "";

      if (!authHeader) {
        throw new Error("Authentication token is empty");
      }

      const response = await axios.post(
        "/api/assistant/send",
        {
          userId: userInfo.id,
          message: currentMessage,
          sessionId: currentSessionId,
          recaptchaToken
        },
        {
          headers: {
            Authorization: authHeader
          }
        }
      );

      console.log("API Response:", response.data);

      if (response.data) {
        let content = "No response";

        if (typeof response.data.content === "string") {
          content = response.data.content;
        } else if (response.data.content) {
          content = JSON.stringify(response.data.content);
        }

        if (!content || content.trim() === "") {
          content = "I couldn't process your request. Please try again.";
        }

        const aiResponse = {
          content: content,
          sender: "AI",
          sessionId: currentSessionId,
          timestamp: new Date().toISOString()
        };

        console.log("Adding AI response to store:", aiResponse);
        dispatch(addAIResponse(aiResponse));
      } else {
        throw new Error("Empty response from server");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = "Sorry, something went wrong. Please try again.";

      // If we can get a more specific error message, use it
      let detailedError = errorMessage;
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        console.log("Error response status:", axiosError.response?.status);
        console.log("Error response data:", axiosError.response?.data);

        if (axiosError.response?.data) {
          // Safely access the message property if it exists
          const errorData = axiosError.response.data;
          if (
            typeof errorData === "object" &&
            errorData !== null &&
            "message" in errorData
          ) {
            const message = (errorData as Record<string, unknown>).message;
            if (typeof message === "string") {
              detailedError = message;
            }
          }
        }
      }

      const errorResponse: ChatMessage = {
        content: detailedError,
        sender: "AI",
        sessionId: currentSessionId,
        timestamp: new Date().toISOString()
      };
      dispatch(addAIResponse(errorResponse));
    } finally {
      dispatch(setLoading(false));
      setAiThinking(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const parseTimestamp = (timestamp?: number[] | string) => {
    if (!timestamp) return null;
    if (typeof timestamp === "string") return new Date(timestamp);
    if (Array.isArray(timestamp) && timestamp.length >= 6) {
      const [year, month, day, hour, minute, second] = timestamp;
      return new Date(year, month - 1, day, hour, minute, second);
    }
    return null;
  };

  const formatTimestamp = (timestamp?: number[] | string) => {
    const date = parseTimestamp(timestamp);
    if (!date || isNaN(date.getTime())) return "Invalid Date";
    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  };

  return (
    <Box className="root-container">
      <Paper elevation={3} className="chat-card">
        <Box className="chat-container" ref={chatContainerRef}>
          {loading && page > 0 && (
            <Box ref={loaderRef} className="loading-earlier-messages">
              <CircularProgress size={20} />
              <Typography variant="body2">
                Loading earlier messages...
              </Typography>
            </Box>
          )}

          {Array.isArray(messages) && messages.length === 0 ? (
            <Box className="empty-chat">
              <Typography variant="h6">No messages yet</Typography>
              <Typography variant="body2">
                Start a conversation by typing a message below.
              </Typography>
            </Box>
          ) : (
            <Box className="messages-container">
              {messages.map((message, index) => (
                <Box
                  key={
                    message.sessionId
                      ? `${message.sessionId}-${message.timestamp}`
                      : index
                  }
                  className={`message ${
                    message.sender === "USER" ? "user-message" : "bot-message"
                  }`}
                >
                  <Typography
                    variant="body1"
                    className={
                      message.sender === "USER" ? "user-name" : "ai-name"
                    }
                  >
                    {message.sender === "USER"
                      ? userInfo?.username || "User"
                      : "AI Assistant"}
                  </Typography>
                  <div className="markdown">
                    <ReactMarkdown
                      rehypePlugins={[rehypeRaw]}
                      // remarkPlugins={[remarkGfm]} // Commented out until package is installed
                      components={
                        {
                          code({ className, children, ...props }) {
                            const match = /language-(\w+)/.exec(
                              className || ""
                            );
                            const lang = match && match[1];
                            const content = String(children).replace(
                              /\\n$/,
                              ""
                            );

                            // Handle inline code safely
                            const nodeData = props.node as unknown as {
                              tagName: string;
                              parentElement?: { tagName: string };
                            };

                            if (
                              nodeData?.tagName === "code" &&
                              nodeData?.parentElement?.tagName !== "pre"
                            ) {
                              return (
                                <code className={className} {...props}>
                                  {children}
                                </code>
                              );
                            }

                            // Mermaid diagram (fenced code block)
                            if (lang === "mermaid") {
                              console.log(
                                "Rendering Mermaid from code block:",
                                content.substring(0, 50) + "..."
                              );
                              return (
                                <div className="diagram-container">
                                  <DiagramViewer mermaidContent={content} />
                                </div>
                              );
                            }

                            // Combined Mermaid and ReactFlow diagram (fenced code block, deprecated but keep for compatibility)
                            if (lang === "diagram") {
                              console.log(
                                "Rendering combined diagram from 'diagram' code block:",
                                content.substring(0, 50) + "..."
                              );
                              try {
                                // Handle both formats:
                                // 1. <diagram mermaid='...' reactflow='...' /> (inside code block - less ideal)
                                // 2. Mermaid content with JSON ReactFlow data separated

                                let mermaidContent = "";
                                let reactFlowContent;
                                const processedContent = content;

                                // Format 1: Check for HTML-like attributes inside the code block content
                                const mermaidAttrMatch = processedContent.match(
                                  /mermaid=(['"])([\\s\\S]*?)\\1/ // Use [\s\S]*? for multiline content
                                );
                                if (mermaidAttrMatch && mermaidAttrMatch[2]) {
                                  mermaidContent = mermaidAttrMatch[2];
                                }

                                const reactFlowAttrMatch =
                                  processedContent.match(
                                    /reactflow=(['"])([\\s\\S]*?)\\1/
                                  );
                                if (
                                  reactFlowAttrMatch &&
                                  reactFlowAttrMatch[2]
                                ) {
                                  reactFlowContent = reactFlowAttrMatch[2];
                                }

                                // Format 2: Look for nodes and edges directly in JSON format
                                const nodesMatch = processedContent.match(
                                  /nodes=(['"])([\\s\\S]*?)\\1/
                                );
                                const edgesMatch = processedContent.match(
                                  /edges=(['"])([\\s\\S]*?)\\1/
                                );

                                if (nodesMatch && edgesMatch) {
                                  const flowData = {
                                    nodes: JSON.parse(nodesMatch[2]), // Parse the JSON string
                                    edges: JSON.parse(edgesMatch[2]) // Parse the JSON string
                                  };
                                  reactFlowContent = JSON.stringify(flowData);

                                  // If we don't have mermaid content, extract it from the beginning
                                  if (!mermaidContent) {
                                    const contentBeforeNodes =
                                      processedContent.split("nodes=")[0];
                                    if (contentBeforeNodes) {
                                      mermaidContent =
                                        contentBeforeNodes.trim();
                                    }
                                  }
                                }

                                // Format 3: Try standard split approach as fallback
                                if (!mermaidContent && !reactFlowContent) {
                                  const parts = processedContent.split(
                                    "---REACTFLOW_DATA---"
                                  );
                                  if (parts.length > 0) {
                                    mermaidContent = parts[0].trim();
                                    reactFlowContent =
                                      parts.length > 1
                                        ? parts[1].trim()
                                        : undefined;
                                  }
                                }

                                // If we still don't have mermaid content, use the whole content
                                if (!mermaidContent) {
                                  mermaidContent = processedContent;
                                }

                                console.log("Parsed 'diagram' code block:", {
                                  mermaidContent:
                                    mermaidContent.substring(0, 50) + "...",
                                  hasReactFlow: !!reactFlowContent
                                });

                                return (
                                  <div className="diagram-container prominent-toolbar">
                                    <DiagramViewer
                                      mermaidContent={mermaidContent}
                                      reactFlowContent={reactFlowContent}
                                    />
                                  </div>
                                );
                              } catch (err) {
                                console.error(
                                  "Failed to parse 'diagram' code block data:",
                                  err
                                );
                                return (
                                  <div className="diagram-error">
                                    Invalid diagram format in code block
                                    <pre>{content}</pre>
                                  </div>
                                );
                              }
                            }

                            // Regular code block
                            return (
                              <SyntaxHighlighter
                                language={lang}
                                style={dracula}
                                wrapLongLines={true}
                                PreTag="div"
                                {...props}
                              >
                                {content}
                              </SyntaxHighlighter>
                            );
                          },
                          // **** ADDED DIAGRAM HANDLER ****
                          diagram({ ...props }) {
                            // Extract attributes from the custom <diagram> tag
                            const mermaidContent = props["mermaid"] || "";
                            const reactFlowContent =
                              props["reactflow"] || undefined;

                            console.log("Rendering <diagram> tag:", {
                              mermaidContent:
                                mermaidContent.substring(0, 50) + "...",
                              hasReactFlow: !!reactFlowContent
                            });

                            if (!mermaidContent) {
                              console.warn(
                                "Diagram tag found but missing 'mermaid' attribute."
                              );
                              return (
                                <div className="diagram-error">
                                  Invalid diagram: Missing Mermaid data.
                                </div>
                              );
                            }

                            return (
                              <div className="diagram-container prominent-toolbar">
                                <DiagramViewer
                                  mermaidContent={mermaidContent}
                                  reactFlowContent={reactFlowContent}
                                />
                              </div>
                            );
                          },
                          // **** END ADDED DIAGRAM HANDLER ****
                          table({ children, ...props }) {
                            return (
                              <div className="table-responsive">
                                <table className="markdown-table" {...props}>
                                  {children}
                                </table>
                              </div>
                            );
                          },
                          thead({ children, ...props }) {
                            return (
                              <thead className="markdown-thead" {...props}>
                                {children}
                              </thead>
                            );
                          },
                          tbody({ children, ...props }) {
                            return (
                              <tbody className="markdown-tbody" {...props}>
                                {children}
                              </tbody>
                            );
                          },
                          tr({ children, ...props }) {
                            return (
                              <tr className="markdown-tr" {...props}>
                                {children}
                              </tr>
                            );
                          },
                          th({ children, ...props }) {
                            return (
                              <th className="markdown-th" {...props}>
                                {children}
                              </th>
                            );
                          },
                          td({ children, ...props }) {
                            return (
                              <td className="markdown-td" {...props}>
                                {children}
                              </td>
                            );
                          }
                        } as Components
                      }
                    >
                      {preprocessMarkdown(message.content)}
                    </ReactMarkdown>
                  </div>
                  {message.timestamp && (
                    <Typography variant="caption" className="message-timestamp">
                      {formatTimestamp(message.timestamp)}
                    </Typography>
                  )}
                </Box>
              ))}
              {aiThinking && (
                <Box className="loading-message">
                  <CircularProgress size={20} />
                  <Typography variant="body1">AI is thinking...</Typography>
                </Box>
              )}
              <div ref={messagesEndRef} />
            </Box>
          )}
        </Box>
        {showScrollButton && (
          <Fab
            className="scroll-down-button"
            color="default"
            size="large"
            onClick={scrollToBottom}
          >
            <KeyboardArrowDown />
          </Fab>
        )}
        <Box className="input-container" style={{ position: "relative" }}>
          <TextField
            fullWidth
            multiline
            className="message-input"
            maxRows={4}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type your message here..."
            variant="outlined"
            disabled={aiThinking}
          />

          <Button
            className="send-button"
            variant="contained"
            onClick={handleSendMessage}
            disabled={!input.trim() || aiThinking}
          >
            <PlayCircleOutlined fontSize="large" />
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default AssistantAI;
