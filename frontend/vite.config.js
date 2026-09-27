import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({

  plugins: [react()],

  server: {
    port: Number(process.env.VITE_PORT) || 5173,
    host: "0.0.0.0",
    allowedHosts: true,
    proxy: {
      "/api": {
        target: process.env.VITE_BACKEND_URL || "http://localhost:8001",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
        configure: (proxy, _options) => {
          proxy.on("error", (err, _req, res) => {
            console.error("Vite Proxy Error:", err.message);
            if (res && res.writeHead && !res.headersSent) {
              res.writeHead(503, {
                "Content-Type": "application/json",
              });
              res.end(JSON.stringify({ detail: "Backend service temporarily unavailable. Please retry in a few seconds." }));
            }
          });
        }
      }
    }
  }

});
