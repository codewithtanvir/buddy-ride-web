import { supabase } from "../lib/supabase";
import type { RideWithProfile, MessageWithProfile } from "../types";

export interface ChatRide extends RideWithProfile {
  lastMessage?: {
    content: string;
    created_at: string;
    sender_name: string;
    message_type?: string;
  };
  hasAccess?: boolean;
}

export class ChatService {
  /**
   * Get all rides that a user has access to chat with
   */
  static async getChatRides(userId: string): Promise<ChatRide[]> {
    console.log("🔍 ChatService: Fetching chat rides for user:", userId);

    try {
      // Get all rides where user is involved (owner, requester, or has messages)
      const { data: accessibleRides, error } = await supabase.rpc(
        'get_user_chat_rides',
        { input_user_id: userId }
      );

      if (error) {
        console.error("❌ Error calling RPC function:", error);
        // Fallback to manual queries if RPC doesn't exist
        return await this.getChatRidesFallback(userId);
      }

      console.log("✅ Got accessible rides from RPC:", Array.isArray(accessibleRides) ? accessibleRides.length : 0);
      
      if (!accessibleRides || !Array.isArray(accessibleRides) || accessibleRides.length === 0) {
        return [];
      }

      // Transform RPC results to proper format and determine chat partner
      const transformedRides: ChatRide[] = [];
      
      for (const row of accessibleRides as any[]) {
        // For each ride, determine who the chat partner is
        let chatPartnerProfile = null;
        
        if (row.user_id === userId) {
          // User owns this ride, find the most recent requester or message sender
          const { data: partner } = await supabase
            .from("ride_requests")
            .select(`
              requester_id,
              profiles:requester_id (
                id, name, student_id, department, gender, role, created_at, notification_preferences, phone_number
              )
            `)
            .eq("ride_id", row.id)
            .neq("requester_id", userId)
            .order("created_at", { ascending: false })
            .limit(1);

          if (partner && partner.length > 0) {
            chatPartnerProfile = partner[0].profiles;
          } else {
            // Fallback: find most recent message sender
            const { data: messageSender } = await supabase
              .from("messages")
              .select(`
                sender_id,
                profiles:sender_id (
                  id, name, student_id, department, gender, role, created_at, notification_preferences, phone_number
                )
              `)
              .eq("ride_id", row.id)
              .neq("sender_id", userId)
              .order("created_at", { ascending: false })
              .limit(1);

            if (messageSender && messageSender.length > 0) {
              chatPartnerProfile = messageSender[0].profiles;
            }
          }
        } else {
          // User doesn't own this ride, so ride owner is the chat partner
          chatPartnerProfile = {
            id: row.profile_id,
            name: row.profile_name,
            student_id: row.profile_student_id,
            department: row.profile_department,
            gender: row.profile_gender,
            role: row.profile_role,
            created_at: row.profile_created_at,
            notification_preferences: row.profile_notification_preferences,
            phone_number: null,
          };
        }

        // Use fallback if no chat partner found
        if (!chatPartnerProfile) {
          chatPartnerProfile = {
            id: row.profile_id,
            name: row.profile_name || "Unknown User",
            student_id: row.profile_student_id,
            department: row.profile_department,
            gender: row.profile_gender,
            role: row.profile_role,
            created_at: row.profile_created_at,
            notification_preferences: row.profile_notification_preferences,
            phone_number: null,
          };
        }

        transformedRides.push({
          id: row.id,
          user_id: row.user_id,
          from_location: row.from_location,
          to_location: row.to_location,
          ride_time: row.ride_time,
          notes: row.notes,
          created_at: row.created_at,
          profiles: chatPartnerProfile,
          hasAccess: true,
        });
      }

      // Get last messages for these rides
      const rideIds = transformedRides.map((ride) => ride.id);
      const { data: messages } = await supabase
        .from("messages")
        .select(`
          ride_id,
          content,
          created_at,
          message_type,
          profiles:sender_id (name)
        `)
        .in("ride_id", rideIds)
        .order("created_at", { ascending: false });

      // Group messages by ride_id and get the latest
      const lastMessagesByRide = new Map<string, any>();
      messages?.forEach((message) => {
        if (message.ride_id && !lastMessagesByRide.has(message.ride_id)) {
          lastMessagesByRide.set(message.ride_id, message);
        }
      });

      // Combine rides with their last messages
      const chatRides: ChatRide[] = transformedRides.map((ride) => {
        const lastMessageData = lastMessagesByRide.get(ride.id);
        
        return {
          ...ride,
          lastMessage: lastMessageData ? {
            content: lastMessageData.content,
            created_at: lastMessageData.created_at,
            sender_name: (lastMessageData.profiles as any)?.name || "Unknown",
            message_type: lastMessageData.message_type,
          } : undefined,
        };
      });

      // Sort by last message time or ride creation time
      chatRides.sort((a, b) => {
        const aTime = a.lastMessage?.created_at || a.created_at || "";
        const bTime = b.lastMessage?.created_at || b.created_at || "";
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });

      console.log("✅ ChatService: Returning", chatRides.length, "chat rides");
      return chatRides;

    } catch (error) {
      console.error("❌ ChatService: Error fetching chat rides:", error);
      return await this.getChatRidesFallback(userId);
    }
  }

