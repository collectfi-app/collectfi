import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  CollectFiConfig,
  TradingOrder,
  OrderType,
  OrderSide,
  OrderStatus,
  UserPortfolio,
  PortfolioAsset,
  MarketData,
  CollectFiError,
} from "../types";

/**
 * Handles all trading operations including order management, portfolio tracking,
 * and market data for the CollectFi platform
 */
export class TradingEngine {
  private connection: Connection;
  private config: CollectFiConfig;
  private orders: Map<string, TradingOrder> = new Map();
  private portfolios: Map<string, UserPortfolio> = new Map();
  private marketData: Map<string, MarketData> = new Map();

  constructor(connection: Connection, config: CollectFiConfig) {
    this.connection = connection;
    this.config = config;
  }

  /**
   * Initialize the trading engine
   */
  async initialize(): Promise<void> {
    try {
      // Initialize market data
      await this.initializeMarketData();
      console.log("TradingEngine initialized successfully");
    } catch (error) {
      throw new CollectFiError(
        "Failed to initialize TradingEngine",
        "TRADING_ENGINE_INIT_ERROR",
        error
      );
    }
  }

  /**
   * Initialize market data for available assets
   */
  private async initializeMarketData(): Promise<void> {
    // This would typically fetch from external sources or database
    // For MVP, we'll create sample data
    const sampleMarketData: MarketData[] = [
      {
        assetMint: "ROLEXDAYTONA1mintaddress123456789",
        currentPrice: 180,
        priceChange24h: 5.2,
        priceChangePercentage24h: 3.6,
        volume24h: 2800,
        marketCap: 18000000,
        circulatingSupply: 100000,
        totalSupply: 100000,
        high24h: 185,
        low24h: 175,
        lastUpdated: new Date(),
      },
      {
        assetMint: "ROLEXDAYTONA2mintaddress123456789",
        currentPrice: 175,
        priceChange24h: -2.1,
        priceChangePercentage24h: -1.4,
        volume24h: 2200,
        marketCap: 17500000,
        circulatingSupply: 100000,
        totalSupply: 100000,
        high24h: 178,
        low24h: 172,
        lastUpdated: new Date(),
      },
    ];

    sampleMarketData.forEach((data) => {
      this.marketData.set(data.assetMint, data);
    });
  }

  /**
   * Buy tokens for a collectible asset
   */
  async buyTokens(
    assetMint: string,
    quantity: number,
    buyerPublicKey: PublicKey,
    maxPrice?: number
  ): Promise<Transaction> {
    const transaction = new Transaction();

    // Get current market price
    const marketData = this.marketData.get(assetMint);
    if (!marketData) {
      throw new CollectFiError("Asset not found", "ASSET_NOT_FOUND");
    }

    const currentPrice = marketData.currentPrice;

    // Check if max price is exceeded
    if (maxPrice && currentPrice > maxPrice) {
      throw new CollectFiError(
        `Current price ${currentPrice} SOL exceeds maximum price ${maxPrice} SOL`,
        "PRICE_EXCEEDED"
      );
    }

    // Calculate total cost
    const totalCost = currentPrice * quantity;

    // Create buy instruction (this would be a real Solana instruction in production)
    const buyInstruction = this.createBuyInstruction(
      assetMint,
      quantity,
      buyerPublicKey,
      currentPrice
    );

    transaction.add(buyInstruction);

    // Update market data
    await this.updateMarketDataAfterTrade(
      assetMint,
      quantity,
      "buy",
      currentPrice
    );

    // Update user portfolio
    await this.updateUserPortfolio(
      buyerPublicKey.toString(),
      assetMint,
      quantity,
      currentPrice,
      "buy"
    );

    return transaction;
  }

