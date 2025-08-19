import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Car,
  Users,
  MessageSquare,
  Plus,
  Search,
  Shield,
  TrendingUp,
  Clock,
  MapPin,
} from "lucide-react";
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
import { formatDistanceToNow, format } from "date-fns";

const HomePage: React.FC = () => {
  const { user } = useAuthStore();
  const { myRides, fetchMyRides } = useRideStore();

  // Check if user is admin
  const isAdmin =
    user?.email === "00-00000-0@student.aiub.com" ||
    user?.profile?.student_id === "00-00000-0" ||
    user?.email?.includes("admin");

  useEffect(() => {
    if (user?.id) {
      fetchMyRides(user.id);
    }
  }, [user?.id, fetchMyRides]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30 p-4 lg:p-6 pb-20 lg:pb-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 lg:mb-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
                Welcome back, {user?.profile?.name?.split(" ")[0] || "Student"}!
              </h1>
              <p className="text-gray-600 mt-2 text-base lg:text-lg leading-relaxed">
                Find ride buddies and share your travel plans with fellow AIUB
                students.
              </p>
            </div>
            <div className="hidden lg:flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-green-100 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-700">
                  Online
                </span>
              </div>
            </div>
          </div>

          {/* Project Motto Section */}
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-6 lg:p-8 shadow-xl border-0 backdrop-blur-sm">
            <div className="text-center text-white">
              <div className="flex items-center justify-center mb-4">
                <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                  <Car className="h-8 w-8 text-white" />
                </div>
              </div>
              <h2 className="text-2xl lg:text-3xl font-bold mb-3">
                🚗 Share Rides, Save Money, Stay Safe
              </h2>
              <p className="text-blue-100 text-base lg:text-lg leading-relaxed max-w-4xl mx-auto">
                <strong>Our Mission:</strong> Choose location and time
                where you want to go, find a buddy based on gender for security,
                chat with them, go together and{" "}
                <span className="text-yellow-300 font-semibold">
                  split the fare to save money!
                </span>
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm">
                <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-full backdrop-blur-sm">
                  <Shield className="h-4 w-4" />
                  <span>Gender-Based Safety</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-full backdrop-blur-sm">
                  <MessageSquare className="h-4 w-4" />
                  <span>Real-time Chat</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-full backdrop-blur-sm">
                  <TrendingUp className="h-4 w-4" />
                  <span>Split Fare & Save</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-full backdrop-blur-sm">
                  <Users className="h-4 w-4" />
                  <span>AIUB Students Only</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-8 lg:mb-10">
          <Card className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-0 shadow-lg bg-white/90 backdrop-blur-sm overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
            <CardHeader className="pb-4">
              <CardTitle className="text-xl flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                  <Plus className="h-5 w-5 text-blue-600" />
                </div>
                Post a Ride
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-gray-600 mb-6 text-sm lg:text-base leading-relaxed">
                Share your travel plans and connect with students going in the
                same direction.
              </p>
              <Link to="/post-ride">
                <Button
                  size="lg"
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Post New Ride
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-0 shadow-lg bg-white/90 backdrop-blur-sm overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-500"></div>
            <CardHeader className="pb-4">
              <CardTitle className="text-xl flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                  <Search className="h-5 w-5 text-green-600" />
                </div>
                Find a Buddy
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-gray-600 mb-6 text-sm lg:text-base leading-relaxed">
                Search for rides posted by other students and join their
                journey.
              </p>
              <Link to="/find-buddy">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full border-2 border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Find Rides
                </Button>
              </Link>
            </CardContent>
          </Card>

          {isAdmin && (
            <Card className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-0 shadow-lg bg-white/90 backdrop-blur-sm overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
              <CardHeader className="pb-4">
                <CardTitle className="text-xl flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                    <Shield className="h-5 w-5 text-purple-600" />
                  </div>
                  Admin Panel
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-gray-600 mb-6 text-sm lg:text-base leading-relaxed">
                  Manage users, rides, and monitor system statistics.
                </p>
                <Link to="/admin">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full border-2 border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
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
        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl lg:text-2xl flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Clock className="h-5 w-5 text-gray-600" />
                </div>
                Recent Activity
              </CardTitle>
              {myRides.length > 3 && (
                <Link to="/profile">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    View All
                  </Button>
                </Link>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {myRides.length === 0 ? (
              <div className="text-center py-12 lg:py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <Car className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  No recent activity
                </h3>
                <p className="text-gray-500 text-sm lg:text-base mb-6 max-w-md mx-auto">
                  Start your journey by posting your first ride or finding a
                  buddy to travel with!
                </p>
                <div className="flex gap-3 justify-center">
                  <Link to="/post-ride">
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Post Ride
                    </Button>
                  </Link>
                  <Link to="/find-buddy">
                    <Button variant="outline" size="sm">
                      <Search className="h-4 w-4 mr-2" />
                      Find Buddy
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4 lg:space-y-5">
                {myRides.slice(0, 3).map((ride, index) => (
                  <div
                    key={ride.id}
                    className="group flex items-center justify-between p-4 lg:p-5 bg-gradient-to-r from-gray-50 to-blue-50/30 rounded-xl border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white rounded-lg shadow-sm group-hover:shadow-md transition-shadow">
                        <MapPin className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 text-base lg:text-lg">
                          {ride.from_location} → {ride.to_location}
                        </h4>
                        <div className="flex items-center gap-4 mt-1">
                          <p className="text-gray-600 text-sm lg:text-base flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {ride.ride_time
                              ? format(
                                  new Date(ride.ride_time),
                                  "MMM dd, yyyy 'at' hh:mm a"
                                )
                              : "No date set"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500 mb-1">
                        Posted{" "}
                        {formatDistanceToNow(new Date(ride.created_at || ""), {
                          addSuffix: true,
                        })}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          Active
                        </span>
                      </div>
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
