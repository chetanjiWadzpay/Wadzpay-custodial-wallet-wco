import dotenv from "dotenv";
import { ethers } from "ethers";

dotenv.config();

export const provider = new ethers.JsonRpcProvider(process.env.RPC_URL, {
  name: "w_chain",
  chainId: 171717,
});

export const masterWallet = new ethers.Wallet(process.env.MASTER_WALLET_PRIVATE_KEY, provider);
export const HOT_WALLET = process.env.HOT_WALLET_ADDRESS;
export const USDT_ADDRESS = "0x40CB2CCcF80Ed2192b53FB09720405F6Fe349743";

export const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 value) returns (bool)",
  "function decimals() view returns (uint8)",
];

export function loadConfig() {
  return {
    RPC_URL: process.env.RPC_URL,
    MASTER_WALLET_PRIVATE_KEY: process.env.MASTER_WALLET_PRIVATE_KEY,
    HOT_WALLET_ADDRESS: process.env.HOT_WALLET_ADDRESS,
    KEY_ENCRYPTION_SECRET: process.env.KEY_ENCRYPTION_SECRET,
    APP_PORT: process.env.APP_PORT || 3000,
    USDT_CONTRACT: process.env.USDT_CONTRACT || USDT_ADDRESS,
  };
}
