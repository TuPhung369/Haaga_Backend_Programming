import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['@splinetool/react-spline'],
  },
  server: {
    port: 3000,
    proxy: {
      "/identify_service": {
        target: "http://localhost:9095",
        changeOrigin: true,
        secure: false,
      },
      "/api/chat": {
        target: "http://localhost:9095",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/chat/, '/identify_service/api/chat')
      },
    },
  },
});