  /**
   * Fallback method using manual queries if RPC function doesn't exist
   */
  private static async getChatRidesFallback(userId: string): Promise<ChatRide[]> {
    console.log("🔄 Using fallback method for chat rides");

    const allRides = new Map<string, RideWithProfile>();

    // 1. Get rides where user is the owner
    const { data: ownedRides } = await supabase
      .from("rides")
      .select(`
        *,
        profiles:user_id (*)
      `)
      .eq("user_id", userId);

    ownedRides?.forEach((ride) => {
      allRides.set(ride.id, ride as RideWithProfile);
    });

    // 2. Get rides where user has made requests
    const { data: requestedRides } = await supabase
      .from("ride_requests")
      .select(`
        ride_id,
        rides!inner (
          *,
          profiles:user_id (*)
        )
      `)
      .eq("requester_id", userId);

    requestedRides?.forEach((item) => {
      if (item.rides && item.ride_id) {
        allRides.set(item.ride_id, item.rides as RideWithProfile);
      }
    });

    // 3. Get rides where others have made requests to user's rides
    const { data: ridesWithRequests } = await supabase
      .from("ride_requests")
      .select(`
        ride_id,
        rides!inner (
          *,
          profiles:user_id (*)
        )
      `)
      .eq("rides.user_id", userId);

    ridesWithRequests?.forEach((item) => {
      if (item.rides && item.ride_id) {
        allRides.set(item.ride_id, item.rides as RideWithProfile);
      }
    });

    // 4. Get rides where user has sent messages
    const { data: messageRides } = await supabase
      .from("messages")
      .select(`
        ride_id,
        rides!inner (
          *,
          profiles:user_id (*)
        )
      `)
      .eq("sender_id", userId);

    messageRides?.forEach((item) => {
      if (item.rides && item.ride_id) {
        allRides.set(item.ride_id, item.rides as RideWithProfile);
      }
    });

    const rides = Array.from(allRides.values());
    
    if (rides.length === 0) {
      return [];
    }

    // Transform rides to show correct chat partners
    const transformedRides: ChatRide[] = [];
    
    for (const ride of rides) {
      let chatPartnerProfile = null;
      
      if (ride.user_id === userId) {
        // User owns this ride, find the most recent requester
        const { data: partner } = await supabase
          .from("ride_requests")
          .select(`
            requester_id,
            profiles:requester_id (*)
          `)
          .eq("ride_id", ride.id)
          .neq("requester_id", userId)
          .order("created_at", { ascending: false })
          .limit(1);

        if (partner && partner.length > 0) {
          chatPartnerProfile = partner[0].profiles;
        }
      } else {
        // User doesn't own this ride, so ride owner is the chat partner
        chatPartnerProfile = ride.profiles;
      }

      // Use fallback if no chat partner found
      if (!chatPartnerProfile) {
        chatPartnerProfile = ride.profiles || {
          id: "unknown",
          name: "Unknown User",
          student_id: null,
          department: null,
          gender: null,
          role: null,
          created_at: new Date().toISOString(),
          notification_preferences: null,
          phone_number: null,
        };
      }

      transformedRides.push({
        ...ride,
        profiles: chatPartnerProfile,
        hasAccess: true,
      });
    }

    // Get last messages
    const rideIds = transformedRides.map(ride => ride.id);
    const { data: messages } = await supabase
      .from("messages")
      .select(`
        ride_id,
        content,
        created_at,
        message_type,
        profiles:sender_id (name)
      `)
      .in("ride_id", rideIds)
      .order("created_at", { ascending: false });

    const lastMessagesByRide = new Map<string, any>();
    messages?.forEach((message) => {
      if (message.ride_id && !lastMessagesByRide.has(message.ride_id)) {
        lastMessagesByRide.set(message.ride_id, message);
      }
    });

    const chatRides: ChatRide[] = transformedRides.map((ride) => {
      const lastMessageData = lastMessagesByRide.get(ride.id);
      
      return {
        ...ride,
        lastMessage: lastMessageData ? {
          content: lastMessageData.content,
          created_at: lastMessageData.created_at,
          sender_name: (lastMessageData.profiles as any)?.name || "Unknown",
          message_type: lastMessageData.message_type,
        } : undefined,
      };
    });

    chatRides.sort((a, b) => {
      const aTime = a.lastMessage?.created_at || a.created_at || "";
      const bTime = b.lastMessage?.created_at || b.created_at || "";
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });

    return chatRides;
  }

