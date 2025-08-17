import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, Send, MapPin, Clock, Users } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { useAuthStore } from "../stores/authStore";
import { useRideStore } from "../stores/rideStore";
import { supabase } from "../lib/supabase";
import { formatDateTime } from "../utils/formatters";
import toast from "react-hot-toast";
import type { MessageWithProfile, RideWithProfile } from "../types";

const ChatPage: React.FC = () => {
  const navigate = useNavigate();
  const { rideId } = useParams<{ rideId: string }>();
  const { user } = useAuthStore();
  const [newMessage, setNewMessage] = useState("");
  const [ride, setRide] = useState<RideWithProfile | null>(null);
  const [messages, setMessages] = useState<MessageWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] =
    useState<string>("disconnected");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (rideId && user?.id) {
      fetchRideDetails();
      fetchMessages();
    }
  }, [rideId, user?.id]);

  useEffect(() => {
    if (!rideId) return;

    console.log("Setting up real-time subscription for ride:", rideId);

    // Set up real-time subscription for new messages
    const messagesSubscription = supabase
      .channel(`messages:${rideId}`, {
        config: {
          broadcast: { self: false },
          presence: { key: user?.id },
        },
      })
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `ride_id=eq.${rideId}`,
        },
        async (payload) => {
          console.log("New message received:", payload);
          const newMsg = payload.new as any;

          // Fetch the complete message with profile data
          try {
            const { data: messageWithProfile } = await supabase
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
              .eq("id", newMsg.id)
              .single();

            if (messageWithProfile) {
              console.log("Adding message to local state:", messageWithProfile);
              setMessages((prev) => {
                // Check if message already exists to avoid duplicates
                const exists = prev.some(
                  (msg) => msg.id === messageWithProfile.id
                );
                if (exists) {
                  console.log("Message already exists, skipping");
                  return prev;
                }
                console.log("Adding new message to state");
                return [...prev, messageWithProfile];
              });
            }
          } catch (error) {
            console.error("Error fetching new message:", error);
            // Fallback to refetching all messages
            fetchMessages();
          }
        }
      )
      .subscribe((status) => {
        console.log("Subscription status:", status);
        setConnectionStatus(status);
      });

    return () => {
      console.log("Cleaning up subscription for ride:", rideId);
      supabase.removeChannel(messagesSubscription);
    };
  }, [rideId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fallback polling mechanism if real-time doesn't work
  useEffect(() => {
    if (!rideId) return;

    const pollForNewMessages = async () => {
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

        if (data && data.length !== messages.length) {
          console.log("Polling detected new messages, updating state");
          setMessages(data);
        }
      } catch (error) {
        console.error("Error polling for messages:", error);
      }
    };

    // Poll every 3 seconds as fallback
    const pollInterval = setInterval(pollForNewMessages, 3000);

    return () => {
      clearInterval(pollInterval);
    };
  }, [rideId, messages.length]);

  const fetchMessages = async () => {
    if (!rideId) return;

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

      setMessages(data || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
      setError("Failed to load messages");
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchRideDetails = async () => {
    if (!rideId) return;

    try {
      setLoading(true);
      setError(null);

      // First check if user has access to this chat
      const hasAccess = await checkChatAccess(rideId, user?.id);
      if (!hasAccess) {
        setError("You don't have access to this chat");
        return;
      }

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
        .eq("id", rideId)
        .single();

      if (error) throw error;

      if (!data) {
        setError("Ride not found");
        return;
      }

      setRide(data);
    } catch (error) {
      console.error("Error fetching ride details:", error);
      setError("Failed to load ride details");
      toast.error("Failed to load ride details");
    } finally {
      setLoading(false);
    }
  };

  const checkChatAccess = async (
    rideId: string,
    userId?: string
  ): Promise<boolean> => {
    if (!userId) return false;

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

      // Check if user has sent messages to this ride
      const { data: messageData } = await supabase
        .from("messages")
        .select("id")
        .eq("ride_id", rideId)
        .eq("sender_id", userId)
        .limit(1);

      if (messageData && messageData.length > 0) {
        return true;
      }

      // Check if user has an accepted request for this ride
      const { data: requestData } = await supabase
        .from("ride_requests")
        .select("id")
        .eq("ride_id", rideId)
        .eq("requester_id", userId)
        .eq("status", "accepted")
        .limit(1);

      if (requestData && requestData.length > 0) {
        return true;
      }

      return false;
    } catch (error) {
      console.error("Error checking chat access:", error);
      return false;
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !rideId || !user?.id || sending) return;

    const messageContent = newMessage.trim();
    setNewMessage("");
    setSending(true);

    console.log("Sending message:", messageContent);

    try {
      const { data, error } = await supabase
        .from("messages")
        .insert({
          content: messageContent,
          ride_id: rideId,
          sender_id: user.id,
        })
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
        .single();

      if (error) throw error;

      console.log("Message sent successfully:", data);

      // Add the message to local state (optimistically)
      setMessages((prev) => {
        // Check if message already exists to avoid duplicates
        const exists = prev.some((msg) => msg.id === data.id);
        if (exists) {
          console.log("Message already exists in state, skipping");
          return prev;
        }
        console.log("Adding sent message to local state");
        return [...prev, data];
      });
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
      setNewMessage(messageContent); // Restore the message
    } finally {
      setSending(false);
    }
  };

  const isMyMessage = (message: MessageWithProfile) => {
    return message.sender_id === user?.id;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-gray-600">Loading chat...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-red-600 mb-4">{error}</p>
                <Button onClick={() => navigate(-1)} variant="outline">
                  Go Back
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-gray-600">Ride not found</p>
              <div className="text-center mt-4">
                <Button onClick={() => navigate("/chats")}>
                  Back to Chats
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-3 lg:p-4 safe-area-top">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              onClick={() => navigate("/chats")}
              className="p-2 h-8 w-8 lg:h-10 lg:w-10 flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4 lg:h-5 lg:w-5" />
            </Button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 lg:space-x-4 text-sm lg:text-base">
                <div className="flex items-center text-gray-700 min-w-0">
                  <MapPin className="h-3 w-3 lg:h-4 lg:w-4 mr-1 flex-shrink-0" />
                  <span className="font-medium truncate">
                    {ride.from_location}
                  </span>
                  <span className="mx-1 lg:mx-2 flex-shrink-0">→</span>
                  <span className="font-medium truncate">
                    {ride.to_location}
                  </span>
                </div>
                <div className="hidden sm:flex items-center text-gray-500 text-xs lg:text-sm flex-shrink-0">
                  <Clock className="h-3 w-3 lg:h-4 lg:w-4 mr-1" />
                  <span>{formatDateTime(ride.ride_time)}</span>
                </div>
              </div>

              <div className="flex items-center text-xs lg:text-sm text-gray-600 mt-1 space-x-2">
                <div className="flex items-center min-w-0">
                  <Users className="h-3 w-3 lg:h-4 lg:w-4 mr-1 flex-shrink-0" />
                  <span className="truncate">
                    Chat with {ride.profiles?.name}
                  </span>
                  <span className="mx-2 hidden sm:inline">•</span>
                  <span className="hidden sm:inline truncate">
                    {ride.profiles?.department}
                  </span>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
                    connectionStatus === "SUBSCRIBED"
                      ? "bg-green-100 text-green-800"
                      : connectionStatus === "CHANNEL_ERROR"
                      ? "bg-red-100 text-red-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {connectionStatus === "SUBSCRIBED"
                    ? "🟢 Live"
                    : connectionStatus === "CHANNEL_ERROR"
                    ? "🔴 Offline"
                    : "🟡 Connecting"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 lg:p-4">
        <div className="max-w-4xl mx-auto space-y-3 lg:space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8 lg:py-12">
              <div className="text-gray-500 text-sm lg:text-base mb-4">
                No messages yet. Start the conversation!
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  isMyMessage(message) ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-xs lg:max-w-md px-3 py-2 lg:px-4 lg:py-2 rounded-lg ${
                    isMyMessage(message)
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-900 border border-gray-200 shadow-sm"
                  }`}
                >
                  {!isMyMessage(message) && (
                    <div className="text-xs font-medium mb-1 opacity-75">
                      {message.profiles?.name}
                    </div>
                  )}
                  <div className="break-words text-sm lg:text-base">
                    {message.content}
                  </div>
                  <div
                    className={`text-xs mt-1 ${
                      isMyMessage(message) ? "text-blue-100" : "text-gray-500"
                    }`}
                  >
                    {formatDateTime(message.created_at)}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 p-4 safe-area-bottom">
        <div className="max-w-4xl mx-auto">
          <form
            onSubmit={handleSendMessage}
            className="flex gap-3 items-center"
          >
            <div className="flex-1">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="w-full border border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                disabled={sending}
                autoComplete="off"
              />
            </div>
            <Button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="h-10 w-10 p-0 rounded-full bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 flex-shrink-0"
              variant="primary"
            >
              {sending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
