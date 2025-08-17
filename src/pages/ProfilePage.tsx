import React, { useState, useEffect } from "react";
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
import { useRideStore } from "../stores/rideStore";
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
  const [rideRequests, setRideRequests] = useState<RideRequestWithProfile[]>(
    []
  );
  const [expandedRides, setExpandedRides] = useState<Set<string>>(new Set());
  const [showPasswordChange, setShowPasswordChange] = useState(false);
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
    try {
      const { error } = await supabase
        .from("ride_requests")
        .update({
          status: action,
          updated_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      if (error) throw error;

      // If accepted, create a welcome message to enable chat
      if (action === "accepted") {
        const request = rideRequests.find((r) => r.id === requestId);
        if (request && request.ride_id && request.requester_id) {
          await createWelcomeMessage(request.ride_id, request.requester_id);
        }
      }

      toast.success(`Request ${action} successfully`);
      fetchRideRequests();
    } catch (error) {
      console.error(`Error ${action} request:`, error);
      toast.error(`Failed to ${action} request`);
    }
  };

  const createWelcomeMessage = async (rideId: string, requesterId: string) => {
    try {
      // Check if there are already messages in this chat
      const { data: existingMessages } = await supabase
        .from("messages")
        .select("id")
        .eq("ride_id", rideId)
        .limit(1);

      // Only create welcome message if there are no existing messages
      if (!existingMessages || existingMessages.length === 0) {
        await supabase.from("messages").insert({
          content:
            "Welcome! Your ride request has been accepted. You can now chat about pickup details and coordination.",
          ride_id: rideId,
          sender_id: user?.id, // Ride owner sends the welcome message
        });
      }
    } catch (error) {
      console.error("Error creating welcome message:", error);
      // Don't throw error as this is not critical
    }
  };

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
    <div className="p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {user?.profile?.name}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Student ID
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {user?.profile?.student_id}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Department
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {user?.profile?.department}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Gender
                </label>
                <p className="mt-1 text-sm text-gray-900 capitalize">
                  {user?.profile?.gender}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <p className="mt-1 text-sm text-gray-900">{user?.email}</p>
              </div>
            </div>

            <div className="mt-6 flex space-x-4">
              <Button
                variant="outline"
                onClick={() => setShowPasswordChange(!showPasswordChange)}
                className="flex items-center"
              >
                <Lock className="h-4 w-4 mr-2" />
                Change Password
              </Button>
              <Button variant="outline" onClick={signOut}>
                Sign Out
              </Button>
            </div>

            {/* Password Change Form */}
            {showPasswordChange && (
              <form
                onSubmit={handlePasswordChange}
                className="mt-6 space-y-4 border-t pt-6"
              >
                <h3 className="text-lg font-medium text-gray-900">
                  Change Password
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  />
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
                  />
                </div>
                <div className="flex space-x-2">
                  <Button type="submit" disabled={loading}>
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
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* My Rides */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              My Rides ({myRides.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {myRides.length === 0 ? (
              <p className="text-gray-600 text-center py-4">
                You haven't posted any rides yet.
              </p>
            ) : (
              <div className="space-y-4">
                {myRides.map((ride) => {
                  const requests = getRideRequests(ride.id);
                  const isExpanded = expandedRides.has(ride.id);
                  const expired = isRideExpired(ride.ride_time);

                  return (
                    <div
                      key={ride.id}
                      className={`border rounded-lg p-4 ${
                        expired ? "border-red-200 bg-red-50" : "border-gray-200"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4 mb-2">
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
                            <div className="flex items-center text-gray-600">
                              <Clock className="h-4 w-4 mr-1" />
                              <span>{formatDateTime(ride.ride_time)}</span>
                            </div>
                            {expired && (
                              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                                ⚠️ Expired
                              </span>
                            )}
                          </div>

                          {ride.notes && (
                            <p className="text-gray-700 text-sm mb-2">
                              {ride.notes}
                            </p>
                          )}

                          {requests.length > 0 && (
                            <div className="flex items-center text-sm text-blue-600">
                              <MessageSquare className="h-4 w-4 mr-1" />
                              <span>
                                {requests.length} request
                                {requests.length > 1 ? "s" : ""}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex space-x-2">
                          {requests.length > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleRideExpansion(ride.id)}
                            >
                              {isExpanded ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          )}
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

                      {/* Ride Requests */}
                      {isExpanded && requests.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <h4 className="font-medium text-gray-900 mb-3">
                            Ride Requests
                          </h4>
                          <div className="space-y-3">
                            {requests.map((request) => (
                              <div
                                key={request.id}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                              >
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <span className="font-medium text-gray-900">
                                      {request.profiles?.name}
                                    </span>
                                    <span className="text-sm text-gray-600">
                                      ({request.profiles?.student_id})
                                    </span>
                                    <span className="text-sm text-gray-600">
                                      • {request.profiles?.department}
                                    </span>
                                  </div>
                                  {request.message && (
                                    <p className="text-sm text-gray-700">
                                      {request.message}
                                    </p>
                                  )}
                                  <p className="text-xs text-gray-500 mt-1">
                                    {formatDateTime(request.created_at)}
                                  </p>
                                </div>

                                {request.status === "pending" && (
                                  <div className="flex space-x-2 ml-4">
                                    <Button
                                      size="sm"
                                      onClick={() =>
                                        handleRequestAction(
                                          request.id,
                                          "accepted"
                                        )
                                      }
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      <Check className="h-4 w-4" />
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
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                )}

                                {request.status !== "pending" && (
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      request.status === "accepted"
                                        ? "bg-green-100 text-green-800"
                                        : "bg-red-100 text-red-800"
                                    }`}
                                  >
                                    {request.status}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;
