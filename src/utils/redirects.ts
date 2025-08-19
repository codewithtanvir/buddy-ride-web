// Redirect utilities for authentication and other navigation

/**
 * Get the base URL for the current environment
 * In production, this will be https://aiubgo.app
 * In development, this will be the current origin
 */
export function getBaseUrl(): string {
  // Check if we're in production
  if (import.meta.env.PROD) {
    return "https://aiubgo.app";
  }

  // In development, use the current origin
  return window.location.origin;
}

/**
 * Get the redirect URL for password reset emails
 */
export function getPasswordResetRedirectUrl(): string {
  return `${getBaseUrl()}/reset-password`;
}

/**
 * Get the redirect URL for email confirmations
 */
export function getEmailConfirmationRedirectUrl(): string {
  return `${getBaseUrl()}/auth/callback`;
}

/**
 * Get the redirect URL for OAuth providers (if used in future)
 */
export function getOAuthRedirectUrl(): string {
  return `${getBaseUrl()}/auth/callback`;
}

/**
 * Get the profile setup redirect URL
 */
export function getProfileSetupRedirectUrl(): string {
  return `${getBaseUrl()}/profile-setup`;
}

/**
 * Utility to build absolute URLs for the app
 */
export function buildAppUrl(path: string): string {
  const baseUrl = getBaseUrl();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}

/**
 * Check if the current environment is production
 */
export function isProduction(): boolean {
  return import.meta.env.PROD;
}

/**
 * Check if the current environment is development
 */
export function isDevelopment(): boolean {
  return import.meta.env.DEV;
}

/**
 * Get environment-specific configuration
 */
export function getEnvironmentConfig() {
  const base = getBaseUrl();

  return {
    baseUrl: base,
    authCallbackUrl: `${base}/auth/callback`,
    passwordResetUrl: `${base}/reset-password`,
    profileSetupUrl: `${base}/profile-setup`,
    isProduction: isProduction(),
    isDevelopment: isDevelopment(),
  };
}

// Export commonly used URLs
export const REDIRECT_URLS = {
  passwordReset: getPasswordResetRedirectUrl(),
  emailConfirmation: getEmailConfirmationRedirectUrl(),
  oauthCallback: getOAuthRedirectUrl(),
  profileSetup: getProfileSetupRedirectUrl(),
} as const;
