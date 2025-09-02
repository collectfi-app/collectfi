import express from 'express';
import { CollectFi } from '../core/CollectFi';
import { Connection } from '@solana/web3.js';
import { DEFAULT_CONFIG } from '../config';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

const router = express.Router();

// Initialize CollectFi instance
const connection = new Connection(DEFAULT_CONFIG.rpcEndpoint, 'confirmed');
const collectFi = new CollectFi(connection, DEFAULT_CONFIG);

// Initialize the platform
collectFi.initialize().catch(console.error);

/**
 * @route GET /api/market/overview
 * @desc Get market overview and statistics
 * @access Public (with API key)
 */
router.get('/overview', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const platformStats = await collectFi.getPlatformStats();
  
  // Get trending assets
  const trendingAssets = await collectFi.getTrendingAssets(5);
  
  // Get market data for all assets
  const assets = await collectFi.getAvailableAssets();
  const marketData = [];
  
  for (const asset of assets) {
    const data = await collectFi.getMarketData(asset.mint);
    if (data) {
      marketData.push(data);
    }
  }
  
  const marketOverview = {
    platformStats,
    trendingAssets,
    marketData,
    totalAssets: assets.length,
    totalMarketCap: marketData.reduce((sum, data) => sum + data.marketCap, 0),
    totalVolume24h: marketData.reduce((sum, data) => sum + data.volume24h, 0),
    averagePriceChange24h: marketData.reduce((sum, data) => sum + data.priceChangePercentage24h, 0) / marketData.length
  };
  
  res.json({
    success: true,
    data: marketOverview,
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route GET /api/market/trending
 * @desc Get trending assets
 * @access Public (with API key)
 */
router.get('/trending', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
  
  const trendingAssets = await collectFi.getTrendingAssets(limit);
  
  res.json({
    success: true,
    data: trendingAssets,
    count: trendingAssets.length,
    limit,
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route GET /api/market/price-changes
 * @desc Get price changes for all assets
 * @access Public (with API key)
 */
router.get('/price-changes', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { timeframe = '24h' } = req.query;
  
  const assets = await collectFi.getAvailableAssets();
  const priceChanges = [];
  
  for (const asset of assets) {
    const priceHistory = await collectFi.getAssetPriceHistory(asset.mint, timeframe as any);
    
    if (priceHistory.length >= 2) {
      const oldestPrice = priceHistory[0].price;
      const newestPrice = priceHistory[priceHistory.length - 1].price;
      const change = newestPrice - oldestPrice;
      const changePercent = (change / oldestPrice) * 100;
      
      priceChanges.push({
        assetId: asset.id,
        assetName: asset.name,
        mint: asset.mint,
        oldPrice: oldestPrice,
        newPrice: newestPrice,
        change,
        changePercent,
        timeframe
      });
    }
  }
  
  // Sort by absolute change percentage
  priceChanges.sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent));
  
  res.json({
    success: true,
    data: priceChanges,
    count: priceChanges.length,
    timeframe,
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route GET /api/market/volume-leaders
 * @desc Get assets with highest trading volume
 * @access Public (with API key)
 */
router.get('/volume-leaders', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { limit = 10 } = req.query;
  
  const assets = await collectFi.getAvailableAssets();
  const volumeData = [];
  
  for (const asset of assets) {
    const marketData = await collectFi.getMarketData(asset.mint);
    if (marketData) {
      volumeData.push({
        assetId: asset.id,
        assetName: asset.name,
        mint: asset.mint,
        volume24h: marketData.volume24h,
        currentPrice: marketData.currentPrice,
        priceChange24h: marketData.priceChangePercentage24h
      });
    }
  }
  
  // Sort by volume
  volumeData.sort((a, b) => b.volume24h - a.volume24h);
  
  res.json({
    success: true,
    data: volumeData.slice(0, parseInt(limit as string)),
    count: Math.min(volumeData.length, parseInt(limit as string)),
    limit: parseInt(limit as string),
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route GET /api/market/gainers-losers
 * @desc Get top gainers and losers
 * @access Public (with API key)
 */
router.get('/gainers-losers', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { limit = 5 } = req.query;
  
  const assets = await collectFi.getAvailableAssets();
  const gainers = [];
  const losers = [];
  
  for (const asset of assets) {
    const marketData = await collectFi.getMarketData(asset.mint);
    if (marketData) {
      const assetData = {
        assetId: asset.id,
        assetName: asset.name,
        mint: asset.mint,
        currentPrice: marketData.currentPrice,
        priceChange24h: marketData.priceChange24h,
        priceChangePercentage24h: marketData.priceChangePercentage24h,
        volume24h: marketData.volume24h
      };
      
      if (marketData.priceChangePercentage24h > 0) {
        gainers.push(assetData);
      } else if (marketData.priceChangePercentage24h < 0) {
        losers.push(assetData);
      }
    }
  }
  
  // Sort gainers by percentage gain, losers by percentage loss
  gainers.sort((a, b) => b.priceChangePercentage24h - a.priceChangePercentage24h);
  losers.sort((a, b) => a.priceChangePercentage24h - b.priceChangePercentage24h);
  
  res.json({
    success: true,
    data: {
      gainers: gainers.slice(0, parseInt(limit as string)),
      losers: losers.slice(0, parseInt(limit as string))
    },
    count: {
      gainers: Math.min(gainers.length, parseInt(limit as string)),
      losers: Math.min(losers.length, parseInt(limit as string))
    },
    limit: parseInt(limit as string),
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route GET /api/market/analytics
 * @desc Get market analytics and insights
 * @access Public (with API key)
 */
router.get('/analytics', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const platformStats = await collectFi.getPlatformStats();
  const assets = await collectFi.getAvailableAssets();
  
  // Calculate market analytics
  const totalMarketCap = platformStats.totalMarketCap;
  const totalVolume24h = platformStats.totalVolume24h;
  const activeTraders = platformStats.activeTraders24h;
  
  // Calculate market sentiment (simplified)
  let bullishAssets = 0;
  let bearishAssets = 0;
  
  for (const asset of assets) {
    const marketData = await collectFi.getMarketData(asset.mint);
    if (marketData) {
      if (marketData.priceChangePercentage24h > 0) {
        bullishAssets++;
      } else if (marketData.priceChangePercentage24h < 0) {
        bearishAssets++;
      }
    }
  }
  
  const marketSentiment = bullishAssets > bearishAssets ? 'bullish' : 
                         bearishAssets > bullishAssets ? 'bearish' : 'neutral';
  
  const analytics = {
    marketCap: {
      total: totalMarketCap,
      average: totalMarketCap / assets.length,
      trend: 'stable' // Simplified
    },
    volume: {
      total24h: totalVolume24h,
      averagePerAsset: totalVolume24h / assets.length,
      trend: 'increasing' // Simplified
    },
    traders: {
      active24h: activeTraders,
      averageVolumePerTrader: totalVolume24h / activeTraders
    },
    sentiment: {
      overall: marketSentiment,
      bullishAssets,
      bearishAssets,
      neutralAssets: assets.length - bullishAssets - bearishAssets
    },
    assets: {
      total: assets.length,
      byCategory: assets.reduce((acc, asset) => {
        acc[asset.category] = (acc[asset.category] || 0) + 1;
        return acc;
      }, {} as any)
    }
  };
  
  res.json({
    success: true,
    data: analytics,
    timestamp: new Date().toISOString()
  });
}));

export default router;
