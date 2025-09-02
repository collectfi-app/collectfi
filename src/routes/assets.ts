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
 * @route GET /api/assets
 * @desc Get all available collectible assets
 * @access Public (with API key)
 */
router.get(
  "/",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const assets = await collectFi.getAvailableAssets();

    res.json({
      success: true,
      data: assets,
      count: assets.length,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @route GET /api/assets/:id
 * @desc Get asset by ID
 * @access Public (with API key)
 */
router.get(
  "/:id",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;

    const asset = await collectFi.getAssetById(id);

    if (!asset) {
      return res.status(404).json({
        success: false,
        error: "Asset not found",
        message: `Asset with ID ${id} not found`,
        code: "ASSET_NOT_FOUND",
      });
    }

    res.json({
      success: true,
      data: asset,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @route GET /api/assets/mint/:mint
 * @desc Get asset by mint address
 * @access Public (with API key)
 */
router.get(
  "/mint/:mint",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { mint } = req.params;

    const asset = await collectFi.getAssetByMint(mint);

    if (!asset) {
      return res.status(404).json({
        success: false,
        error: "Asset not found",
        message: `Asset with mint address ${mint} not found`,
        code: "ASSET_NOT_FOUND",
      });
    }

    res.json({
      success: true,
      data: asset,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @route GET /api/assets/search
 * @desc Search assets by criteria
 * @access Public (with API key)
 */
router.get(
  "/search",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const {
      category,
      minPrice,
      maxPrice,
      rarity,
      condition,
      year,
      manufacturer,
    } = req.query;

    const searchCriteria: any = {};

    if (category) searchCriteria.category = category;
    if (minPrice) searchCriteria.minPrice = parseFloat(minPrice as string);
    if (maxPrice) searchCriteria.maxPrice = parseFloat(maxPrice as string);
    if (rarity) searchCriteria.rarity = rarity;
    if (condition) searchCriteria.condition = condition;
    if (year) searchCriteria.year = parseInt(year as string);
    if (manufacturer) searchCriteria.manufacturer = manufacturer;

    const results = await collectFi.searchAssets(searchCriteria);

    res.json({
      success: true,
      data: results,
      count: results.length,
      criteria: searchCriteria,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @route GET /api/assets/trending
 * @desc Get trending assets
 * @access Public (with API key)
 */
router.get(
  "/trending",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    const trendingAssets = await collectFi.getTrendingAssets(limit);

    res.json({
      success: true,
      data: trendingAssets,
      count: trendingAssets.length,
      limit,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @route GET /api/assets/:id/price-history
 * @desc Get asset price history
 * @access Public (with API key)
 */
router.get(
  "/:id/price-history",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const { timeframe = "7d" } = req.query;

    // Get asset first to get the mint address
    const asset = await collectFi.getAssetById(id);

    if (!asset) {
      return res.status(404).json({
        success: false,
        error: "Asset not found",
        message: `Asset with ID ${id} not found`,
        code: "ASSET_NOT_FOUND",
      });
    }

    const priceHistory = await collectFi.getAssetPriceHistory(
      asset.mint,
      timeframe as any
    );

    res.json({
      success: true,
      data: {
        assetId: id,
        assetName: asset.name,
        timeframe,
        priceHistory,
        count: priceHistory.length,
      },
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @route GET /api/assets/:id/vault-info
 * @desc Get vault information for an asset
 * @access Public (with API key)
 */
router.get(
  "/:id/vault-info",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;

    const vaultInfo = await collectFi.getVaultInfo(id);

    if (!vaultInfo) {
      return res.status(404).json({
        success: false,
        error: "Vault info not found",
        message: `Vault information for asset ${id} not found`,
        code: "VAULT_INFO_NOT_FOUND",
      });
    }

    res.json({
      success: true,
      data: vaultInfo,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @route POST /api/assets
 * @desc Add new asset (Admin only)
 * @access Private (Admin API key required)
 */
router.post(
  "/",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    // Check if user has admin permissions
    if (
      !req.permissions?.includes("*") &&
      !req.permissions?.includes("admin:assets")
    ) {
      return res.status(403).json({
        success: false,
        error: "Insufficient permissions",
        message: "Admin permissions required to add assets",
        code: "INSUFFICIENT_PERMISSIONS",
      });
    }

    const assetData = req.body;

    // Validate required fields
    const requiredFields = [
      "name",
      "description",
      "category",
      "mint",
      "totalSupply",
      "currentPrice",
    ];
    for (const field of requiredFields) {
      if (!assetData[field]) {
        return res.status(400).json({
          success: false,
          error: "Missing required field",
          message: `Field ${field} is required`,
          code: "MISSING_REQUIRED_FIELD",
        });
      }
    }

    // Add asset using AssetManager
    const assetId = await collectFi.assetManager.addAsset(assetData);

    res.status(201).json({
      success: true,
      data: { assetId },
      message: "Asset added successfully",
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;
