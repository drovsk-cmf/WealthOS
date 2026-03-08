/**
 * WealthOS - Auth Module
 *
 * Central exports for all auth-related utilities.
 */

export { isPasswordBlocked } from "./password-blocklist";
export { useSessionTimeout } from "./use-session-timeout";
export { useBiometricAuth } from "./use-biometric";
export {
  getMfaStatus,
  getAssuranceLevel,
  enrollTotp,
  verifyTotpEnrollment,
  challengeAndVerify,
  unenrollTotp,
} from "./mfa";
export type { MfaStatus, MfaEnrollResult } from "./mfa";
export {
  initializeEncryption,
  loadEncryptionKey,
  rotateEncryptionKey,
  getActiveDEK,
  clearEncryptionKey,
} from "./encryption-manager";
