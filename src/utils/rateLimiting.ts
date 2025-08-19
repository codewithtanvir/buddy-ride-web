// Rate limiting utilities for preventing abuse
// This is a client-side rate limiter - should be backed by server-side rate limiting

interface RateLimitEntry {
  count: number;
  lastReset: number;
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(windowMs: number = 60000, maxRequests: number = 10) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  public isAllowed(key: string): boolean {
    const now = Date.now();
    const entry = this.limits.get(key);

    if (!entry || now - entry.lastReset > this.windowMs) {
      // First request or window has expired
      this.limits.set(key, { count: 1, lastReset: now });
      return true;
    }

    if (entry.count >= this.maxRequests) {
      return false;
    }

    entry.count++;
    return true;
  }

  public getRemainingRequests(key: string): number {
    const entry = this.limits.get(key);
    if (!entry) return this.maxRequests;

    const now = Date.now();
    if (now - entry.lastReset > this.windowMs) {
      return this.maxRequests;
    }

    return Math.max(0, this.maxRequests - entry.count);
  }

  public getTimeUntilReset(key: string): number {
    const entry = this.limits.get(key);
    if (!entry) return 0;

    const now = Date.now();
    const timeElapsed = now - entry.lastReset;

    if (timeElapsed >= this.windowMs) return 0;

    return this.windowMs - timeElapsed;
  }
}

// Rate limiters for different actions
export const messageRateLimiter = new RateLimiter(60000, 20); // 20 messages per minute
export const requestRateLimiter = new RateLimiter(300000, 5); // 5 ride requests per 5 minutes
export const passwordResetRateLimiter = new RateLimiter(3600000, 3); // 3 password resets per hour

// Helper function to check if an action is rate limited
export const checkRateLimit = (
  rateLimiter: RateLimiter,
  userId: string,
  action: string
): { allowed: boolean; message?: string } => {
  if (!rateLimiter.isAllowed(userId)) {
    const timeUntilReset = rateLimiter.getTimeUntilReset(userId);
    const minutes = Math.ceil(timeUntilReset / 60000);

    return {
      allowed: false,
      message: `Too many ${action} attempts. Please wait ${minutes} minute(s) before trying again.`,
    };
  }

  return { allowed: true };
};

// Content filtering for messages and ride descriptions
export const containsInappropriateContent = (content: string): boolean => {
  const inappropriateWords = [
    "spam",
    "scam",
    "fake",
    "fraud",
    "phishing",
    "money",
    "cash",
    "payment",
    "bank",
    "credit",
    "drugs",
    "alcohol",
    "illegal",
  ];

  const lowercaseContent = content.toLowerCase();
  return inappropriateWords.some((word) => lowercaseContent.includes(word));
};

// Phone number extractor and validator for Bangladesh
export const extractPhoneNumbers = (text: string): string[] => {
  const phoneRegex = /(?:\+88)?01[3-9]\d{8}/g;
  return text.match(phoneRegex) || [];
};

export const containsPhoneNumber = (text: string): boolean => {
  return extractPhoneNumbers(text).length > 0;
};

// URL extractor for preventing link spam
export const extractUrls = (text: string): string[] => {
  const urlRegex = /https?:\/\/[^\s]+/g;
  return text.match(urlRegex) || [];
};

export const containsUrls = (text: string): boolean => {
  return extractUrls(text).length > 0;
};

// Comprehensive content validation
export const validateMessageContent = (
  content: string
): {
  valid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (!content.trim()) {
    errors.push("Message cannot be empty");
    return { valid: false, errors };
  }

  if (content.length > 1000) {
    errors.push("Message cannot be longer than 1000 characters");
  }

  if (containsInappropriateContent(content)) {
    errors.push("Message contains inappropriate content");
  }

  if (containsUrls(content)) {
    errors.push("Messages cannot contain URLs for security reasons");
  }

  // Allow phone numbers but warn about privacy
  if (containsPhoneNumber(content)) {
    errors.push(
      "Warning: Consider sharing contact details only after establishing trust"
    );
  }

  return {
    valid:
      errors.length === 0 ||
      (errors.length === 1 && errors[0].startsWith("Warning:")),
    errors,
  };
};

export default {
  messageRateLimiter,
  requestRateLimiter,
  passwordResetRateLimiter,
  checkRateLimit,
  validateMessageContent,
  containsInappropriateContent,
  containsPhoneNumber,
  containsUrls,
};
