import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ["@splinetool/react-spline"],
  },
  resolve: {
    alias: {
      // Polyfills for Node.js modules
      stream: "stream-browserify",
      buffer: "buffer",
    },
  },
  define: {
    // Polyfills for Node.js globals
    global: "window",
    process: {
      env: {},
    },
  },
  server: {
    port: 3000,
    proxy: {
      // Speech processing endpoints - Python server on port 8008
      "/api/speech-to-text": {
        target: "http://localhost:8008",
        changeOrigin: true,
        secure: false,
      },
      "/api/text-to-speech": {
        target: "http://localhost:8008",
        changeOrigin: true,
        secure: false,
      },
      // Ensure WebSocket connections work properly
      "/ws": {
        target: "ws://localhost:8008",
        ws: true,
        changeOrigin: true,
        secure: false,
      },
      // WebSocket for chat
      "/identify_service/ws-messaging": {
        target: "ws://localhost:9095",
        ws: true,
        changeOrigin: true,
        secure: false,
        headers: {
          Origin: "http://localhost:3000",
          "Access-Control-Allow-Origin": "*",
        },
      },
      "/identify_service/ws-messaging/**": {
        target: "ws://localhost:9095",
        ws: true,
        changeOrigin: true,
        secure: false,
      },
      // Add specific endpoint for audio format conversion
      "/api/convert-audio": {
        target: "http://localhost:8008",
        changeOrigin: true,
        secure: false,
      },
      // All other endpoints - Spring Boot on port 9095
      "/identify_service": {
        target: "http://localhost:9095",
        changeOrigin: true,
        secure: false,
      },
      "/api/chat": {
        target: "http://localhost:9095",
        changeOrigin: true,
        secure: false,
        rewrite: (path) =>
          path.replace(/^\/api\/chat/, "/identify_service/api/chat"),
      },
      "/api/assistant": {
        target: "http://localhost:9095",
        changeOrigin: true,
        secure: false,
        rewrite: (path) =>
          path.replace(/^\/api\/assistant/, "/identify_service/api/assistant"),
      },
      // Language AI endpoints should continue using Spring Boot
      "/api/language-ai": {
        target: "http://localhost:9095",
        changeOrigin: true,
        secure: false,
        rewrite: (path) =>
          path.replace(
            /^\/api\/language-ai/,
            "/identify_service/api/language-ai"
          ),
      },
      // Notification endpoints
      "/api/notifications": {
        target: "http://localhost:9095",
        changeOrigin: true,
        secure: false,
        rewrite: (path) =>
          path.replace(
            /^\/api\/notifications/,
            "/identify_service/api/notifications"
          ),
      },
    },
  },
});

