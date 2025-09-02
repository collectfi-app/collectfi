import express from "express";
import { CollectFi } from "../core/CollectFi";
import { Connection } from "@solana/web3.js";
import { DEFAULT_CONFIG } from "../config";
import { asyncHandler } from "../middleware/errorHandler";
import { AuthenticatedRequest } from "../middleware/authMiddleware";

const router = express.Router();

// Initialize CollectFi instance
const connection = new Connection(DEFAULT_CONFIG.rpcEndpoint, "confirmed");
const collectFi = new CollectFi(connection, DEFAULT_CONFIG);

// Initialize the platform
collectFi.initialize().catch(console.error);

/**
 * @route GET /api/portfolio/:walletAddress
 * @desc Get user portfolio
 * @access Private (API key required)
 */
router.get(
  "/:walletAddress",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { walletAddress } = req.params;

    // Check if user has permission to view this portfolio
    if (
      req.userId &&
      req.userId !== walletAddress &&
      !req.permissions?.includes("*")
    ) {
      return res.status(403).json({
        success: false,
        error: "Insufficient permissions",
        message: "You can only view your own portfolio",
        code: "INSUFFICIENT_PERMISSIONS",
      });
    }

    const portfolio = await collectFi.getUserPortfolio(walletAddress);

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        error: "Portfolio not found",
        message: `Portfolio for wallet ${walletAddress} not found`,
        code: "PORTFOLIO_NOT_FOUND",
      });
    }

    res.json({
      success: true,
      data: portfolio,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @route GET /api/portfolio/:walletAddress/transactions
 * @desc Get user transaction history
 * @access Private (API key required)
 */
router.get(
  "/:walletAddress/transactions",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { walletAddress } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

    // Check if user has permission to view this transaction history
    if (
      req.userId &&
      req.userId !== walletAddress &&
      !req.permissions?.includes("*")
    ) {
      return res.status(403).json({
        success: false,
        error: "Insufficient permissions",
        message: "You can only view your own transaction history",
        code: "INSUFFICIENT_PERMISSIONS",
      });
    }

    const transactions = await collectFi.getUserTransactionHistory(
      walletAddress,
      limit
    );

    res.json({
      success: true,
      data: transactions,
      count: transactions.length,
      limit,
      walletAddress,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @route GET /api/portfolio/:walletAddress/performance
 * @desc Get portfolio performance metrics
 * @access Private (API key required)
 */
router.get(
  "/:walletAddress/performance",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { walletAddress } = req.params;

    // Check if user has permission to view this portfolio
    if (
      req.userId &&
      req.userId !== walletAddress &&
      !req.permissions?.includes("*")
    ) {
      return res.status(403).json({
        success: false,
        error: "Insufficient permissions",
        message: "You can only view your own portfolio performance",
        code: "INSUFFICIENT_PERMISSIONS",
      });
    }

    const portfolio = await collectFi.getUserPortfolio(walletAddress);

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        error: "Portfolio not found",
        message: `Portfolio for wallet ${walletAddress} not found`,
        code: "PORTFOLIO_NOT_FOUND",
      });
    }

    // Calculate performance metrics
    const performance = {
      totalValue: portfolio.totalValue,
      totalValueUSD: portfolio.totalValueUSD,
      pnl24h: portfolio.pnl24h,
      pnl7d: portfolio.pnl7d,
      pnl30d: portfolio.pnl30d,
      assetCount: portfolio.assets.length,
      topPerformers: portfolio.assets
        .filter((asset) => asset.pnl > 0)
        .sort((a, b) => b.pnl - a.pnl)
        .slice(0, 3),
      worstPerformers: portfolio.assets
        .filter((asset) => asset.pnl < 0)
        .sort((a, b) => a.pnl - b.pnl)
        .slice(0, 3),
    };

    res.json({
      success: true,
      data: performance,
      walletAddress,
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;