  /**
   * Sell tokens for a collectible asset
   */
  async sellTokens(
    assetMint: string,
    quantity: number,
    sellerPublicKey: PublicKey,
    minPrice?: number
  ): Promise<Transaction> {
    const transaction = new Transaction();

    // Get current market price
    const marketData = this.marketData.get(assetMint);
    if (!marketData) {
      throw new CollectFiError("Asset not found", "ASSET_NOT_FOUND");
    }

    const currentPrice = marketData.currentPrice;

    // Check if min price is met
    if (minPrice && currentPrice < minPrice) {
      throw new CollectFiError(
        `Current price ${currentPrice} SOL is below minimum price ${minPrice} SOL`,
        "PRICE_TOO_LOW"
      );
    }

    // Check if user has enough tokens
    const portfolio = await this.getUserPortfolio(sellerPublicKey.toString());
    const asset = portfolio?.assets.find((a) => a.mint === assetMint);

    if (!asset || asset.quantity < quantity) {
      throw new CollectFiError(
        "Insufficient tokens to sell",
        "INSUFFICIENT_TOKENS"
      );
    }

    // Create sell instruction
    const sellInstruction = this.createSellInstruction(
      assetMint,
      quantity,
      sellerPublicKey,
      currentPrice
    );

    transaction.add(sellInstruction);

    // Update market data
    await this.updateMarketDataAfterTrade(
      assetMint,
      quantity,
      "sell",
      currentPrice
    );

    // Update user portfolio
    await this.updateUserPortfolio(
      sellerPublicKey.toString(),
      assetMint,
      quantity,
      currentPrice,
      "sell"
    );

    return transaction;
  }

  /**
   * Place a limit order
   */
  async placeLimitOrder(
    assetMint: string,
    side: "buy" | "sell",
    quantity: number,
    price: number,
    userPublicKey: PublicKey
  ): Promise<string> {
    const orderId = this.generateOrderId();

    const order: TradingOrder = {
      id: orderId,
      userId: userPublicKey.toString(),
      assetMint,
      type: OrderType.LIMIT,
      side: side === "buy" ? OrderSide.BUY : OrderSide.SELL,
      quantity,
      price,
      status: OrderStatus.PENDING,
      createdAt: new Date(),
    };

    this.orders.set(orderId, order);

    // In a real implementation, this would be added to an order book
    // and matched with existing orders

    return orderId;
  }

  /**
   * Cancel an order
   */
  async cancelOrder(
    orderId: string,
    userPublicKey: PublicKey
  ): Promise<boolean> {
    const order = this.orders.get(orderId);

    if (!order) {
      return false;
    }

    if (order.userId !== userPublicKey.toString()) {
      throw new CollectFiError(
        "Cannot cancel order from another user",
        "UNAUTHORIZED"
      );
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new CollectFiError(
        "Cannot cancel non-pending order",
        "ORDER_NOT_CANCELLABLE"
      );
    }

    order.status = OrderStatus.CANCELLED;
    this.orders.set(orderId, order);

    return true;
  }

  /**
   * Get user portfolio
   */
  async getUserPortfolio(walletAddress: string): Promise<UserPortfolio | null> {
    return this.portfolios.get(walletAddress) || null;
  }

  /**
   * Get open orders for a user
   */
  async getOpenOrders(walletAddress: string): Promise<TradingOrder[]> {
    return Array.from(this.orders.values()).filter(
      (order) =>
        order.userId === walletAddress && order.status === OrderStatus.PENDING
    );
  }

