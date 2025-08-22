import { create } from "zustand";
import { supabase } from "../lib/supabase";
import type { RideWithProfile, MessageWithProfile } from "../types";

interface RideState {
  rides: RideWithProfile[];
  myRides: RideWithProfile[];
  messages: MessageWithProfile[];
  userMessagesCount: number;
  totalRequestsCount: number;
  loading: boolean;
  fetchRides: (
    fromLocation?: string,
    toLocation?: string,
    gender?: string
  ) => Promise<void>;
  fetchMyRides: (userId: string) => Promise<void>;
  fetchMessages: (rideId: string) => Promise<void>;
  fetchUserMessagesCount: (userId: string) => Promise<void>;
  fetchTotalRequestsCount: (userId: string) => Promise<void>;
  fetchDashboardData: (userId: string) => Promise<void>;
  addRide: (ride: RideWithProfile) => void;
  addMessage: (message: MessageWithProfile) => void;
  clearMessages: () => void;
  setMyRides: (rides: RideWithProfile[]) => void;
}

export const useRideStore = create<RideState>((set, get) => ({
  rides: [],
  myRides: [],
  messages: [],
  userMessagesCount: 0,
  totalRequestsCount: 0,
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
            phone_number,
            role,
            created_at,
            notification_preferences
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
            phone_number,
            role,
            created_at,
            notification_preferences
          ),
          ride_requests (*)
        `
        )
        .eq("user_id", userId)
        .gte("ride_time", new Date().toISOString())
        .order("ride_time", { ascending: true });

      if (error) throw error;

      // Add requests count to each ride
      const ridesWithCount = (data || []).map(ride => ({
        ...ride,
        requests_count: ride.ride_requests?.length || 0
      }));

      set({ myRides: ridesWithCount });
    } catch (error) {
      console.error("Error fetching my rides:", error);
      set({ myRides: [] });
    }
  },

  fetchUserMessagesCount: async (userId: string) => {
    try {
      // Get user's chat rides first
      const { data: chatRides, error: chatError } = await supabase
        .rpc('get_user_chat_rides', { input_user_id: userId });

      if (chatError) throw chatError;

      if (!chatRides || chatRides.length === 0) {
        set({ userMessagesCount: 0 });
        return;
      }

      // Get count of messages from these rides
      const rideIds = chatRides.map(ride => ride.id);
      const { count, error } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .in("ride_id", rideIds);

      if (error) throw error;

      set({ userMessagesCount: count || 0 });
    } catch (error) {
      console.error("Error fetching user messages count:", error);
      set({ userMessagesCount: 0 });
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
            phone_number,
            role,
            created_at,
            notification_preferences
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

  fetchTotalRequestsCount: async (userId: string) => {
    try {
      // Get user's rides first
      const { data: userRides, error: ridesError } = await supabase
        .from("rides")
        .select("id")
        .eq("user_id", userId);

      if (ridesError) throw ridesError;

      if (!userRides || userRides.length === 0) {
        set({ totalRequestsCount: 0 });
        return;
      }

      // Get count of all requests for these rides
      const rideIds = userRides.map(ride => ride.id);
      const { count, error } = await supabase
        .from("ride_requests")
        .select("id", { count: "exact", head: true })
        .in("ride_id", rideIds);

      if (error) throw error;

      set({ totalRequestsCount: count || 0 });
    } catch (error) {
      console.error("Error fetching total requests count:", error);
      set({ totalRequestsCount: 0 });
    }
  },

  fetchDashboardData: async (userId: string) => {
    set({ loading: true });
    try {
      // Fetch all dashboard data in parallel for better performance
      await Promise.all([
        get().fetchMyRides(userId),
        get().fetchUserMessagesCount(userId),
        get().fetchTotalRequestsCount(userId)
      ]);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      set({ loading: false });
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
