import crypto from 'crypto';
import 'dotenv/config';

const ALGORITHM = 'aes-256-cbc';
const SECRET_KEY = process.env.KEY_ENCRYPTION_SECRET;

if (!SECRET_KEY) {
  throw new Error("KEY_ENCRYPTION_SECRET not set in .env");
}

/**
 * Decrypt an encrypted key using KEY_ENCRYPTION_SECRET
 * Format: iv:ciphertext (hex)
 * @param {string} encryptedKey
 * @returns {string} - Decrypted private key
 */
export function decryptKey(encryptedKey) {
  if (!encryptedKey) throw new Error('No encrypted key provided');

  const parts = encryptedKey.split(':');
  if (parts.length < 2) throw new Error('Invalid encryptedKey format');

  const ivHex = parts[0];
  const ciphertextHex = parts.slice(1).join(':');

  const key = crypto.createHash('sha256').update(SECRET_KEY).digest();
  const iv = Buffer.from(ivHex, 'hex');
  const encryptedText = Buffer.from(ciphertextHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encryptedText, null, 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * Encrypt a private key
 * @param {string} privateKey
 * @returns {string} - iv:ciphertext
 */
export function encryptKey(privateKey) {
  const key = crypto.createHash('sha256').update(SECRET_KEY).digest();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(privateKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}
