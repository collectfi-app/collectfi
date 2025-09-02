# CollectFi API

<img width="1080" height="360" alt="WhatsApp Image 2025-08-21 at 22 23 12" src="https://github.com/user-attachments/assets/1ae5ff6c-52bd-46d9-afb6-f5eec31e8af6" />

> **Invest in grails. Trade culture. Diversify with SOL.**

A comprehensive REST API service for fractionalized collectibles trading on Solana blockchain, enabling users to own fractional shares of high-value real-world collectibles through SPL tokens.

## 🎯 What is CollectFi?

CollectFi is a blockchain-based investment platform on Solana that allows users to own fractional shares of high-value collectibles like Rolex Daytona Panda luxury watches. Each collectible is tokenized into 100,000 SPL tokens, making expensive assets accessible to everyone.

## 🚀 Key Features

### Phase 1 (MVP) - Initial Drops & Trading Platform

- **Fractionalized Collectibles**: Rolex Daytona Panda 116500LN Watches ($350K each)
- **SPL Token Trading**: 100,000 tokens per collectible, minimum investment ~$1.75-1.80
- **Real-time Trading**: 24/7 trading using SOL as base currency
- **Secure Vaulting**: Insured storage with Rolex authentication
- **Redemption System**: Collect 100% tokens to claim physical asset

### Core Infrastructure

- **Solana Integration**: Native SPL token support
- **REST API**: Comprehensive HTTP endpoints for all operations
- **API Key Authentication**: Secure access control
- **Rate Limiting**: Protection against abuse
- **Asset Management**: Authentication, storage, and insurance tracking

## 🏗️ Architecture

```
src/
├── core/                 # Core business logic
│   ├── CollectFi.ts     # Main platform class
│   ├── AssetManager.ts  # Collectible asset management
│   ├── TradingEngine.ts # Trading functionality
│   ├── VaultManager.ts  # Physical storage management
│   └── Wallet.ts        # Wallet integration
├── routes/               # API route handlers
│   ├── assets.ts        # Asset management endpoints
│   ├── trading.ts       # Trading operations
│   ├── portfolio.ts     # Portfolio management
│   ├── vault.ts         # Vault and redemption
│   └── market.ts        # Market data and analytics
├── middleware/           # Express middleware
│   ├── authMiddleware.ts # API key authentication
│   └── errorHandler.ts  # Error handling
├── utils/                # Utility functions
├── config.ts            # Configuration settings
└── index.ts            # Main server entry point
```

## 📦 Installation

```bash
git clone https://github.com/collectfi/collectfi.git
cd collectfi
npm install
```

## 🔧 Quick Start

### 1. Environment Setup

```bash
cp env.example .env
# Edit .env with your configuration
```

### 2. Start the Server

```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

### 3. API Key Authentication

All API endpoints require a valid API key in the `X-API-Key` header:

```bash
curl -H "X-API-Key: cf_live_1234567890abcdef" \
     https://api.collectfi.app/health
```

## 🔑 API Endpoints

### Health Check

- `GET /health` - Service health status (no auth required)

### Assets

- `GET /api/assets` - Get all available collectibles
- `GET /api/assets/:id` - Get asset by ID
- `GET /api/assets/mint/:mint` - Get asset by mint address
- `GET /api/assets/search` - Search assets by criteria
- `GET /api/assets/trending` - Get trending assets
- `GET /api/assets/:id/price-history` - Get asset price history
- `GET /api/assets/:id/vault-info` - Get vault information
- `POST /api/assets` - Add new asset (Admin only)

### Trading

- `GET /api/trading/market-data` - Get market data for all assets
- `GET /api/trading/market-data/:mint` - Get market data for specific asset
- `GET /api/trading/history/:mint` - Get trading history
- `GET /api/trading/portfolio/:walletAddress` - Get user portfolio
- `GET /api/trading/orders/:walletAddress` - Get user open orders
- `POST /api/trading/place-order` - Place trading order
- `DELETE /api/trading/orders/:orderId` - Cancel order
- `GET /api/trading/stats` - Get platform statistics

### Portfolio

- `GET /api/portfolio/:walletAddress` - Get user portfolio
- `GET /api/portfolio/:walletAddress/transactions` - Get transaction history
- `GET /api/portfolio/:walletAddress/performance` - Get performance metrics

### Vault

- `GET /api/vault/:assetId` - Get vault information
- `GET /api/vault/status/overview` - Get vault security status
- `POST /api/vault/redemption/request` - Request asset redemption
- `GET /api/vault/redemption/:requestId` - Get redemption details
- `GET /api/vault/redemption/user/:userId` - Get user redemption requests
- `PUT /api/vault/redemption/:requestId/status` - Update redemption status (Admin)
- `DELETE /api/vault/redemption/:requestId` - Cancel redemption request

### Market

- `GET /api/market/overview` - Get market overview
- `GET /api/market/trending` - Get trending assets
- `GET /api/market/price-changes` - Get price changes
- `GET /api/market/volume-leaders` - Get volume leaders
- `GET /api/market/gainers-losers` - Get top gainers and losers
- `GET /api/market/analytics` - Get market analytics

## 🔐 Authentication

### API Key Format

```
cf_live_1234567890abcdef
```

### Sample API Keys (for testing)

- **Read-only**: `cf_live_1234567890abcdef`
- **Trading enabled**: `cf_live_0987654321fedcba`
- **Admin access**: `cf_live_admin_superuser`

### Required Headers

```http
X-API-Key: cf_live_1234567890abcdef
Content-Type: application/json
```

## 📊 Example API Calls

### Get Available Assets

```bash
curl -H "X-API-Key: cf_live_1234567890abcdef" \
     https://api.collectfi.app/api/assets
