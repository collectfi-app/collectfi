import { Connection } from "@solana/web3.js";
import { CollectFi } from "../core/CollectFi";
import { createMockConnection, mockConfig } from "./setup";

describe("CollectFi", () => {
  let connection: Connection;
  let collectFi: CollectFi;

  beforeEach(() => {
    connection = createMockConnection();
    collectFi = new CollectFi(connection, mockConfig);
  });

  describe("Initialization", () => {
    it("should create CollectFi instance with connection and config", () => {
      expect(collectFi).toBeInstanceOf(CollectFi);
      expect(collectFi.getConnection()).toBe(connection);
      expect(collectFi.getConfig()).toBe(mockConfig);
    });

    it("should initialize successfully", async () => {
      await expect(collectFi.initialize()).resolves.not.toThrow();
    });
  });

  describe("Asset Management", () => {
    beforeEach(async () => {
      await collectFi.initialize();
    });

    it("should get available assets", async () => {
      const assets = await collectFi.getAvailableAssets();
      expect(Array.isArray(assets)).toBe(true);
      expect(assets.length).toBeGreaterThan(0);

      // Check that we have the expected Rolex assets
      const rolexAssets = assets.filter((asset) =>
        asset.name.includes("Rolex Daytona Panda")
      );
      expect(rolexAssets.length).toBe(2);
    });

    it("should get asset by mint address", async () => {
      const assets = await collectFi.getAvailableAssets();
      const firstAsset = assets[0];

      const foundAsset = await collectFi.getAssetByMint(firstAsset.mint);
      expect(foundAsset).toBeDefined();
      expect(foundAsset?.id).toBe(firstAsset.id);
    });

    it("should get asset by ID", async () => {
      const assets = await collectFi.getAvailableAssets();
      const firstAsset = assets[0];

      const foundAsset = await collectFi.getAssetById(firstAsset.id);
      expect(foundAsset).toBeDefined();
      expect(foundAsset?.mint).toBe(firstAsset.mint);
    });

    it("should search assets by criteria", async () => {
      const results = await collectFi.searchAssets({
        category: "memorabilia",
        minPrice: 170,
        maxPrice: 190,
      });

      expect(Array.isArray(results)).toBe(true);
      expect(results.every((asset) => asset.category === "memorabilia")).toBe(
        true
      );
      expect(
        results.every(
          (asset) => asset.currentPrice >= 140 && asset.currentPrice <= 160
        )
      ).toBe(true);
    });

    it("should get trending assets", async () => {
      const trending = await collectFi.getTrendingAssets(5);
      expect(Array.isArray(trending)).toBe(true);
      expect(trending.length).toBeLessThanOrEqual(5);
    });
  });

  describe("Trading Operations", () => {
    beforeEach(async () => {
      await collectFi.initialize();
    });

    it("should get market data for assets", async () => {
      const assets = await collectFi.getAvailableAssets();
      const firstAsset = assets[0];

      const marketData = await collectFi.getMarketData(firstAsset.mint);
      expect(marketData).toBeDefined();
      expect(marketData?.assetMint).toBe(firstAsset.mint);
    });

    it("should get platform statistics", async () => {
      const stats = await collectFi.getPlatformStats();
      expect(stats).toBeDefined();
      expect(typeof stats.totalAssets).toBe("number");
      expect(typeof stats.totalUsers).toBe("number");
      expect(typeof stats.totalVolume24h).toBe("number");
      expect(typeof stats.totalMarketCap).toBe("number");
    });

    it("should get trading history for assets", async () => {
      const assets = await collectFi.getAvailableAssets();
      const firstAsset = assets[0];

      const history = await collectFi.getTradingHistory(firstAsset.mint, 10);
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeLessThanOrEqual(10);
    });
  });

  describe("Portfolio Management", () => {
    beforeEach(async () => {
      await collectFi.initialize();
    });

    it("should get user portfolio", async () => {
      const testAddress = "TestWalletAddress123";
      const portfolio = await collectFi.getUserPortfolio(testAddress);

      // Initially no portfolio exists
      expect(portfolio).toBeNull();
    });
  });

  describe("Vault Operations", () => {
    beforeEach(async () => {
      await collectFi.initialize();
    });

    it("should get vault information for assets", async () => {
      const assets = await collectFi.getAvailableAssets();
      const firstAsset = assets[0];

      const vaultInfo = await collectFi.getVaultInfo(firstAsset.id);
      expect(vaultInfo).toBeDefined();
      expect(vaultInfo.vaultId).toBeDefined();
      expect(vaultInfo.location).toBeDefined();
    });
  });

  describe("Price History", () => {
    beforeEach(async () => {
      await collectFi.initialize();
    });

    it("should get asset price history for different timeframes", async () => {
      const assets = await collectFi.getAvailableAssets();
      const firstAsset = assets[0];

      const timeframes: Array<"1h" | "24h" | "7d" | "30d" | "1y"> = [
        "24h",
        "7d",
        "30d",
      ];

      for (const timeframe of timeframes) {
        const history = await collectFi.getAssetPriceHistory(
          firstAsset.mint,
          timeframe
        );
        expect(Array.isArray(history)).toBe(true);

        if (history.length > 0) {
          expect(history[0]).toHaveProperty("timestamp");
          expect(history[0]).toHaveProperty("price");
          expect(history[0]).toHaveProperty("volume");
          expect(history[0]).toHaveProperty("marketCap");
        }
      }
    });
  });

  describe("Error Handling", () => {
    it("should handle asset not found gracefully", async () => {
      const nonExistentMint = "NonExistentMint123456789";
      const asset = await collectFi.getAssetByMint(nonExistentMint);
      expect(asset).toBeNull();
    });

    it("should handle invalid asset ID gracefully", async () => {
      const nonExistentId = "non-existent-id";
      const asset = await collectFi.getAssetById(nonExistentId);
      expect(asset).toBeNull();
    });
  });

  describe("Configuration", () => {
    it("should return correct configuration", () => {
      const config = collectFi.getConfig();
      expect(config).toBe(mockConfig);
      expect(config.rpcEndpoint).toBe("http://localhost:8899");
      expect(config.network).toBe("devnet");
    });
  });

  describe("Wallet Integration", () => {
    it("should provide wallet instance", () => {
      const wallet = collectFi.getWallet();
      expect(wallet).toBeDefined();
      expect(typeof wallet.connect).toBe("function");
      expect(typeof wallet.disconnect).toBe("function");
    });
  });
});
