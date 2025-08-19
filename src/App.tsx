import { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAuthStore } from "./stores/authStore";
import { startAutomaticCleanup } from "./utils/rideCleanup";
import { PWAInstallPrompt } from "./components/PWAInstallPrompt";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AsyncErrorBoundary } from "./components/AsyncErrorBoundary";
import { PageLoadingSpinner } from "./components/LoadingStates";

// Pages
import AuthPage from "./pages/AuthPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ProfileSetupPage from "./pages/ProfileSetupPage";
import DashboardLayout from "./components/layouts/DashboardLayout";
import HomePage from "./pages/HomePage";
import FindBuddyPage from "./pages/FindBuddyPage";
import PostRidePage from "./pages/PostRidePage";
import ChatsPage from "./pages/ChatsPage";
import ChatPage from "./pages/ChatPage";
import ProfilePage from "./pages/ProfilePage";
import AdminPage from "./pages/AdminPage";

// Loading component
const LoadingSpinner = () => (
  <PageLoadingSpinner text="Initializing Buddy Ride..." />
);

function App() {
  const { user, loading, initialize } = useAuthStore();

  useEffect(() => {
    initialize();

    // Start automatic cleanup of expired rides
    const cleanupInterval = startAutomaticCleanup();

    return () => {
      clearInterval(cleanupInterval);
    };
  }, [initialize]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <ErrorBoundary>
      <AsyncErrorBoundary>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: "#363636",
                  color: "#fff",
                },
              }}
            />

            <Routes>
              {!user ? (
                <>
                  <Route path="/auth" element={<AuthPage />} />
                  <Route
                    path="/forgot-password"
                    element={<ForgotPasswordPage />}
                  />
                  <Route
                    path="/reset-password"
                    element={<ResetPasswordPage />}
                  />
                  <Route path="*" element={<AuthPage />} />
                </>
              ) : !user.profile ? (
                <Route path="*" element={<ProfileSetupPage />} />
              ) : (
                <>
                  <Route path="/" element={<DashboardLayout />}>
                    <Route index element={<HomePage />} />
                    <Route path="find-buddy" element={<FindBuddyPage />} />
                    <Route path="post-ride" element={<PostRidePage />} />
                    <Route path="chats" element={<ChatsPage />} />
                    <Route path="profile" element={<ProfilePage />} />
                    <Route path="admin" element={<AdminPage />} />
                  </Route>
                  <Route path="/chat/:rideId" element={<ChatPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </>
              )}
            </Routes>

            {/* PWA Install Prompt */}
            <PWAInstallPrompt />
          </div>
        </Router>
      </AsyncErrorBoundary>
    </ErrorBoundary>
  );
}

export default App;
