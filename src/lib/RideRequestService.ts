import { supabase } from './supabase';
import { ChatService } from './ChatService';

export class RideRequestService {
  // Accept a ride request
  static async acceptRequest(requestId: string, rideOwnerId: string): Promise<void> {
    try {
      console.log('RideRequestService: Accepting request:', requestId);
      
      // Update request status
      const { error: updateError } = await supabase
        .from('ride_requests')
        .update({ status: 'accepted' })
        .eq('id', requestId);

      if (updateError) {
        console.error('RideRequestService: Error updating request:', updateError);
        throw updateError;
      }

      // Get the ride ID from the request
      const { data: requestData, error: fetchError } = await supabase
        .from('ride_requests')
        .select('ride_id')
        .eq('id', requestId)
        .single();

      if (fetchError || !requestData) {
        console.error('RideRequestService: Error fetching request data:', fetchError);
        throw fetchError || new Error('Request not found');
      }

      // Create welcome message
      await ChatService.createWelcomeMessage(requestData.ride_id, rideOwnerId);
      
      console.log('RideRequestService: Request accepted successfully');
    } catch (error) {
      console.error('RideRequestService: Failed to accept request:', error);
      throw error;
    }
  }

  // Reject a ride request
  static async rejectRequest(requestId: string): Promise<void> {
    try {
      console.log('RideRequestService: Rejecting request:', requestId);
      
      const { error } = await supabase
        .from('ride_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId);

      if (error) {
        console.error('RideRequestService: Error rejecting request:', error);
        throw error;
      }
      
      console.log('RideRequestService: Request rejected successfully');
    } catch (error) {
      console.error('RideRequestService: Failed to reject request:', error);
      throw error;
    }
  }
}
