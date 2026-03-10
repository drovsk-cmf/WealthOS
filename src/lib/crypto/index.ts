/**
 * Oniefy E2E Encryption Module
 *
 * Strategy: Random DEK (Data Encryption Key) protected by stable KEK.
 * - DEK: AES-256-GCM key, generated once per user, stored encrypted in users_profile
 * - KEK: derived from stable kek_material (random 256 bits) via HKDF (Web Crypto API)
 * - kek_material: generated once during onboarding, stored in users_profile
 * - Fields encrypted: cpf_encrypted, notes_encrypted, details_encrypted
 *
 * Implementation: Web Crypto API (native, no external deps)
 * Compatibility: All modern browsers + WKWebView (Capacitor iOS)
 *
 * Source: wealthos-adendo-v1.1.docx section 3
 */

const ALGORITHM = "AES-GCM";
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits for AES-GCM

/**
 * Generate a new Data Encryption Key (DEK).
 * Called once during user onboarding.
 */
export async function generateDEK(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: ALGORITHM, length: KEY_LENGTH },
    true, // extractable for storage
    ["encrypt", "decrypt"]
  );
}

/**
 * Derive a Key Encryption Key (KEK) from stable user-specific material.
 * Uses HKDF with SHA-256.
 *
 * O material de entrada é um valor aleatório de 256 bits (base64) gerado
 * uma vez no onboarding e armazenado em users_profile.kek_material.
 * Diferente do design anterior (JWT efêmero), este material nunca rotaciona,
 * eliminando o risco de perda da DEK em token refresh.
 */
export async function deriveKEK(
  kekMaterial: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  // Decode base64 kekMaterial to raw bytes
  const rawBytes = Uint8Array.from(atob(kekMaterial), (c) => c.charCodeAt(0));

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    rawBytes,
    "HKDF",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt,
      info: new TextEncoder().encode("wealthos-e2e-kek-v2"),
    } as HkdfParams,
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH } as AesKeyGenParams,
    false,
    ["wrapKey", "unwrapKey"]
  );
}

/**
 * Encrypt a plaintext field using the DEK.
 * Returns base64-encoded ciphertext with IV prepended.
 */
export async function encryptField(
  plaintext: string,
  dek: CryptoKey
): Promise<string> {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    dek,
    encoder.encode(plaintext)
  );

  // Prepend IV to ciphertext
  const combined = new Uint8Array(iv.length + new Uint8Array(ciphertext).length);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);

  return btoa(Array.from(combined, (b) => String.fromCharCode(b)).join(""));
}

/**
 * Decrypt a field using the DEK.
 * Expects base64-encoded ciphertext with IV prepended.
 */
export async function decryptField(
  encryptedBase64: string,
  dek: CryptoKey
): Promise<string> {
  const combined = Uint8Array.from(atob(encryptedBase64), (c) =>
    c.charCodeAt(0)
  );

  const iv = combined.slice(0, IV_LENGTH);
  const ciphertext = combined.slice(IV_LENGTH);

  const plaintext = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    dek,
    ciphertext
  );

  return new TextDecoder().decode(plaintext);
}

/**
 * Export DEK as wrapped (encrypted) key for storage in users_profile.
 */
export async function wrapDEK(
  dek: CryptoKey,
  kek: CryptoKey
): Promise<{ encrypted: string; iv: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  const wrappedKey = await crypto.subtle.wrapKey("raw", dek, kek, {
    name: ALGORITHM,
    iv,
  });

  return {
    encrypted: btoa(Array.from(new Uint8Array(wrappedKey), (b) => String.fromCharCode(b)).join("")),
    iv: btoa(Array.from(iv, (b) => String.fromCharCode(b)).join("")),
  };
}

/**
 * Import DEK from wrapped (encrypted) key stored in users_profile.
 */
export async function unwrapDEK(
  encryptedKey: string,
  iv: string,
  kek: CryptoKey
): Promise<CryptoKey> {
  const wrappedKeyBuffer = Uint8Array.from(atob(encryptedKey), (c) =>
    c.charCodeAt(0)
  );
  const ivBuffer = Uint8Array.from(atob(iv), (c) => c.charCodeAt(0));

  return crypto.subtle.unwrapKey(
    "raw",
    wrappedKeyBuffer,
    kek,
    { name: ALGORITHM, iv: ivBuffer },
    { name: ALGORITHM, length: KEY_LENGTH },
    true,
    ["encrypt", "decrypt"]
  );
}
