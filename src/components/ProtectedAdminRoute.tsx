import React from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { isAdmin } from "../utils/roles";

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

export const ProtectedAdminRoute: React.FC<ProtectedAdminRouteProps> = ({
  children,
}) => {
  const { user } = useAuthStore();

  // Check if user is admin
  if (!isAdmin(user)) {
    // Redirect non-admin users to home page
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
