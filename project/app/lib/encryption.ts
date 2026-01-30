import crypto from "crypto";

// Support both Node.js (server) and Vite (client) environments
const getEncryptionKey = (): string => {
  // Try Node.js environment first (server-side)
  if (typeof process !== 'undefined' && process.env) {
    return process.env.ENCRYPTION_KEY || process.env.VITE_ENCRYPTION_KEY || crypto.randomBytes(32).toString("hex");
  }
  // Fallback to Vite environment (client-side - though encryption should only happen server-side)
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env.ENCRYPTION_KEY || import.meta.env.VITE_ENCRYPTION_KEY || crypto.randomBytes(32).toString("hex");
  }
  // Last resort fallback
  return crypto.randomBytes(32).toString("hex");
};

const ALGORITHM = "aes-256-cbc";
const ENCRYPTION_KEY = getEncryptionKey();
const IV_LENGTH = 16;

/**
 * Encrypt sensitive data using AES-256-CBC
 * This should only be called server-side
 */
export function encrypt(text: string): string {
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    // Ensure we have a valid 32-byte key
    const keyBuffer = Buffer.from(ENCRYPTION_KEY.slice(0, 64), "hex");
    const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv);

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    return `${iv.toString("hex")}:${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error(`Failed to encrypt data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Decrypt encrypted data
 * This should only be called server-side
 */
export function decrypt(encryptedData: string): string {
  try {
    const parts = encryptedData.split(":");
    if (parts.length !== 2) {
      throw new Error("Invalid encrypted data format");
    }
    
    const iv = Buffer.from(parts[0], "hex");
    const encryptedText = parts[1];
    // Ensure we have a valid 32-byte key
    const keyBuffer = Buffer.from(ENCRYPTION_KEY.slice(0, 64), "hex");

    const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, iv);

    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error(`Failed to decrypt data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
