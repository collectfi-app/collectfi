import { Connection, PublicKey, Keypair } from "@solana/web3.js";
import { WalletInfo, TokenBalance, CollectFiError } from "../types";

/**
 * Manages Solana wallet connections and operations for the CollectFi platform
 */
export class Wallet {
  private connection: Connection;
  private walletAdapter: any; // Would be proper wallet adapter in production
  private publicKey: PublicKey | null = null;
  private connected: boolean = false;
  private walletType: "Phantom" | "Backpack" | "Solflare" | "Other" = "Other";

  constructor(connection: Connection) {
    this.connection = connection;
  }

  /**
   * Connect to a Solana wallet
   */
  async connect(): Promise<boolean> {
    try {
      // In a real implementation, this would integrate with wallet adapters
      // For MVP, we'll simulate wallet connection

      // Check if wallet is available
      if (typeof window !== "undefined" && "solana" in window) {
        const solana = (window as any).solana;

        if (solana.isPhantom) {
          this.walletType = "Phantom";
        } else if (solana.isBackpack) {
          this.walletType = "Backpack";
        } else if (solana.isSolflare) {
          this.walletType = "Solflare";
        }

        // Request connection
        const response = await solana.connect();
        this.publicKey = new PublicKey(response.publicKey.toString());
        this.connected = true;

        console.log(
          `Connected to ${this.walletType} wallet: ${this.publicKey.toString()}`
        );
        return true;
      } else {
        // Fallback for development/testing
        const keypair = Keypair.generate();
        this.publicKey = keypair.publicKey;
        this.connected = true;
        this.walletType = "Other";

        console.log(
          `Connected to generated wallet: ${this.publicKey.toString()}`
        );
        return true;
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      throw new CollectFiError(
        "Failed to connect wallet",
        "WALLET_CONNECTION_ERROR",
        error
      );
    }
  }

  /**
   * Disconnect from wallet
   */
  async disconnect(): Promise<void> {
    try {
      if (typeof window !== "undefined" && "solana" in window) {
        const solana = (window as any).solana;
        if (solana.disconnect) {
          await solana.disconnect();
        }
      }

      this.publicKey = null;
      this.connected = false;
      this.walletType = "Other";

      console.log("Wallet disconnected");
    } catch (error) {
      console.error("Failed to disconnect wallet:", error);
      throw new CollectFiError(
        "Failed to disconnect wallet",
        "WALLET_DISCONNECTION_ERROR",
        error
      );
    }
  }

  /**
   * Check if wallet is connected
   */
  isConnected(): boolean {
    return this.connected && this.publicKey !== null;
  }

  /**
   * Get wallet public key
   */
  getPublicKey(): PublicKey | null {
    return this.publicKey;
  }

  /**
   * Get wallet address as string
   */
  getAddress(): string | null {
    return this.publicKey?.toString() || null;
  }

  /**
   * Get wallet information
   */
  async getWalletInfo(): Promise<WalletInfo | null> {
    if (!this.isConnected()) {
      return null;
    }

    try {
      const address = this.getAddress()!;
      const balance = await this.getBalance();
      const tokens = await this.getTokenBalances();

      return {
        address,
        balance,
        tokens,
        connected: this.connected,
        walletType: this.walletType,
      };
    } catch (error) {
      console.error("Failed to get wallet info:", error);
      return null;
    }
  }

  /**
   * Get SOL balance
   */
  async getBalance(): Promise<number> {
    if (!this.isConnected()) {
      throw new CollectFiError("Wallet not connected", "WALLET_NOT_CONNECTED");
    }

    try {
      const balance = await this.connection.getBalance(this.publicKey!);
      return balance / 1e9; // Convert lamports to SOL
    } catch (error) {
      console.error("Failed to get balance:", error);
      throw new CollectFiError(
        "Failed to get wallet balance",
        "BALANCE_FETCH_ERROR",
        error
      );
    }
  }

  /**
   * Get token balances for the wallet
   */
  async getTokenBalances(): Promise<TokenBalance[]> {
    if (!this.isConnected()) {
      throw new CollectFiError("Wallet not connected", "WALLET_NOT_CONNECTED");
    }

    try {
      // In a real implementation, this would use SPL token program
      // For MVP, we'll return sample data
      const sampleTokens: TokenBalance[] = [
        {
          mint: "ROLEXDAYTONA1mintaddress123456789",
          balance: 1000,
          decimals: 0,
          symbol: "ROLEXDAYTONA1",
          name: "Rolex Daytona Panda 116500LN Token",
        },
        {
          mint: "ROLEXDAYTONA2mintaddress123456789",
          balance: 500,
          decimals: 0,
          symbol: "ROLEXDAYTONA2",
          name: "Rolex Daytona Panda 116500LN Token (Copy 2)",
        },
      ];

      return sampleTokens;
    } catch (error) {
      console.error("Failed to get token balances:", error);
      return [];
    }
  }

  /**
   * Get specific token balance
   */
  async getTokenBalance(mint: string): Promise<TokenBalance | null> {
    const tokens = await this.getTokenBalances();
    return tokens.find((token) => token.mint === mint) || null;
  }

  /**
   * Sign a transaction
   */
  async signTransaction(transaction: any): Promise<any> {
    if (!this.isConnected()) {
      throw new CollectFiError("Wallet not connected", "WALLET_NOT_CONNECTED");
    }

    try {
      if (typeof window !== "undefined" && "solana" in window) {
        const solana = (window as any).solana;
        if (solana.signTransaction) {
          return await solana.signTransaction(transaction);
        }
      }

      // Fallback for development/testing
      throw new CollectFiError(
        "Transaction signing not supported in this environment",
        "SIGNING_NOT_SUPPORTED"
      );
    } catch (error) {
      console.error("Failed to sign transaction:", error);
      throw new CollectFiError(
        "Failed to sign transaction",
        "TRANSACTION_SIGNING_ERROR",
        error
      );
    }
  }

  /**
   * Sign multiple transactions
   */
  async signAllTransactions(transactions: any[]): Promise<any[]> {
    if (!this.isConnected()) {
      throw new CollectFiError("Wallet not connected", "WALLET_NOT_CONNECTED");
    }

    try {
      if (typeof window !== "undefined" && "solana" in window) {
        const solana = (window as any).solana;
        if (solana.signAllTransactions) {
          return await solana.signAllTransactions(transactions);
        }
      }

      // Fallback for development/testing
      throw new CollectFiError(
        "Batch transaction signing not supported in this environment",
        "BATCH_SIGNING_NOT_SUPPORTED"
      );
    } catch (error) {
      console.error("Failed to sign transactions:", error);
      throw new CollectFiError(
        "Failed to sign transactions",
        "BATCH_SIGNING_ERROR",
        error
      );
    }
  }

  /**
   * Send a signed transaction
   */
  async sendTransaction(signedTransaction: any): Promise<string> {
    try {
      const signature = await this.connection.sendRawTransaction(
        signedTransaction.serialize()
      );

      // Wait for confirmation
      const confirmation = await this.connection.confirmTransaction(signature);

      if (confirmation.value.err) {
        throw new Error("Transaction failed");
      }

      console.log(`Transaction sent: ${signature}`);
      return signature;
    } catch (error) {
      console.error("Failed to send transaction:", error);
      throw new CollectFiError(
        "Failed to send transaction",
        "TRANSACTION_SEND_ERROR",
        error
      );
    }
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(signature: string): Promise<string> {
    try {
      const status = await this.connection.getSignatureStatus(signature);
      return status.value?.confirmationStatus || "unknown";
    } catch (error) {
      console.error("Failed to get transaction status:", error);
      return "unknown";
    }
  }

  /**
   * Get wallet type
   */
  getWalletType(): string {
    return this.walletType;
  }

  /**
   * Check if wallet supports a specific feature
   */
  supportsFeature(feature: string): boolean {
    if (typeof window === "undefined" || !("solana" in window)) {
      return false;
    }

    const solana = (window as any).solana;

    switch (feature) {
      case "signTransaction":
        return !!solana.signTransaction;
      case "signAllTransactions":
        return !!solana.signAllTransactions;
      case "signMessage":
        return !!solana.signMessage;
      default:
        return false;
    }
  }

  /**
   * Sign a message
   */
  async signMessage(
    message: string
  ): Promise<{ signature: string; publicKey: string } | null> {
    if (!this.isConnected()) {
      throw new CollectFiError("Wallet not connected", "WALLET_NOT_CONNECTED");
    }

    try {
      if (typeof window !== "undefined" && "solana" in window) {
        const solana = (window as any).solana;
        if (solana.signMessage) {
          const encodedMessage = new TextEncoder().encode(message);
          const signedMessage = await solana.signMessage(
            encodedMessage,
            "utf8"
          );

          return {
            signature: signedMessage.signature.toString(),
            publicKey: signedMessage.publicKey.toString(),
          };
        }
      }

      return null;
    } catch (error) {
      console.error("Failed to sign message:", error);
      return null;
    }
  }

  /**
   * Listen for wallet connection changes
   */
  onConnectionChange(callback: (connected: boolean) => void): () => void {
    if (typeof window !== "undefined" && "solana" in window) {
      const solana = (window as any).solana;

      const handleConnect = () => {
        this.connected = true;
        callback(true);
      };

      const handleDisconnect = () => {
        this.connected = false;
        this.publicKey = null;
        callback(false);
      };

      const handleAccountChange = (publicKey: PublicKey) => {
        this.publicKey = publicKey;
        callback(this.connected);
      };

      solana.on("connect", handleConnect);
      solana.on("disconnect", handleDisconnect);
      solana.on("accountChanged", handleAccountChange);

      return () => {
        solana.removeListener("connect", handleConnect);
        solana.removeListener("disconnect", handleDisconnect);
        solana.removeListener("accountChanged", handleAccountChange);
      };
    }

    // Return no-op function if wallet events not supported
    return () => {};
  }
}
