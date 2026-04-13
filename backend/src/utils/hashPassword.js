import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';

/**
 * Hash a plain-text password using a random per-user salt (bcrypt) with an
 * application-level pepper prepended before hashing.
 *
 * The pepper is read from env.passwordPepper (PASSWORD_PEPPER env var).
 * Salt rounds default to 12 (BCRYPT_SALT_ROUNDS env var).
 *
 * Security properties:
 *  - Random per-user salt: bcrypt.genSalt generates a new random salt every
 *    call, so identical passwords produce different hashes in the DB.
 *  - Application pepper: a secret stored in app config (not DB), so a DB
 *    breach alone is insufficient to crack passwords offline.
 */
export async function hashPassword(plainText) {
  const pepper = env.passwordPepper;
  const pepperedPassword = pepper ? pepper + plainText : plainText;
  const salt = await bcrypt.genSalt(env.bcryptSaltRounds);
  return bcrypt.hash(pepperedPassword, salt);
}

export async function verifyPassword(plainText, hash) {
  const pepper = env.passwordPepper;
  const pepperedPassword = pepper ? pepper + plainText : plainText;
  return bcrypt.compare(pepperedPassword, hash);
}
