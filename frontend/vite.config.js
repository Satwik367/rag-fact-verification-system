import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Defaults to localhost for normal local dev; Docker Compose overrides
// this with the backend service name (e.g. http://backend:5000).
const backendTarget = process.env.VITE_BACKEND_URL || "http://localhost:5000";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // needed so the dev server is reachable from outside a Docker container
    port: 5173,
    proxy: {
      "/api": backendTarget,
    },
  },
});