import type { AuthUser } from "../types";

export type UserRole = "user" | "admin" | "moderator";

export const ROLE_PERMISSIONS = {
  user: ["read_own_data", "create_rides", "send_messages"],
  moderator: [
    "read_own_data",
    "create_rides",
    "send_messages",
    "moderate_content",
    "view_all_rides",
  ],
  admin: [
    "read_own_data",
    "create_rides",
    "send_messages",
    "moderate_content",
    "view_all_rides",
    "manage_users",
    "view_analytics",
    "delete_content",
  ],
} as const;

export function getUserRole(user: AuthUser | null): UserRole {
  if (!user?.profile) return "user";

  // Check database role first
  if (user.profile.role === "admin" || user.profile.role === "moderator") {
    return user.profile.role;
  }

  // Fallback to legacy admin detection for existing admins
  if (
    user.email === "00-00000-0@student.aiub.com" ||
    user.profile.student_id === "00-00000-0" ||
    user.email?.includes("admin")
  ) {
    return "admin";
  }

  return "user";
}

export function hasPermission(
  user: AuthUser | null,
  permission: string
): boolean {
  const role = getUserRole(user);
  return ROLE_PERMISSIONS[role].includes(permission as any);
}

export function isAdmin(user: AuthUser | null): boolean {
  return getUserRole(user) === "admin";
}

export function isModerator(user: AuthUser | null): boolean {
  return getUserRole(user) === "moderator";
}

export function isAdminOrModerator(user: AuthUser | null): boolean {
  const role = getUserRole(user);
  return role === "admin" || role === "moderator";
}
