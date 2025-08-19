import React, { useState, useEffect } from "react";
import { X, Download, Smartphone, Monitor, Zap } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showDetailedPrompt, setShowDetailedPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: BeforeInstallPromptEvent) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Save the event so it can be triggered later
      setDeferredPrompt(e);

      // Show after a small delay to let users get familiar with the app
      setTimeout(() => {
        setShowInstallPrompt(true);
      }, 5000); // Show after 5 seconds
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Check if app is already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setShowInstallPrompt(false);
    }

    // Also check if user has interacted with the app significantly
    const interactionCount = parseInt(
      localStorage.getItem("user-interactions") || "0"
    );
    if (interactionCount > 3) {
      // User has used the app, show install prompt after delay
      setTimeout(() => {
        if (
          deferredPrompt &&
          !window.matchMedia("(display-mode: standalone)").matches
        ) {
          setShowInstallPrompt(true);
        }
      }, 3000);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, [deferredPrompt]);

  // Track user interactions
  useEffect(() => {
    const trackInteraction = () => {
      const count = parseInt(localStorage.getItem("user-interactions") || "0");
      localStorage.setItem("user-interactions", (count + 1).toString());
    };

    // Track various user interactions
    const events = ["click", "scroll", "keydown"];
    events.forEach((event) => {
      document.addEventListener(event, trackInteraction, { once: true });
    });

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, trackInteraction);
      });
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Show the install prompt
      deferredPrompt.prompt();
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);

      // Track the outcome
      localStorage.setItem("pwa-install-outcome", outcome);
      localStorage.setItem("pwa-install-date", Date.now().toString());

      // Clear the saved prompt since it can't be used again
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
      setShowDetailedPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    setShowDetailedPrompt(false);
    // Store dismissal in localStorage to avoid showing again for a while
    localStorage.setItem("pwa-install-dismissed", Date.now().toString());
  };

  const handleShowDetails = () => {
    setShowDetailedPrompt(true);
  };

  // Don't show if user dismissed recently (within 7 days)
  const lastDismissed = localStorage.getItem("pwa-install-dismissed");
  if (
    lastDismissed &&
    Date.now() - parseInt(lastDismissed) < 7 * 24 * 60 * 60 * 1000
  ) {
    return null;
  }

  // Don't show if user already installed or declined recently
  const lastOutcome = localStorage.getItem("pwa-install-outcome");
  if (lastOutcome === "accepted" || lastOutcome === "dismissed") {
    const lastInstallDate = localStorage.getItem("pwa-install-date");
    if (
      lastInstallDate &&
      Date.now() - parseInt(lastInstallDate) < 30 * 24 * 60 * 60 * 1000 // 30 days
    ) {
      return null;
    }
  }

  if (!showInstallPrompt || !deferredPrompt) {
    return null;
  }

  // Detailed prompt modal
  if (showDetailedPrompt) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl">
                <Smartphone className="h-8 w-8 text-white" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Install AIUB Go
            </h2>
            <p className="text-gray-600">
              Get the best experience with our mobile app
            </p>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <Zap className="h-5 w-5 text-blue-600" />
              <div>
                <h3 className="font-semibold text-blue-900">Lightning Fast</h3>
                <p className="text-sm text-blue-700">
                  Instant loading, even offline
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <Monitor className="h-5 w-5 text-green-600" />
              <div>
                <h3 className="font-semibold text-green-900">
                  App-like Experience
                </h3>
                <p className="text-sm text-green-700">
                  Full screen, no browser bars
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
              <Download className="h-5 w-5 text-purple-600" />
              <div>
                <h3 className="font-semibold text-purple-900">Quick Access</h3>
                <p className="text-sm text-purple-700">
                  Add to home screen for instant access
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleInstallClick}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg"
            >
              <Download size={18} />
              Install App
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              Not now
            </button>
          </div>

          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    );
  }

  // Compact prompt
  return (
    <div className="fixed bottom-4 left-4 right-4 bg-white border border-gray-200 rounded-xl shadow-2xl p-4 z-50 max-w-sm mx-auto animate-slide-up">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg">
            <Smartphone className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1">
              Install AIUB Go
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Get the app for better experience
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleShowDetails}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium underline"
              >
                Learn more
              </button>
              <button
                onClick={handleInstallClick}
                className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <Download size={14} />
                Install
              </button>
            </div>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
