import 'dotenv/config';
import fs from 'fs';
import { ethers } from 'ethers';
import { encryptKey } from '../utils/cryptoUtils.js'; // updated import

// --- Config ---
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const MASTER_WALLET_PRIVATE_KEY = process.env.MASTER_WALLET_PRIVATE_KEY;
const HOT_WALLET = process.env.HOT_WALLET_ADDRESS; // optional, not used here
const DB_FILE = 'src/db.json';
const INITIAL_WCO_AMOUNT = ethers.parseEther('1'); // 1 WCO

const masterWallet = new ethers.Wallet(MASTER_WALLET_PRIVATE_KEY, provider);

// --- Load DB ---
function loadWallets() {
  try {
    if (!fs.existsSync(DB_FILE)) return [];
    const raw = fs.readFileSync(DB_FILE, "utf-8").trim();
    if (!raw) return [];
    const db = JSON.parse(raw);
    return db.wallets || [];
  } catch (err) {
    console.warn("⚠️ db.json corrupted or empty, resetting file...");
    return [];
  }
}

function saveWallets(wallets) {
  fs.writeFileSync(DB_FILE, JSON.stringify({ wallets }, null, 2));
}

// --- Create custodial wallet ---
async function createCustodialWallet() {
  // 1️⃣ Generate new wallet
  const wallet = ethers.Wallet.createRandom();
  console.log("New wallet address:", wallet.address);

  // 2️⃣ Encrypt private key
  const encryptedKey = encryptKey(wallet.privateKey);
  console.log("Encrypted private key:", encryptedKey);

  // 3️⃣ Save to DB
  const wallets = loadWallets();
  wallets.push({
    address: wallet.address,
    encryptedKey
  });
  saveWallets(wallets);
  console.log("✅ Wallet saved to db.json");

  // 4️⃣ Fund wallet with 1 WCO
  const tx = await masterWallet.sendTransaction({
    to: wallet.address,
    value: INITIAL_WCO_AMOUNT
  });
  await tx.wait();
  console.log(`✅ Funded 1 WCO to ${wallet.address} | Tx: ${tx.hash}`);

  return wallet.address;
}

// --- Run ---
createCustodialWallet().catch(err => {
  console.error("Error creating custodial wallet:", err);
  process.exit(1);
});
