// Test setup for CollectFi SDK
import { Connection } from "@solana/web3.js";

// Mock Solana connection for testing
export const createMockConnection = (): Connection => {
  return new Connection("http://localhost:8899", "confirmed");
};

// Mock configuration for testing
export const mockConfig = {
  rpcEndpoint: "http://localhost:8899",
  network: "devnet" as const,
  programId: "TestProgram111111111111111111111111111111",
  feeAccount: "TestFeeAccount111111111111111111111111111",
  vaultAddress: "TestVault111111111111111111111111111111",
  insuranceProvider: "Test Insurance Co.",
};

// Test utilities
export const testUtils = {
  // Wait for a specified number of milliseconds
  wait: (ms: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },

  // Generate random test data
  generateRandomString: (length: number = 10): string => {
    return Math.random()
      .toString(36)
      .substring(2, length + 2);
  },

  // Generate random Solana address
  generateRandomAddress: (): string => {
    return "TestAddress" + Math.random().toString(36).substring(2, 15);
  },

  // Generate random number between min and max
  generateRandomNumber: (min: number, max: number): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  // Mock collectible asset for testing
  createMockAsset: (overrides: any = {}) => {
    return {
      id:
        overrides.id ||
        `test-asset-${Math.random().toString(36).substring(2, 9)}`,
      name: overrides.name || "Test Collectible Asset",
      description:
        overrides.description ||
        "A test collectible asset for testing purposes",
      category: overrides.category || "memorabilia",
      mint:
        overrides.mint ||
        `TestMint${Math.random().toString(36).substring(2, 9)}`,
      totalSupply: overrides.totalSupply || 100000,
      circulatingSupply: overrides.circulatingSupply || 100000,
      currentPrice: overrides.currentPrice || 100,
      priceHistory: overrides.priceHistory || [],
      authentication: overrides.authentication || {
        provider: "PSA",
        grade: "Gem Mint 10",
        certificateId: "TEST-001",
        verifiedAt: new Date(),
        authenticityScore: 100,
      },
      storage: overrides.storage || {
        vaultId: "TEST-VAULT-001",
        location: "Test Facility",
        temperature: 20,
        humidity: 45,
        lastInspection: new Date(),
        securityLevel: "Standard",
      },
      insurance: overrides.insurance || {
        provider: "Test Insurance",
        coverageAmount: 100000,
        policyNumber: "TEST-POLICY-001",
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        deductible: 0,
      },
      metadata: overrides.metadata || {
        images: ["https://test.com/image1.jpg"],
        documents: ["https://test.com/certificate.pdf"],
        provenance: "Test provenance",
        rarity: "rare",
        condition: "Mint",
        year: 2024,
        manufacturer: "Test Manufacturer",
      },
      createdAt: overrides.createdAt || new Date(),
      updatedAt: overrides.updatedAt || new Date(),
    };
  },

  // Mock user portfolio for testing
  createMockPortfolio: (overrides: any = {}) => {
    return {
      userId:
        overrides.userId ||
        `test-user-${Math.random().toString(36).substring(2, 9)}`,
      walletAddress:
        overrides.walletAddress ||
        `TestWallet${Math.random().toString(36).substring(2, 15)}`,
      assets: overrides.assets || [],
      totalValue: overrides.totalValue || 0,
      totalValueUSD: overrides.totalValueUSD || 0,
      pnl24h: overrides.pnl24h || 0,
      pnl7d: overrides.pnl7d || 0,
      pnl30d: overrides.pnl30d || 0,
    };
  },

  // Mock trading order for testing
  createMockOrder: (overrides: any = {}) => {
    return {
      id: overrides.id || `order-${Math.random().toString(36).substring(2, 9)}`,
      userId:
        overrides.userId ||
        `test-user-${Math.random().toString(36).substring(2, 9)}`,
      assetMint:
        overrides.assetMint ||
        `TestMint${Math.random().toString(36).substring(2, 9)}`,
      type: overrides.type || "market",
      side: overrides.side || "buy",
      quantity: overrides.quantity || 1000,
      price: overrides.price || 100,
      status: overrides.status || "pending",
      createdAt: overrides.createdAt || new Date(),
      executedAt: overrides.executedAt,
      txHash: overrides.txHash,
    };
  },

  // Mock market data for testing
  createMockMarketData: (overrides: any = {}) => {
    return {
      assetMint:
        overrides.assetMint ||
        `TestMint${Math.random().toString(36).substring(2, 9)}`,
      currentPrice: overrides.currentPrice || 100,
      priceChange24h: overrides.priceChange24h || 5.0,
      priceChangePercentage24h: overrides.priceChangePercentage24h || 5.0,
      volume24h: overrides.volume24h || 1000,
      marketCap: overrides.marketCap || 10000000,
      circulatingSupply: overrides.circulatingSupply || 100000,
      totalSupply: overrides.totalSupply || 100000,
      high24h: overrides.high24h || 105,
      low24h: overrides.low24h || 95,
      lastUpdated: overrides.lastUpdated || new Date(),
    };
  },
};

// Global test configuration
beforeAll(() => {
  // Set up any global test configuration
  console.log("Setting up CollectFi SDK tests...");
});

afterAll(() => {
  // Clean up any global test resources
  console.log("Cleaning up CollectFi SDK tests...");
});

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