  /**
   * Get trading history for an asset
   */
  async getTradingHistory(
    assetMint: string,
    limit: number = 100
  ): Promise<TradingOrder[]> {
    return Array.from(this.orders.values())
      .filter(
        (order) =>
          order.assetMint === assetMint && order.status === OrderStatus.EXECUTED
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  /**
   * Get market data for an asset
   */
  async getMarketData(assetMint: string): Promise<MarketData | null> {
    return this.marketData.get(assetMint) || null;
  }

  /**
   * Get user transaction history
   */
  async getUserTransactionHistory(
    walletAddress: string,
    limit: number = 50
  ): Promise<TradingOrder[]> {
    return Array.from(this.orders.values())
      .filter((order) => order.userId === walletAddress)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  /**
   * Get total users count
   */
  async getTotalUsers(): Promise<number> {
    return this.portfolios.size;
  }

  /**
   * Get 24h total volume
   */
  async getTotalVolume24h(): Promise<number> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    let totalVolume = 0;

    for (const order of this.orders.values()) {
      if (
        order.status === OrderStatus.EXECUTED &&
        order.createdAt >= oneDayAgo
      ) {
        totalVolume += order.quantity * order.price;
      }
    }

    return totalVolume;
  }

  /**
   * Get total market cap
   */
  async getTotalMarketCap(): Promise<number> {
    let totalMarketCap = 0;

    for (const marketData of this.marketData.values()) {
      totalMarketCap += marketData.marketCap;
    }

    return totalMarketCap;
  }

  /**
   * Get active traders in last 24h
   */
  async getActiveTraders24h(): Promise<number> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const activeTraders = new Set<string>();

    for (const order of this.orders.values()) {
      if (order.createdAt >= oneDayAgo) {
        activeTraders.add(order.userId);
      }
    }

    return activeTraders.size;
  }

  /**
   * Create buy instruction (placeholder for real Solana instruction)
   */
  private createBuyInstruction(
    assetMint: string,
    quantity: number,
    buyerPublicKey: PublicKey,
    price: number
  ): TransactionInstruction {
    // This would be a real Solana instruction in production
    // For now, return a placeholder
    return new TransactionInstruction({
      keys: [],
      programId: new PublicKey(this.config.programId),
      data: Buffer.from([]),
    });
  }

  /**
   * Create sell instruction (placeholder for real Solana instruction)
   */
  private createSellInstruction(
    assetMint: string,
    quantity: number,
    sellerPublicKey: PublicKey,
    price: number
  ): TransactionInstruction {
    // This would be a real Solana instruction in production
    // For now, return a placeholder
    return new TransactionInstruction({
      keys: [],
      programId: new PublicKey(this.config.programId),
      data: Buffer.from([]),
    });
  }

  /**
   * Update market data after a trade
   */
  private async updateMarketDataAfterTrade(
    assetMint: string,
    quantity: number,
    side: "buy" | "sell",
    price: number
  ): Promise<void> {
    const marketData = this.marketData.get(assetMint);
    if (!marketData) return;

    // Update current price
    marketData.currentPrice = price;

    // Update 24h high/low
    if (price > marketData.high24h) {
      marketData.high24h = price;
    }
    if (price < marketData.low24h) {
      marketData.low24h = price;
    }

    // Update volume
    marketData.volume24h += quantity * price;

    // Update market cap
    marketData.marketCap = price * marketData.totalSupply;

    // Update last updated timestamp
    marketData.lastUpdated = new Date();

    this.marketData.set(assetMint, marketData);
  }

  /**
   * Update user portfolio after a trade
   */
  private async updateUserPortfolio(
    walletAddress: string,
    assetMint: string,
    quantity: number,
    price: number,
    side: "buy" | "sell"
  ): Promise<void> {
    let portfolio = this.portfolios.get(walletAddress);

    if (!portfolio) {
      portfolio = {
        userId: walletAddress,
        walletAddress,
        assets: [],
        totalValue: 0,
        totalValueUSD: 0,
        pnl24h: 0,
        pnl7d: 0,
        pnl30d: 0,
      };
    }

    let asset = portfolio.assets.find((a) => a.mint === assetMint);

    if (!asset) {
      asset = {
        assetId: assetMint,
        mint: assetMint,
        quantity: 0,
        averagePrice: 0,
        currentValue: 0,
        pnl: 0,
        pnlPercentage: 0,
      };
      portfolio.assets.push(asset);
    }

    if (side === "buy") {
      // Calculate new average price
      const totalCost = asset.quantity * asset.averagePrice + quantity * price;
      const totalQuantity = asset.quantity + quantity;
      asset.averagePrice = totalCost / totalQuantity;
      asset.quantity = totalQuantity;
    } else {
      // Selling
      asset.quantity -= quantity;
      if (asset.quantity < 0) {
        asset.quantity = 0;
      }
    }

    // Update current value and P&L
    const marketData = this.marketData.get(assetMint);
    if (marketData) {
      asset.currentValue = asset.quantity * marketData.currentPrice;
      asset.pnl = asset.currentValue - asset.quantity * asset.averagePrice;
      asset.pnlPercentage =
        asset.averagePrice > 0
          ? (asset.pnl / (asset.quantity * asset.averagePrice)) * 100
          : 0;
    }

    // Update portfolio totals
    portfolio.totalValue = portfolio.assets.reduce(
      (sum, a) => sum + a.currentValue,
      0
    );

    // Remove asset if quantity is 0
    portfolio.assets = portfolio.assets.filter((a) => a.quantity > 0);

    this.portfolios.set(walletAddress, portfolio);
  }

  /**
   * Generate unique order ID
   */
  private generateOrderId(): string {
    return `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
