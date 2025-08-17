import { supabase } from "../lib/supabase";

/**
 * Delete rides that have expired (ride_time is in the past)
 * This function can be called periodically or on app start
 */
export async function cleanupExpiredRides(): Promise<void> {
  try {
    const now = new Date().toISOString();

    // First delete related messages
    const { data: expiredRides } = await supabase
      .from("rides")
      .select("id")
      .lt("ride_time", now);

    if (expiredRides && expiredRides.length > 0) {
      const rideIds = expiredRides.map((ride) => ride.id);

      // Delete messages for expired rides
      await supabase.from("messages").delete().in("ride_id", rideIds);

      // Delete ride requests for expired rides
      await supabase.from("ride_requests").delete().in("ride_id", rideIds);
    }

    // Delete expired rides
    const { error } = await supabase
      .from("rides")
      .delete()
      .lt("ride_time", now);

    if (error) {
      console.error("Error cleaning up expired rides:", error);
      throw error;
    }

    console.log("Successfully cleaned up expired rides");
  } catch (error) {
    console.error("Failed to cleanup expired rides:", error);
  }
}

/**
 * Delete rides that are older than the specified hours
 * @param hoursOld - Number of hours after ride_time to delete the ride
 */
export async function cleanupOldRides(hoursOld: number = 2): Promise<void> {
  try {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hoursOld);

    // First get rides to delete
    const { data: oldRides } = await supabase
      .from("rides")
      .select("id")
      .lt("ride_time", cutoffTime.toISOString());

    if (oldRides && oldRides.length > 0) {
      const rideIds = oldRides.map((ride) => ride.id);

      // Delete messages for old rides
      await supabase.from("messages").delete().in("ride_id", rideIds);

      // Delete ride requests for old rides
      await supabase.from("ride_requests").delete().in("ride_id", rideIds);
    }

    // Delete old rides
    const { error } = await supabase
      .from("rides")
      .delete()
      .lt("ride_time", cutoffTime.toISOString());

    if (error) {
      console.error("Error cleaning up old rides:", error);
      throw error;
    }

    console.log(`Successfully cleaned up rides older than ${hoursOld} hours`);
  } catch (error) {
    console.error("Failed to cleanup old rides:", error);
  }
}

/**
 * Schedule automatic cleanup of expired rides
 * This will run cleanup every hour
 */
export function startAutomaticCleanup(): number {
  // Run cleanup immediately
  cleanupExpiredRides();

  // Then run every hour
  return window.setInterval(() => {
    cleanupExpiredRides();
  }, 60 * 60 * 1000); // 1 hour in milliseconds
}

/**
 * Check if a ride is expired
 */
export function isRideExpired(rideTime: string | null): boolean {
  if (!rideTime) return false;
  return new Date(rideTime) < new Date();
}
