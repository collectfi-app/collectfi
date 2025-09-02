import { Connection, PublicKey } from "@solana/web3.js";
import {
  CollectibleAsset,
  CollectFiConfig,
  AssetCategory,
  RarityLevel,
  PricePoint,
  CollectFiError,
} from "../types";

/**
 * Manages collectible assets, their metadata, and price information
 */
export class AssetManager {
  private connection: Connection;
  private config: CollectFiConfig;
  private assets: Map<string, CollectibleAsset> = new Map();
  private priceHistory: Map<string, PricePoint[]> = new Map();

  constructor(connection: Connection, config: CollectFiConfig) {
    this.connection = connection;
    this.config = config;
  }

  /**
   * Initialize the asset manager
   */
  async initialize(): Promise<void> {
    try {
      // Load initial assets from configuration or database
      await this.loadInitialAssets();
      console.log("AssetManager initialized successfully");
    } catch (error) {
      throw new CollectFiError(
        "Failed to initialize AssetManager",
        "ASSET_MANAGER_INIT_ERROR",
        error
      );
    }
  }

  /**
   * Load initial assets (Phase 1: Rolex Daytona Panda Watches)
   */
  private async loadInitialAssets(): Promise<void> {
    const initialAssets: CollectibleAsset[] = [
      {
        id: "rolex-daytona-panda-1",
        name: "Rolex Daytona Panda 116500LN",
        description:
          "Iconic Rolex Daytona Panda chronograph watch with white dial and black sub-dials. Features the legendary 4130 movement, ceramic bezel, and Oyster bracelet. One of the most sought-after luxury timepieces in the world.",
        category: AssetCategory.MEMORABILIA,
        mint: "ROLEXDAYTONA1mintaddress123456789", // This would be the actual SPL token mint
        totalSupply: 100000,
        circulatingSupply: 100000,
        currentPrice: 180, // in SOL
        priceHistory: [],
        authentication: {
          provider: "Rolex",
          grade: "Authentic",
          certificateId: "ROLEX-116500LN-001",
          verifiedAt: new Date("2024-01-15"),
          authenticityScore: 100,
        },
        storage: {
          vaultId: "VAULT-001",
          location: "Secure Facility, Delaware",
          temperature: 20,
          humidity: 45,
          lastInspection: new Date("2024-01-20"),
          securityLevel: "Ultra",
        },
        insurance: {
          provider: "Lloyd's of London",
          coverageAmount: 350000,
          policyNumber: "LL-2024-001",
          expiryDate: new Date("2025-01-15"),
          deductible: 0,
        },
        metadata: {
          images: [
            "https://collectfi.app/assets/rolex-daytona-panda-1-front.jpg",
            "https://collectfi.app/assets/rolex-daytona-panda-1-back.jpg",
            "https://collectfi.app/assets/rolex-daytona-panda-1-side.jpg",
          ],
          documents: [
            "https://collectfi.app/assets/rolex-certificate.pdf",
            "https://collectfi.app/assets/insurance-policy.pdf",
          ],
          provenance:
            "Acquired from authorized Rolex dealer, includes original box, papers, and warranty",
          rarity: RarityLevel.LEGENDARY,
          condition: "Mint",
          year: 2023,
          manufacturer: "Rolex SA",
        },
        createdAt: new Date("2024-01-15"),
        updatedAt: new Date("2024-01-20"),
      },
      {
        id: "rolex-daytona-panda-2",
        name: "Rolex Daytona Panda 116500LN (Second Copy)",
        description:
          "Second Rolex Daytona Panda chronograph watch in pristine condition. Features the same iconic design with white dial, black sub-dials, and ceramic bezel. Includes complete set with box and papers.",
        category: AssetCategory.MEMORABILIA,
        mint: "ROLEXDAYTONA2mintaddress123456789",
        totalSupply: 100000,
        circulatingSupply: 100000,
        currentPrice: 175, // in SOL
        priceHistory: [],
        authentication: {
          provider: "Rolex",
          grade: "Authentic",
          certificateId: "ROLEX-116500LN-002",
          verifiedAt: new Date("2024-01-16"),
          authenticityScore: 100,
        },
        storage: {
          vaultId: "VAULT-002",
          location: "Secure Facility, Delaware",
          temperature: 20,
          humidity: 45,
          lastInspection: new Date("2024-01-21"),
          securityLevel: "Ultra",
        },
        insurance: {
          provider: "Lloyd's of London",
          coverageAmount: 350000,
          policyNumber: "LL-2024-002",
          expiryDate: new Date("2025-01-16"),
          deductible: 0,
        },
        metadata: {
          images: [
            "https://collectfi.app/assets/rolex-daytona-panda-2-front.jpg",
            "https://collectfi.app/assets/rolex-daytona-panda-2-back.jpg",
          ],
          documents: [
            "https://collectfi.app/assets/rolex-certificate-2.pdf",
            "https://collectfi.app/assets/insurance-policy-2.pdf",
          ],
          provenance:
            "Acquired from private collection, verified authenticity with Rolex",
          rarity: RarityLevel.LEGENDARY,
          condition: "Mint",
          year: 2023,
          manufacturer: "Rolex SA",
        },
        createdAt: new Date("2024-01-16"),
        updatedAt: new Date("2024-01-21"),
      },
    ];

    // Add assets to the map
    initialAssets.forEach((asset) => {
      this.assets.set(asset.id, asset);
      this.assets.set(asset.mint, asset);
    });

    // Initialize price history
    await this.initializePriceHistory();
  }

