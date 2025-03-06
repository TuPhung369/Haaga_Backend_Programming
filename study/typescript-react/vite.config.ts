import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      "/identify_service": {
        target: "http://localhost:9095",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});

