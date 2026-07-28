import argon2 from 'argon2';
import crypto from 'node:crypto';

/**
 * Hashes a plaintext password using Argon2id with high security parameters.
 */
export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536, // 64 MB
    timeCost: 3,
    parallelism: 4,
  });
}

/**
 * Verifies a plaintext password against an Argon2id hash.
 */
export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}

/**
 * Generates a SHA-256 hash of a string (e.g. refresh token) for database storage.
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