  /**
   * Initialize price history for assets
   */
  private async initializePriceHistory(): Promise<void> {
    for (const asset of this.assets.values()) {
      if (asset.id.startsWith("rolex-daytona-panda")) {
        // Generate sample price history for demonstration
        const history: PricePoint[] = [];
        const basePrice = asset.currentPrice;

        for (let i = 30; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);

          // Simulate price volatility
          const volatility = 0.05; // 5% daily volatility
          const randomChange = (Math.random() - 0.5) * 2 * volatility;
          const price = basePrice * (1 + randomChange);

          history.push({
            timestamp: date,
            price: Math.max(price, basePrice * 0.8), // Don't go below 80% of base price
            volume: Math.random() * 1000 + 100, // Random volume between 100-1100
            marketCap: price * asset.totalSupply,
          });
        }

        this.priceHistory.set(asset.mint, history);

        // Update asset with price history
        asset.priceHistory = history;
        asset.currentPrice = history[history.length - 1].price;
      }
    }
  }

  /**
   * Get all available assets
   */
  async getAvailableAssets(): Promise<CollectibleAsset[]> {
    return Array.from(this.assets.values()).filter((asset) =>
      asset.id.startsWith("rolex-daytona-panda")
    );
  }

  /**
   * Get asset by mint address
   */
  async getAssetByMint(mint: string): Promise<CollectibleAsset | null> {
    return this.assets.get(mint) || null;
  }

  /**
   * Get asset by ID
   */
  async getAssetById(id: string): Promise<CollectibleAsset | null> {
    return this.assets.get(id) || null;
  }

  /**
   * Get total number of assets
   */
  async getTotalAssets(): Promise<number> {
    return this.assets.size;
  }

  /**
   * Get price history for an asset
   */
  async getPriceHistory(
    assetMint: string,
    timeframe: "1h" | "24h" | "7d" | "30d" | "1y"
  ): Promise<PricePoint[]> {
    const history = this.priceHistory.get(assetMint);
    if (!history) return [];

    const now = new Date();
    let filteredHistory: PricePoint[];

    switch (timeframe) {
      case "1h":
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        filteredHistory = history.filter(
          (point) => point.timestamp >= oneHourAgo
        );
        break;
      case "24h":
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        filteredHistory = history.filter(
          (point) => point.timestamp >= oneDayAgo
        );
        break;
      case "7d":
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filteredHistory = history.filter(
          (point) => point.timestamp >= oneWeekAgo
        );
        break;
      case "30d":
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filteredHistory = history.filter(
          (point) => point.timestamp >= oneMonthAgo
        );
        break;
      case "1y":
        const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        filteredHistory = history.filter(
          (point) => point.timestamp >= oneYearAgo
        );
        break;
      default:
        filteredHistory = history;
    }

    return filteredHistory;
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
  }): Promise<CollectibleAsset[]> {
    let results = Array.from(this.assets.values());

    if (criteria.category) {
      results = results.filter((asset) => asset.category === criteria.category);
    }

    if (criteria.minPrice !== undefined) {
      results = results.filter(
        (asset) => asset.currentPrice >= criteria.minPrice!
      );
    }

    if (criteria.maxPrice !== undefined) {
      results = results.filter(
        (asset) => asset.currentPrice <= criteria.maxPrice!
      );
    }

    if (criteria.rarity) {
      results = results.filter(
        (asset) => asset.metadata.rarity === criteria.rarity
      );
    }

    if (criteria.condition) {
      results = results.filter(
        (asset) => asset.metadata.condition === criteria.condition
      );
    }

    if (criteria.year) {
      results = results.filter(
        (asset) => asset.metadata.year === criteria.year
      );
    }

    return results;
  }

  /**
   * Get trending assets based on volume and price movement
   */
  async getTrendingAssets(limit: number = 10): Promise<CollectibleAsset[]> {
    const assets = Array.from(this.assets.values());

    // Sort by 24h volume and price change
    const sortedAssets = assets.sort((a, b) => {
      const aVolume = a.priceHistory[a.priceHistory.length - 1]?.volume || 0;
      const bVolume = b.priceHistory[b.priceHistory.length - 1]?.volume || 0;

      if (aVolume !== bVolume) {
        return bVolume - aVolume;
      }

      // If volume is same, sort by price change
      const aPriceChange = this.getPriceChange24h(a);
      const bPriceChange = this.getPriceChange24h(b);

      return Math.abs(bPriceChange) - Math.abs(aPriceChange);
    });

    return sortedAssets.slice(0, limit);
  }

  /**
   * Calculate 24h price change percentage
   */
  private getPriceChange24h(asset: CollectibleAsset): number {
    if (asset.priceHistory.length < 2) return 0;

    const currentPrice =
      asset.priceHistory[asset.priceHistory.length - 1].price;
    const previousPrice =
      asset.priceHistory[asset.priceHistory.length - 2].price;

    return ((currentPrice - previousPrice) / previousPrice) * 100;
  }

  /**
   * Update asset price (called by trading engine)
   */
  async updateAssetPrice(assetMint: string, newPrice: number): Promise<void> {
    const asset = this.assets.get(assetMint);
    if (!asset) return;

    // Add new price point to history
    const newPricePoint: PricePoint = {
      timestamp: new Date(),
      price: newPrice,
      volume: 0, // Will be updated by trading engine
      marketCap: newPrice * asset.totalSupply,
    };

    asset.priceHistory.push(newPricePoint);
    asset.currentPrice = newPrice;
    asset.updatedAt = new Date();

    // Keep only last 1000 price points to prevent memory issues
    if (asset.priceHistory.length > 1000) {
      asset.priceHistory = asset.priceHistory.slice(-1000);
    }

    // Update price history map
    this.priceHistory.set(assetMint, asset.priceHistory);
  }

  /**
   * Add new asset to the platform
   */
  async addAsset(
    asset: Omit<CollectibleAsset, "id" | "createdAt" | "updatedAt">
  ): Promise<string> {
    const id = this.generateAssetId(asset.name);
    const newAsset: CollectibleAsset = {
      ...asset,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.assets.set(id, newAsset);
    this.assets.set(asset.mint, newAsset);
    this.priceHistory.set(asset.mint, []);

    return id;
  }

  /**
   * Generate unique asset ID
   */
  private generateAssetId(name: string): string {
    const baseId = name.toLowerCase().replace(/[^a-z0-9]/g, "-");
    const timestamp = Date.now();
    return `${baseId}-${timestamp}`;
  }

  /**
   * Remove asset from platform
   */
  async removeAsset(assetId: string): Promise<boolean> {
    const asset = this.assets.get(assetId);
    if (!asset) return false;

    this.assets.delete(assetId);
    this.assets.delete(asset.mint);
    this.priceHistory.delete(asset.mint);

    return true;
  }
}
