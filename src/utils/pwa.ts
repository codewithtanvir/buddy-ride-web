// PWA utility functions for service worker management and PWA lifecycle

// Register service worker with auto-update
export const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    // Basic service worker registration
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('Service worker registered:', registration);

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('New service worker available');
              }
            });
          }
        });
      })
      .catch((error) => {
        console.error('Service worker registration failed:', error);
      });
  }
  return null;
};

// Check if PWA is installed
export const isPWAInstalled = (): boolean => {
  if (typeof window === 'undefined') return false;

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
};

// Check if PWA is installable
export const isPWAInstallable = (): boolean => {
  if (typeof window === 'undefined') return false;

  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'BeforeInstallPromptEvent' in window
  );
};

// Get PWA installation prompt
export const getInstallPrompt = (): Promise<Event | null> => {
  return new Promise((resolve) => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      resolve(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Resolve with null if no prompt after 1 second
    setTimeout(() => resolve(null), 1000);
  });
};

// Install PWA
export const installPWA = async (): Promise<boolean> => {
  try {
    const prompt = await getInstallPrompt();
    if (!prompt) return false;

    const beforeInstallPromptEvent = prompt as any;
    await beforeInstallPromptEvent.prompt();

    const { outcome } = await beforeInstallPromptEvent.userChoice;
    return outcome === 'accepted';
  } catch (error) {
    console.error('Error installing PWA:', error);
    return false;
  }
};

// Check for PWA updates
export const checkForUpdates = async (): Promise<boolean> => {
  if (!('serviceWorker' in navigator)) return false;

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) return false;

    await registration.update();

    return new Promise((resolve) => {
      const handleUpdateFound = () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              resolve(true);
            }
          });
        }
      };

      registration.addEventListener('updatefound', handleUpdateFound);

      // Resolve false if no update found after 2 seconds
      setTimeout(() => resolve(false), 2000);
    });
  } catch (error) {
    console.error('Error checking for updates:', error);
    return false;
  }
};

// Skip waiting for service worker update
export const skipWaiting = async (): Promise<void> => {
  if (!('serviceWorker' in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  } catch (error) {
    console.error('Error skipping waiting:', error);
  }
};
