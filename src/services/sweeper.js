import { ethers } from "ethers";
import { HOT_WALLET, USDT_ADDRESS } from "../config.js";
import { decrypt } from "../utils/cryptoUtils.js";
import { erc20BalanceOf, erc20Transfer } from "../utils/erc20.js";
import { logger } from "../utils/logger.js";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";

const adapter = new JSONFile("src/db.json");
const db = new Low(adapter, { wallets: [] });
await db.read();

const MIN_GAS_BUFFER = ethers.parseEther("0.001");

export async function runBatchSweep(provider, config) {
  await db.read();
  const wallets = db.data.wallets || [];
  const report = [];

  for (const record of wallets) {
    try {
      const privKey = decrypt(record.encryptedKey, config.ENCRYPTION_SECRET || "default_secret");
      const wallet = new ethers.Wallet(privKey, provider);

      const wcoBal = await provider.getBalance(wallet.address);
      const usdtBal = await erc20BalanceOf(provider, USDT_ADDRESS, wallet.address);

      const transfers = [];

      if (wcoBal > MIN_GAS_BUFFER) {
        const amount = wcoBal - MIN_GAS_BUFFER;
        const tx = await wallet.sendTransaction({ to: HOT_WALLET, value: amount, gasLimit: 21000 });
        await tx.wait();
        transfers.push({ type: "WCO", amount: amount.toString(), tx: tx.hash });
        logger.info(`Swept WCO from ${wallet.address} tx ${tx.hash}`);
      }

      if (usdtBal > 0n) {
        const tx = await erc20Transfer(provider, USDT_ADDRESS, wallet, HOT_WALLET, usdtBal);
        await tx.wait();
        transfers.push({ type: "USDT", amount: usdtBal.toString(), tx: tx.hash });
        logger.info(`Swept USDT from ${wallet.address} tx ${tx.hash}`);
      }

      report.push({ address: wallet.address, swept: transfers.length > 0, transfers });
    } catch (err) {
      logger.error(`Failed wallet ${record.address}:`, err.message);
      report.push({ address: record.address, swept: false, error: err.message });
    }
  }

  logger.info("Sweep report:", report);
  return report;
}
