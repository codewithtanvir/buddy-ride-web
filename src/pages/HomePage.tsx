import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Car, Users, MessageSquare, Plus, Search, Shield } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { useAuthStore } from "../stores/authStore";
import { useRideStore } from "../stores/rideStore";
import { supabase } from "../lib/supabase";

const HomePage: React.FC = () => {
  const { user } = useAuthStore();
  const { myRides, fetchMyRides } = useRideStore();
  const [connections, setConnections] = useState(0);
  const [chats, setChats] = useState(0);

  // Check if user is admin
  const isAdmin =
    user?.email === "00-00000-0@student.aiub.com" ||
    user?.profile?.student_id === "00-00000-0" ||
    user?.email?.includes("admin");

  useEffect(() => {
    if (user?.id) {
      fetchMyRides(user.id);
      fetchUserStats();
    }
  }, [user?.id, fetchMyRides]);

  const fetchUserStats = async () => {
    if (!user?.id) return;

    try {
      // Count accepted ride requests (connections)
      const { data: acceptedRequests } = await supabase
        .from("ride_requests")
        .select("id")
        .eq("requester_id", user.id)
        .eq("status", "accepted");

      // Count unique chat conversations
      const { data: messages } = await supabase
        .from("messages")
        .select("ride_id")
        .or(
          `sender_id.eq.${user.id},ride_id.in.(select id from rides where user_id.eq.${user.id})`
        );

      const uniqueRideIds = new Set(messages?.map((msg) => msg.ride_id) || []);

      setConnections(acceptedRequests?.length || 0);
      setChats(uniqueRideIds.size);
    } catch (error) {
      console.error("Error fetching user stats:", error);
    }
  };

  const stats = [
    {
      name: "Rides Posted",
      value: myRides.length,
      icon: Car,
      color: "text-blue-600",
    },
    {
      name: "Connections",
      value: connections,
      icon: Users,
      color: "text-green-600",
    },
    {
      name: "Chats",
      value: chats,
      icon: MessageSquare,
      color: "text-purple-600",
    },
  ];

  return (
    <div className="p-4 lg:p-6 pb-20 lg:pb-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Welcome back, {user?.profile?.name || "Student"}!
          </h1>
          <p className="text-gray-600 mt-2 text-sm lg:text-base">
            Find ride buddies and share your travel plans with fellow AIUB
            students.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
          {stats.map((stat) => (
            <Card key={stat.name} className="shadow-sm">
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg bg-gray-100 mr-3 lg:mr-4`}>
                    <stat.icon
                      className={`h-5 w-5 lg:h-6 lg:w-6 ${stat.color}`}
                    />
                  </div>
                  <div>
                    <p className="text-xl lg:text-2xl font-bold text-gray-900">
                      {stat.value}
                    </p>
                    <p className="text-gray-600 text-sm lg:text-base">
                      {stat.name}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Post a Ride</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-gray-600 mb-4 text-sm lg:text-base">
                Share your travel plans and find students going in the same
                direction.
              </p>
              <Link to="/post-ride">
                <Button className="w-full h-10 lg:h-11 text-sm lg:text-base">
                  <Plus className="h-4 w-4 mr-2" />
                  Post New Ride
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Find a Buddy</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-gray-600 mb-4 text-sm lg:text-base">
                Search for rides posted by other students and join them.
              </p>
              <Link to="/find-buddy">
                <Button
                  variant="outline"
                  className="w-full h-10 lg:h-11 text-sm lg:text-base"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Find Rides
                </Button>
              </Link>
            </CardContent>
          </Card>

          {isAdmin && (
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Admin Panel</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-gray-600 mb-4 text-sm lg:text-base">
                  Manage users, rides, and system statistics.
                </p>
                <Link to="/admin">
                  <Button
                    variant="outline"
                    className="w-full h-10 lg:h-11 text-sm lg:text-base"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Admin Dashboard
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recent Activity */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {myRides.length === 0 ? (
              <div className="text-center py-6 lg:py-8">
                <Car className="h-10 w-10 lg:h-12 lg:w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-sm lg:text-base">
                  No recent activity
                </p>
                <p className="text-gray-400 text-xs lg:text-sm mt-1">
                  Start by posting your first ride or finding a buddy!
                </p>
              </div>
            ) : (
              <div className="space-y-3 lg:space-y-4">
                {myRides.slice(0, 3).map((ride) => (
                  <div
                    key={ride.id}
                    className="flex items-center justify-between p-3 lg:p-4 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900 text-sm lg:text-base">
                        {ride.from_location} → {ride.to_location}
                      </p>
                      <p className="text-gray-600 text-xs lg:text-sm">
                        {ride.ride_time
                          ? new Date(ride.ride_time).toLocaleDateString()
                          : "No date set"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs lg:text-sm text-gray-500">
                        Posted{" "}
                        {new Date(ride.created_at || "").toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HomePage;
