/**
 * WealthOS - Password Blocklist
 * Common weak passwords that should be rejected regardless of length.
 * Source: Compiled from NIST SP 800-63B recommendations + common breach lists.
 *
 * AUTH-01: Senha deve ter 12+ caracteres E não estar nesta blocklist.
 */

export const PASSWORD_BLOCKLIST = new Set([
  "123456789012",
  "1234567890123",
  "password1234",
  "passwordpassword",
  "qwerty123456",
  "qwertyqwerty",
  "abcdefghijkl",
  "abcdef123456",
  "letmeinletmein",
  "welcomewelcome",
  "trustno1trust",
  "iloveyou1234",
  "sunshine1234",
  "princess1234",
  "football1234",
  "charlie12345",
  "shadow123456",
  "master123456",
  "dragon123456",
  "monkey1234567",
  "qwerty1234567",
  "abc123456789",
  "mustang12345",
  "michael12345",
  "passw0rd1234",
  "admin1234567",
  "senha1234567",
  "senha12345678",
  "wealthos1234",
  "123456123456",
  "111111111111",
  "000000000000",
  "aaaaaaaaaaaa",
  "changeme1234",
  "default12345",
  "password12345",
  "p@ssword1234",
  "p@ssw0rd1234",
]);

/**
 * Check if password is in the blocklist.
 * Comparison is case-insensitive.
 */
export function isPasswordBlocked(password: string): boolean {
  return PASSWORD_BLOCKLIST.has(password.toLowerCase());
}
