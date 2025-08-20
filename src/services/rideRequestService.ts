import { supabase } from "../lib/supabase";
import { ChatService } from "./chatService";

export class RideRequestService {
  /**
   * Accept a ride request and create welcome message
   */
  static async acceptRequest(requestId: string, rideOwnerId: string): Promise<void> {
    console.log("✅ RideRequestService: Accepting request:", requestId);

    try {
      // Get request details first
      const { data: request, error: requestError } = await supabase
        .from("ride_requests")
        .select("ride_id, requester_id, status")
        .eq("id", requestId)
        .single();

      if (requestError) throw requestError;
      if (!request) throw new Error("Request not found");
      if (request.status === "accepted") {
        console.log("ℹ️ Request already accepted");
        return;
      }

      // Update request status
      const { error: updateError } = await supabase
        .from("ride_requests")
        .update({
          status: "accepted",
          updated_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      if (updateError) throw updateError;

      // Create welcome message to enable chat
      await ChatService.createWelcomeMessage(request.ride_id, rideOwnerId);

      console.log("✅ Request accepted and welcome message created");

    } catch (error) {
      console.error("❌ Error accepting request:", error);
      throw error;
    }
  }

  /**
   * Reject a ride request
   */
  static async rejectRequest(requestId: string): Promise<void> {
    console.log("❌ RideRequestService: Rejecting request:", requestId);

    try {
      const { error } = await supabase
        .from("ride_requests")
        .update({
          status: "rejected",
          updated_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      if (error) throw error;

      console.log("✅ Request rejected");

    } catch (error) {
      console.error("❌ Error rejecting request:", error);
      throw error;
    }
  }
}
