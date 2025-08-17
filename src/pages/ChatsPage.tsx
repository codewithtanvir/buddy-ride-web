import React, { useState, useEffect } from "react";
import { MessageCircle, Clock, MapPin, Users } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { supabase } from "../lib/supabase";
import { formatDateTime } from "../utils/formatters";
import { SkeletonList } from "../components/LoadingStates";
import type { RideWithProfile } from "../types";

interface ChatRide extends RideWithProfile {
  lastMessage?: {
    content: string;
    created_at: string;
    sender_name: string;
  };
}

const ChatsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [chatRides, setChatRides] = useState<ChatRide[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchChatRides();

      // Subscribe to new messages for real-time updates
      const subscription = supabase
        .channel("chat-updates")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "messages",
          },
          () => {
            fetchChatRides();
          }
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "ride_requests",
          },
          () => {
            fetchChatRides();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user?.id]);

  const fetchChatRides = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Get rides where user is either the creator or has sent/received messages
      const { data: ridesData, error: ridesError } = await supabase
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
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (ridesError) throw ridesError;

      // Get rides where user has sent messages (not their own rides)
      const { data: messageRidesData, error: messageRidesError } =
        await supabase
          .from("messages")
          .select(
            `
          ride_id,
          rides!inner (
            *,
            profiles:user_id (
              id,
              name,
              student_id,
              department,
              gender,
              created_at
            )
          )
        `
          )
          .eq("sender_id", user.id)
          .neq("rides.user_id", user.id);

      if (messageRidesError) throw messageRidesError;

      // Get rides where user has accepted requests (status = 'accepted')
      const { data: acceptedRequestRides, error: acceptedRequestError } =
        await supabase
          .from("ride_requests")
          .select(
            `
          ride_id,
          rides!inner (
            *,
            profiles:user_id (
              id,
              name,
              student_id,
              department,
              gender,
              created_at
            )
          )
        `
          )
          .eq("requester_id", user.id)
          .eq("status", "accepted")
          .neq("rides.user_id", user.id);

      if (acceptedRequestError) throw acceptedRequestError;

      // Combine and deduplicate rides
      const allRides = new Map<string, RideWithProfile>();

      ridesData?.forEach((ride) => {
        allRides.set(ride.id, ride);
      });

      messageRidesData?.forEach((messageRide) => {
        if (messageRide.rides && messageRide.ride_id) {
          allRides.set(
            messageRide.ride_id,
            messageRide.rides as RideWithProfile
          );
        }
      });

      // Add rides from accepted requests
      acceptedRequestRides?.forEach((requestRide) => {
        if (requestRide.rides && requestRide.ride_id) {
          allRides.set(
            requestRide.ride_id,
            requestRide.rides as RideWithProfile
          );
        }
      });

      // Get last message for each ride in batch for better performance
      const rideIds = Array.from(allRides.keys());

      if (rideIds.length === 0) {
        setChatRides([]);
        return;
      }

      // Get all last messages in one query
      const { data: messagesData, error: messagesError } = await supabase
        .from("messages")
        .select(
          `
          ride_id,
          content,
          created_at,
          profiles:sender_id (name)
        `
        )
        .in("ride_id", rideIds)
        .order("created_at", { ascending: false });

      if (messagesError) throw messagesError;

      // Group messages by ride_id and get the latest for each
      const lastMessagesByRide = new Map<string, any>();
      messagesData?.forEach((message) => {
        if (message.ride_id && !lastMessagesByRide.has(message.ride_id)) {
          lastMessagesByRide.set(message.ride_id, message);
        }
      });

      const chatRidesWithMessages: ChatRide[] = Array.from(
        allRides.values()
      ).map((ride) => {
        const lastMessageData = lastMessagesByRide.get(ride.id);

        const chatRide: ChatRide = {
          ...ride,
          lastMessage: lastMessageData
            ? {
                content: lastMessageData.content,
                created_at: lastMessageData.created_at,
                sender_name:
                  (lastMessageData.profiles as any)?.name || "Unknown",
              }
            : undefined,
        };

        return chatRide;
      });

      // Sort by last message time or ride creation time
      chatRidesWithMessages.sort((a, b) => {
        const aTime = a.lastMessage?.created_at || a.created_at || "";
        const bTime = b.lastMessage?.created_at || b.created_at || "";
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });

      setChatRides(chatRidesWithMessages);
    } catch (error) {
      console.error("Error fetching chat rides:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChat = (rideId: string) => {
    navigate(`/chat/${rideId}`);
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Chats</h1>
          <p className="text-gray-600 mt-2">Your ride conversations</p>
        </div>

        <div className="space-y-4">
          {loading ? (
            <SkeletonList count={3} />
          ) : chatRides.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No conversations yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Start chatting by posting a ride or joining someone else's
                  ride
                </p>
                <div className="space-x-2">
                  <Button onClick={() => navigate("/post-ride")}>
                    Post a Ride
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate("/find-buddy")}
                  >
                    Find Rides
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            chatRides.map((ride) => (
              <Card
                key={ride.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
              >
                <CardContent
                  className="p-6"
                  onClick={() => handleOpenChat(ride.id)}
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="flex items-center text-gray-600">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span className="font-medium">
                            {ride.from_location}
                          </span>
                          <span className="mx-2">→</span>
                          <span className="font-medium">
                            {ride.to_location}
                          </span>
                        </div>
                        <div className="flex items-center text-gray-500 text-sm">
                          <Clock className="h-4 w-4 mr-1" />
                          <span>{formatDateTime(ride.ride_time)}</span>
                        </div>
                      </div>

                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <Users className="h-4 w-4 mr-1" />
                        <span>with {ride.profiles?.name}</span>
                        <span className="mx-2">•</span>
                        <span>{ride.profiles?.department}</span>
                      </div>

                      {ride.lastMessage ? (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">
                            {ride.lastMessage.sender_name}:
                          </span>
                          <span className="ml-1">
                            {ride.lastMessage.content}
                          </span>
                          <span className="ml-2 text-gray-400">
                            • {formatDateTime(ride.lastMessage.created_at)}
                          </span>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500 italic">
                          No messages yet - start the conversation!
                        </div>
                      )}
                    </div>

                    <div className="flex items-center">
                      <MessageCircle className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatsPage;
