import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Calendar,
  MapPin,
  Clock,
  MessageSquare,
  Check,
  X,
  Trash2,
  Eye,
  EyeOff,
  Lock,
  Shield,
  Star,
  Settings,
  LogOut,
  Edit,
  FileText,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import ProfileEditForm from "../components/ProfileEditForm";
import { useAuthStore } from "../stores/authStore";
import { useRideStore } from "../stores/rideStore";
import { RideRequestService } from "../services/rideRequestService";
import { supabase } from "../lib/supabase";
import { formatDateTime } from "../utils/formatters";
import { isRideExpired } from "../utils/rideCleanup";
import toast from "react-hot-toast";
import type { RideWithProfile, RideRequestWithProfile } from "../types";

interface RideWithRequests extends RideWithProfile {
  ride_requests?: RideRequestWithProfile[];
}

const ProfilePage: React.FC = () => {
  const { user, signOut } = useAuthStore();
  const { myRides, fetchMyRides } = useRideStore();
  const navigate = useNavigate();
  const [rideRequests, setRideRequests] = useState<RideRequestWithProfile[]>(
    []
  );
  const [expandedRides, setExpandedRides] = useState<Set<string>>(new Set());
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchMyRides(user.id);
      fetchRideRequests();
    }
  }, [user, fetchMyRides]);

  const fetchRideRequests = async () => {
    if (!user?.id) return;

    try {
      // Get requests for user's rides
      const { data, error } = await supabase
        .from("ride_requests")
        .select(
          `
          *,
          profiles:requester_id (
            id,
            name,
            student_id,
            department,
            gender,
            created_at
          ),
          rides!inner (
            id,
            from_location,
            to_location,
            ride_time,
            user_id
          )
        `
        )
        .eq("rides.user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRideRequests((data || []) as RideRequestWithProfile[]);
    } catch (error) {
      console.error("Error fetching ride requests:", error);
    }
  };

  const handleRequestAction = async (
    requestId: string,
    action: "accepted" | "rejected"
  ) => {
    console.log(`🎯 ${action} request:`, requestId);
    try {
      if (action === "accepted") {
        await RideRequestService.acceptRequest(requestId, user?.id!);
      } else {
        await RideRequestService.rejectRequest(requestId);
      }

      toast.success(`Request ${action} successfully`);
      fetchRideRequests();
    } catch (error) {
      console.error(`Error ${action} request:`, error);
      toast.error(`Failed to ${action} request`);
    }
  };

  // Removed createWelcomeMessage - now handled by RideRequestService

  const handleDeleteRide = async (rideId: string) => {
    if (!confirm("Are you sure you want to delete this ride?")) return;

    try {
      // Delete messages first
      await supabase.from("messages").delete().eq("ride_id", rideId);

      // Delete ride requests
      await supabase.from("ride_requests").delete().eq("ride_id", rideId);

      // Delete ride
      const { error } = await supabase.from("rides").delete().eq("id", rideId);

      if (error) throw error;

      toast.success("Ride deleted successfully");
      if (user?.id) {
        fetchMyRides(user.id);
      }
      fetchRideRequests();
    } catch (error) {
      console.error("Error deleting ride:", error);
      toast.error("Failed to delete ride");
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (error) throw error;

      toast.success("Password changed successfully");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setShowPasswordChange(false);
    } catch (error: any) {
      console.error("Error changing password:", error);
      toast.error(error.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };




  const toggleRideExpansion = (rideId: string) => {
    const newExpanded = new Set(expandedRides);
    if (newExpanded.has(rideId)) {
      newExpanded.delete(rideId);
    } else {
      newExpanded.add(rideId);
    }
    setExpandedRides(newExpanded);
  };

  const getRideRequests = (rideId: string) => {
    return rideRequests.filter((req) => req.ride_id === rideId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50/30 to-purple-50/30 p-4 lg:p-6 pb-20 lg:pb-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Profile Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full shadow-xl mb-6">
            <User className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-indigo-800 to-purple-800 bg-clip-text text-transparent mb-2">
            Welcome back, {user?.profile?.name?.split(" ")[0]}!
          </h1>
          <p className="text-gray-600 text-base lg:text-lg">
            Manage your rides and profile settings
          </p>
        </div>

        {/* Profile Info */}
        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="pb-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-t-xl">
            <CardTitle className="flex items-center text-xl lg:text-2xl font-bold text-gray-900">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg mr-3">
                <User className="h-6 w-6 text-white" />
              </div>
              Profile Information
            </CardTitle>
            <p className="text-gray-600 text-sm lg:text-base mt-2">
              Your account details and student information
            </p>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Full Name
                </label>
                <p className="text-base font-medium text-gray-900">
                  {user?.profile?.name}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
                <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  <Star className="h-4 w-4 mr-2" />
                  Student ID
                </label>
                <p className="text-base font-medium text-gray-900">
                  {user?.profile?.student_id}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  <Settings className="h-4 w-4 mr-2" />
                  Department
                </label>
                <p className="text-base font-medium text-gray-900">
                  {user?.profile?.department}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl border border-orange-100">
                <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Gender
                </label>
                <p className="text-base font-medium text-gray-900 capitalize">
                  {user?.profile?.gender}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl border border-gray-100">
                <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Email Address
                </label>
                <p className="text-base font-medium text-gray-900">
                  {user?.email}
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Button
                variant="outline"
                onClick={() => setShowProfileEdit(true)}
                className="flex items-center justify-center border-2 border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300 px-6 py-3"
              >
                <Edit className="h-5 w-5 mr-2" />
                Edit Profile
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowPasswordChange(!showPasswordChange)}
                className="flex items-center justify-center border-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 px-6 py-3"
              >
                <Lock className="h-5 w-5 mr-2" />
                Change Password
              </Button>
              <Button
                variant="outline"
                onClick={signOut}
                className="flex items-center justify-center border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 px-6 py-3"
              >
                <LogOut className="h-5 w-5 mr-2" />
                Sign Out
              </Button>
            </div>

            {/* Enhanced Password Change Form */}
            {showPasswordChange && (
              <div className="mt-8 pt-8 border-t-2 border-gray-100">
                <div className="p-6 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border border-indigo-100">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <Shield className="h-6 w-6 mr-3 text-indigo-600" />
                    Change Password
                  </h3>
                  <form onSubmit={handlePasswordChange} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Input
                        type="password"
                        placeholder="Current Password"
                        value={passwordData.currentPassword}
                        onChange={(e) =>
                          setPasswordData((prev) => ({
                            ...prev,
                            currentPassword: e.target.value,
                          }))
                        }
                        required
                        className="border-2 border-gray-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-200"
                      />
                      <Input
                        type="password"
                        placeholder="New Password"
                        value={passwordData.newPassword}
                        onChange={(e) =>
                          setPasswordData((prev) => ({
                            ...prev,
                            newPassword: e.target.value,
                          }))
                        }
                        required
                        className="border-2 border-gray-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-200"
                      />
                      <div className="md:col-span-2">
                        <Input
                          type="password"
                          placeholder="Confirm New Password"
                          value={passwordData.confirmPassword}
                          onChange={(e) =>
                            setPasswordData((prev) => ({
                              ...prev,
                              confirmPassword: e.target.value,
                            }))
                          }
                          required
                          className="border-2 border-gray-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-200"
                        />
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <Button
                        type="submit"
                        disabled={loading}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg"
                      >
                        {loading ? "Changing..." : "Change Password"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowPasswordChange(false);
                          setPasswordData({
                            currentPassword: "",
                            newPassword: "",
                            confirmPassword: "",
                          });
                        }}
                        className="border-gray-300"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enhanced My Rides */}
        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="pb-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-t-xl">
            <CardTitle className="flex items-center justify-between text-xl lg:text-2xl font-bold text-gray-900">
              <div className="flex items-center">
                <div className="p-2 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg mr-3">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                🚗 My Rides
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-green-100 rounded-full">
                <Star className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">
                  {myRides.length} rides
                </span>
              </div>
            </CardTitle>
            <p className="text-gray-600 text-sm lg:text-base mt-2">
              Manage your posted rides and view requests from other students
            </p>
          </CardHeader>
          <CardContent className="pt-6">
            {myRides.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <Calendar className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  No rides posted yet
                </h3>
                <p className="text-gray-500 mb-6">
                  Start sharing your travel plans with fellow students!
                </p>
                <Button
                  onClick={() => navigate("/post-ride")}
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 shadow-lg"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Post Your First Ride
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {myRides.map((ride) => {
                  const requests = getRideRequests(ride.id);
                  const isExpanded = expandedRides.has(ride.id);
                  const expired = isRideExpired(ride.ride_time);

                  return (
                    <Card
                      key={ride.id}
                      className={`shadow-lg border-0 transition-all duration-300 hover:-translate-y-1 ${expired
                          ? "bg-gradient-to-br from-red-50 to-red-100 border-l-4 border-l-red-500"
                          : "bg-white/95 backdrop-blur-sm hover:shadow-xl"
                        }`}
                    >
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                              <div className="flex items-center text-gray-700">
                                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mr-4">
                                  <MapPin className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                                    Route
                                  </p>
                                  <p className="font-semibold text-base">
                                    {ride.from_location} → {ride.to_location}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center text-gray-700">
                                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                                  <Clock className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                                    Departure
                                  </p>
                                  <p className="font-semibold text-base">
                                    {formatDateTime(ride.ride_time)}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {expired && (
                              <div className="flex items-center mb-4 px-4 py-2 bg-red-100 rounded-lg border border-red-200">
                                <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                                <span className="text-red-800 font-medium text-sm">
                                  This ride has expired
                                </span>
                              </div>
                            )}

                            {ride.notes && (
                              <div className="mb-4 p-4 bg-gray-50 rounded-lg border-l-4 border-blue-400">
                                <p className="text-sm text-gray-700">
                                  <span className="font-semibold text-gray-900 flex items-center">
                                    <FileText className="h-4 w-4 mr-2" />
                                    Notes:
                                  </span>{" "}
                                  {ride.notes}
                                </p>
                              </div>
                            )}

                            {requests.length > 0 && (
                              <div className="flex items-center mb-4 px-4 py-2 bg-blue-50 rounded-lg border border-blue-200">
                                <MessageSquare className="h-5 w-5 text-blue-600 mr-3" />
                                <span className="text-blue-800 font-medium">
                                  {requests.length} student
                                  {requests.length > 1 ? "s" : ""} interested in
                                  this ride
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col gap-2 ml-4">
                            {requests.length > 0 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleRideExpansion(ride.id)}
                                className="border-blue-200 text-blue-600 hover:bg-blue-50"
                              >
                                {isExpanded ? (
                                  <>
                                    <EyeOff className="h-4 w-4 mr-2" />
                                    Hide
                                  </>
                                ) : (
                                  <>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View
                                  </>
                                )}
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteRide(ride.id)}
                              className="border-red-200 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </Button>
                          </div>
                        </div>

                        {/* Enhanced Ride Requests */}
                        {isExpanded && requests.length > 0 && (
                          <div className="mt-6 pt-6 border-t-2 border-gray-100">
                            <h4 className="font-bold text-gray-900 mb-4 flex items-center">
                              <MessageSquare className="h-5 w-5 mr-3 text-purple-600" />
                              Ride Requests
                            </h4>
                            <div className="space-y-4">
                              {requests.map((request) => (
                                <div
                                  key={request.id}
                                  className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-100"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-3 mb-2">
                                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                                          {request.profiles?.name
                                            ?.charAt(0)
                                            ?.toUpperCase() || "U"}
                                        </div>
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <span className="font-semibold text-gray-900">
                                              {request.profiles?.name}
                                            </span>
                                            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                              {request.profiles?.student_id}
                                            </span>
                                            <span className="text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                                              {request.profiles?.department}
                                            </span>
                                          </div>
                                          <p className="text-xs text-gray-500 mt-1">
                                            {formatDateTime(request.created_at)}
                                          </p>
                                        </div>
                                      </div>
                                      {request.message && (
                                        <div className="p-3 bg-white rounded-lg border border-gray-200 mt-3">
                                          <p className="text-sm text-gray-700 italic">
                                            "{request.message}"
                                          </p>
                                        </div>
                                      )}
                                    </div>

                                    <div className="ml-4">
                                      {request.status === "pending" ? (
                                        <div className="flex gap-2">
                                          <Button
                                            size="sm"
                                            onClick={() =>
                                              handleRequestAction(
                                                request.id,
                                                "accepted"
                                              )
                                            }
                                            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg"
                                          >
                                            <Check className="h-4 w-4 mr-1" />
                                            Accept
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() =>
                                              handleRequestAction(
                                                request.id,
                                                "rejected"
                                              )
                                            }
                                            className="border-red-200 text-red-600 hover:bg-red-50"
                                          >
                                            <X className="h-4 w-4 mr-1" />
                                            Decline
                                          </Button>
                                        </div>
                                      ) : (
                                        <div className="flex flex-col gap-2">
                                          <span
                                            className={`px-4 py-2 rounded-full text-sm font-semibold text-center ${request.status === "accepted"
                                                ? "bg-green-100 text-green-800 border border-green-200"
                                                : "bg-red-100 text-red-800 border border-red-200"
                                              }`}
                                          >
                                            {request.status === "accepted"
                                              ? "Accepted"
                                              : "Declined"}
                                          </span>
                                          {request.status === "accepted" && (
                                            <div className="flex flex-col gap-1">
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Profile Edit Modal */}
      {showProfileEdit && (
        <ProfileEditForm
          onCancel={() => setShowProfileEdit(false)}
          onSuccess={() => {
            setShowProfileEdit(false);
            // Refresh profile data if needed
            if (user?.id) {
              fetchMyRides(user.id);
            }
          }}
        />
      )}
    </div>
  );
};

export default ProfilePage;
