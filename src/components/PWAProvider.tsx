import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { registerServiceWorker, isPWAInstalled, isPWAInstallable } from '../utils/pwa';
import PWAInstallPrompt from './PWAInstallPrompt';
import PWAUpdatePrompt from './PWAUpdatePrompt';

interface PWAContextType {
  isInstalled: boolean;
  isInstallable: boolean;
  isOnline: boolean;
  hasUpdate: boolean;
  checkForUpdates: () => Promise<void>;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

export const usePWA = () => {
  const context = useContext(PWAContext);
  if (context === undefined) {
    throw new Error('usePWA must be used within a PWAProvider');
  }
  return context;
};

interface PWAProviderProps {
  children: ReactNode;
}

export const PWAProvider: React.FC<PWAProviderProps> = ({ children }) => {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hasUpdate, setHasUpdate] = useState(false);

  useEffect(() => {
    // Register service worker
    registerServiceWorker();
    
    // Check PWA status
    const checkPWAStatus = () => {
      setIsInstalled(isPWAInstalled());
      setIsInstallable(isPWAInstallable());
    };

    checkPWAStatus();

    // Listen for online/offline changes
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for app installation
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    // Listen for service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        setHasUpdate(true);
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const checkForUpdates = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.update();
        }
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
    }
  };

  const contextValue: PWAContextType = {
    isInstalled,
    isInstallable,
    isOnline,
    hasUpdate,
    checkForUpdates,
  };

  return (
    <PWAContext.Provider value={contextValue}>
      {children}
      
      {/* PWA Prompts */}
      <PWAInstallPrompt />
      <PWAUpdatePrompt />
      
      {/* Offline Indicator */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-white text-center py-2 px-4 text-sm">
          You're currently offline. Some features may be limited.
        </div>
      )}
    </PWAContext.Provider>
  );
};

export default PWAProvider;
