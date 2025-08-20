import React from 'react';
import { usePWA } from './PWAProvider';
import { Download, CheckCircle, Wifi, WifiOff, RefreshCw } from 'lucide-react';

const PWAStatusIndicator: React.FC = () => {
  const { isInstalled, isInstallable, isOnline, hasUpdate, checkForUpdates } = usePWA();

  if (isInstalled) {
    return (
      <div className="flex items-center space-x-2 text-green-600 text-sm">
        <CheckCircle className="w-4 h-4" />
        <span>App Installed</span>
      </div>
    );
  }

  if (isInstallable) {
    return (
      <div className="flex items-center space-x-2 text-blue-600 text-sm">
        <Download className="w-4 h-4" />
        <span>Install Available</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2 text-gray-500 text-sm">
      {isOnline ? (
        <Wifi className="w-4 h-4" />
      ) : (
        <WifiOff className="w-4 h-4" />
      )}
      <span>{isOnline ? 'Online' : 'Offline'}</span>
      
      {hasUpdate && (
        <button
          onClick={checkForUpdates}
          className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          <span className="text-xs">Update</span>
        </button>
      )}
    </div>
  );
};

export default PWAStatusIndicator;
