// Production health check utilities

import { supabase } from "../lib/supabase";
import { validateAndGetConfig } from "./environment";

export interface HealthCheckResult {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  checks: {
    database: HealthStatus;
    environment: HealthStatus;
    version: HealthStatus;
  };
  metadata: {
    version: string;
    environment: string;
    userAgent: string;
  };
}

interface HealthStatus {
  status: "pass" | "warn" | "fail";
  message: string;
  responseTime?: number;
}

export async function performHealthCheck(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  let config;
  try {
    config = validateAndGetConfig();
  } catch (error) {
    return {
      status: "unhealthy",
      timestamp,
      checks: {
        database: {
          status: "fail",
          message: "Skipped due to environment error",
        },
        environment: {
          status: "fail",
          message:
            error instanceof Error
              ? error.message
              : "Environment validation failed",
        },
        version: { status: "fail", message: "Unable to determine version" },
      },
      metadata: {
        version: "unknown",
        environment: "unknown",
        userAgent: navigator.userAgent,
      },
    };
  }

  // Check database connectivity
  const databaseCheck = await checkDatabase();

  // Check environment configuration
  const environmentCheck = checkEnvironment(config);

  // Check version information
  const versionCheck = checkVersion(config);

  // Determine overall status
  const allChecks = [databaseCheck, environmentCheck, versionCheck];
  const failedChecks = allChecks.filter((check) => check.status === "fail");
  const warningChecks = allChecks.filter((check) => check.status === "warn");

  let overallStatus: "healthy" | "degraded" | "unhealthy";
  if (failedChecks.length > 0) {
    overallStatus = "unhealthy";
  } else if (warningChecks.length > 0) {
    overallStatus = "degraded";
  } else {
    overallStatus = "healthy";
  }

  return {
    status: overallStatus,
    timestamp,
    checks: {
      database: databaseCheck,
      environment: environmentCheck,
      version: versionCheck,
    },
    metadata: {
      version: config.version,
      environment: config.environment,
      userAgent: navigator.userAgent,
    },
  };
}

async function checkDatabase(): Promise<HealthStatus> {
  const startTime = Date.now();

  try {
    // Simple query to test database connectivity
    const { data, error } = await supabase
      .from("profiles")
      .select("count")
      .limit(1)
      .single();

    const responseTime = Date.now() - startTime;

    if (error) {
      return {
        status: "fail",
        message: `Database query failed: ${error.message}`,
        responseTime,
      };
    }

    if (responseTime > 5000) {
      return {
        status: "warn",
        message: `Database response time is high: ${responseTime}ms`,
        responseTime,
      };
    }

    return {
      status: "pass",
      message: "Database connection successful",
      responseTime,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      status: "fail",
      message: `Database connection failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      responseTime,
    };
  }
}

function checkEnvironment(
  config: ReturnType<typeof validateAndGetConfig>
): HealthStatus {
  try {
    // Check if running in production with appropriate settings
    if (config.environment === "production") {
      if (config.logLevel !== "error" && config.logLevel !== "warn") {
        return {
          status: "warn",
          message: "Production environment using non-production log level",
        };
      }

      if (config.supabaseUrl.includes("localhost")) {
        return {
          status: "fail",
          message: "Production environment using localhost URLs",
        };
      }
    }

    // Check if all required environment variables are present
    if (!config.supabaseUrl || !config.supabaseAnonKey) {
      return {
        status: "fail",
        message: "Missing required environment variables",
      };
    }

    return {
      status: "pass",
      message: "Environment configuration is valid",
    };
  } catch (error) {
    return {
      status: "fail",
      message: `Environment check failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
}

function checkVersion(
  config: ReturnType<typeof validateAndGetConfig>
): HealthStatus {
  try {
    const version = config.version;

    if (!version) {
      return {
        status: "warn",
        message: "Application version not specified",
      };
    }

    // Basic version format validation (semantic versioning)
    const versionRegex = /^\d+\.\d+\.\d+/;
    if (!versionRegex.test(version)) {
      return {
        status: "warn",
        message: "Application version format is not semantic versioning",
      };
    }

    return {
      status: "pass",
      message: `Application version: ${version}`,
    };
  } catch (error) {
    return {
      status: "fail",
      message: `Version check failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
}

// Export health check endpoint for production monitoring
export async function healthCheckEndpoint(): Promise<Response> {
  try {
    const healthResult = await performHealthCheck();

    const statusCode =
      healthResult.status === "healthy"
        ? 200
        : healthResult.status === "degraded"
        ? 200
        : 503;

    return new Response(JSON.stringify(healthResult, null, 2), {
      status: statusCode,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    const errorResponse = {
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      checks: {
        database: { status: "fail", message: "Health check failed" },
        environment: { status: "fail", message: "Health check failed" },
        version: { status: "fail", message: "Health check failed" },
      },
      metadata: {
        version: "unknown",
        environment: "unknown",
        userAgent: navigator.userAgent,
      },
      error: error instanceof Error ? error.message : "Unknown error",
    };

    return new Response(JSON.stringify(errorResponse, null, 2), {
      status: 503,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  }
}
