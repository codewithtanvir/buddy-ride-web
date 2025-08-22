// Error monitoring and analytics utilities

import { validateAndGetConfig } from "./environment";
import { sanitizeError } from "./security";

export interface ErrorReport {
  id: string;
  timestamp: string;
  error: {
    message: string;
    stack?: string;
    name: string;
  };
  context: {
    url: string;
    userAgent: string;
    userId?: string;
    sessionId: string;
    environment: string;
    version: string;
  };
  metadata?: Record<string, any>;
}

export interface PerformanceMetric {
  id: string;
  timestamp: string;
  metric: string;
  value: number;
  unit: string;
  context: {
    url: string;
    environment: string;
    version: string;
  };
}

class ErrorMonitor {
  private config: ReturnType<typeof validateAndGetConfig>;
  private sessionId: string;
  private errorQueue: ErrorReport[] = [];
  private performanceQueue: PerformanceMetric[] = [];
  private isOnline: boolean = navigator.onLine;

  constructor() {
    this.config = validateAndGetConfig();
    this.sessionId = this.generateSessionId();
    this.initializeEventListeners();
    this.initializePerformanceMonitoring();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeEventListeners(): void {
    // Global error handler
    window.addEventListener("error", (event) => {
      this.captureError(event.error, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener("unhandledrejection", (event) => {
      this.captureError(event.reason, {
        type: "unhandledrejection",
      });
    });

    // Network status monitoring
    window.addEventListener("online", () => {
      this.isOnline = true;
      this.flushErrorQueue();
      this.flushPerformanceQueue();
    });

    window.addEventListener("offline", () => {
      this.isOnline = false;
    });

    // Page visibility for analytics
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        this.capturePageView();
      }
    });
  }

  private initializePerformanceMonitoring(): void {
    // Monitor core web vitals
    if ("PerformanceObserver" in window) {
      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.capturePerformanceMetric("LCP", lastEntry.startTime, "ms");
      });

      try {
        lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });
      } catch (e) {
        // LCP not supported
      }

      // First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          this.capturePerformanceMetric(
            "FID",
            entry.processingStart - entry.startTime,
            "ms"
          );
        });
      });

      try {
        fidObserver.observe({ entryTypes: ["first-input"] });
      } catch (e) {
        // FID not supported
      }

      // Cumulative Layout Shift
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        this.capturePerformanceMetric("CLS", clsValue, "score");
      });

      try {
        clsObserver.observe({ entryTypes: ["layout-shift"] });
      } catch (e) {
        // CLS not supported
      }
    }

    // Navigation timing
    window.addEventListener("load", () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType(
          "navigation"
        )[0] as PerformanceNavigationTiming;
        if (navigation) {
          this.capturePerformanceMetric(
            "DOMContentLoaded",
            navigation.domContentLoadedEventEnd -
              navigation.domContentLoadedEventStart,
            "ms"
          );
          this.capturePerformanceMetric(
            "LoadEvent",
            navigation.loadEventEnd - navigation.loadEventStart,
            "ms"
          );
          this.capturePerformanceMetric(
            "TimeToInteractive",
            navigation.domInteractive - navigation.fetchStart,
            "ms"
          );
        }
      }, 1000);
    });
  }

  public captureError(error: unknown, metadata?: Record<string, any>): string {
    const errorId = `error_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const errorReport: ErrorReport = {
      id: errorId,
      timestamp: new Date().toISOString(),
      error: {
        message: sanitizeError(error),
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : "Unknown",
      },
      context: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        sessionId: this.sessionId,
        environment: this.config.environment,
        version: this.config.version,
      },
      metadata,
    };

    // Add to queue
    this.errorQueue.push(errorReport);

    // Log to console in development
    if (this.config.environment === "development") {
      console.error("Error captured:", errorReport);
    }

    // Try to send immediately if online
    if (this.isOnline && this.config.enableAnalytics) {
      this.sendErrorReport(errorReport);
    }

    return errorId;
  }

  public capturePerformanceMetric(
    metric: string,
    value: number,
    unit: string
  ): void {
    const performanceMetric: PerformanceMetric = {
      id: `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      metric,
      value,
      unit,
      context: {
        url: window.location.href,
        environment: this.config.environment,
        version: this.config.version,
      },
    };

    this.performanceQueue.push(performanceMetric);

    // Log in development
    if (this.config.environment === "development") {
      console.log(`Performance metric - ${metric}: ${value}${unit}`);
    }

    // Try to send if online and analytics enabled
    if (this.isOnline && this.config.enableAnalytics) {
      this.sendPerformanceMetric(performanceMetric);
    }
  }

  public capturePageView(): void {
    if (this.config.enableAnalytics) {
      this.captureEvent("page_view", {
        url: window.location.href,
        title: document.title,
        referrer: document.referrer,
      });
    }
  }

  public captureEvent(
    eventName: string,
    properties?: Record<string, any>
  ): void {
    if (!this.config.enableAnalytics) {
      return;
    }

    const event = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      event: eventName,
      properties: {
        ...properties,
        sessionId: this.sessionId,
        url: window.location.href,
        environment: this.config.environment,
        version: this.config.version,
      },
    };

    // Log in development
    if (this.config.environment === "development") {
      console.log("Event captured:", event);
    }

    // TODO: Integrate with analytics service when available
    if (this.isOnline) {
      this.sendEvent(event);
    }
  }

  private async sendErrorReport(errorReport: ErrorReport): Promise<void> {
    try {
      // In a real application, this would send to your error tracking service
      // For now, we'll just log and remove from queue
      if (this.config.environment === "development") {
        console.log("Sending error report:", errorReport);
      }

      // Remove from queue on successful send
      this.errorQueue = this.errorQueue.filter(
        (report) => report.id !== errorReport.id
      );
    } catch (error) {
      console.error("Failed to send error report:", error);
    }
  }

  private async sendPerformanceMetric(
    metric: PerformanceMetric
  ): Promise<void> {
    try {
      // In a real application, this would send to your analytics service
      if (this.config.environment === "development") {
        console.log("Sending performance metric:", metric);
      }

      // Remove from queue on successful send
      this.performanceQueue = this.performanceQueue.filter(
        (m) => m.id !== metric.id
      );
    } catch (error) {
      console.error("Failed to send performance metric:", error);
    }
  }

  private async sendEvent(event: any): Promise<void> {
    try {
      // In a real application, this would send to your analytics service
      if (this.config.environment === "development") {
        console.log("Sending event:", event);
      }
    } catch (error) {
      console.error("Failed to send event:", error);
    }
  }

  private flushErrorQueue(): void {
    const errorsToSend = [...this.errorQueue];
    errorsToSend.forEach((error) => this.sendErrorReport(error));
  }

  private flushPerformanceQueue(): void {
    const metricsToSend = [...this.performanceQueue];
    metricsToSend.forEach((metric) => this.sendPerformanceMetric(metric));
  }

  public getSessionId(): string {
    return this.sessionId;
  }

  public getQueuedErrors(): ErrorReport[] {
    return [...this.errorQueue];
  }

  public getQueuedMetrics(): PerformanceMetric[] {
    return [...this.performanceQueue];
  }
}

// Export singleton instance
export const errorMonitor = new ErrorMonitor();

// Convenience functions
export function captureError(
  error: unknown,
  metadata?: Record<string, any>
): string {
  return errorMonitor.captureError(error, metadata);
}

export function captureEvent(
  eventName: string,
  properties?: Record<string, any>
): void {
  errorMonitor.captureEvent(eventName, properties);
}

export function capturePerformanceMetric(
  metric: string,
  value: number,
  unit: string
): void {
  errorMonitor.capturePerformanceMetric(metric, value, unit);
}
