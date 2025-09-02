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
 * @route GET /api/trading/market-data
 * @desc Get market data for all assets
 * @access Public (with API key)
 */
router.get(
  "/market-data",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const assets = await collectFi.getAvailableAssets();
    const marketData = [];

    for (const asset of assets) {
      const data = await collectFi.getMarketData(asset.mint);
      if (data) {
        marketData.push(data);
      }
    }

    res.json({
      success: true,
      data: marketData,
      count: marketData.length,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @route GET /api/trading/market-data/:mint
 * @desc Get market data for specific asset
 * @access Public (with API key)
 */
router.get(
  "/market-data/:mint",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { mint } = req.params;

    const marketData = await collectFi.getMarketData(mint);

    if (!marketData) {
      return res.status(404).json({
        success: false,
        error: "Market data not found",
        message: `Market data for asset ${mint} not found`,
        code: "MARKET_DATA_NOT_FOUND",
      });
    }

    res.json({
      success: true,
      data: marketData,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @route GET /api/trading/history/:mint
 * @desc Get trading history for specific asset
 * @access Public (with API key)
 */
router.get(
  "/history/:mint",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { mint } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

    const tradingHistory = await collectFi.getTradingHistory(mint, limit);

    res.json({
      success: true,
      data: tradingHistory,
      count: tradingHistory.length,
      limit,
      assetMint: mint,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @route GET /api/trading/portfolio/:walletAddress
 * @desc Get user portfolio
 * @access Private (API key required)
 */
router.get(
  "/portfolio/:walletAddress",
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
 * @route GET /api/trading/orders/:walletAddress
 * @desc Get user open orders
 * @access Private (API key required)
 */
router.get(
  "/orders/:walletAddress",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { walletAddress } = req.params;

    // Check if user has permission to view these orders
    if (
      req.userId &&
      req.userId !== walletAddress &&
      !req.permissions?.includes("*")
    ) {
      return res.status(403).json({
        success: false,
        error: "Insufficient permissions",
        message: "You can only view your own orders",
        code: "INSUFFICIENT_PERMISSIONS",
      });
    }

    const openOrders = await collectFi.getOpenOrders(walletAddress);

    res.json({
      success: true,
      data: openOrders,
      count: openOrders.length,
      walletAddress,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @route POST /api/trading/place-order
 * @desc Place a new trading order
 * @access Private (API key required)
 */
router.post(
  "/place-order",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    // Check if user has trading permissions
    if (
      !req.permissions?.includes("*") &&
      !req.permissions?.includes("write:trading")
    ) {
      return res.status(403).json({
        success: false,
        error: "Insufficient permissions",
        message: "Trading permissions required",
        code: "INSUFFICIENT_PERMISSIONS",
      });
    }

    const { assetMint, side, quantity, price, type = "limit" } = req.body;

    // Validate required fields
    if (!assetMint || !side || !quantity || !price) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
        message: "assetMint, side, quantity, and price are required",
        code: "MISSING_REQUIRED_FIELDS",
      });
    }

    // Validate side
    if (!["buy", "sell"].includes(side)) {
      return res.status(400).json({
        success: false,
        error: "Invalid side",
        message: 'Side must be either "buy" or "sell"',
        code: "INVALID_SIDE",
      });
    }

    // Validate type
    if (!["market", "limit"].includes(type)) {
      return res.status(400).json({
        success: false,
        error: "Invalid order type",
        message: 'Type must be either "market" or "limit"',
        code: "INVALID_ORDER_TYPE",
      });
    }

    try {
      let orderId: string;

      if (type === "limit") {
        orderId = await collectFi.placeLimitOrder(
          assetMint,
          side,
          quantity,
          price
        );
      } else {
        // For market orders, we'll create a transaction
        const transaction =
          side === "buy"
            ? await collectFi.buyTokens(assetMint, quantity)
            : await collectFi.sellTokens(assetMint, quantity);

        orderId = `market_${Date.now()}_${Math.random()
          .toString(36)
          .substring(2, 9)}`;
      }

      res.status(201).json({
        success: true,
        data: { orderId, type, side, assetMint, quantity, price },
        message: `${type} order placed successfully`,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: "Order placement failed",
        message: error instanceof Error ? error.message : "Unknown error",
        code: "ORDER_PLACEMENT_FAILED",
      });
    }
  })
);

/**
 * @route DELETE /api/trading/orders/:orderId
 * @desc Cancel an order
 * @access Private (API key required)
 */
router.delete(
  "/orders/:orderId",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    // Check if user has trading permissions
    if (
      !req.permissions?.includes("*") &&
      !req.permissions?.includes("write:trading")
    ) {
      return res.status(403).json({
        success: false,
        error: "Insufficient permissions",
        message: "Trading permissions required",
        code: "INSUFFICIENT_PERMISSIONS",
      });
    }

    const { orderId } = req.params;

    try {
      const cancelled = await collectFi.cancelOrder(orderId);

      if (!cancelled) {
        return res.status(404).json({
          success: false,
          error: "Order not found",
          message: `Order ${orderId} not found or cannot be cancelled`,
          code: "ORDER_NOT_FOUND",
        });
      }

      res.json({
        success: true,
        data: { orderId },
        message: "Order cancelled successfully",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: "Order cancellation failed",
        message: error instanceof Error ? error.message : "Unknown error",
        code: "ORDER_CANCELLATION_FAILED",
      });
    }
  })
);

/**
 * @route GET /api/trading/stats
 * @desc Get platform trading statistics
 * @access Public (with API key)
 */
router.get(
  "/stats",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const platformStats = await collectFi.getPlatformStats();

    res.json({
      success: true,
      data: platformStats,
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;
