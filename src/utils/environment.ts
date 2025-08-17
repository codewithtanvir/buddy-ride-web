// Environment validation utilities

interface EnvironmentConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  environment: "development" | "production" | "test";
  logLevel: "error" | "warn" | "info" | "debug";
}

class EnvironmentError extends Error {
  constructor(message: string) {
    super(`Environment Configuration Error: ${message}`);
    this.name = "EnvironmentError";
  }
}

function validateRequiredEnvVar(
  name: string,
  value: string | undefined
): string {
  if (!value || value.trim() === "") {
    throw new EnvironmentError(
      `Missing required environment variable: ${name}`
    );
  }
  return value.trim();
}

function validateUrl(name: string, url: string): string {
  try {
    new URL(url);
    return url;
  } catch {
    throw new EnvironmentError(`Invalid URL format for ${name}: ${url}`);
  }
}

function getEnvironment(): "development" | "production" | "test" {
  const env = import.meta.env.MODE;
  if (env === "development" || env === "production" || env === "test") {
    return env;
  }
  return "development"; // Default fallback
}

function getLogLevel(): "error" | "warn" | "info" | "debug" {
  const level = import.meta.env.VITE_LOG_LEVEL?.toLowerCase();
  if (
    level === "error" ||
    level === "warn" ||
    level === "info" ||
    level === "debug"
  ) {
    return level;
  }
  return getEnvironment() === "production" ? "error" : "debug";
}

export function validateAndGetConfig(): EnvironmentConfig {
  try {
    const supabaseUrl = validateRequiredEnvVar(
      "VITE_SUPABASE_URL",
      import.meta.env.VITE_SUPABASE_URL
    );
    const supabaseAnonKey = validateRequiredEnvVar(
      "VITE_SUPABASE_ANON_KEY",
      import.meta.env.VITE_SUPABASE_ANON_KEY
    );

    // Validate URL format
    validateUrl("VITE_SUPABASE_URL", supabaseUrl);

    // Validate Supabase URL domain (basic check)
    if (
      !supabaseUrl.includes("supabase.co") &&
      !supabaseUrl.includes("localhost")
    ) {
      console.warn(
        "Warning: Supabase URL does not appear to be a standard Supabase domain"
      );
    }

    // Validate anon key format (basic JWT check)
    if (
      !supabaseAnonKey.includes(".") ||
      supabaseAnonKey.split(".").length !== 3
    ) {
      throw new EnvironmentError(
        "VITE_SUPABASE_ANON_KEY does not appear to be a valid JWT token"
      );
    }

    const environment = getEnvironment();
    const logLevel = getLogLevel();

    const config: EnvironmentConfig = {
      supabaseUrl,
      supabaseAnonKey,
      environment,
      logLevel,
    };

    // Log configuration in development
    if (environment === "development") {
      console.log("Environment Configuration:", {
        supabaseUrl,
        supabaseAnonKey: `${supabaseAnonKey.substring(0, 20)}...`,
        environment,
        logLevel,
      });
    }

    return config;
  } catch (error) {
    if (error instanceof EnvironmentError) {
      console.error(error.message);
      throw error;
    }
    throw new EnvironmentError(
      `Unexpected error during environment validation: ${error}`
    );
  }
}

export function isDevelopment(): boolean {
  return getEnvironment() === "development";
}

export function isProduction(): boolean {
  return getEnvironment() === "production";
}

export function shouldLog(level: "error" | "warn" | "info" | "debug"): boolean {
  const currentLevel = getLogLevel();
  const levels = ["error", "warn", "info", "debug"];
  return levels.indexOf(level) <= levels.indexOf(currentLevel);
}

// Enhanced logger with environment-based filtering
export const logger = {
  error: (...args: any[]) => {
    if (shouldLog("error")) console.error(...args);
  },
  warn: (...args: any[]) => {
    if (shouldLog("warn")) console.warn(...args);
  },
  info: (...args: any[]) => {
    if (shouldLog("info")) console.info(...args);
  },
  debug: (...args: any[]) => {
    if (shouldLog("debug")) console.log(...args);
  },
};
