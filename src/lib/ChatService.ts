import { supabase } from './supabase';
import type { ChatRide, Message } from '../types';

export class ChatService {
  // Get chat rides for the current user using the database function
  static async getChatRides(userId: string): Promise<ChatRide[]> {
    try {
      console.log('ChatService: Getting chat rides for user:', userId);
      
      const { data, error } = await supabase
        .rpc('get_user_chat_rides', { input_user_id: userId });

      if (error) {
        console.error('ChatService: Error getting chat rides:', error);
        throw error;
      }

      console.log('ChatService: Raw chat rides data:', data);

      // Transform the data to include chat partner information
      const chatRides = data?.map((ride: any) => {
        // Determine chat partner based on user's relationship to the ride
        let chatPartner = null;
        if (ride.requester_user_id === userId) {
          // User is the requester, chat with ride owner
          chatPartner = {
            id: ride.user_id,
            name: ride.owner_name,
            avatar_url: ride.owner_avatar_url
          };
        } else {
          // User is the ride owner, chat with requester
          chatPartner = {
            id: ride.requester_user_id,
            name: ride.requester_name,
            avatar_url: ride.requester_avatar_url
          };
        }

        return {
          id: ride.id,
          title: ride.title,
          from_location: ride.from_location,
          to_location: ride.to_location,
          chat_partner: chatPartner,
          last_message: ride.last_message,
          last_message_time: ride.last_message_time,
          unread_count: ride.unread_count || 0
        };
      }) || [];

      console.log('ChatService: Processed chat rides:', chatRides);
      return chatRides;
    } catch (error) {
      console.error('ChatService: Failed to get chat rides:', error);
      throw error;
    }
  }

  // Send a message in a chat
  static async sendMessage(rideId: string, senderId: string, content: string): Promise<Message> {
    try {
      console.log('ChatService: Sending message:', { rideId, senderId, content });
      
      // Validate inputs
      if (!rideId || !senderId || !content?.trim()) {
        const error = new Error('Missing required fields for sending message');
        console.error('ChatService: Validation error:', error);
        throw error;
      }

      // First, verify the user has access to this chat
      const hasAccess = await this.verifyUserChatAccess(rideId, senderId);
      if (!hasAccess) {
        const error = new Error('User does not have access to this chat');
        console.error('ChatService: Access denied:', error);
        throw error;
      }

      // Insert the message
      const { data, error } = await supabase
        .from('messages')
        .insert({
          ride_id: rideId,
          sender_id: senderId,
          content: content.trim(),
          created_at: new Date().toISOString()
        })
        .select('*')
        .single();

      if (error) {
        console.error('ChatService: Database error sending message:', error);
        console.error('ChatService: Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw new Error(`Failed to send message: ${error.message}`);
      }

      if (!data) {
        const error = new Error('No data returned after sending message');
        console.error('ChatService: No data error:', error);
        throw error;
      }

      console.log('ChatService: Message sent successfully:', data);
      return data;
    } catch (error) {
      console.error('ChatService: Failed to send message:', error);
      // Re-throw with more context
      if (error instanceof Error) {
        throw new Error(`Message sending failed: ${error.message}`);
      }
      throw new Error('Message sending failed: Unknown error');
    }
  }

  // Verify user has access to chat (either ride owner or requester)
  static async verifyUserChatAccess(rideId: string, userId: string): Promise<boolean> {
    try {
      console.log('ChatService: Verifying chat access:', { rideId, userId });
      
      const { data, error } = await supabase
        .from('ride_requests')
        .select('requester_id, rides!inner(user_id)')
        .eq('ride_id', rideId)
        .eq('status', 'accepted')
        .single();

      if (error) {
        console.error('ChatService: Error verifying access:', error);
        return false;
      }

      if (!data) {
        console.log('ChatService: No accepted request found for ride');
        return false;
      }

      // User has access if they are either the ride owner or the requester
      const isRideOwner = data.rides.user_id === userId;
      const isRequester = data.requester_id === userId;
      const hasAccess = isRideOwner || isRequester;
      
      console.log('ChatService: Access check result:', {
        isRideOwner,
        isRequester,
        hasAccess,
        rideOwnerId: data.rides.user_id,
        requesterId: data.requester_id,
        currentUserId: userId
      });
      
      return hasAccess;
    } catch (error) {
      console.error('ChatService: Error in access verification:', error);
      return false;
    }
  }

  // Get messages for a specific chat
  static async getMessages(rideId: string, userId: string): Promise<Message[]> {
    try {
      console.log('ChatService: Getting messages for ride:', rideId);
      
      // Verify user has access first
      const hasAccess = await this.verifyUserChatAccess(rideId, userId);
      if (!hasAccess) {
        throw new Error('User does not have access to this chat');
      }

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('ride_id', rideId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('ChatService: Error getting messages:', error);
        throw error;
      }

      console.log('ChatService: Retrieved messages:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('ChatService: Failed to get messages:', error);
      throw error;
    }
  }

  // Subscribe to messages for a specific chat
  static subscribeToMessages(rideId: string, callback: (message: Message) => void) {
    console.log('ChatService: Setting up message subscription for ride:', rideId);
    
    const subscription = supabase
      .channel(`messages-${rideId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `ride_id=eq.${rideId}`
        },
        (payload) => {
          console.log('ChatService: New message received:', payload);
          callback(payload.new as Message);
        }
      )
      .subscribe();

    return subscription;
  }

  // Create welcome message when request is accepted
  static async createWelcomeMessage(rideId: string, fromUserId: string): Promise<Message> {
    try {
      console.log('ChatService: Creating welcome message for ride:', rideId);
      
      const welcomeContent = "Your ride request has been accepted! You can now chat with each other to coordinate the details.";
      
      return await this.sendMessage(rideId, fromUserId, welcomeContent);
    } catch (error) {
      console.error('ChatService: Failed to create welcome message:', error);
      throw error;
    }
  }
}
