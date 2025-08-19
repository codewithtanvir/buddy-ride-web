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
  Shield,
  Star,
  TrendingUp,
  MessageSquare,
  RefreshCw,
  Bell,
  AlertTriangle,
  Phone,
  X,
  Check,
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
import {
  cleanupExpiredRides,
  runManualCleanup,
  isRideExpired,
} from "../utils/rideCleanup";
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
  totalNotifications: number;
  unreadNotifications: number;
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
    totalNotifications: 0,
    unreadNotifications: 0,
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
            phone_number,
            role,
            notification_preferences,
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
      const [
        usersCount,
        ridesCount,
        messagesCount,
        requestsCount,
        notificationsCount,
      ] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("rides").select("id", { count: "exact", head: true }),
        supabase.from("messages").select("id", { count: "exact", head: true }),
        supabase
          .from("ride_requests")
          .select("id", { count: "exact", head: true }),
        supabase
          .from("notifications")
          .select("id", { count: "exact", head: true }),
      ]);

      // Get active vs expired rides
      const now = new Date().toISOString();
      const [activeRidesCount, expiredRidesCount, unreadNotificationsCount] =
        await Promise.all([
          supabase
            .from("rides")
            .select("id", { count: "exact", head: true })
            .gte("ride_time", now),
          supabase
            .from("rides")
            .select("id", { count: "exact", head: true })
            .lt("ride_time", now),
          supabase
            .from("notifications")
            .select("id", { count: "exact", head: true })
            .eq("read", false),
        ]);

      setStats({
        totalUsers: usersCount.count || 0,
        totalRides: ridesCount.count || 0,
        activeRides: activeRidesCount.count || 0,
        expiredRides: expiredRidesCount.count || 0,
        totalMessages: messagesCount.count || 0,
        totalRequests: requestsCount.count || 0,
        totalNotifications: notificationsCount.count || 0,
        unreadNotifications: unreadNotificationsCount.count || 0,
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
    if (
      !confirm(
        "Are you sure you want to delete all expired rides and clean up orphaned data?"
      )
    )
      return;

    try {
      const result = await runManualCleanup();

      if (result.success) {
        const total =
          result.results.expired.deletedRides + result.results.old.deletedRides;
        const totalMessages =
          result.results.expired.deletedMessages +
          result.results.old.deletedMessages;
        const totalRequests =
          result.results.expired.deletedRequests +
          result.results.old.deletedRequests;

        toast.success(
          `Cleanup completed! Removed ${total} rides, ${totalMessages} messages, ${totalRequests} requests, ${result.results.orphaned.orphanedMessages} orphaned messages, and ${result.results.orphaned.orphanedRequests} orphaned requests.`,
          { duration: 8000 }
        );

        loadData();
      } else {
        toast.error(`Cleanup failed: ${result.error}`);
      }
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Access Denied
              </h3>
              <p className="text-gray-600 text-lg">
                You don't have permission to access the admin panel.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-gray-600 text-lg mt-1">
                Manage users, rides, and system statistics
              </p>
            </div>
          </div>
        </div>

        {/* Enhanced Navigation Tabs */}
        <div className="mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-2 shadow-lg border border-gray-200">
            <nav className="flex space-x-2">
              {[
                {
                  id: "overview",
                  label: "Overview",
                  icon: BarChart3,
                  color: "blue",
                },
                { id: "users", label: "Users", icon: Users, color: "green" },
                { id: "rides", label: "Rides", icon: Car, color: "purple" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center py-3 px-6 rounded-xl font-medium text-sm transition-all duration-200 ${
                    activeTab === tab.id
                      ? `bg-gradient-to-r from-${tab.color}-500 to-${tab.color}-600 text-white shadow-lg scale-105`
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  <tab.icon className="h-5 w-5 mr-2" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Enhanced Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Enhanced Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-medium mb-1">
                        Total Users
                      </p>
                      <p className="text-3xl font-bold">{stats.totalUsers}</p>
                      <p className="text-blue-200 text-xs mt-1">
                        Registered members
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <Users className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm font-medium mb-1">
                        Total Rides
                      </p>
                      <p className="text-3xl font-bold">{stats.totalRides}</p>
                      <p className="text-green-200 text-xs mt-1">
                        All rides posted
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <Car className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm font-medium mb-1">
                        Active Rides
                      </p>
                      <p className="text-3xl font-bold">{stats.activeRides}</p>
                      <p className="text-purple-200 text-xs mt-1">
                        Currently available
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <TrendingUp className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-red-100 text-sm font-medium mb-1">
                        Expired Rides
                      </p>
                      <p className="text-3xl font-bold">{stats.expiredRides}</p>
                      <p className="text-red-200 text-xs mt-1">Need cleanup</p>
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <Clock className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white border-0 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-yellow-100 text-sm font-medium mb-1">
                        Total Messages
                      </p>
                      <p className="text-3xl font-bold">
                        {stats.totalMessages}
                      </p>
                      <p className="text-yellow-200 text-xs mt-1">
                        Chat activity
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <MessageSquare className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white border-0 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-indigo-100 text-sm font-medium mb-1">
                        Ride Requests
                      </p>
                      <p className="text-3xl font-bold">
                        {stats.totalRequests}
                      </p>
                      <p className="text-indigo-200 text-xs mt-1">
                        Join requests
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <Star className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-teal-500 to-teal-600 text-white border-0 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-teal-100 text-sm font-medium mb-1">
                        Notifications
                      </p>
                      <p className="text-3xl font-bold">
                        {stats.totalNotifications}
                      </p>
                      <p className="text-teal-200 text-xs mt-1">Total sent</p>
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <Bell className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-pink-500 to-pink-600 text-white border-0 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-pink-100 text-sm font-medium mb-1">
                        Unread Alerts
                      </p>
                      <p className="text-3xl font-bold">
                        {stats.unreadNotifications}
                      </p>
                      <p className="text-pink-200 text-xs mt-1">
                        Need attention
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <AlertTriangle className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Quick Actions */}
            <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <BarChart3 className="h-4 w-4 text-white" />
                  </div>
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <Button
                    onClick={handleCleanupExpiredRides}
                    className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl px-6 py-3 shadow-lg transition-all duration-200"
                  >
                    <Trash2 className="h-4 w-4" />
                    Cleanup Expired Rides
                  </Button>
                  <Button
                    onClick={loadData}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl px-6 py-3 shadow-lg transition-all duration-200"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Refresh Stats
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Enhanced Users Tab */}
        {activeTab === "users" && (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Input
                  placeholder="Search users by name, student ID, or department..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-md bg-white/80 backdrop-blur-sm border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl"
                />
              </div>
              <Button
                onClick={loadData}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl px-6 py-3 shadow-lg transition-all duration-200"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>

            <div className="grid gap-4">
              {filteredUsers.map((user) => (
                <Card
                  key={user.id}
                  className="bg-white/95 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                          {user.name?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 mb-1">
                            {user.name || "No Name"}
                          </h3>
                          <div className="flex items-center gap-3 text-sm text-gray-600 mb-2">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-lg font-medium">
                              ID: {user.student_id}
                            </span>
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-lg font-medium">
                              {user.department}
                            </span>
                            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-lg font-medium">
                              {user.gender}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Joined: {formatDateTime(user.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 rounded-xl transition-all duration-200"
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

        {/* Enhanced Rides Tab */}
        {activeTab === "rides" && (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Input
                  placeholder="Search rides by location or user..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-md bg-white/80 backdrop-blur-sm border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl"
                />
              </div>
              <Button
                onClick={loadData}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl px-6 py-3 shadow-lg transition-all duration-200"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>

            <div className="grid gap-4">
              {filteredRides.map((ride) => {
                const expired = isRideExpired(ride.ride_time);

                return (
                  <Card
                    key={ride.id}
                    className={`backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-200 ${
                      expired ? "bg-red-50/95 border-red-200" : "bg-white/95"
                    }`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4 mb-3">
                            <div className="flex items-center text-gray-700 bg-gray-100 rounded-lg px-3 py-2">
                              <MapPin className="h-4 w-4 mr-2 text-green-600" />
                              <span className="font-medium">
                                {ride.from_location}
                              </span>
                              <span className="mx-2 text-blue-600">→</span>
                              <span className="font-medium">
                                {ride.to_location}
                              </span>
                            </div>
                            <div className="flex items-center text-gray-600 bg-blue-50 rounded-lg px-3 py-2">
                              <Clock className="h-4 w-4 mr-2 text-blue-600" />
                              <span className="font-medium">
                                {formatDateTime(ride.ride_time)}
                              </span>
                            </div>
                            {expired && (
                              <span className="px-3 py-1 bg-red-500 text-white text-xs rounded-full font-medium shadow-lg">
                                Expired
                              </span>
                            )}
                          </div>

                          {ride.notes && (
                            <div className="bg-gray-50 rounded-lg p-3 mb-3">
                              <p className="text-gray-700 text-sm italic">
                                "{ride.notes}"
                              </p>
                            </div>
                          )}

                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                              {ride.profiles?.name?.charAt(0)?.toUpperCase() ||
                                "U"}
                            </div>
                            <div>
                              <div className="font-bold text-gray-900">
                                {ride.profiles?.name}
                              </div>
                              <div className="flex items-center gap-3 text-sm">
                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium">
                                  {ride.profiles?.student_id}
                                </span>
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded font-medium">
                                  {ride.profiles?.department}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteRide(ride.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 rounded-xl transition-all duration-200"
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
