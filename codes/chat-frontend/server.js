const express = require("express");
const cors = require("cors");
const { createProxyMiddleware } = require("http-proxy-middleware");
const path = require("path");

const app = express();
const PORT = 3000;

// Enable CORS for all routes
app.use(cors());

// Parse JSON body
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname)));

// Proxy API requests to n8n
app.use(
  "/api/chat",
  createProxyMiddleware({
    target: "http://localhost:5678",
    changeOrigin: true,
    pathRewrite: {
      "^/api/chat": "/webhook/c1784e69-2d89-45fb-b47d-dd13dddcf31e/chat"
    },
    logLevel: "debug",
    onProxyReq: (proxyReq, req, res) => {
      // For POST requests, write the JSON body to the proxied request
      if (req.method === "POST" && req.body) {
        const bodyData = JSON.stringify(req.body);
        console.log("Sending to n8n:", bodyData);
        // Update header content-type and content-length
        proxyReq.setHeader("Content-Type", "application/json");
        proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData));
        // Write body to request
        proxyReq.write(bodyData);
      }
      console.log(
        `Proxying ${proxyReq.method} request to: ${proxyReq.path} with headers:`,
        proxyReq.getHeaders()
      );
    },
    onProxyRes: (proxyRes, req, res) => {
      console.log("Response from n8n status:", proxyRes.statusCode);
      let responseBody = "";
      proxyRes.on("data", (chunk) => {
        responseBody += chunk;
      });
      proxyRes.on("end", () => {
        try {
          console.log("Response from n8n:", responseBody);
        } catch (e) {
          console.log("Raw response:", responseBody);
        }
      });
    },
    onError: (err, req, res) => {
      console.error("Proxy error:", err);
      res.status(500).json({
        error: "Proxy error",
        message: err.message,
        details: err.stack
      });
    }
  })
);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Express error:", err);
  res.status(500).json({
    error: "Server error",
    message: err.message
  });
});

// Serve the main HTML file for all other routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Chat interface: http://localhost:${PORT}`);
  console.log(`API endpoint: http://localhost:${PORT}/api/chat`);
});
