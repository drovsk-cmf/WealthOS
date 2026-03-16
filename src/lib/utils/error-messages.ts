/**
 * Supabase Auth error messages → PT-BR translation map (D7.08)
 *
 * Covers common error codes/messages from GoTrue.
 */

const SUPABASE_ERROR_MAP: Record<string, string> = {
  // Auth errors
  "Invalid login credentials": "Email ou senha inválidos.",
  "Email not confirmed": "Email ainda não confirmado. Verifique sua caixa de entrada.",
  "User already registered": "Este email já está cadastrado.",
  "Password should be at least 6 characters": "A senha deve ter no mínimo 6 caracteres.",
  "Password should be at least 12 characters": "A senha deve ter no mínimo 12 caracteres.",
  "Signup requires a valid password": "Informe uma senha válida.",
  "Unable to validate email address: invalid format": "Formato de email inválido.",
  "Email rate limit exceeded": "Muitas tentativas. Aguarde alguns minutos.",
  "For security purposes, you can only request this once every 60 seconds": "Por segurança, aguarde 60 segundos entre tentativas.",
  "User not found": "Usuário não encontrado.",
  "New password should be different from the old password.": "A nova senha deve ser diferente da senha atual.",
  "Auth session missing!": "Sessão expirada. Faça login novamente.",
  "JWT expired": "Sessão expirada. Faça login novamente.",
  "Invalid Refresh Token: Refresh Token Not Found": "Sessão expirada. Faça login novamente.",
  "invalid claim: missing sub claim": "Sessão inválida. Faça login novamente.",
  // Rate limit
  "Request rate limit reached": "Limite de requisições atingido. Tente novamente em breve.",
  // Generic
  "Network request failed": "Falha na conexão. Verifique sua internet.",
};

export function translateSupabaseError(message: string): string {
  // Exact match first
  if (SUPABASE_ERROR_MAP[message]) return SUPABASE_ERROR_MAP[message];

  // Partial match
  for (const [key, value] of Object.entries(SUPABASE_ERROR_MAP)) {
    if (message.toLowerCase().includes(key.toLowerCase())) return value;
  }

  // Fallback
  return "Ocorreu um erro. Tente novamente.";
}
