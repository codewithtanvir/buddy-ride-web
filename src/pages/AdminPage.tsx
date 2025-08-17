import React, { useState, useEffect } from "react";
import {
  Users,
  Car,
  BarChart3,
  Search,
  Trash2,
  Eye,
  UserX,
  Calendar,
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
import { Input } from "../components/ui/Input";
import { useAuthStore } from "../stores/authStore";
import { supabase } from "../lib/supabase";
import { formatDateTime } from "../utils/formatters";
import { cleanupExpiredRides, isRideExpired } from "../utils/rideCleanup";
import { isAdmin } from "../utils/roles";
import toast from "react-hot-toast";
import type { Profile, RideWithProfile } from "../types";

interface AdminStats {
  totalUsers: number;
  totalRides: number;
  activeRides: number;
  expiredRides: number;
  totalMessages: number;
  totalRequests: number;
}

const AdminPage: React.FC = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "rides">(
    "overview"
  );
  const [users, setUsers] = useState<Profile[]>([]);
  const [rides, setRides] = useState<RideWithProfile[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalRides: 0,
    activeRides: 0,
    expiredRides: 0,
    totalMessages: 0,
    totalRequests: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Check if user is admin using role-based system
  const userIsAdmin = isAdmin(user);

  useEffect(() => {
    if (userIsAdmin) {
      loadData();
    }
  }, [activeTab, userIsAdmin]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load users
      const { data: usersData, error: usersError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (usersError) throw usersError;
      setUsers(usersData || []);

      // Load rides with profiles
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
        .order("created_at", { ascending: false });

      if (ridesError) throw ridesError;
      setRides(ridesData || []);

      // Calculate stats
      await calculateStats();
    } catch (error) {
      console.error("Error loading admin data:", error);
      toast.error("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = async () => {
    try {
      // Get total counts
      const [usersCount, ridesCount, messagesCount, requestsCount] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("id", { count: "exact", head: true }),
          supabase.from("rides").select("id", { count: "exact", head: true }),
          supabase
            .from("messages")
            .select("id", { count: "exact", head: true }),
          supabase
            .from("ride_requests")
            .select("id", { count: "exact", head: true }),
        ]);

      // Get active vs expired rides
      const now = new Date().toISOString();
      const [activeRidesCount, expiredRidesCount] = await Promise.all([
        supabase
          .from("rides")
          .select("id", { count: "exact", head: true })
          .gte("ride_time", now),
        supabase
          .from("rides")
          .select("id", { count: "exact", head: true })
          .lt("ride_time", now),
      ]);

      setStats({
        totalUsers: usersCount.count || 0,
        totalRides: ridesCount.count || 0,
        activeRides: activeRidesCount.count || 0,
        expiredRides: expiredRidesCount.count || 0,
        totalMessages: messagesCount.count || 0,
        totalRequests: requestsCount.count || 0,
      });
    } catch (error) {
      console.error("Error calculating stats:", error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this user? This will also delete all their rides, messages, and requests."
      )
    ) {
      return;
    }

    try {
      // Delete user's messages
      await supabase.from("messages").delete().eq("sender_id", userId);

      // Delete requests made by user
      await supabase.from("ride_requests").delete().eq("requester_id", userId);

      // Get user's rides to delete related data
      const { data: userRides } = await supabase
        .from("rides")
        .select("id")
        .eq("user_id", userId);

      if (userRides && userRides.length > 0) {
        const rideIds = userRides.map((ride) => ride.id);

        // Delete messages for user's rides
        await supabase.from("messages").delete().in("ride_id", rideIds);

        // Delete requests for user's rides
        await supabase.from("ride_requests").delete().in("ride_id", rideIds);

        // Delete user's rides
        await supabase.from("rides").delete().eq("user_id", userId);
      }

      // Delete user profile
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userId);

      if (error) throw error;

      toast.success("User deleted successfully");
      loadData();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user");
    }
  };

  const handleDeleteRide = async (rideId: string) => {
    if (!confirm("Are you sure you want to delete this ride?")) return;

    try {
      // Delete messages for this ride
      await supabase.from("messages").delete().eq("ride_id", rideId);

      // Delete requests for this ride
      await supabase.from("ride_requests").delete().eq("ride_id", rideId);

      // Delete ride
      const { error } = await supabase.from("rides").delete().eq("id", rideId);

      if (error) throw error;

      toast.success("Ride deleted successfully");
      loadData();
    } catch (error) {
      console.error("Error deleting ride:", error);
      toast.error("Failed to delete ride");
    }
  };

  const handleCleanupExpiredRides = async () => {
    if (!confirm("Are you sure you want to delete all expired rides?")) return;

    try {
      await cleanupExpiredRides();
      toast.success("Expired rides cleaned up successfully");
      loadData();
    } catch (error) {
      console.error("Error cleaning up expired rides:", error);
      toast.error("Failed to cleanup expired rides");
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.student_id?.includes(searchQuery) ||
      user.department?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRides = rides.filter(
    (ride) =>
      ride.from_location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ride.to_location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ride.profiles?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ride.profiles?.student_id?.includes(searchQuery)
  );

  if (!userIsAdmin) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-6 text-center">
              <UserX className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Access Denied
              </h3>
              <p className="text-gray-600">
                You don't have permission to access the admin panel.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Manage users, rides, and system statistics
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: "overview", label: "Overview", icon: BarChart3 },
                { id: "users", label: "Users", icon: Users },
                { id: "rides", label: "Rides", icon: Car },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? "border-primary-500 text-primary-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <tab.icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600">
                        Total Users
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.totalUsers}
                      </p>
                    </div>
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600">
                        Total Rides
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.totalRides}
                      </p>
                    </div>
                    <Car className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600">
                        Active Rides
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.activeRides}
                      </p>
                    </div>
                    <Calendar className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600">
                        Expired Rides
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.expiredRides}
                      </p>
                    </div>
                    <Clock className="h-8 w-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600">
                        Total Messages
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.totalMessages}
                      </p>
                    </div>
                    <Users className="h-8 w-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600">
                        Ride Requests
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.totalRequests}
                      </p>
                    </div>
                    <Calendar className="h-8 w-8 text-indigo-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-4">
                  <Button
                    onClick={handleCleanupExpiredRides}
                    className="flex items-center"
                    variant="outline"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Cleanup Expired Rides
                  </Button>
                  <Button
                    onClick={loadData}
                    className="flex items-center"
                    variant="outline"
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Refresh Stats
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Input
                  placeholder="Search users by name, student ID, or department..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-md"
                />
              </div>
              <Button onClick={loadData} variant="outline">
                <Search className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>

            <div className="grid gap-4">
              {filteredUsers.map((user) => (
                <Card key={user.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">
                              {user.name || "No Name"}
                            </h3>
                            <p className="text-sm text-gray-600">
                              ID: {user.student_id} • {user.department} •{" "}
                              {user.gender}
                            </p>
                            <p className="text-xs text-gray-500">
                              Joined: {formatDateTime(user.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Rides Tab */}
        {activeTab === "rides" && (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Input
                  placeholder="Search rides by location or user..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-md"
                />
              </div>
              <Button onClick={loadData} variant="outline">
                <Search className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>

            <div className="grid gap-4">
              {filteredRides.map((ride) => {
                const expired = isRideExpired(ride.ride_time);

                return (
                  <Card
                    key={ride.id}
                    className={expired ? "border-red-200 bg-red-50" : ""}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4 mb-2">
                            <div className="flex items-center text-gray-700">
                              <MapPin className="h-4 w-4 mr-1" />
                              <span className="font-medium">
                                {ride.from_location}
                              </span>
                              <span className="mx-2">→</span>
                              <span className="font-medium">
                                {ride.to_location}
                              </span>
                            </div>
                            <div className="flex items-center text-gray-600">
                              <Clock className="h-4 w-4 mr-1" />
                              <span>{formatDateTime(ride.ride_time)}</span>
                            </div>
                            {expired && (
                              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                                Expired
                              </span>
                            )}
                          </div>

                          {ride.notes && (
                            <p className="text-gray-700 text-sm mb-2">
                              {ride.notes}
                            </p>
                          )}

                          <div className="text-sm text-gray-600">
                            <span className="font-medium">
                              {ride.profiles?.name}
                            </span>
                            <span className="mx-2">•</span>
                            <span>{ride.profiles?.student_id}</span>
                            <span className="mx-2">•</span>
                            <span>{ride.profiles?.department}</span>
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteRide(ride.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
