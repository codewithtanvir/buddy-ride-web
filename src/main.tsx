import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Production utilities
import { validateAndGetConfig } from "./utils/environment";
import { initializeSecurity } from "./utils/security";
import { errorMonitor, captureError } from "./utils/monitoring";

// Initialize production configurations
async function initializeApp() {
  try {
    // Validate environment configuration
    const config = validateAndGetConfig();

    // Initialize security measures
    initializeSecurity();

    // Initialize error monitoring
    console.log(
      "Application initialized with environment:",
      config.environment
    );

    // Register service worker for PWA functionality
    if ("serviceWorker" in navigator && import.meta.env.PROD) {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        console.log("Service Worker registered successfully:", registration);
      } catch (error) {
        console.error("Service Worker registration failed:", error);
        captureError(error, { context: "service-worker-registration" });
      }
    }
  } catch (error) {
    console.error("Failed to initialize application:", error);
    captureError(error, { context: "app-initialization" });

    // Still try to render the app even if initialization fails
  }
}

// Initialize and render the application
initializeApp()
  .then(() => {
    ReactDOM.createRoot(document.getElementById("root")!).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  })
  .catch((error) => {
    console.error("Critical application error:", error);
    captureError(error, { context: "app-render" });

    // Fallback error UI
    document.getElementById("root")!.innerHTML = `
    <div style="display: flex; justify-content: center; align-items: center; height: 100vh; flex-direction: column; font-family: system-ui;">
      <h1 style="color: #ef4444; margin-bottom: 1rem;">Application Error</h1>
      <p style="color: #6b7280; text-align: center; margin-bottom: 2rem;">
        We're sorry, but something went wrong. Please refresh the page to try again.
      </p>
      <button 
        onclick="window.location.reload()" 
        style="background: #3b82f6; color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 0.375rem; cursor: pointer;"
      >
        Refresh Page
      </button>
    </div>
  `;
  });
