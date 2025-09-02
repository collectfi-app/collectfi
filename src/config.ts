import dotenv from "dotenv";

dotenv.config();

export const DEFAULT_CONFIG = {
  rpcEndpoint:
    process.env.SOLANA_RPC_ENDPOINT || "https://api.mainnet-beta.solana.com",
  network:
    (process.env.SOLANA_NETWORK as "mainnet-beta" | "testnet" | "devnet") ||
    "mainnet-beta",
  programId:
    process.env.COLLECTFI_PROGRAM_ID ||
    "CollectFiProgram111111111111111111111111111",
  feeAccount:
    process.env.COLLECTFI_FEE_ACCOUNT ||
    "CollectFiFeeAccount111111111111111111111111",
  vaultAddress:
    process.env.COLLECTFI_VAULT_ADDRESS ||
    "CollectFiVault111111111111111111111111111",
  insuranceProvider: process.env.INSURANCE_PROVIDER || "Lloyd's of London",
  apiKeyHeader: process.env.API_KEY_HEADER || "X-API-Key",
  maxRequestsPerMinute: parseInt(process.env.MAX_REQUESTS_PER_MINUTE || "100"),
  corsOrigin: process.env.CORS_ORIGIN || "*",
  port: parseInt(process.env.PORT || "3000"),
  environment: process.env.NODE_ENV || "development",
};

export const API_ENDPOINTS = {
  ASSETS: "/api/assets",
  TRADING: "/api/trading",
  PORTFOLIO: "/api/portfolio",
  VAULT: "/api/vault",
  MARKET: "/api/market",
};

export const RATE_LIMITS = {
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: 100,
  SKIP_SUCCESSFUL_REQUESTS: false,
  SKIP_FAILED_REQUESTS: false,
};

export const SECURITY_CONFIG = {
  JWT_SECRET: process.env.JWT_SECRET || "your-secret-key",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "24h",
  BCRYPT_ROUNDS: 12,
  SESSION_SECRET: process.env.SESSION_SECRET || "your-session-secret",
};
