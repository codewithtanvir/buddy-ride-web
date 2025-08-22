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
  Crown,
  Settings,
  Activity,
  Download,
  Filter,
  User,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { AdminPromotionTool } from "../components/admin/AdminPromotionTool";
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
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "rides" | "admin-management" | "analytics">(
    "overview"
  );
  const [users, setUsers] = useState<Profile[]>([]);
  const [rides, setRides] = useState<RideWithProfile[]>([]);
  const [filteredRides, setFilteredRides] = useState<RideWithProfile[]>([]);
  const [rideFilter, setRideFilter] = useState<"all" | "active" | "expired">("all");
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
  const [error, setError] = useState<string | null>(null);
  const [deletingUser, setDeletingUser] = useState<string | null>(null);
  const [deletingRide, setDeletingRide] = useState<string | null>(null);
  const [cleaningUp, setCleaningUp] = useState(false);
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
    setError(null);
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
            role,
            notification_preferences,
            created_at
          )
        `
        )
        .order("created_at", { ascending: false });

      if (ridesError) throw ridesError;
      setRides(ridesData as RideWithProfile[] || []);

      // Calculate stats
      await calculateStats();
    } catch (error: any) {
      console.error("Error loading admin data:", error);
      setError(error.message || "Failed to load admin data");
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
      !window.confirm(
        "Are you sure you want to delete this user? This will also delete all their rides, messages, and requests."
      )
    ) {
      return;
    }

    setDeletingUser(userId);
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
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast.error(error.message || "Failed to delete user");
    } finally {
      setDeletingUser(null);
    }
  };

  const handleDeleteRide = async (rideId: string) => {
    if (!window.confirm("Are you sure you want to delete this ride?")) return;

    setDeletingRide(rideId);
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
    } catch (error: any) {
      console.error("Error deleting ride:", error);
      toast.error(error.message || "Failed to delete ride");
    } finally {
      setDeletingRide(null);
    }
  };

  const handleCleanupExpiredRides = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete all expired rides and clean up orphaned data?"
      )
    )
      return;

    setCleaningUp(true);
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
    } catch (error: any) {
      console.error("Error cleaning up expired rides:", error);
      toast.error(error.message || "Failed to cleanup expired rides");
    } finally {
      setCleaningUp(false);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.student_id?.includes(searchQuery) ||
      user.department?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter rides based on current filter and search query
  const filteredRidesData = rides.filter((ride) => {
    const matchesSearch = 
      ride.from_location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ride.to_location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ride.profiles?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ride.profiles?.student_id?.includes(searchQuery);

    const matchesFilter = 
      rideFilter === "all" ||
      (rideFilter === "active" && !isRideExpired(ride.ride_time)) ||
      (rideFilter === "expired" && isRideExpired(ride.ride_time));

    return matchesSearch && matchesFilter;
  });

  if (!userIsAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
            <CardContent className="p-8 md:p-12 text-center">
              <div className="w-16 md:w-20 h-16 md:h-20 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="h-8 md:h-10 w-8 md:w-10 text-white" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">
                Access Denied
              </h3>
              <p className="text-gray-600 text-base md:text-lg mb-6">
                You don't have permission to access the admin panel.
              </p>
              <p className="text-gray-500 text-sm">
                Only administrators can access this section. Contact your system administrator if you believe this is an error.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
            <CardContent className="p-8 md:p-12 text-center">
              <div className="w-16 md:w-20 h-16 md:h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="h-8 md:h-10 w-8 md:w-10 text-white" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">
                Error Loading Admin Data
              </h3>
              <p className="text-gray-600 text-base md:text-lg mb-6">
                {error}
              </p>
              <Button
                onClick={loadData}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl px-6 py-3 shadow-lg transition-all duration-200"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Enhanced Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-gray-600 text-base md:text-lg mt-1">
                Manage users, rides, and system statistics
              </p>
            </div>
            {loading && (
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-xl">
                <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
                <span className="text-blue-600 text-sm font-medium">Loading...</span>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Navigation Tabs */}
        <div className="mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-2 shadow-lg border border-gray-200">
            <nav className="flex space-x-2 overflow-x-auto">
              {[
                {
                  id: "overview",
                  label: "Overview",
                  icon: BarChart3,
                  color: "blue",
                },
                { id: "users", label: "Users", icon: Users, color: "green" },
                { id: "rides", label: "Rides", icon: Car, color: "purple" },
                { 
                  id: "admin-management", 
                  label: "Admin Management", 
                  icon: Crown, 
                  color: "pink" 
                },
                { 
                  id: "analytics", 
                  label: "Analytics", 
                  icon: Activity, 
                  color: "indigo" 
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center py-3 px-4 rounded-xl font-medium text-sm transition-all duration-200 whitespace-nowrap ${
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
                    disabled={cleaningUp}
                    className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl px-6 py-3 shadow-lg transition-all duration-200"
                  >
                    {cleaningUp ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    {cleaningUp ? "Cleaning..." : "Cleanup Expired Rides"}
                  </Button>
                  <Button
                    onClick={loadData}
                    disabled={loading}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl px-6 py-3 shadow-lg transition-all duration-200"
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    {loading ? "Refreshing..." : "Refresh Stats"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Enhanced Users Tab */}
        {activeTab === "users" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name, student ID (23-51455-1), or department (CSE, EEE)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 max-w-md bg-white/80 backdrop-blur-sm border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl"
                  />
                </div>
              </div>
              <Button
                onClick={loadData}
                disabled={loading}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl px-6 py-3 shadow-lg transition-all duration-200"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>

            {/* Users Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-800 text-sm font-medium">Total Users</p>
                      <p className="text-2xl font-bold text-blue-900">{users.length}</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-800 text-sm font-medium">Regular Users</p>
                      <p className="text-2xl font-bold text-green-900">
                        {users.filter(u => !u.role || u.role === "user").length}
                      </p>
                    </div>
                    <User className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-800 text-sm font-medium">Admins</p>
                      <p className="text-2xl font-bold text-purple-900">
                        {users.filter(u => u.role === "admin").length}
                      </p>
                    </div>
                    <Crown className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-800 text-sm font-medium">This Month</p>
                      <p className="text-2xl font-bold text-orange-900">
                        {users.filter(u => {
                          const userDate = new Date(u.created_at);
                          const now = new Date();
                          return userDate.getMonth() === now.getMonth() && 
                                 userDate.getFullYear() === now.getFullYear();
                        }).length}
                      </p>
                    </div>
                    <Calendar className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {filteredUsers.length === 0 ? (
              <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
                <CardContent className="p-12 text-center">
                  <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No Users Found</h3>
                  <p className="text-gray-600">
                    {searchQuery ? "No users match your search criteria" : "No users registered yet"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredUsers.map((user) => (
                  <Card
                    key={user.id}
                    className="bg-white/95 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg ${
                            user.role === "admin" 
                              ? "bg-gradient-to-br from-purple-500 to-pink-600"
                              : "bg-gradient-to-br from-blue-500 to-purple-600"
                          }`}>
                            {user.role === "admin" ? (
                              <Crown className="h-6 w-6" />
                            ) : (
                              user.name?.charAt(0)?.toUpperCase() || "U"
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-lg font-bold text-gray-900">
                                {user.name || "No Name"}
                              </h3>
                              {user.role === "admin" && (
                                <span className="px-2 py-1 bg-gradient-to-r from-purple-500 to-pink-600 text-white text-xs rounded-full font-medium shadow-lg">
                                  ADMIN
                                </span>
                              )}
                            </div>
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
                          {user.role === "admin" ? (
                            <span className="px-3 py-2 bg-purple-100 text-purple-800 rounded-xl text-sm font-medium">
                              Protected
                            </span>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteUser(user.id)}
                              disabled={deletingUser === user.id}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 rounded-xl transition-all duration-200"
                            >
                              {deletingUser === user.id ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Enhanced Rides Tab */}
        {activeTab === "rides" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search rides by location (AIUB, Kuril, Jamuna) or user name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 max-w-md bg-white/80 backdrop-blur-sm border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl"
                  />
                </div>
                
                <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-xl p-1 border border-gray-200">
                  <Filter className="h-4 w-4 text-gray-500 ml-2" />
                  {[
                    { id: "all", label: "All Rides", count: rides.length },
                    { id: "active", label: "Active", count: stats.activeRides },
                    { id: "expired", label: "Expired", count: stats.expiredRides },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setRideFilter(filter.id as any)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        rideFilter === filter.id
                          ? "bg-blue-500 text-white shadow-lg"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      }`}
                    >
                      {filter.label} ({filter.count})
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={handleCleanupExpiredRides}
                  disabled={cleaningUp}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl px-4 py-2 shadow-lg transition-all duration-200"
                >
                  {cleaningUp ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  {cleaningUp ? "Cleaning..." : "Cleanup Expired"}
                </Button>
                <Button
                  onClick={loadData}
                  disabled={loading}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl px-4 py-2 shadow-lg transition-all duration-200"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                  {loading ? "Loading..." : "Refresh"}
                </Button>
              </div>
            </div>

            {filteredRidesData.length === 0 ? (
              <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
                <CardContent className="p-12 text-center">
                  <Car className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No Rides Found</h3>
                  <p className="text-gray-600">
                    {searchQuery || rideFilter !== "all" 
                      ? "No rides match your current filters" 
                      : "No rides have been posted yet"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredRidesData.map((ride) => {
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
                                  {ride.profiles?.role === "admin" && (
                                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded font-medium">
                                      Admin
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteRide(ride.id)}
                              disabled={deletingRide === ride.id}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 rounded-xl transition-all duration-200"
                            >
                              {deletingRide === ride.id ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Admin Management Tab */}
        {activeTab === "admin-management" && (
          <AdminPromotionTool />
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            {/* Advanced Analytics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white border-0 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-cyan-100 text-sm font-medium mb-1">
                        Ride Success Rate
                      </p>
                      <p className="text-3xl font-bold">
                        {stats.totalRides > 0 
                          ? Math.round((stats.activeRides / stats.totalRides) * 100)
                          : 0}%
                      </p>
                      <p className="text-cyan-200 text-xs mt-1">
                        Active vs Total
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <TrendingUp className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-emerald-500 to-green-600 text-white border-0 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-emerald-100 text-sm font-medium mb-1">
                        User Engagement
                      </p>
                      <p className="text-3xl font-bold">
                        {stats.totalUsers > 0 
                          ? Math.round((stats.totalMessages / stats.totalUsers) * 10) / 10
                          : 0}
                      </p>
                      <p className="text-emerald-200 text-xs mt-1">
                        Messages per user
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <Activity className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-violet-500 to-purple-600 text-white border-0 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-violet-100 text-sm font-medium mb-1">
                        Request Rate
                      </p>
                      <p className="text-3xl font-bold">
                        {stats.totalRides > 0 
                          ? Math.round((stats.totalRequests / stats.totalRides) * 10) / 10
                          : 0}
                      </p>
                      <p className="text-violet-200 text-xs mt-1">
                        Requests per ride
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <Star className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* System Health */}
            <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                    <Activity className="h-4 w-4 text-white" />
                  </div>
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-800 text-sm font-medium">Database</p>
                        <p className="text-green-600 text-xs">Connected</p>
                      </div>
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-800 text-sm font-medium">Authentication</p>
                        <p className="text-blue-600 text-xs">Active</p>
                      </div>
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    </div>
                  </div>
                  
                  <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-800 text-sm font-medium">Real-time Chat</p>
                        <p className="text-purple-600 text-xs">Online</p>
                      </div>
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-yellow-800 text-sm font-medium">Cleanup</p>
                        <p className="text-yellow-600 text-xs">
                          {stats.expiredRides > 0 ? "Needed" : "Clean"}
                        </p>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${
                        stats.expiredRides > 0 ? "bg-yellow-500" : "bg-green-500"
                      }`}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Data Export */}
            <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Download className="h-4 w-4 text-white" />
                  </div>
                  Data Export
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    onClick={() => toast("Export feature coming soon!", { icon: "📊" })}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl p-4 h-auto flex-col space-y-2 transition-all duration-200"
                  >
                    <Download className="h-6 w-6" />
                    <span className="font-medium">Export Users</span>
                    <span className="text-xs opacity-90">CSV format</span>
                  </Button>
                  
                  <Button
                    onClick={() => toast("Export feature coming soon!", { icon: "📊" })}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl p-4 h-auto flex-col space-y-2 transition-all duration-200"
                  >
                    <Download className="h-6 w-6" />
                    <span className="font-medium">Export Rides</span>
                    <span className="text-xs opacity-90">CSV format</span>
                  </Button>
                  
                  <Button
                    onClick={() => toast("Export feature coming soon!", { icon: "📊" })}
                    className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl p-4 h-auto flex-col space-y-2 transition-all duration-200"
                  >
                    <Download className="h-6 w-6" />
                    <span className="font-medium">Export Analytics</span>
                    <span className="text-xs opacity-90">JSON format</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
