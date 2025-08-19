import React, { useState, useEffect } from "react";
import { RefreshCw, X, Download } from "lucide-react";
import toast from "react-hot-toast";

export const PWAUpdatePrompt: React.FC = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(
    null
  );

  useEffect(() => {
    // Listen for PWA update events
    const handleSWUpdate = (event: CustomEvent) => {
      setWaitingWorker(event.detail);
      setUpdateAvailable(true);

      // Show a toast notification
      toast(
        (t) => (
          <div className="flex items-center gap-3">
            <RefreshCw className="h-5 w-5 text-blue-600" />
            <div>
              <p className="font-semibold text-gray-900">Update Available!</p>
              <p className="text-sm text-gray-600">
                New version ready to install
              </p>
            </div>
            <button
              onClick={() => {
                handleUpdate();
                toast.dismiss(t.id);
              }}
              className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700"
            >
              Update
            </button>
          </div>
        ),
        {
          duration: 8000,
          position: "top-center",
        }
      );
    };

    // Check if service worker is supported
    if ("serviceWorker" in navigator) {
      // Listen for the custom event from the service worker
      window.addEventListener(
        "sw-update-available",
        handleSWUpdate as EventListener
      );

      // Also check for existing waiting worker
      navigator.serviceWorker.ready.then((registration) => {
        if (registration.waiting) {
          setWaitingWorker(registration.waiting);
          setUpdateAvailable(true);
        }
      });

      // Listen for new service worker installations
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        window.location.reload();
      });
    }

    return () => {
      window.removeEventListener(
        "sw-update-available",
        handleSWUpdate as EventListener
      );
    };
  }, []);

  const handleUpdate = () => {
    if (waitingWorker) {
      // Tell the waiting service worker to skip waiting and become active
      waitingWorker.postMessage({ type: "SKIP_WAITING" });
      setUpdateAvailable(false);

      // Show updating toast
      toast.loading("Updating app...", { duration: 2000 });

      // Reload after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  const handleDismiss = () => {
    setUpdateAvailable(false);
    // Store dismissal to avoid showing again for this session
    sessionStorage.setItem("pwa-update-dismissed", "true");
  };

  // Don't show if dismissed in this session
  if (sessionStorage.getItem("pwa-update-dismissed") === "true") {
    return null;
  }

  if (!updateAvailable || !waitingWorker) {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 right-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-lg p-4 z-50 max-w-md mx-auto">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className="p-2 bg-white bg-opacity-20 rounded-lg">
            <RefreshCw className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-1">🎉 Update Available!</h3>
            <p className="text-sm text-blue-100 mb-3">
              A new version of Buddy Ride is ready with improvements and bug
              fixes.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleUpdate}
                className="flex items-center gap-2 bg-white text-blue-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-50 transition-colors"
              >
                <Download size={14} />
                Update Now
              </button>
              <button
                onClick={handleDismiss}
                className="text-blue-100 hover:text-white px-3 py-2 text-sm transition-colors"
              >
                Later
              </button>
            </div>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="ml-2 text-blue-100 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