  /**
   * Check if a user has access to a specific chat
   */
  static async checkChatAccess(rideId: string, userId: string): Promise<boolean> {
    console.log("🔐 ChatService: Checking access for ride:", rideId, "user:", userId);

    try {
      // Check if user is ride owner
      const { data: ride } = await supabase
        .from("rides")
        .select("user_id")
        .eq("id", rideId)
        .single();

      if (ride?.user_id === userId) {
        console.log("✅ User is ride owner");
        return true;
      }

      // Check if user has any request for this ride
      const { data: requests } = await supabase
        .from("ride_requests")
        .select("id, status")
        .eq("ride_id", rideId)
        .eq("requester_id", userId);

      if (requests && requests.length > 0) {
        console.log("✅ User has requests for this ride:", requests);
        return true;
      }

      // Check if user has sent messages to this ride
      const { data: messages } = await supabase
        .from("messages")
        .select("id")
        .eq("ride_id", rideId)
        .eq("sender_id", userId)
        .limit(1);

      if (messages && messages.length > 0) {
        console.log("✅ User has sent messages to this ride");
        return true;
      }

      // Check if others have made requests to user's ride
      const { data: requestsToMyRide } = await supabase
        .from("ride_requests")
        .select("id, rides!inner(user_id)")
        .eq("ride_id", rideId)
        .eq("rides.user_id", userId);

      if (requestsToMyRide && requestsToMyRide.length > 0) {
        console.log("✅ Others have made requests to user's ride");
        return true;
      }

      console.log("❌ User does not have access to this chat");
      return false;

    } catch (error) {
      console.error("❌ Error checking chat access:", error);
      return false;
    }
  }

  /**
   * Get messages for a specific ride
   */
  static async getMessages(rideId: string): Promise<MessageWithProfile[]> {
    console.log("💬 ChatService: Fetching messages for ride:", rideId);

    try {
      // First get the messages
      const { data: messagesData, error: messagesError } = await supabase
        .from("messages")
        .select("*")
        .eq("ride_id", rideId)
        .order("created_at", { ascending: true });

      if (messagesError) {
        console.error("❌ Error fetching messages:", messagesError);
        throw messagesError;
      }

      if (!messagesData || messagesData.length === 0) {
        console.log("✅ No messages found for ride");
        return [];
      }

      // Get unique sender IDs
      const senderIds = [...new Set(messagesData.map(msg => msg.sender_id))];
      
      // Fetch profiles for all senders
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, name, student_id, department, gender, role, created_at, notification_preferences, phone_number")
        .in("id", senderIds);

      if (profilesError) {
        console.error("❌ Error fetching profiles:", profilesError);
        // Continue without profile data
      }

      // Create a map of profiles for quick lookup
      const profilesMap = new Map();
      profilesData?.forEach(profile => {
        profilesMap.set(profile.id, profile);
      });

      // Combine messages with profile data
      const messagesWithProfiles: MessageWithProfile[] = messagesData.map(message => ({
        ...message,
        profiles: profilesMap.get(message.sender_id) || {
          id: message.sender_id,
          name: "Unknown User",
          student_id: null,
          department: null,
          gender: null,
          role: null,
          created_at: new Date().toISOString(),
          notification_preferences: null,
          phone_number: null
        }
      }));

      console.log("✅ Fetched", messagesWithProfiles.length, "messages with profiles");
      return messagesWithProfiles;

    } catch (error) {
      console.error("❌ Error fetching messages:", error);
      return [];
    }
  }

