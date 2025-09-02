import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { AssetManager } from "./AssetManager";
import { TradingEngine } from "./TradingEngine";
import { VaultManager } from "./VaultManager";
import { Wallet } from "./Wallet";
import {
  CollectFiConfig,
  CollectibleAsset,
  UserPortfolio,
  TradingOrder,
  MarketData,
  PlatformStats,
  CollectFiError,
  CollectFiEvent,
} from "../types";

/**
 * Main CollectFi platform class that orchestrates all functionality
 * for fractionalized collectibles trading on Solana
 */
export class CollectFi {
  private connection: Connection;
  private config: CollectFiConfig;
  private assetManager: AssetManager;
  private tradingEngine: TradingEngine;
  private vaultManager: VaultManager;
  private wallet: Wallet;

  constructor(connection: Connection, config: CollectFiConfig) {
    this.connection = connection;
    this.config = config;

    // Initialize core managers
    this.assetManager = new AssetManager(connection, config);
    this.tradingEngine = new TradingEngine(connection, config);
    this.vaultManager = new VaultManager(connection, config);
    this.wallet = new Wallet(connection);
  }

  /**
   * Initialize the CollectFi platform
   */
  async initialize(): Promise<void> {
    try {
      // Initialize all managers
      await Promise.all([
        this.assetManager.initialize(),
        this.tradingEngine.initialize(),
        this.vaultManager.initialize(),
      ]);

      console.log("CollectFi platform initialized successfully");
    } catch (error) {
      throw new CollectFiError(
        "Failed to initialize CollectFi platform",
        "INITIALIZATION_ERROR",
        error
      );
    }
  }

  /**
   * Get all available collectible assets
   */
  async getAvailableAssets(): Promise<CollectibleAsset[]> {
    return this.assetManager.getAvailableAssets();
  }

  /**
   * Get asset by mint address
   */
  async getAssetByMint(mint: string): Promise<CollectibleAsset | null> {
    return this.assetManager.getAssetByMint(mint);
  }

  /**
   * Get asset by ID
   */
  async getAssetById(id: string): Promise<CollectibleAsset | null> {
    return this.assetManager.getAssetById(id);
  }

  /**
   * Get market data for an asset
   */
  async getMarketData(assetMint: string): Promise<MarketData | null> {
    return this.tradingEngine.getMarketData(assetMint);
  }

  /**
   * Get user portfolio
   */
  async getUserPortfolio(walletAddress: string): Promise<UserPortfolio | null> {
    return this.tradingEngine.getUserPortfolio(walletAddress);
  }

  /**
   * Buy tokens for a collectible asset
   */
  async buyTokens(
    assetMint: string,
    quantity: number,
    maxPrice?: number
  ): Promise<Transaction> {
    if (!this.wallet.isConnected()) {
      throw new CollectFiError("Wallet not connected", "WALLET_NOT_CONNECTED");
    }

    return this.tradingEngine.buyTokens(
      assetMint,
      quantity,
      this.wallet.getPublicKey()!,
      maxPrice
    );
  }

  /**
   * Sell tokens for a collectible asset
   */
  async sellTokens(
    assetMint: string,
    quantity: number,
    minPrice?: number
  ): Promise<Transaction> {
    if (!this.wallet.isConnected()) {
      throw new CollectFiError("Wallet not connected", "WALLET_NOT_CONNECTED");
    }

    return this.tradingEngine.sellTokens(
      assetMint,
      quantity,
      this.wallet.getPublicKey()!,
      minPrice
    );
  }

  /**
   * Place a limit order
   */
  async placeLimitOrder(
    assetMint: string,
    side: "buy" | "sell",
    quantity: number,
    price: number
  ): Promise<string> {
    if (!this.wallet.isConnected()) {
      throw new CollectFiError("Wallet not connected", "WALLET_NOT_CONNECTED");
    }

    return this.tradingEngine.placeLimitOrder(
      assetMint,
      side,
      quantity,
      price,
      this.wallet.getPublicKey()!
    );
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string): Promise<boolean> {
    if (!this.wallet.isConnected()) {
      throw new CollectFiError("Wallet not connected", "WALLET_NOT_CONNECTED");
    }

    return this.tradingEngine.cancelOrder(orderId, this.wallet.getPublicKey()!);
  }

