import 'dotenv/config';
import fs from 'fs';
import { ethers } from 'ethers';
import { decryptKey } from '../utils/cryptoUtils.js';
import { getERC20Balance, sweepERC20 } from '../utils/erc20.js';
import { HOT_WALLET, USDT_ADDRESS } from '../config.js';

// --- Config ---
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const DB_FILE = 'src/db.json';
const WCO_BUFFER = process.env.WCO_BUFFER ? ethers.parseEther(process.env.WCO_BUFFER) : ethers.parseEther('1');
const MAX_RETRIES = process.env.SWEEP_RETRIES ? parseInt(process.env.SWEEP_RETRIES) : 3;

// --- Helpers ---
function loadWallets() {
  if (!fs.existsSync(DB_FILE)) return [];
  const raw = fs.readFileSync(DB_FILE, 'utf8');
  if (!raw) return [];
  try {
    const db = JSON.parse(raw);
    return db.wallets || [];
  } catch {
    console.error('Invalid JSON in db.json, returning empty wallet list...');
    return [];
  }
}

function saveWallets(wallets) {
  fs.writeFileSync(DB_FILE, JSON.stringify({ wallets }, null, 2));
}

// Retry wrapper for RPC calls
async function withRetries(fn, retries = MAX_RETRIES) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (err.code === 'TIMEOUT') {
        console.warn(`⚠️ RPC timeout, retrying (${i + 1}/${retries})...`);
        await new Promise(res => setTimeout(res, 2000)); // 2 sec delay
      } else {
        throw err;
      }
    }
  }
  throw new Error('Max retries exceeded');
}

async function sweepWallet(walletData) {
  try {
    const decryptedKey = decryptKey(walletData.encryptedKey);
    const wallet = new ethers.Wallet(decryptedKey, provider);

    console.log(`\n🔑 Sweeping wallet: ${wallet.address}`);

    // --- Sweep ERC20 (USDT) ---
    const tokenBalance = await withRetries(() => getERC20Balance(USDT_ADDRESS, wallet.address, provider));
    if (tokenBalance > 0n) {
      const gasNeeded = 21000n + 50000n; // conservative estimate
      const wcoBalance = await provider.getBalance(wallet.address);
      if (wcoBalance > gasNeeded) {
        console.log(`Sweeping ${ethers.formatUnits(tokenBalance, 6)} USDT from ${wallet.address} to ${HOT_WALLET}...`);
        await sweepERC20(USDT_ADDRESS, wallet, HOT_WALLET);
      } else {
        console.log(`⚠️ Not enough WCO to cover gas for ERC20 sweep in ${wallet.address}, skipping USDT sweep`);
      }
    } else {
      console.log(`No USDT in ${wallet.address}`);
    }

    // --- Sweep native token (WCO) ---
    const nativeBalance = await withRetries(() => provider.getBalance(wallet.address));
    if (nativeBalance > WCO_BUFFER) {
      const gasPrice = (await provider.getFeeData()).gasPrice || 1n;
      const gasLimit = 21000n;
      const txCost = gasPrice * gasLimit;

      if (nativeBalance > WCO_BUFFER + txCost) {
        const amountToSend = nativeBalance - WCO_BUFFER - txCost;
        const tx = await wallet.sendTransaction({
          to: HOT_WALLET,
          value: amountToSend,
          gasLimit,
          gasPrice,
        });
        await tx.wait();
        console.log(`✅ Swept ${ethers.formatEther(amountToSend)} WCO → ${HOT_WALLET} | Tx: ${tx.hash}`);
      } else {
        console.log(`⚠️ Not enough WCO above buffer to sweep for ${wallet.address}`);
      }
    } else {
      console.log(`⚠️ WCO balance less than buffer in ${wallet.address}, skipping sweep`);
    }

    return true;
  } catch (err) {
    console.error(`❌ Error sweeping wallet ${walletData.address}:`, err.message);
    return false;
  }
}

export async function runBatchSweep() {
  console.log('🚀 Starting batch sweep...');

  const wallets = loadWallets();
  console.log(`Wallet count: ${wallets.length}`);

  for (const wallet of wallets) {
    await sweepWallet(wallet);
  }

  saveWallets(wallets);
  console.log('🎉 Batch sweep complete.');
}

// --- Run if executed directly ---
if (process.argv[1].endsWith('batchSweep.js')) {
  runBatchSweep().catch(err => {
    console.error('Fatal error in batch sweep:', err);
    process.exit(1);
  });
}
