import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import { CollectFi } from "./core/CollectFi";
import { Connection } from "@solana/web3.js";
import { DEFAULT_CONFIG } from "./config";
import { errorHandler } from "./middleware/errorHandler";
import { authMiddleware } from "./middleware/authMiddleware";
import { validateApiKey } from "./utils/apiKeyValidator";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
app.use(limiter);

// Initialize Solana connection
const connection = new Connection(DEFAULT_CONFIG.rpcEndpoint, "confirmed");
const collectFi = new CollectFi(connection, DEFAULT_CONFIG);

// Health check endpoint (no auth required)
app.get("/health", async (req, res) => {
  try {
    await collectFi.initialize();
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      service: "CollectFi API",
      version: "1.0.0",
      solana: {
        endpoint: DEFAULT_CONFIG.rpcEndpoint,
        network: DEFAULT_CONFIG.network,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "unhealthy",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// API key validation middleware for all protected routes
app.use("/api", authMiddleware);

// API Routes
app.use("/api/assets", require("./routes/assets"));
app.use("/api/trading", require("./routes/trading"));
app.use("/api/portfolio", require("./routes/portfolio"));
app.use("/api/vault", require("./routes/vault"));
app.use("/api/market", require("./routes/market"));

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    message: `The requested endpoint ${req.originalUrl} does not exist`,
    availableEndpoints: [
      "/health",
      "/api/assets",
      "/api/trading",
      "/api/portfolio",
      "/api/vault",
      "/api/market",
    ],
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 CollectFi API server running on port ${PORT}`);
  console.log(`📊 Health check available at http://localhost:${PORT}/health`);
  console.log(`🔑 API endpoints require valid API key`);
});

export default app;
