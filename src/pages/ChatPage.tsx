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
                  phone_number,
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
              phone_number,
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
            phone_number,
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
            phone_number,
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
            phone_number,
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
            <CardContent className="p-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="text-gray-600 font-medium">Loading chat...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
            <CardContent className="p-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-xl">
                  ⚠️
                </div>
                <p className="text-red-600 mb-6 font-medium">{error}</p>
                <Button
                  onClick={() => navigate(-1)}
                  variant="outline"
                  className="rounded-xl border-2 hover:bg-gray-50"
                >
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
            <CardContent className="p-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-400 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-xl">
                  🚗
                </div>
                <p className="text-gray-600 mb-6 font-medium">Ride not found</p>
                <Button
                  onClick={() => navigate("/chats")}
                  className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
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
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      {/* Enhanced Header */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-lg p-3 lg:p-4 safe-area-top">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              onClick={() => navigate("/chats")}
              className="p-2 h-10 w-10 lg:h-12 lg:w-12 flex-shrink-0 rounded-xl hover:bg-blue-100 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 lg:h-6 lg:w-6 text-blue-600" />
            </Button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3 lg:space-x-4">
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                  {ride.profiles?.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-bold text-lg lg:text-xl text-gray-900 truncate">
                    Chat with {ride.profiles?.name}
                  </h2>
                  <div className="flex items-center text-sm text-gray-600 gap-2">
                    <MapPin className="h-3 w-3 lg:h-4 lg:w-4 flex-shrink-0 text-green-600" />
                    <span className="font-medium truncate">
                      {ride.from_location} → {ride.to_location}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center text-xs lg:text-sm text-gray-500">
                <Clock className="h-3 w-3 lg:h-4 lg:w-4 mr-1" />
                <span>{formatDateTime(ride.ride_time)}</span>
              </div>
              <div
                className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2 ${
                  connectionStatus === "SUBSCRIBED"
                    ? "bg-green-100 text-green-800"
                    : connectionStatus === "CHANNEL_ERROR"
                    ? "bg-red-100 text-red-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    connectionStatus === "SUBSCRIBED"
                      ? "bg-green-500 animate-pulse"
                      : connectionStatus === "CHANNEL_ERROR"
                      ? "bg-red-500"
                      : "bg-yellow-500"
                  }`}
                ></div>
                {connectionStatus === "SUBSCRIBED"
                  ? "Live"
                  : connectionStatus === "CHANNEL_ERROR"
                  ? "Offline"
                  : "Connecting"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Messages Section */}
      <div className="flex-1 overflow-y-auto p-3 lg:p-4">
        <div className="max-w-4xl mx-auto space-y-3 lg:space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8 lg:py-12">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-8 mx-auto max-w-md shadow-sm border border-gray-200">
                <div className="text-gray-500 text-base mb-2">💬</div>
                <div className="text-gray-600 font-medium mb-2">
                  No messages yet
                </div>
                <div className="text-gray-500 text-sm">
                  Start the conversation with {ride.profiles?.name}!
                </div>
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
                  className={`max-w-[85%] sm:max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
                    isMyMessage(message)
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                      : "bg-white/95 backdrop-blur-sm text-gray-900 border border-gray-200"
                  }`}
                >
                  {!isMyMessage(message) && (
                    <div className="text-xs font-medium mb-1 text-gray-600">
                      {message.profiles?.name}
                    </div>
                  )}
                  <div className="break-words text-sm lg:text-base">
                    {message.content}
                  </div>
                  <div
                    className={`text-xs mt-2 ${
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

      {/* Enhanced Message Input */}
      <div className="bg-white/95 backdrop-blur-sm border-t border-gray-200 p-4 shadow-lg safe-area-bottom">
        <div className="max-w-4xl mx-auto">
          <form
            onSubmit={handleSendMessage}
            className="flex gap-3 items-center"
          >
            <div className="flex-1">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={`Message ${ride.profiles?.name}...`}
                className="w-full border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl bg-gray-50/50 backdrop-blur-sm transition-all duration-200"
                disabled={sending}
                autoComplete="off"
              />
            </div>
            <Button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="h-12 w-12 p-0 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:ring-4 focus:ring-blue-500/20 flex-shrink-0 transition-all duration-200 shadow-lg"
              variant="primary"
            >
              {sending ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
