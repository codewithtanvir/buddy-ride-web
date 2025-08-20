import React, { useState, useEffect } from "react";
import {
  MessageCircle,
  Clock,
  MapPin,
  Users,
  Search,
  Plus,
  Zap,
} from "lucide-react";
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
import { ChatService, type ChatRide } from "../services/chatService";

const ChatsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [chatRides, setChatRides] = useState<ChatRide[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchChatRides();

      // Subscribe to real-time updates
      const subscription = supabase
        .channel("chats-page-updates")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "messages",
          },
          (payload) => {
            console.log("🔔 Real-time message update:", payload);
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
          (payload) => {
            console.log("🔔 Real-time ride request update:", payload);
            fetchChatRides();
          }
        )
        .subscribe((status) => {
          console.log("🔔 ChatsPage subscription status:", status);
        });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user?.id]);

  const fetchChatRides = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      console.log("🔍 Fetching chat rides using ChatService");
      
      const rides = await ChatService.getChatRides(user.id);
      setChatRides(rides);
      
      console.log("✅ Updated chat rides:", rides.length);
    } catch (error) {
      console.error("❌ Error fetching chat rides:", error);
      setChatRides([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChat = (rideId: string) => {
    navigate(`/chat/${rideId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-blue-50/30 p-4 lg:p-6 pb-20 lg:pb-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 lg:mb-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-purple-800 to-blue-800 bg-clip-text text-transparent">
                Messages 💬
              </h1>
              <p className="text-gray-600 mt-2 text-base lg:text-lg">
                Your ride conversations with fellow students
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-purple-100 rounded-full">
              <MessageCircle className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-700">
                {chatRides.length} chats
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card
                  key={i}
                  className="shadow-lg border-0 bg-white/90 backdrop-blur-sm"
                >
                  <CardContent className="p-6">
                    <div className="animate-pulse">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : chatRides.length === 0 ? (
            <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
              <CardContent className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full mb-6 shadow-lg">
                  <MessageCircle className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  No conversations yet
                </h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">
                  Start your journey by posting a ride or joining someone else's
                  adventure!
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    onClick={() => navigate("/post-ride")}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 px-8 py-3"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Post a Ride
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate("/find-buddy")}
                    className="border-2 border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300 px-8 py-3"
                  >
                    <Search className="h-5 w-5 mr-2" />
                    Find Rides
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            chatRides.map((ride) => (
              <Card
                key={ride.id}
                className="shadow-lg border-0 bg-white/95 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group"
                onClick={() => handleOpenChat(ride.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:scale-110 transition-transform duration-200">
                        {ride.profiles?.name?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-lg text-gray-900 group-hover:text-purple-600 transition-colors truncate">
                          Chat with {ride.profiles?.name}
                        </h3>
                        <div className="flex items-center gap-2 px-3 py-1 bg-purple-100 rounded-full">
                          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                          <span className="text-xs font-medium text-purple-700">
                            Active
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
                        <div className="flex items-center text-gray-700">
                          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                            <MapPin className="h-4 w-4 text-green-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs text-gray-500 uppercase tracking-wide">
                              Route
                            </p>
                            <p className="font-medium text-sm truncate">
                              {ride.from_location} → {ride.to_location}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center text-gray-700">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                            <Clock className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs text-gray-500 uppercase tracking-wide">
                              Departure
                            </p>
                            <p className="font-medium text-sm truncate">
                              {formatDateTime(ride.ride_time)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center text-sm text-gray-600 mb-4">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                          <Users className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <span className="font-medium">
                            {ride.profiles?.name}
                          </span>
                          <span className="mx-2">•</span>
                          <span>{ride.profiles?.department}</span>
                        </div>
                      </div>

                      {ride.lastMessage ? (
                        <div className="p-3 bg-gray-50 rounded-lg border-l-4 border-purple-400">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-700 mb-1">
                                <span className="font-semibold text-purple-700">
                                  {ride.lastMessage.sender_name}:
                                </span>
                                <span className="ml-2">
                                  {ride.lastMessage.content}
                                </span>
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatDateTime(ride.lastMessage.created_at)}
                              </p>
                            </div>
                            <Zap className="h-4 w-4 text-purple-500 flex-shrink-0 ml-2" />
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-blue-700 font-medium">
                              💬 No messages yet - start the conversation!
                            </p>
                            <MessageCircle className="h-4 w-4 text-blue-500" />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <MessageCircle className="h-4 w-4 text-purple-600" />
                      </div>
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
