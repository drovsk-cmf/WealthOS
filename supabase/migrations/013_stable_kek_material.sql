-- Migration 013: S1 - Redesenhar KEK
-- Problema: KEK derivada de JWT efêmero causava risco de perda da DEK em token refresh.
-- Solução: KEK agora derivada de kek_material estável (random 256 bits, gerado no onboarding).
--
-- Como não há dados criptografados no ambiente atual, limpamos encrypted_dek/iv
-- para forçar re-inicialização no próximo login.

-- 1. Adicionar coluna para material estável da KEK
ALTER TABLE public.users_profile
  ADD COLUMN IF NOT EXISTS kek_material TEXT;

-- 2. Limpar DEK antiga (incompatível com novo esquema de derivação)
-- Isso força o app a re-inicializar a criptografia no próximo login.
UPDATE public.users_profile
  SET encryption_key_encrypted = NULL,
      encryption_key_iv = NULL
  WHERE encryption_key_encrypted IS NOT NULL;

-- 3. Comentário para documentação
COMMENT ON COLUMN public.users_profile.kek_material IS
  'Material estável para derivação da KEK via HKDF. Gerado uma vez no onboarding. Base64-encoded 256 bits.';
