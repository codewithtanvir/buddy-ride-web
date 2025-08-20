import React, { useState, useEffect } from 'react';
import { RefreshCw, X, CheckCircle } from 'lucide-react';

const PWAUpdatePrompt: React.FC = () => {
    const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateComplete, setUpdateComplete] = useState(false);

    useEffect(() => {
        // Listen for service worker updates
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                // New service worker is controlling the page
                setShowUpdatePrompt(true);
            });

            // Check for updates
            const checkForUpdates = async () => {
                try {
                    const registration = await navigator.serviceWorker.getRegistration();
                    if (registration) {
                        registration.addEventListener('updatefound', () => {
                            const newWorker = registration.installing;
                            if (newWorker) {
                                newWorker.addEventListener('statechange', () => {
                                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                        // New version is available
                                        setShowUpdatePrompt(true);
                                    }
                                });
                            }
                        });
                    }
                } catch (error) {
                    console.error('Error checking for updates:', error);
                }
            };

            checkForUpdates();
        }
    }, []);

    const handleUpdate = async () => {
        setIsUpdating(true);

        try {
            // Send message to service worker to skip waiting
            if (navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
            }

            // Reload the page to activate the new service worker
            setTimeout(() => {
                window.location.reload();
            }, 1000);

        } catch (error) {
            console.error('Error updating PWA:', error);
            setIsUpdating(false);
        }
    };

    const handleDismiss = () => {
        setShowUpdatePrompt(false);
    };

    if (!showUpdatePrompt) {
        return null;
    }

    if (updateComplete) {
        return (
            <div className="fixed bottom-4 left-4 right-4 z-50 bg-green-50 border border-green-200 rounded-lg p-4 max-w-sm mx-auto">
                <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div className="flex-1">
                        <p className="text-sm font-medium text-green-800">
                            Update complete! New version is now active.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed bottom-4 left-4 right-4 z-50 bg-white rounded-lg shadow-2xl border border-gray-200 p-4 max-w-sm mx-auto">
            <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <RefreshCw className={`w-5 h-5 text-blue-600 ${isUpdating ? 'animate-spin' : ''}`} />
                    </div>
                </div>

                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">
                        New Version Available
                    </h3>
                    <p className="text-xs text-gray-600 mb-3">
                        A new version of Buddy Ride is ready with improvements and bug fixes
                    </p>

                    <div className="flex space-x-2">
                        <button
                            onClick={handleUpdate}
                            disabled={isUpdating}
                            className="flex-1 bg-blue-600 text-white text-xs font-medium px-3 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isUpdating ? 'Updating...' : 'Update Now'}
                        </button>
                        <button
                            onClick={handleDismiss}
                            disabled={isUpdating}
                            className="text-gray-500 hover:text-gray-700 text-xs px-3 py-2 rounded-md transition-colors disabled:opacity-50"
                        >
                            Later
                        </button>
                    </div>
                </div>

                <button
                    onClick={handleDismiss}
                    disabled={isUpdating}
                    className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default PWAUpdatePrompt;
