 
# 💼 Wadzpay Custodial Wallet (WCO)

**Wadzpay-Custodial-Wallet-WCO** is a Node.js-based custodial wallet management system built on the **W Chain** (EVM-compatible blockchain).  
It allows you to:
- Create and manage on-chain custodial wallets.
- Securely store encrypted private keys.
- Fund newly created wallets from a master wallet.
- Sweep **WCO (native token)** and **USDT** balances automatically to a central hot wallet.
- Maintain a configurable safety buffer to prevent emptying wallets completely.

---

## 🚀 Features

✅ Create custodial wallets programmatically  
✅ Encrypt private keys using AES-256-CBC  
✅ Automatically fund wallets from a master wallet  
✅ Sweep all ERC20 and native balances to a hot wallet  
✅ Leave a configurable **WCO buffer** (e.g., 1 WCO minimum)  
✅ Retry logic for RPC timeouts  
✅ Built-in Express API for wallet management  
✅ Modular architecture with `scripts`, `services`, and `utils`

---

## 🧩 Prerequisites
  **Node.js** v18+  
- **npm** or **pnpm**  
- A funded **W Chain master wallet** (for initial funding & sweeps)  
- A valid **RPC endpoint** for W Chain (e.g., `https://rpc.w-chain.com`) 

## 🔧 Setup Instructions 

### 1️⃣ Clone Repository 
git clone https://github.com/chetanjiWadzpay/Wadzpay-custodial-wallet-wco.git 

cd Wadzpay-custodial-wallet-wco 

2️⃣ Install Dependencies 
npm install 

3️⃣ Configure Environment 
Create a .env file in the root directory (or copy from .env.example): 

# W Chain RPC and wallet settings
RPC_URL=https://rpc.w-chain.com
MASTER_WALLET_PRIVATE_KEY=0xYOUR_MASTER_PRIVATE_KEY
HOT_WALLET_ADDRESS=0xYOUR_HOT_WALLET_ADDRESS

# USDT contract on W Chain
USDT_CONTRACT=0x40CB2CCcF80Ed2192b53FB09720405F6Fe349743

# Key encryption secret (AES)
KEY_ENCRYPTION_SECRET=your_strong_random_secret_here

# Sweep settings
WCO_BUFFER=1         # Leave 1 WCO in each wallet
SWEEP_RETRIES=3      # RPC retry count for timeouts

# Express server port
APP_PORT=3000
 


🧠 How It Works
🪙 1. Create a New Custodial Wallet

Generates a new Ethereum-style wallet, encrypts its private key, saves it to src/db.json, and funds it with 1 WCO from the master wallet.

npm run create-wallet   

Example output: 
New wallet address: 0xABCD...
Encrypted private key: <AES-encrypted-string>
✅ Wallet saved to db.json
✅ Funded 1 WCO to 0xABCD... | Tx: 0x1234...



💰 2. Sweep Balances to Hot Wallet

Sweeps both USDT and WCO from all custodial wallets to the hot wallet, leaving the configured WCO_BUFFER untouched. 

npm run sweep
 
 Example output: 
 🚀 Starting batch sweep...
🔑 Sweeping wallet: 0xABCD...
✅ Swept 100.0 USDT | Tx: 0xUSDT_TX_HASH
✅ Swept 0.956 WCO  | Tx: 0xWCO_TX_HASH
🎉 Batch sweep complete. 


🧰 Available npm Scripts
Command	Description
npm run create-wallet	Create & fund a new custodial wallet
npm run sweep	Sweep all wallets to the hot wallet
npm start	Run the Express API server

...
