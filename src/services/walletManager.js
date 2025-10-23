import { ethers } from "ethers";
import { encrypt, decrypt } from "../utils/cryptoUtils.js";
import { logger } from "../utils/logger.js";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";

// -------------------- DB -------------------- //
const adapter = new JSONFile("src/db.json");
const db = new Low(adapter, { wallets: [] });
await db.read();

export class WalletManager {
  constructor(provider, config) {
    this.provider = provider;
    this.masterWallet = new ethers.Wallet(config.MASTER_WALLET_PRIVATE_KEY, provider);
    this.config = config;
  }

  // Create a new custodial wallet and fund it with 1 WCO
  async createCustodialWallet() {
    // 1. Generate new wallet
    const newWallet = ethers.Wallet.createRandom();

    // 2. Encrypt private key
    const encryptedKey = encrypt(
      newWallet.privateKey,
      this.config.ENCRYPTION_SECRET || "default_secret"
    );

    // 3. Store wallet in DB
    db.data.wallets.push({
      address: newWallet.address,
      encryptedKey,
      createdAt: new Date().toISOString(),
    });
    await db.write();

    logger.info(`New custodial wallet created: ${newWallet.address}`);

    // 4. Fund new wallet with 1 WCO
    try {
      const tx = await this.masterWallet.sendTransaction({
        to: newWallet.address,
        value: ethers.parseEther("1.0"),
        gasLimit: 21000,
      });
      await tx.wait();
      logger.info(`Sent 1 WCO from master to ${newWallet.address}, tx: ${tx.hash}`);
    } catch (err) {
      logger.error("Funding new wallet with 1 WCO failed:", err);
    }

    return { address: newWallet.address };
  }

  // Get all wallets
  async getAllWallets() {
    await db.read();
    return db.data.wallets;
  }

  // Get wallet by address and decrypt private key
  async getWalletPrivateKey(address) {
    await db.read();
    const wallet = db.data.wallets.find((w) => w.address === address);
    if (!wallet) throw new Error(`Wallet not found: ${address}`);
    return decrypt(wallet.encryptedKey, this.config.ENCRYPTION_SECRET || "default_secret");
  }
}
