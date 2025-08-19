import { supabase } from "../lib/supabase";

export interface CleanupResult {
  success: boolean;
  deletedRides: number;
  deletedMessages: number;
  deletedRequests: number;
  error?: string;
}

/**
 * Delete rides that have expired (ride_time is in the past)
 * This function can be called periodically or on app start
 */
export async function cleanupExpiredRides(): Promise<CleanupResult> {
  try {
    const now = new Date().toISOString();

    // First get rides to delete for counting
    const { data: expiredRides, error: fetchError } = await supabase
      .from("rides")
      .select("id")
      .lt("ride_time", now);

    if (fetchError) throw fetchError;

    if (!expiredRides || expiredRides.length === 0) {
      return {
        success: true,
        deletedRides: 0,
        deletedMessages: 0,
        deletedRequests: 0,
      };
    }

    const rideIds = expiredRides.map((ride) => ride.id);

    // Delete messages for expired rides first (foreign key constraint)
    const { error: messagesError, count: deletedMessages } = await supabase
      .from("messages")
      .delete()
      .in("ride_id", rideIds);

    if (messagesError) throw messagesError;

    // Delete ride requests for expired rides
    const { error: requestsError, count: deletedRequests } = await supabase
      .from("ride_requests")
      .delete()
      .in("ride_id", rideIds);

    if (requestsError) throw requestsError;

    // Delete expired rides
    const { error: ridesError, count: deletedRides } = await supabase
      .from("rides")
      .delete()
      .lt("ride_time", now);

    if (ridesError) throw ridesError;

    console.log("Successfully cleaned up expired rides:", {
      rides: deletedRides || 0,
      messages: deletedMessages || 0,
      requests: deletedRequests || 0,
    });

    return {
      success: true,
      deletedRides: deletedRides || 0,
      deletedMessages: deletedMessages || 0,
      deletedRequests: deletedRequests || 0,
    };
  } catch (error) {
    console.error("Failed to cleanup expired rides:", error);
    return {
      success: false,
      deletedRides: 0,
      deletedMessages: 0,
      deletedRequests: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Delete rides that are older than the specified hours
 * @param hoursOld - Number of hours after ride_time to delete the ride
 */
export async function cleanupOldRides(
  hoursOld: number = 24
): Promise<CleanupResult> {
  try {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hoursOld);
    const cutoffISO = cutoffTime.toISOString();

    // First get rides to delete
    const { data: oldRides, error: fetchError } = await supabase
      .from("rides")
      .select("id")
      .lt("ride_time", cutoffISO);

    if (fetchError) throw fetchError;

    if (!oldRides || oldRides.length === 0) {
      return {
        success: true,
        deletedRides: 0,
        deletedMessages: 0,
        deletedRequests: 0,
      };
    }

    const rideIds = oldRides.map((ride) => ride.id);

    // Delete messages for old rides
    const { error: messagesError, count: deletedMessages } = await supabase
      .from("messages")
      .delete()
      .in("ride_id", rideIds);

    if (messagesError) throw messagesError;

    // Delete ride requests for old rides
    const { error: requestsError, count: deletedRequests } = await supabase
      .from("ride_requests")
      .delete()
      .in("ride_id", rideIds);

    if (requestsError) throw requestsError;

    // Delete old rides
    const { error: ridesError, count: deletedRides } = await supabase
      .from("rides")
      .delete()
      .lt("ride_time", cutoffISO);

    if (ridesError) throw ridesError;

    console.log(`Successfully cleaned up rides older than ${hoursOld} hours:`, {
      rides: deletedRides || 0,
      messages: deletedMessages || 0,
      requests: deletedRequests || 0,
    });

    return {
      success: true,
      deletedRides: deletedRides || 0,
      deletedMessages: deletedMessages || 0,
      deletedRequests: deletedRequests || 0,
    };
  } catch (error) {
    console.error("Failed to cleanup old rides:", error);
    return {
      success: false,
      deletedRides: 0,
      deletedMessages: 0,
      deletedRequests: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Clean up orphaned data (messages/requests without valid rides)
 */
export async function cleanupOrphanedData(): Promise<{
  success: boolean;
  orphanedMessages: number;
  orphanedRequests: number;
  error?: string;
}> {
  try {
    // This is a simplified approach - ideally use database-level constraints
    // For now, we'll clean up based on non-existent ride IDs

    // Get all valid ride IDs
    const { data: validRides } = await supabase.from("rides").select("id");

    if (!validRides) {
      return {
        success: true,
        orphanedMessages: 0,
        orphanedRequests: 0,
      };
    }

    const validRideIds = validRides.map((r) => r.id);

    let deletedMessages = 0;
    let deletedRequests = 0;

    // Clean up messages with invalid ride_id (simplified check)
    const { data: allMessages } = await supabase
      .from("messages")
      .select("id, ride_id");

    if (allMessages) {
      const orphanedMessageIds = allMessages
        .filter((m) => m.ride_id && !validRideIds.includes(m.ride_id))
        .map((m) => m.id);

      if (orphanedMessageIds.length > 0) {
        const { count } = await supabase
          .from("messages")
          .delete()
          .in("id", orphanedMessageIds);
        deletedMessages = count || 0;
      }
    }

    // Clean up ride requests with invalid ride_id
    const { data: allRequests } = await supabase
      .from("ride_requests")
      .select("id, ride_id");

    if (allRequests) {
      const orphanedRequestIds = allRequests
        .filter((r) => r.ride_id && !validRideIds.includes(r.ride_id))
        .map((r) => r.id);

      if (orphanedRequestIds.length > 0) {
        const { count } = await supabase
          .from("ride_requests")
          .delete()
          .in("id", orphanedRequestIds);
        deletedRequests = count || 0;
      }
    }

    return {
      success: true,
      orphanedMessages: deletedMessages,
      orphanedRequests: deletedRequests,
    };
  } catch (error) {
    console.error("Failed to cleanup orphaned data:", error);
    return {
      success: false,
      orphanedMessages: 0,
      orphanedRequests: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Schedule automatic cleanup of expired rides
 * This will run cleanup every 6 hours with immediate first run
 */
export function startAutomaticCleanup(): number {
  // Run cleanup immediately
  setTimeout(async () => {
    console.log("Running initial cleanup...");
    await cleanupExpiredRides();
    await cleanupOrphanedData();
  }, 5000); // Wait 5 seconds after app start

  // Then run every 6 hours
  return window.setInterval(async () => {
    console.log("Running scheduled cleanup...");
    const expiredResult = await cleanupExpiredRides();
    const orphanedResult = await cleanupOrphanedData();

    console.log("Scheduled cleanup completed:", {
      expired: expiredResult,
      orphaned: orphanedResult,
    });
  }, 6 * 60 * 60 * 1000); // 6 hours in milliseconds
}

/**
 * Check if a ride is expired
 */
export function isRideExpired(rideTime: string | null): boolean {
  if (!rideTime) return false;
  return new Date(rideTime) < new Date();
}

/**
 * Get rides that will expire within specified hours
 */
export function getRidesExpiringWithin(rides: any[], hours: number = 2): any[] {
  const futureTime = new Date();
  futureTime.setHours(futureTime.getHours() + hours);

  return rides.filter((ride) => {
    if (!ride.ride_time) return false;
    const rideTime = new Date(ride.ride_time);
    return rideTime > new Date() && rideTime <= futureTime;
  });
}

/**
 * Manual cleanup function for admin use
 */
export async function runManualCleanup(): Promise<{
  success: boolean;
  results: {
    expired: CleanupResult;
    old: CleanupResult;
    orphaned: {
      success: boolean;
      orphanedMessages: number;
      orphanedRequests: number;
    };
  };
  error?: string;
}> {
  try {
    console.log("Starting manual cleanup...");

    const [expiredResult, oldResult, orphanedResult] = await Promise.all([
      cleanupExpiredRides(),
      cleanupOldRides(48), // Clean rides older than 48 hours
      cleanupOrphanedData(),
    ]);

    return {
      success: true,
      results: {
        expired: expiredResult,
        old: oldResult,
        orphaned: orphanedResult,
      },
    };
  } catch (error) {
    console.error("Manual cleanup failed:", error);
    return {
      success: false,
      results: {
        expired: {
          success: false,
          deletedRides: 0,
          deletedMessages: 0,
          deletedRequests: 0,
        },
        old: {
          success: false,
          deletedRides: 0,
          deletedMessages: 0,
          deletedRequests: 0,
        },
        orphaned: { success: false, orphanedMessages: 0, orphanedRequests: 0 },
      },
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
