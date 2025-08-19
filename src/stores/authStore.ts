import { create } from "zustand";
import { supabase } from "../lib/supabase";
import type { AuthUser, ProfileFormData } from "../types";
import { getPasswordResetRedirectUrl } from "../utils/redirects";

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  pendingVerification: string | null; // Email pending verification
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resetPasswordWithOTP: (email: string) => Promise<void>;
  verifyOTPAndResetPassword: (
    email: string,
    token: string,
    newPassword: string
  ) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  updateProfile: (profileData: Partial<ProfileFormData>) => Promise<void>;
  initialize: () => Promise<void>;
  verifyEmailOTP: (email: string, token: string) => Promise<void>;
  resendEmailOTP: (email: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  pendingVerification: null,

  initialize: async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        set({
          user: {
            id: session.user.id,
            email: session.user.email,
            profile: profile || undefined,
          },
          loading: false,
        });
      } else {
        set({ user: null, loading: false });
      }
    } catch (error) {
      console.error("Error initializing auth:", error);
      set({ user: null, loading: false });
    }
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    if (data.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single();

      set({
        user: {
          id: data.user.id,
          email: data.user.email,
          profile: profile || undefined,
        },
      });
    }
  },

  signUp: async (email: string, password: string) => {
    console.log("🔢 Starting OTP-based signup");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: undefined, // Force OTP-only, no magic link redirect
      },
    });

    if (error) {
      console.error("❌ Signup failed:", error);
      throw error;
    }

    console.log("✅ Signup successful, OTP email sent");

    // Set pending verification email
    set({ pendingVerification: email });

    // Note: User will be null until email is verified
    if (data.user && data.user.email_confirmed_at) {
      set({
        user: {
          id: data.user.id,
          email: data.user.email,
          profile: undefined,
        },
        pendingVerification: null,
      });
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null });
  },

  resetPassword: async (email: string) => {
    console.log("🔢 Starting OTP-based password reset");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: undefined, // Force OTP-only, no magic link redirect
    });

    if (error) {
      console.error("❌ Password reset failed:", error);
      throw error;
    }

    console.log("✅ Password reset OTP email sent");
  },

  updatePassword: async (password: string) => {
    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) throw error;
  },

  updateProfile: async (profileData: Partial<ProfileFormData>) => {
    const { user } = get();
    if (!user) throw new Error("No user found");

    // Check if the student_id is being updated and if it already exists
    if (profileData.student_id) {
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("student_id", profileData.student_id)
        .neq("id", user.id)
        .single();

      if (existingProfile) {
        throw new Error(
          "Student ID already exists. Please use a different student ID."
        );
      }
    }

    const { data, error } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        ...profileData,
      })
      .select()
      .single();

    if (error) {
      if (
        error.code === "23505" &&
        error.message.includes("profiles_student_id_key")
      ) {
        throw new Error(
          "Student ID already exists. Please use a different student ID."
        );
      }
      throw error;
    }

    set({
      user: {
        ...user,
        profile: data,
      },
    });
  },

  // OTP-based password reset
  resetPasswordWithOTP: async (email: string) => {
    console.log("🔢 Starting OTP-based password reset");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: undefined, // No redirect for OTP flow
    });

    if (error) {
      console.error("❌ Password reset OTP failed:", error);
      throw error;
    }

    console.log("✅ Password reset OTP email sent");
  },

  verifyOTPAndResetPassword: async (
    email: string,
    token: string,
    newPassword: string
  ) => {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "recovery",
    });

    if (error) throw error;

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) throw updateError;

    // Update user state
    if (data.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single();

      set({
        user: {
          id: data.user.id,
          email: data.user.email,
          profile: profile || undefined,
        },
      });
    }
  },

  // Email verification with OTP
  verifyEmailOTP: async (email: string, token: string) => {
    console.log("🔢 Verifying email OTP");

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "signup",
    });

    if (error) {
      console.error("❌ OTP verification failed:", error);
      throw error;
    }

    console.log("✅ Email OTP verification successful");

    if (data.user) {
      set({
        user: {
          id: data.user.id,
          email: data.user.email,
          profile: undefined,
        },
        pendingVerification: null,
      });
    }
  },

  resendEmailOTP: async (email: string) => {
    console.log("🔢 Resending email OTP");

    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
    });

    if (error) {
      console.error("❌ OTP resend failed:", error);
      throw error;
    }

    console.log("✅ Email OTP resent successfully");
  },
}));
