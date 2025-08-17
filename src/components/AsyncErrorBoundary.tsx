import React, { useState, useEffect, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Card, CardContent } from "./ui/Card";
import { Button } from "./ui/Button";

interface AsyncErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, retry: () => void) => ReactNode;
}

export function AsyncErrorBoundary({
  children,
  fallback,
}: AsyncErrorBoundaryProps) {
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error("Unhandled promise rejection:", event.reason);
      setError(new Error(event.reason?.message || "An async error occurred"));
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection
      );
    };
  }, []);

  const retry = () => {
    setError(null);
  };

  if (error) {
    if (fallback) {
      return fallback(error, retry);
    }

    return (
      <div className="p-4">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-red-800 font-medium">Something went wrong</p>
                <p className="text-red-600 text-sm mt-1">
                  {error.message || "An unexpected error occurred"}
                </p>
              </div>
              <Button
                onClick={retry}
                variant="outline"
                size="sm"
                className="flex items-center gap-1 text-red-700 border-red-300 hover:bg-red-100"
              >
                <RefreshCw className="h-3 w-3" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
