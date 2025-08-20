import React, { useState } from 'react';
import { usePWA } from './PWAProvider';
import { Download, CheckCircle, Loader } from 'lucide-react';

const PWAInstallButton: React.FC = () => {
  const { isInstalled, isInstallable } = usePWA();
  const [isInstalling, setIsInstalling] = useState(false);

  const handleInstall = async () => {
    if (!isInstallable || isInstalled) return;

    setIsInstalling(true);
    
    try {
      // Trigger the install prompt
      const prompt = await new Promise<Event | null>((resolve) => {
        const handleBeforeInstallPrompt = (e: Event) => {
          e.preventDefault();
          window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
          resolve(e);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        
        // Resolve with null if no prompt after 1 second
        setTimeout(() => resolve(null), 1000);
      });

      if (prompt) {
        const beforeInstallPromptEvent = prompt as any;
        await beforeInstallPromptEvent.prompt();
        
        const { outcome } = await beforeInstallPromptEvent.userChoice;
        if (outcome === 'accepted') {
          console.log('PWA installed successfully');
        }
      }
    } catch (error) {
      console.error('Error installing PWA:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  if (isInstalled) {
    return (
      <div className="flex items-center space-x-2 text-green-600 text-sm">
        <CheckCircle className="w-4 h-4" />
        <span>App Installed</span>
      </div>
    );
  }

  if (!isInstallable) {
    return null;
  }

  return (
    <button
      onClick={handleInstall}
      disabled={isInstalling}
      className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {isInstalling ? (
        <Loader className="w-4 h-4 animate-spin" />
      ) : (
        <Download className="w-4 h-4" />
      )}
      <span>{isInstalling ? 'Installing...' : 'Install App'}</span>
    </button>
  );
};

export default PWAInstallButton;
