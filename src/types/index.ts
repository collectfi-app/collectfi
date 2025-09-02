// Core types for CollectFi platform

export interface CollectibleAsset {
  id: string;
  name: string;
  description: string;
  category: AssetCategory;
  mint: string; // SPL token mint address
  totalSupply: number;
  circulatingSupply: number;
  currentPrice: number; // in SOL
  priceHistory: PricePoint[];
  authentication: Authentication;
  storage: StorageInfo;
  insurance: InsuranceInfo;
  metadata: AssetMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface PricePoint {
  timestamp: Date;
  price: number; // in SOL
  volume: number;
  marketCap: number;
}

export interface Authentication {
  provider: "PSA" | "Beckett" | "CGC";
  grade: string;
  certificateId: string;
  verifiedAt: Date;
  authenticityScore: number; // 0-100
}

export interface StorageInfo {
  vaultId: string;
  location: string;
  temperature: number;
  humidity: number;
  lastInspection: Date;
  securityLevel: "Standard" | "Premium" | "Ultra";
}

export interface InsuranceInfo {
  provider: string;
  coverageAmount: number; // in USD
  policyNumber: string;
  expiryDate: Date;
  deductible: number;
}

export interface AssetMetadata {
  images: string[];
  documents: string[];
  provenance: string;
  rarity: RarityLevel;
  condition: "Mint" | "Near Mint" | "Excellent" | "Good" | "Light Played";
  year: number;
  manufacturer: string;
}

export enum AssetCategory {
  TRADING_CARDS = "trading_cards",
  COMICS = "comics",
  TOYS = "toys",
  ART = "art",
  MEMORABILIA = "memorabilia",
  COINS = "coins",
  STAMPS = "stamps",
}

export enum RarityLevel {
  COMMON = "common",
  UNCOMMON = "uncommon",
  RARE = "rare",
  EPIC = "epic",
  LEGENDARY = "legendary",
}

export interface UserPortfolio {
  userId: string;
  walletAddress: string;
  assets: PortfolioAsset[];
  totalValue: number; // in SOL
  totalValueUSD: number;
  pnl24h: number;
  pnl7d: number;
  pnl30d: number;
}

export interface PortfolioAsset {
  assetId: string;
  mint: string;
  quantity: number;
  averagePrice: number; // in SOL
  currentValue: number; // in SOL
  pnl: number; // in SOL
  pnlPercentage: number;
}

export interface TradingOrder {
  id: string;
  userId: string;
  assetMint: string;
  type: OrderType;
  side: OrderSide;
  quantity: number;
  price: number; // in SOL
  status: OrderStatus;
  createdAt: Date;
  executedAt?: Date;
  txHash?: string;
}

export enum OrderType {
  MARKET = "market",
  LIMIT = "limit",
}

export enum OrderSide {
  BUY = "buy",
  SELL = "sell",
}

export enum OrderStatus {
  PENDING = "pending",
  EXECUTED = "executed",
  CANCELLED = "cancelled",
  FAILED = "failed",
}

export interface TradingPair {
  baseAsset: string; // SOL
  quoteAsset: string; // Asset mint address
  baseDecimals: number;
  quoteDecimals: number;
  minOrderSize: number;
  maxOrderSize: number;
  pricePrecision: number;
  quantityPrecision: number;
}

export interface MarketData {
  assetMint: string;
  currentPrice: number;
  priceChange24h: number;
  priceChangePercentage24h: number;
  volume24h: number;
  marketCap: number;
  circulatingSupply: number;
  totalSupply: number;
  high24h: number;
  low24h: number;
  lastUpdated: Date;
}

export interface RedemptionRequest {
  id: string;
  userId: string;
  assetMint: string;
  tokenQuantity: number;
  status: RedemptionStatus;
  requestedAt: Date;
  processedAt?: Date;
  shippingAddress: ShippingAddress;
  trackingNumber?: string;
}

export enum RedemptionStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  SHIPPED = "shipped",
  DELIVERED = "delivered",
  CANCELLED = "cancelled",
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
}

export interface WalletInfo {
  address: string;
  balance: number; // in SOL
  tokens: TokenBalance[];
  connected: boolean;
  walletType: "Phantom" | "Backpack" | "Solflare" | "Other";
}

export interface TokenBalance {
  mint: string;
  balance: number;
  decimals: number;
  symbol: string;
  name: string;
}

export interface PlatformStats {
  totalAssets: number;
  totalUsers: number;
  totalVolume24h: number;
  totalMarketCap: number;
  activeTraders24h: number;
  totalRedemptions: number;
}

export interface CollectToken {
  symbol: "COLLECT";
  totalSupply: number;
  circulatingSupply: number;
  currentPrice: number;
  holders: number;
  utility: CollectTokenUtility[];
}

export interface CollectTokenUtility {
  type: "governance" | "staking" | "exclusive_access" | "referral_bonus";
  description: string;
  requirements: string;
  benefits: string[];
}

// Configuration types
export interface CollectFiConfig {
  rpcEndpoint: string;
  network: "mainnet-beta" | "testnet" | "devnet";
  programId: string;
  feeAccount: string;
  vaultAddress: string;
  insuranceProvider: string;
}

// Event types
export interface CollectFiEvent {
  type: string;
  data: any;
  timestamp: Date;
  txHash?: string;
}

// Error types
export class CollectFiError extends Error {
  constructor(message: string, public code: string, public details?: any) {
    super(message);
    this.name = "CollectFiError";
  }
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}
