/**
 * WealthOS - Encryption Manager
 *
 * Gerencia o ciclo de vida da DEK (Data Encryption Key):
 * - Onboarding: gera kek_material + DEK, deriva KEK, armazena tudo no profile
 * - Login: busca kek_material + encrypted_dek, deriva KEK, decripta DEK para memória
 * - Logout/Timeout: limpa DEK da memória
 *
 * KEK é derivada de kek_material (random 256 bits, estável) via HKDF.
 * Diferente do design anterior (JWT efêmero), não há necessidade de
 * re-encriptar a DEK em token refresh.
 *
 * Ref: S1 saneamento (2026-03-10), Adendo v1.1 seção 3.2-3.5
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  generateDEK,
  deriveKEK,
  wrapDEK,
  unwrapDEK,
} from "@/lib/crypto/index";

type AnySupabaseClient = SupabaseClient<any, any, any>;

// In-memory DEK reference (cleared on logout/timeout)
let activeDEK: CryptoKey | null = null;

// Salt for HKDF (fixed per-app, not secret)
const HKDF_SALT = new TextEncoder().encode("wealthos-kek-salt-v2");

/**
 * Gera 256 bits aleatórios e retorna como base64.
 * Usado uma vez no onboarding para criar o kek_material.
 */
function generateKekMaterial(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(Array.from(bytes, (b) => String.fromCharCode(b)).join(""));
}

/**
 * Gera e armazena kek_material + DEK durante o onboarding.
 * Passo: gera kek_material → gera DEK → deriva KEK → wrap DEK → salva no profile.
 */
export async function initializeEncryption(
  supabase: AnySupabaseClient
): Promise<void> {
  // 1. Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não encontrado.");

  // 2. Generate stable KEK material (random 256 bits)
  const kekMaterial = generateKekMaterial();

  // 3. Generate fresh DEK
  const dek = await generateDEK();

  // 4. Derive KEK from stable material
  const kek = await deriveKEK(kekMaterial, HKDF_SALT);

  // 5. Wrap (encrypt) DEK with KEK
  const { encrypted, iv } = await wrapDEK(dek, kek);

  // 6. Store kek_material + encrypted DEK in users_profile
  const { error } = await supabase
    .from("users_profile")
    .update({
      kek_material: kekMaterial,
      encryption_key_encrypted: encrypted,
      encryption_key_iv: iv,
    })
    .eq("id", user.id);

  if (error) {
    throw new Error(`Erro ao salvar chave de criptografia: ${error.message}`);
  }

  // 7. Keep DEK in memory
  activeDEK = dek;
}

/**
 * Carrega e decripta a DEK na memória após login.
 *
 * Se kek_material estiver ausente (migração de schema antigo),
 * re-inicializa a criptografia automaticamente.
 */
export async function loadEncryptionKey(
  supabase: AnySupabaseClient
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: profile } = await supabase
    .from("users_profile")
    .select("kek_material, encryption_key_encrypted, encryption_key_iv")
    .eq("id", user.id)
    .single();

  // Caso 1: kek_material ausente → re-inicializar (migração de JWT → material estável)
  if (!profile?.kek_material) {
    console.warn("[WealthOS] kek_material ausente. Re-inicializando criptografia.");
    await initializeEncryption(supabase);
    return;
  }

  // Caso 2: DEK não inicializada ainda (não deveria acontecer após onboarding)
  if (!profile.encryption_key_encrypted || !profile.encryption_key_iv) {
    console.warn("[WealthOS] DEK ausente. Re-inicializando criptografia.");
    await initializeEncryption(supabase);
    return;
  }

  // Caso 3: normal - derivar KEK e decriptar DEK
  const kek = await deriveKEK(profile.kek_material, HKDF_SALT);
  activeDEK = await unwrapDEK(
    profile.encryption_key_encrypted,
    profile.encryption_key_iv,
    kek
  );
}

/**
 * Retorna a DEK ativa (em memória).
 * Null se não estiver carregada.
 */
export function getActiveDEK(): CryptoKey | null {
  return activeDEK;
}

/**
 * Limpa a DEK da memória (logout/timeout).
 */
export function clearEncryptionKey(): void {
  activeDEK = null;
}
