import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";

export interface PhoneShareRequest {
  id: string;
  ride_id: string;
  requester_id: string;
  phone_shared: boolean;
  message?: string;
  created_at: string;
  status: "pending" | "accepted" | "declined";
}

export interface ChatMessage {
  id: string;
  content: string;
  ride_id: string;
  sender_id: string;
  created_at: string;
  message_type?: "text" | "phone_share" | "system";
  phone_number?: string;
  phone_shared?: boolean;
  profiles?: {
    id: string;
    name: string | null;
    student_id: string | null;
    department: string | null;
    gender: string | null;
    phone_number: string | null;
    created_at: string | null;
  } | null;
}

/**
 * Send a message with optional phone number sharing
 */
export async function sendChatMessage({
  rideId,
  senderId,
  content,
  sharePhone = false,
  phoneNumber,
}: {
  rideId: string;
  senderId: string;
  content: string;
  sharePhone?: boolean;
  phoneNumber?: string;
}): Promise<ChatMessage | null> {
  try {
    // Validate inputs
    if (!content.trim()) {
      throw new Error("Message content cannot be empty");
    }

    if (content.length > 1000) {
      throw new Error("Message cannot be longer than 1000 characters");
    }

    // Content filtering
    const inappropriateWords = ["spam", "scam", "fake", "fraud"];
    if (
      inappropriateWords.some((word) => content.toLowerCase().includes(word))
    ) {
      throw new Error("Message contains inappropriate content");
    }

    // Prepare message data
    const messageData: any = {
      content: content.trim(),
      ride_id: rideId,
      sender_id: senderId,
      message_type: sharePhone ? "phone_share" : "text",
    };

    // Add phone number if sharing
    if (sharePhone && phoneNumber) {
      messageData.phone_number = phoneNumber;
      messageData.phone_shared = true;
    }

    // Insert message
    const { data, error } = await supabase
      .from("messages")
      .insert(messageData)
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
          created_at
        )
      `
      )
      .single();

    if (error) throw error;

    return data as ChatMessage;
  } catch (error) {
    console.error("Error sending chat message:", error);
    throw error;
  }
}

/**
 * Request phone number from another user
 */
export async function requestPhoneNumber({
  rideId,
  requesterId,
  message,
}: {
  rideId: string;
  requesterId: string;
  message?: string;
}): Promise<boolean> {
  try {
    // Check if request already exists
    const { data: existingRequest } = await supabase
      .from("ride_requests")
      .select("id, status")
      .eq("ride_id", rideId)
      .eq("requester_id", requesterId)
      .single();

    if (existingRequest) {
      if (existingRequest.status === "pending") {
        throw new Error("Phone number request already pending");
      }

      // Update existing request
      const { error: updateError } = await supabase
        .from("ride_requests")
        .update({
          message:
            message ||
            "Would like to get your phone number for ride coordination",
          status: "pending",
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingRequest.id);

      if (updateError) throw updateError;
    } else {
      // Create new request
      const { error: insertError } = await supabase
        .from("ride_requests")
        .insert({
          ride_id: rideId,
          requester_id: requesterId,
          message:
            message ||
            "Would like to get your phone number for ride coordination",
          status: "pending",
        });

      if (insertError) throw insertError;
    }

    // Send system message about the request
    await supabase.from("messages").insert({
      content: `📱 ${
        message || "Requested phone number for ride coordination"
      }`,
      ride_id: rideId,
      sender_id: requesterId,
      message_type: "system",
    });

    return true;
  } catch (error) {
    console.error("Error requesting phone number:", error);
    throw error;
  }
}

/**
 * Respond to a phone number request
 */
export async function respondToPhoneRequest({
  requestId,
  approved,
  phoneNumber,
  responseMessage,
}: {
  requestId: string;
  approved: boolean;
  phoneNumber?: string;
  responseMessage?: string;
}): Promise<boolean> {
  try {
    // Get the request details
    const { data: request, error: fetchError } = await supabase
      .from("ride_requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (fetchError || !request) {
      throw new Error("Phone request not found");
    }

    // Update the request status
    const { error: updateError } = await supabase
      .from("ride_requests")
      .update({
        status: approved ? "accepted" : "declined",
        phone_shared: approved,
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (updateError) throw updateError;

    // Send response message
    const messageContent = approved
      ? `📱 ${responseMessage || `Here's my phone number: ${phoneNumber}`}`
      : `❌ ${responseMessage || "Phone number request declined"}`;

    await supabase.from("messages").insert({
      content: messageContent,
      ride_id: request.ride_id,
      sender_id: request.requester_id, // Send to the requester
      message_type: approved ? "phone_share" : "system",
      phone_number: approved ? phoneNumber : undefined,
      phone_shared: approved,
    });

    return true;
  } catch (error) {
    console.error("Error responding to phone request:", error);
    throw error;
  }
}

/**
 * Get phone sharing history for a ride
 */
export async function getPhoneShareHistory(rideId: string): Promise<{
  sharedNumbers: Array<{
    user_id: string;
    user_name: string;
    phone_number: string;
    shared_at: string;
  }>;
  pendingRequests: Array<{
    id: string;
    requester_id: string;
    requester_name: string;
    message: string;
    created_at: string;
  }>;
}> {
  try {
    // Get shared phone numbers from messages
    const { data: sharedMessages, error: messagesError } = await supabase
      .from("messages")
      .select(
        `
        sender_id,
        phone_number,
        created_at,
        profiles:sender_id (
          name
        )
      `
      )
      .eq("ride_id", rideId)
      .eq("message_type", "phone_share")
      .not("phone_number", "is", null);

    if (messagesError) {
      console.error("Error fetching shared messages:", messagesError);
      // Continue with empty array instead of throwing
    }

    // Get pending requests
    const { data: pendingRequests, error: requestsError } = await supabase
      .from("ride_requests")
      .select(
        `
        id,
        requester_id,
        message,
        created_at,
        profiles:requester_id (
          name
        )
      `
      )
      .eq("ride_id", rideId)
      .eq("status", "pending");

    if (requestsError) throw requestsError;

    return {
      sharedNumbers:
        sharedMessages && !messagesError
          ? sharedMessages.map((msg) => ({
              user_id: msg.sender_id!,
              user_name: msg.profiles?.name || "Unknown User",
              phone_number: msg.phone_number!,
              shared_at: msg.created_at!,
            }))
          : [],
      pendingRequests: (pendingRequests || []).map((req) => ({
        id: req.id,
        requester_id: req.requester_id!,
        requester_name: req.profiles?.name || "Unknown User",
        message: req.message || "",
        created_at: req.created_at!,
      })),
    };
  } catch (error) {
    console.error("Error getting phone share history:", error);
    return {
      sharedNumbers: [],
      pendingRequests: [],
    };
  }
}

/**
 * Check if user has permission to see phone numbers in a ride
 */
export async function checkPhoneAccessPermission(
  rideId: string,
  userId: string
): Promise<boolean> {
  try {
    // Check if user is the ride owner
    const { data: rideData } = await supabase
      .from("rides")
      .select("user_id")
      .eq("id", rideId)
      .single();

    if (rideData?.user_id === userId) {
      return true;
    }

    // Check if user has an accepted request
    const { data: requestData } = await supabase
      .from("ride_requests")
      .select("id")
      .eq("ride_id", rideId)
      .eq("requester_id", userId)
      .eq("status", "accepted")
      .limit(1);

    return !!(requestData && requestData.length > 0);
  } catch (error) {
    console.error("Error checking phone access permission:", error);
    return false;
  }
}

/**
 * Validate phone number format
 */
export function validatePhoneNumber(phone: string): boolean {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, "");

  // Check if it's a valid length (10-15 digits)
  if (cleaned.length < 10 || cleaned.length > 15) {
    return false;
  }

  // Basic pattern matching for common formats
  const patterns = [
    /^\d{10}$/, // 1234567890
    /^\d{11}$/, // 11234567890
    /^\d{3}-?\d{3}-?\d{4}$/, // 123-456-7890
    /^\(\d{3}\)\s?\d{3}-?\d{4}$/, // (123) 456-7890
    /^\+\d{1,3}\s?\d{10,11}$/, // +1 1234567890
  ];

  return patterns.some((pattern) => pattern.test(phone));
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");

  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3");
  } else if (cleaned.length === 11) {
    return cleaned.replace(/(\d{1})(\d{3})(\d{3})(\d{4})/, "+$1 ($2) $3-$4");
  }

  return phone; // Return original if format not recognized
}