```

### Search for Luxury Watches

```bash
curl -H "X-API-Key: cf_live_1234567890abcdef" \
     "https://api.collectfi.app/api/assets/search?category=memorabilia&maxPrice=200"
```

### Get Market Data

```bash
curl -H "X-API-Key: cf_live_1234567890abcdef" \
     https://api.collectfi.app/api/trading/market-data
```

### Place Trading Order

```bash
curl -X POST \
     -H "X-API-Key: cf_live_0987654321fedcba" \
     -H "Content-Type: application/json" \
     -d '{
       "assetMint": "ROLEXDAYTONA1mintaddress123456789",
       "side": "buy",
       "quantity": 1000,
       "price": 180,
       "type": "limit"
     }' \
     https://api.collectfi.app/api/trading/place-order
```

## 🎮 Supported Collectibles

### Initial Drop (Phase 1)

- **Rolex Daytona Panda 116500LN Watches**: Iconic luxury chronograph timepieces
- **Authentication**: Rolex certified authentic
- **Storage**: Insured vault with climate control
- **Tokenization**: 100,000 SPL tokens per watch

### Future Drops (Phase 2+)

- Weekly asset additions
- Diverse collectible categories
- Community voting for new assets

## 🔐 Security Features

- **API Key Authentication**: Secure access control
- **Rate Limiting**: Protection against abuse
- **CORS Protection**: Cross-origin request security
- **Input Validation**: Request parameter validation
- **Error Handling**: Secure error responses
- **Multi-signature Wallets**: Secure asset backing
- **Insurance Coverage**: Full asset insurance
- **Smart Contract Audits**: Security verification
- **Vault Monitoring**: 24/7 physical security

## 📊 Trading Features

### MVP Trading (Phase 1)

- **REST API Interface**: HTTP endpoints for all operations
- **Market Orders**: Simple buy/sell functionality
- **Real-time Data**: Price and volume information
- **Portfolio Tracking**: Holdings and P&L

### Advanced Trading (Phase 2+)

- **Limit Orders**: Advanced order types
- **WebSocket Support**: Real-time updates
- **Mobile API**: Optimized endpoints
- **Referral Program**: User incentives

## 🌟 Token Utility: $COLLECTFI

### Earning $COLLECTFI

- Trading on platform
- Referral program participation
- Providing liquidity (LP)

### $COLLECTFI Benefits

- Governance voting rights
- New asset drop voting
- Access to exclusive assets
- Staking bonuses

## 📈 Market Opportunity

- **Luxury Watch Market**: >$20 billion
- **Traditional Fractionalization**: Limited crypto integration
- **Solana Ecosystem**: Untapped potential for collectibles

## 🤝 Contributing

We welcome contributions! Please see our Contributing Guide for details.

### Development Guidelines

- Follow TypeScript best practices
- Write comprehensive tests
- Maintain API documentation
- Follow REST API design principles

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

**CollectFi**: Democratizing access to legendary collectibles through blockchain technology.