  /**
   * Get user's open orders
   */
  async getOpenOrders(walletAddress: string): Promise<TradingOrder[]> {
    return this.tradingEngine.getOpenOrders(walletAddress);
  }

  /**
   * Get trading history for an asset
   */
  async getTradingHistory(
    assetMint: string,
    limit: number = 100
  ): Promise<TradingOrder[]> {
    return this.tradingEngine.getTradingHistory(assetMint, limit);
  }

  /**
   * Get vault information for an asset
   */
  async getVaultInfo(assetId: string) {
    return this.vaultManager.getVaultInfo(assetId);
  }

  /**
   * Request redemption of physical asset
   */
  async requestRedemption(
    assetMint: string,
    shippingAddress: any
  ): Promise<string> {
    if (!this.wallet.isConnected()) {
      throw new CollectFiError("Wallet not connected", "WALLET_NOT_CONNECTED");
    }

    // Check if user has 100% of tokens
    const portfolio = await this.getUserPortfolio(
      this.wallet.getPublicKey()!.toString()
    );
    const asset = portfolio?.assets.find((a) => a.mint === assetMint);

    if (!asset || asset.quantity < 100000) {
      // Assuming 100,000 tokens per asset
      throw new CollectFiError(
        "Must own 100% of tokens to request redemption",
        "INSUFFICIENT_TOKENS_FOR_REDEMPTION"
      );
    }

    return this.vaultManager.requestRedemption(
      assetMint,
      this.wallet.getPublicKey()!,
      shippingAddress
    );
  }

  /**
   * Get platform statistics
   */
  async getPlatformStats(): Promise<PlatformStats> {
    const [assets, users, volume, marketCap, traders, redemptions] =
      await Promise.all([
        this.assetManager.getTotalAssets(),
        this.tradingEngine.getTotalUsers(),
        this.tradingEngine.getTotalVolume24h(),
        this.tradingEngine.getTotalMarketCap(),
        this.tradingEngine.getActiveTraders24h(),
        this.vaultManager.getTotalRedemptions(),
      ]);

    return {
      totalAssets: assets,
      totalUsers: users,
      totalVolume24h: volume,
      totalMarketCap: marketCap,
      activeTraders24h: traders,
      totalRedemptions: redemptions,
    };
  }

  /**
   * Get wallet instance
   */
  getWallet(): Wallet {
    return this.wallet;
  }

  /**
   * Get connection instance
   */
  getConnection(): Connection {
    return this.connection;
  }

  /**
   * Get configuration
   */
  getConfig(): CollectFiConfig {
    return this.config;
  }

  /**
   * Subscribe to platform events
   */
  subscribeToEvents(callback: (event: CollectFiEvent) => void): () => void {
    // Implementation for event subscription
    // This would integrate with Solana webhook system or similar
    return () => {
      // Unsubscribe logic
    };
  }

  /**
   * Get asset price history
   */
  async getAssetPriceHistory(
    assetMint: string,
    timeframe: "1h" | "24h" | "7d" | "30d" | "1y"
  ) {
    return this.assetManager.getPriceHistory(assetMint, timeframe);
  }

  /**
   * Search assets by criteria
   */
  async searchAssets(criteria: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    rarity?: string;
    condition?: string;
    year?: number;
  }) {
    return this.assetManager.searchAssets(criteria);
  }

  /**
   * Get trending assets
   */
  async getTrendingAssets(limit: number = 10) {
    return this.assetManager.getTrendingAssets(limit);
  }

  /**
   * Get user transaction history
   */
  async getUserTransactionHistory(walletAddress: string, limit: number = 50) {
    return this.tradingEngine.getUserTransactionHistory(walletAddress, limit);
  }
}