  /**
   * Send a message
   */
  static async sendMessage(
    rideId: string, 
    senderId: string, 
    content: string,
    messageType: string = 'text'
  ): Promise<MessageWithProfile> {
    console.log("📤 ChatService: Sending message to ride:", rideId, "from:", senderId);
    console.log("📤 Message content:", content);
    console.log("📤 Message type:", messageType);

    try {
      // Validate inputs
      if (!rideId || !senderId || !content) {
        throw new Error("Missing required parameters: rideId, senderId, or content");
      }

      if (content.trim().length === 0) {
        throw new Error("Message content cannot be empty");
      }

      if (content.length > 1000) {
        throw new Error("Message content too long (max 1000 characters)");
      }

      // Check if user has access to this chat
      const hasAccess = await this.checkChatAccess(rideId, senderId);
      if (!hasAccess) {
        throw new Error("You don't have permission to send messages in this chat");
      }

      // Insert the message
      const { data: messageData, error: messageError } = await supabase
        .from("messages")
        .insert({
          content: content.trim(),
          ride_id: rideId,
          sender_id: senderId,
          message_type: messageType,
        })
        .select("*")
        .single();

      if (messageError) {
        console.error("❌ Supabase error:", messageError);
        if (messageError.code === 'PGRST116') {
          throw new Error("Message could not be saved. Please check your connection and try again.");
        } else if (messageError.code === '23503') {
          throw new Error("Invalid ride or user. Please refresh and try again.");
        } else {
          throw new Error(`Failed to send message: ${messageError.message || 'Unknown database error'}`);
        }
      }

      if (!messageData) {
        throw new Error("No data returned from message insert - message may not have been saved");
      }

      // Get the sender's profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, name, student_id, department, gender, role, created_at, notification_preferences, phone_number")
        .eq("id", senderId)
        .single();

      if (profileError) {
        console.error("❌ Error fetching sender profile:", profileError);
      }

      // Combine message with profile data
      const messageWithProfile: MessageWithProfile = {
        ...messageData,
        profiles: profileData || {
          id: senderId,
          name: "Unknown User",
          student_id: null,
          department: null,
          gender: null,
          role: null,
          created_at: new Date().toISOString(),
          notification_preferences: null,
          phone_number: null
        }
      };

      console.log("✅ Message sent successfully:", messageData.id);
      return messageWithProfile;

    } catch (error) {
      console.error("❌ Error sending message:", error);
      console.error("❌ Error details:", {
        rideId,
        senderId,
        contentLength: content?.length,
        messageType,
        error: error instanceof Error ? error.message : error
      });
      
      // Re-throw the error with better context
      if (error instanceof Error) {
        throw new Error(`Failed to send message: ${error.message}`);
      } else {
        throw new Error("Failed to send message: Unknown error occurred");
      }
    }
  }

  /**
   * Create a welcome message when a request is accepted
   */
  static async createWelcomeMessage(
    rideId: string, 
    rideOwnerId: string
  ): Promise<void> {
    console.log("🎉 ChatService: Creating welcome message for ride:", rideId);

    try {
      // Check if messages already exist
      const { data: existingMessages } = await supabase
        .from("messages")
        .select("id")
        .eq("ride_id", rideId)
        .limit(1);

      if (existingMessages && existingMessages.length > 0) {
        console.log("ℹ️ Messages already exist, skipping welcome message");
        return;
      }

      await this.sendMessage(
        rideId,
        rideOwnerId,
        "Welcome to the ride chat! Feel free to coordinate pickup details, timing, and any other arrangements here. 🚗",
        "system"
      );

      console.log("✅ Welcome message created");

    } catch (error) {
      console.error("❌ Error creating welcome message:", error);
      // Don't throw - this is not critical
    }
  }
}
