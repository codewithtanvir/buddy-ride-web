// Security utilities for production

export const SECURITY_HEADERS = {
  // Content Security Policy
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://analytics.google.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "media-src 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "upgrade-insecure-requests",
  ].join("; "),

  // Prevent clickjacking
  "X-Frame-Options": "DENY",

  // Prevent MIME type sniffing
  "X-Content-Type-Options": "nosniff",

  // Enable XSS protection
  "X-XSS-Protection": "1; mode=block",

  // HTTPS redirect
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",

  // Referrer policy
  "Referrer-Policy": "strict-origin-when-cross-origin",

  // Permissions policy
  "Permissions-Policy": [
    "accelerometer=()",
    "camera=()",
    "geolocation=(self)",
    "gyroscope=()",
    "magnetometer=()",
    "microphone=()",
    "payment=()",
    "usb=()",
  ].join(", "),
};

export function applySecurityHeaders(): void {
  // Apply CSP meta tag if not already present
  if (!document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
    const metaCSP = document.createElement("meta");
    metaCSP.httpEquiv = "Content-Security-Policy";
    metaCSP.content = SECURITY_HEADERS["Content-Security-Policy"];
    document.head.appendChild(metaCSP);
  }

  // Apply X-Frame-Options meta tag
  if (!document.querySelector('meta[http-equiv="X-Frame-Options"]')) {
    const metaFrameOptions = document.createElement("meta");
    metaFrameOptions.httpEquiv = "X-Frame-Options";
    metaFrameOptions.content = SECURITY_HEADERS["X-Frame-Options"];
    document.head.appendChild(metaFrameOptions);
  }
}

// Input sanitization utilities
export function sanitizeInput(input: string): string {
  if (typeof input !== "string") {
    return "";
  }

  return input
    .replace(/[<>]/g, "") // Remove angle brackets
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/data:/gi, "") // Remove data: protocol
    .trim()
    .slice(0, 1000); // Limit length
}

export function sanitizeUrl(url: string): string {
  if (typeof url !== "string") {
    return "";
  }

  try {
    const parsedUrl = new URL(url);

    // Only allow http and https protocols
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return "";
    }

    return parsedUrl.toString();
  } catch {
    return "";
  }
}

// Rate limiting utilities
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 100, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];

    // Remove old requests outside the window
    const validRequests = requests.filter((time) => now - time < this.windowMs);

    if (validRequests.length >= this.maxRequests) {
      return false;
    }

    validRequests.push(now);
    this.requests.set(identifier, validRequests);

    return true;
  }

  reset(identifier?: string): void {
    if (identifier) {
      this.requests.delete(identifier);
    } else {
      this.requests.clear();
    }
  }
}

export const globalRateLimiter = new RateLimiter();

// Error sanitization
export function sanitizeError(error: unknown): string {
  if (error instanceof Error) {
    // In production, don't expose internal error details
    if (import.meta.env.PROD) {
      // Common user-friendly error messages
      const userFriendlyErrors: Record<string, string> = {
        "Network Error":
          "Unable to connect to the server. Please check your internet connection.",
        Unauthorized: "Your session has expired. Please log in again.",
        Forbidden: "You do not have permission to perform this action.",
        "Not Found": "The requested resource was not found.",
        "Internal Server Error":
          "An unexpected error occurred. Please try again later.",
        "Service Unavailable":
          "The service is temporarily unavailable. Please try again later.",
      };

      return (
        userFriendlyErrors[error.message] ||
        "An unexpected error occurred. Please try again later."
      );
    }

    return error.message;
  }

  if (typeof error === "string") {
    return import.meta.env.PROD ? "An unexpected error occurred." : error;
  }

  return "An unexpected error occurred.";
}

// Secure random string generation
export function generateSecureId(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    ""
  );
}

// Session security utilities
export function validateSession(): boolean {
  try {
    // Check if we're in a secure context for sensitive operations
    if (!window.isSecureContext && import.meta.env.PROD) {
      console.warn("Application is not running in a secure context");
      return false;
    }

    // Check for common security issues
    if (window.location.protocol === "http:" && import.meta.env.PROD) {
      console.warn("Application is not using HTTPS in production");
      return false;
    }

    return true;
  } catch (error) {
    console.error("Session validation failed:", error);
    return false;
  }
}

// Initialize security measures
export function initializeSecurity(): void {
  // Apply security headers
  applySecurityHeaders();

  // Validate session
  validateSession();

  // Disable right-click in production (optional)
  if (import.meta.env.PROD) {
    document.addEventListener("contextmenu", (e) => {
      e.preventDefault();
    });

    // Disable common developer shortcuts
    document.addEventListener("keydown", (e) => {
      if (
        (e.ctrlKey && e.shiftKey && e.code === "KeyI") || // Ctrl+Shift+I
        (e.ctrlKey && e.shiftKey && e.code === "KeyJ") || // Ctrl+Shift+J
        (e.ctrlKey && e.code === "KeyU") || // Ctrl+U
        e.code === "F12" // F12
      ) {
        e.preventDefault();
      }
    });
  }

  console.log("Security measures initialized");
}
