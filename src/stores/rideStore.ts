import { create } from "zustand";
import { supabase } from "../lib/supabase";
import type { RideWithProfile, MessageWithProfile } from "../types";

interface RideState {
  rides: RideWithProfile[];
  myRides: RideWithProfile[];
  messages: MessageWithProfile[];
  loading: boolean;
  fetchRides: (
    fromLocation?: string,
    toLocation?: string,
    gender?: string
  ) => Promise<void>;
  fetchMyRides: (userId: string) => Promise<void>;
  fetchMessages: (rideId: string) => Promise<void>;
  addRide: (ride: RideWithProfile) => void;
  addMessage: (message: MessageWithProfile) => void;
  clearMessages: () => void;
  setMyRides: (rides: RideWithProfile[]) => void;
}

export const useRideStore = create<RideState>((set, get) => ({
  rides: [],
  myRides: [],
  messages: [],
  loading: false,

  fetchRides: async (fromLocation = "", toLocation = "", gender = "") => {
    set({ loading: true });
    try {
      let query = supabase
        .from("rides")
        .select(
          `
          *,
          profiles:user_id (
            id,
            name,
            student_id,
            department,
            gender,
            created_at
          )
        `
        )
        .gte("ride_time", new Date().toISOString())
        .order("ride_time", { ascending: true });

      if (fromLocation && fromLocation.trim()) {
        query = query.ilike("from_location", `%${fromLocation.trim()}%`);
      }

      if (toLocation && toLocation.trim()) {
        query = query.ilike("to_location", `%${toLocation.trim()}%`);
      }

      if (gender && gender.trim() && gender !== "all") {
        query = query.eq("profiles.gender", gender);
      }

      const { data, error } = await query;

      if (error) throw error;

      set({ rides: data || [], loading: false });
    } catch (error) {
      console.error("Error fetching rides:", error);
      set({ loading: false });
    }
  },

  fetchMyRides: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("rides")
        .select(
          `
          *,
          profiles:user_id (
            id,
            name,
            student_id,
            department,
            gender,
            created_at
          )
        `
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      set({ myRides: data || [] });
    } catch (error) {
      console.error("Error fetching my rides:", error);
    }
  },

  fetchMessages: async (rideId: string) => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select(
          `
          *,
          profiles:sender_id (
            id,
            name,
            student_id,
            department,
            gender,
            created_at
          )
        `
        )
        .eq("ride_id", rideId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      set({ messages: data || [] });
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  },

  addRide: (ride: RideWithProfile) => {
    set((state) => ({
      rides: [ride, ...state.rides],
      myRides: [ride, ...state.myRides],
    }));
  },

  addMessage: (message: MessageWithProfile) => {
    set((state) => ({
      messages: [...state.messages, message],
    }));
  },

  clearMessages: () => {
    set({ messages: [] });
  },

  setMyRides: (rides: RideWithProfile[]) => {
    set({ myRides: rides });
  },
}));
