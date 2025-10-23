import { ethers } from "ethers";

/**
 * Minimal ERC20 ABI
 */
const ERC20_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
];

/**
 * Get ERC20 contract instance
 */
export function getERC20Contract(tokenAddress, providerOrSigner) {
  return new ethers.Contract(tokenAddress, ERC20_ABI, providerOrSigner);
}

/**
 * Get ERC20 balance of a wallet
 */
export async function getERC20Balance(tokenAddress, walletAddress, provider) {
  const token = getERC20Contract(tokenAddress, provider);
  const balance = await token.balanceOf(walletAddress);
  return balance;
}

/**
 * Sweep ERC20 tokens from a wallet to the hot wallet
 * Returns the transaction hash
 */
export async function sweepERC20(tokenAddress, wallet, hotWallet) {
  const token = getERC20Contract(tokenAddress, wallet);

  const balance = await token.balanceOf(wallet.address);
  if (balance === 0n) {
    console.log(`No ERC20 balance in ${wallet.address} for token ${tokenAddress}`);
    return null;
  }

  const decimals = await token.decimals();
  const humanReadable = ethers.formatUnits(balance, decimals);

  console.log(`Sweeping ${humanReadable} tokens from ${wallet.address} to hot wallet ${hotWallet}...`);

  const tx = await token.transfer(hotWallet, balance);
  await tx.wait();

  console.log(`✅ ERC20 sweep complete | Tx: ${tx.hash}`);
  return tx.hash; // <-- always return tx.hash
}
