import React, { useState, useEffect } from "react";
import {
  Search,
  MapPin,
  Clock,
  MessageSquare,
  Send,
  Filter,
  RefreshCw,
  Users,
  Heart,
  ExternalLink,
  Shield,
  AlertCircle,
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
import { LocationPicker } from "../components/LocationPicker";
import { useRideStore } from "../stores/rideStore";
import { useAuthStore } from "../stores/authStore";
import { supabase } from "../lib/supabase";
import { formatDateTime } from "../utils/formatters";
import toast from "react-hot-toast";

const FindBuddyPage: React.FC = () => {
  const { rides, loading, fetchRides } = useRideStore();
  const { user } = useAuthStore();
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [genderPreference, setGenderPreference] = useState("all");
  const [requestingRide, setRequestingRide] = useState<string | null>(null);
  const [requestMessage, setRequestMessage] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Load all rides initially, regardless of gender
    fetchRides("", "", "all");
  }, [fetchRides]);

  const handleSearch = async () => {
    setIsRefreshing(true);
    await fetchRides(fromLocation, toLocation, genderPreference);
    setIsRefreshing(false);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchRides(fromLocation, toLocation, genderPreference);
    setIsRefreshing(false);
    toast.success("Rides refreshed!");
  };

  const clearFilters = () => {
    setFromLocation("");
    setToLocation("");
    setGenderPreference("all");
    fetchRides("", "", "all");
  };

  const handleSendRequest = async (rideId: string) => {
    if (!user?.id || !requestMessage.trim()) {
      toast.error("Please enter a message");
      return;
    }

    if (!user?.profile?.gender) {
      toast.error("Please complete your profile setup to send requests");
      return;
    }

    // Find the ride to check gender compatibility
    const targetRide = rides.find((ride) => ride.id === rideId);
    if (!targetRide) {
      toast.error("Ride not found");
      return;
    }

    // CRITICAL FIX: Prevent users from requesting their own rides
    if (targetRide.user_id === user.id) {
      toast.error("You cannot request your own ride!");
      return;
    }

    if (!targetRide.profiles?.gender) {
      toast.error(
        "Cannot send request: Ride owner's gender information is not available"
      );
      return;
    }

    // Check gender compatibility - only allow same gender requests
    if (user.profile.gender !== targetRide.profiles.gender) {
      const userGenderDisplay =
        user.profile.gender === "male" ? "male" : "female";
      const rideOwnerGenderDisplay =
        targetRide.profiles.gender === "male" ? "male" : "female";

      toast.error(
        `Gender restriction: Only ${rideOwnerGenderDisplay} students can request rides from ${rideOwnerGenderDisplay} students for safety and comfort.`,
        { duration: 6000 }
      );
      return;
    }

    // Validate message content - removed minimum length requirement
    if (requestMessage.trim().length > 500) {
      toast.error("Request message cannot be longer than 500 characters");
      return;
    }

    try {
      // Check if user already sent a request for this ride
      const { data: existingRequest } = await supabase
        .from("ride_requests")
        .select("id")
        .eq("ride_id", rideId)
        .eq("requester_id", user.id)
        .single();

      if (existingRequest) {
        toast.error("You have already sent a request for this ride");
        return;
      }

      const { error } = await supabase.from("ride_requests").insert({
        ride_id: rideId,
        requester_id: user.id,
        message: requestMessage.trim(),
        status: "pending",
      });

      if (error) {
        if (error.message?.includes("Gender compatibility")) {
          toast.error(
            "Gender compatibility check failed. Please ensure your profile is complete."
          );
        } else if (error.message?.includes("duplicate")) {
          toast.error("You have already sent a request for this ride");
        } else {
          throw error;
        }
        return;
      }

      toast.success("Request sent successfully!");
      setRequestingRide(null);
      setRequestMessage("");
    } catch (error) {
      console.error("Error sending request:", error);
      toast.error("Failed to send request. Please try again.");
    }
  };

  const isMyRide = (ride: any) => ride.user_id === user?.id;

  const isGenderCompatible = (ride: any) => {
    if (!user?.profile?.gender || !ride.profiles?.gender) {
      return false;
    }
    return user.profile.gender === ride.profiles.gender;
  };

  const getGenderCompatibilityMessage = (ride: any) => {
    if (!user?.profile?.gender) {
      return "Complete your profile to send requests";
    }
    if (!ride.profiles?.gender) {
      return "Gender information not available";
    }
    if (!isGenderCompatible(ride)) {
      const rideOwnerGender =
        ride.profiles.gender === "male" ? "male" : "female";
      return `Only ${rideOwnerGender} students can request this ride`;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30 p-4 lg:p-6 pb-20 lg:pb-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 lg:mb-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
                Find Your Ride Buddy 🚗
              </h1>
              <p className="text-gray-600 mt-2 text-base lg:text-lg">
                Connect with fellow AIUB students and share your journey
              </p>
              <div className="flex items-center gap-2 mt-3 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                <Shield className="h-4 w-4 text-blue-600 flex-shrink-0" />
                <p className="text-sm text-blue-700">
                  <span className="font-medium">Safety Policy:</span> For
                  comfort and security, requests are only allowed between
                  students of the same gender.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="hidden sm:flex items-center gap-2"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-100 rounded-full">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">
                  {rides.length} rides
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Search Filters */}
        <Card className="mb-8 shadow-lg border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Search className="h-5 w-5 text-blue-600" />
                </div>
                Search & Filter Rides
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
                {(fromLocation || toLocation || genderPreference !== "all") && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent
            className={`pt-0 ${showFilters ? "block" : "hidden lg:block"}`}
          >
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
              <div>
                <LocationPicker
                  label="From Location"
                  value={fromLocation}
                  onSelect={setFromLocation}
                  placeholder="Any location"
                />
              </div>
              <div>
                <LocationPicker
                  label="To Location"
                  value={toLocation}
                  onSelect={setToLocation}
                  placeholder="Any location"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender Preference
                </label>
                <select
                  value={genderPreference}
                  onChange={(e) => setGenderPreference(e.target.value)}
                  className="w-full h-10 lg:h-11 px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all duration-200"
                >
                  <option value="all">🌍 All Students</option>
                  <option value="male">👨 Male Students</option>
                  <option value="female">👩 Female Students</option>
                </select>
              </div>
              <div className="flex items-end gap-2">
                <Button
                  onClick={handleSearch}
                  size="lg"
                  disabled={loading || isRefreshing}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  <Search className="h-4 w-4 mr-2" />
                  {loading || isRefreshing ? "Searching..." : "Search"}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="lg:hidden p-3"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                  />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rides List */}
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
          ) : rides.length === 0 ? (
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardContent className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <Search className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  No rides found
                </h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  Try adjusting your search criteria or check back later for new
                  rides.
                </p>
                <div className="flex gap-3 justify-center">
                  <Button onClick={clearFilters} variant="outline">
                    Clear Filters
                  </Button>
                  <Button onClick={handleRefresh}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            rides.map((ride) => (
              <Card
                key={ride.id}
                className="shadow-lg border-0 bg-white/95 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                          {ride.profiles?.name?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
                              {ride.profiles?.name || "Unknown User"}
                            </h3>
                            {ride.profiles?.gender && (
                              <div
                                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                  ride.profiles.gender === "male"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-pink-100 text-pink-700"
                                }`}
                              >
                                <User className="h-3 w-3" />
                                {ride.profiles.gender === "male"
                                  ? "👨 Male"
                                  : "👩 Female"}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center text-sm text-gray-500 gap-2">
                            <span className="flex items-center gap-1">
                              <Heart className="h-3 w-3 text-red-400" />
                              {ride.profiles?.department || "AIUB Student"}
                            </span>
                            <span>•</span>
                            <span>
                              {ride.profiles?.student_id || "Student"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                        <div className="space-y-3">
                          <div className="flex items-center text-gray-700">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                              <MapPin className="h-4 w-4 text-green-600" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wide">
                                From
                              </p>
                              <p className="font-medium">
                                {ride.from_location}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center text-gray-700">
                            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                              <MapPin className="h-4 w-4 text-red-600" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wide">
                                To
                              </p>
                              <p className="font-medium">{ride.to_location}</p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center text-gray-700">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                              <Clock className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wide">
                                Departure
                              </p>
                              <p className="font-medium">
                                {formatDateTime(ride.ride_time)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center text-gray-700">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                              <Users className="h-4 w-4 text-purple-600" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wide">
                                Available
                              </p>
                              <p className="font-medium">Ride Available</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {ride.notes && (
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg border-l-4 border-blue-400">
                          <p className="text-sm text-gray-700">
                            <span className="font-medium text-gray-900">
                              Note:
                            </span>{" "}
                            {ride.notes}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 px-3 py-1 bg-green-100 rounded-full">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-xs font-medium text-green-700">
                              Available
                            </span>
                          </div>
                          {/* Gender Compatibility Indicator */}
                          {!isMyRide(ride) && (
                            <div
                              className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                                isGenderCompatible(ride)
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              <Shield className="h-3 w-3" />
                              <span className="text-xs font-medium">
                                {isGenderCompatible(ride)
                                  ? "Compatible"
                                  : "Gender Restricted"}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="lg:ml-6 flex flex-col sm:flex-row lg:flex-col gap-3 lg:w-32">
                      {isMyRide(ride) ? (
                        <div className="flex items-center justify-center px-4 py-3 bg-blue-100 rounded-lg border border-blue-200">
                          <span className="text-sm font-medium text-blue-700">
                            Your Ride
                          </span>
                        </div>
                      ) : (
                        <>
                          {/* Join Button - disabled if gender incompatible */}
                          <Button
                            onClick={() => setRequestingRide(ride.id)}
                            disabled={!isGenderCompatible(ride)}
                            className={`w-full lg:w-32 ${
                              isGenderCompatible(ride)
                                ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                                : "bg-gray-300 text-gray-500 cursor-not-allowed"
                            }`}
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            {isGenderCompatible(ride) ? "Join" : "Restricted"}
                          </Button>

                          {/* Show warning message if gender incompatible */}
                          {!isGenderCompatible(ride) && (
                            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
                              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                              <span className="text-xs text-red-700">
                                {getGenderCompatibilityMessage(ride)}
                              </span>
                            </div>
                          )}

                          <Button
                            variant="outline"
                            onClick={() => {
                              // Open Google Maps directions
                              const mapsUrl = `https://www.google.com/maps/dir/${encodeURIComponent(
                                ride.from_location
                              )}/${encodeURIComponent(ride.to_location)}`;
                              window.open(mapsUrl, "_blank");
                            }}
                            className="w-full lg:w-32 border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300"
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Route
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Request Modal */}
                  {requestingRide === ride.id && (
                    <div className="mt-6 pt-6 border-t border-gray-200 bg-gray-50 rounded-lg p-4 -m-6">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-blue-600" />
                        Send a request to join this ride
                      </h4>
                      <div className="space-y-4">
                        <Input
                          placeholder="Add a message (optional)..."
                          value={requestMessage}
                          onChange={(e) => setRequestMessage(e.target.value)}
                          className="w-full bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-200"
                        />
                        <div className="flex space-x-3 justify-end">
                          <Button
                            onClick={() => handleSendRequest(ride.id)}
                            className="flex items-center bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Send Request
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setRequestingRide(null);
                              setRequestMessage("");
                            }}
                            className="border-gray-300"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default FindBuddyPage;
