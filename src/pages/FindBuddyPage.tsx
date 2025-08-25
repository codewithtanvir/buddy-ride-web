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
    if (!user?.id) {
      toast.error("You must be logged in to send a request.");
      return;
    }

    if (!requestMessage.trim()) {
      toast.error("Please enter a message");
      return;
    }

    if (!user?.profile?.gender) {
      toast.error("Please complete your profile setup to send requests");
      return;
    }

    if (!user?.profile?.name || !user?.profile?.student_id) {
      toast.error(
        "Please complete your profile information (name and student ID) before sending requests"
      );
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
      // First check if user already sent a request for this ride
      const { data: existingRequest, error: checkError } = await supabase
        .from("ride_requests")
        .select("id, status")
        .eq("ride_id", rideId)
        .eq("requester_id", user.id)
        .maybeSingle(); // Use maybeSingle to avoid error if no record found

      if (checkError) {
        console.error("Error checking existing request:", checkError);
        toast.error("Unable to verify request status. Please try again.");
        return;
      }

      if (existingRequest) {
        const statusText =
          existingRequest.status === "pending"
            ? "pending"
            : existingRequest.status === "accepted"
              ? "already accepted"
              : "previously sent";
        toast.error(`You have ${statusText} a request for this ride`);
        return;
      }

      // Verify the ride still exists and is valid
      const { data: rideCheck, error: rideError } = await supabase
        .from("rides")
        .select("id, user_id, ride_time")
        .eq("id", rideId)
        .single();

      if (rideError || !rideCheck) {
        toast.error("This ride is no longer available");
        return;
      }

      // Check if ride is in the future
      if (rideCheck.ride_time && new Date(rideCheck.ride_time) <= new Date()) {
        toast.error("This ride has already passed");
        return;
      }

      // Double-check that user is not requesting their own ride
      if (rideCheck.user_id === user.id) {
        toast.error("You cannot request your own ride!");
        return;
      }

      // Now try to insert the new request
      const { error } = await supabase.from("ride_requests").insert({
        ride_id: rideId,
        requester_id: user.id,
        message: requestMessage.trim(),
        status: "pending",
      });

      if (error) {
        console.error("Database error details:", error);

        // Handle specific database constraint violations
        if (
          error.code === "23505" ||
          error.message?.includes("duplicate") ||
          error.message?.includes("unique")
        ) {
          toast.error("You have already sent a request for this ride");
        } else if (error.message?.includes("Gender compatibility")) {
          toast.error(
            "Gender compatibility check failed. Please ensure your profile is complete."
          );
        } else if (error.code === "23503") {
          // Foreign key constraint violation
          toast.error(
            "Invalid ride or user information. Please refresh and try again."
          );
        } else if (error.message?.includes("Row Level Security")) {
          toast.error(
            "You don't have permission to send this request. Please check your profile."
          );
        } else {
          // Generic error with more details
          toast.error(
            `Failed to send request: ${error.message || "Unknown error"}`
          );
        }
        return;
      }

      toast.success("Request sent successfully!");
      setRequestingRide(null);
      setRequestMessage("");
    } catch (error: any) {
      console.error("Error sending request:", error);

      // Provide more specific error messages
      if (error?.code === "23505") {
        toast.error("You have already sent a request for this ride");
      } else if (error?.code === "23503") {
        toast.error(
          "Invalid ride information. Please refresh the page and try again."
        );
      } else if (error?.message?.includes("JSON")) {
        toast.error("Invalid data format. Please refresh and try again.");
      } else if (
        error?.message?.includes("network") ||
        error?.message?.includes("fetch")
      ) {
        toast.error(
          "Network error. Please check your connection and try again."
        );
      } else {
        toast.error(
          `Failed to send request: ${error?.message || "Please try again"}`
        );
      }
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/50 p-4 lg:p-6 pb-20 lg:pb-6">
      <div className="max-w-7xl mx-auto">
        {/* Enhanced Header */}
        <div className="mb-8 lg:mb-12">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full mb-4">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-blue-700">Live Ride Sharing</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent mb-4">
              Find Your Ride Buddy
            </h1>
            <p className="text-gray-600 text-base sm:text-lg lg:text-xl max-w-2xl mx-auto mb-6">
              Connect with AIUB students, share costs, and travel safely together 🚗✨
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
              <div className="flex items-center gap-3 px-4 py-3 bg-white/80 backdrop-blur-sm border border-blue-200/50 rounded-xl shadow-sm">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-900">Safe & Secure</p>
                  <p className="text-xs text-gray-600">Verified AIUB students only</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 px-4 py-3 bg-white/80 backdrop-blur-sm border border-green-200/50 rounded-xl shadow-sm">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-900">Same Gender</p>
                  <p className="text-xs text-gray-600">Comfort & safety first</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 px-4 py-3 bg-white/80 backdrop-blur-sm border border-purple-200/50 rounded-xl shadow-sm sm:col-span-2 lg:col-span-1">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-900">Popular Routes</p>
                  <p className="text-xs text-gray-600">AIUB ↔️ Kuril, Jamuna & more</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-center items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-full shadow-sm">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">
                {rides.length} Available Rides
              </span>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="bg-white/90 backdrop-blur-sm border-gray-200/50 shadow-sm hover:shadow-md"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Enhanced Search Filters */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-10">
          {/* Enhanced Search Filters Column */}
          <div className="lg:col-span-2">
            <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm sticky top-6 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      <Search className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Find Your Ride</h2>
                      <p className="text-blue-100 text-sm">Search & filter available rides</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowFilters(!showFilters)}
                      className="lg:hidden text-white hover:bg-white/20 border-white/30"
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      {showFilters ? 'Hide' : 'Show'}
                    </Button>
                    {(fromLocation || toLocation || genderPreference !== "all") && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="text-white hover:bg-white/20 border-white/30"
                      >
                        Clear All
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              
              <CardContent className={`p-6 ${showFilters ? "block" : "hidden lg:block"}`}>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        📍 Route Information
                      </label>
                      <div className="space-y-4">
                        <div className="relative">
                          <LocationPicker
                            label="From Location"
                            value={fromLocation}
                            onSelect={setFromLocation}
                            placeholder="Select pickup location"
                          />
                          <div className="absolute -right-2 top-8 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
                        </div>
                        
                        <div className="flex justify-center">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <div className="w-4 h-4 border-2 border-gray-400 border-dashed rounded-full"></div>
                          </div>
                        </div>
                        
                        <div className="relative">
                          <LocationPicker
                            label="To Location"
                            value={toLocation}
                            onSelect={setToLocation}
                            placeholder="Select destination"
                          />
                          <div className="absolute -right-2 top-8 w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-sm"></div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        👤 Gender Preference
                      </label>
                      <div className="grid grid-cols-1 gap-2">
                        {[
                          { value: "all", label: "🌍 All Students", desc: "View all available rides" },
                          { value: "male", label: "👨 Male Students", desc: "Male students only" },
                          { value: "female", label: "👩 Female Students", desc: "Female students only" }
                        ].map((option) => (
                          <div
                            key={option.value}
                            className={`p-3 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                              genderPreference === option.value
                                ? "border-blue-500 bg-blue-50 shadow-sm"
                                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                            }`}
                            onClick={() => setGenderPreference(option.value)}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-900">{option.label}</p>
                                <p className="text-xs text-gray-600">{option.desc}</p>
                              </div>
                              <div className={`w-4 h-4 rounded-full border-2 ${
                                genderPreference === option.value
                                  ? "border-blue-500 bg-blue-500"
                                  : "border-gray-300"
                              }`}>
                                {genderPreference === option.value && (
                                  <div className="w-full h-full rounded-full bg-white scale-50"></div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3 pt-4 border-t border-gray-200">
                    <Button
                      onClick={handleSearch}
                      size="lg"
                      disabled={loading || isRefreshing}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                    >
                      <Search className="h-5 w-5 mr-2" />
                      {loading || isRefreshing ? "Searching..." : "Search Rides"}
                    </Button>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="bg-white/80 border-gray-200"
                      >
                        <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? "animate-spin" : ""}`} />
                        Refresh
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearFilters}
                        disabled={!fromLocation && !toLocation && genderPreference === "all"}
                        className="bg-white/80 border-gray-200"
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          {/* Enhanced Rides List Column */}
          <div className="lg:col-span-3 space-y-6">
            {/* Quick Stats Bar */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200/50 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-gray-700">
                      {rides.length} Rides Available
                    </span>
                  </div>
                  {rides.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>Updated {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {(fromLocation || toLocation || genderPreference !== "all") && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 rounded-full">
                      <Filter className="h-3 w-3 text-blue-600" />
                      <span className="text-xs text-blue-700 font-medium">Filtered</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Enhanced Rides List */}
            <div className="space-y-6">
              {loading ? (
                <div className="space-y-6">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="shadow-lg border-0 bg-white/95 backdrop-blur-sm overflow-hidden">
                      <CardContent className="p-6">
                        <div className="animate-pulse">
                          <div className="flex items-start gap-4 mb-6">
                            <div className="w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl"></div>
                            <div className="flex-1 space-y-3">
                              <div className="flex items-center gap-3">
                                <div className="h-5 bg-gray-200 rounded-lg w-32"></div>
                                <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                              </div>
                              <div className="h-4 bg-gray-200 rounded w-48"></div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="space-y-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                                <div className="space-y-1">
                                  <div className="h-3 bg-gray-200 rounded w-12"></div>
                                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                                <div className="space-y-1">
                                  <div className="h-3 bg-gray-200 rounded w-8"></div>
                                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                                </div>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                                <div className="space-y-1">
                                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                                  <div className="h-4 bg-gray-200 rounded w-28"></div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                                <div className="space-y-1">
                                  <div className="h-3 bg-gray-200 rounded w-14"></div>
                                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="flex gap-2">
                              <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                              <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                            </div>
                            <div className="flex gap-2">
                              <div className="h-10 bg-gray-200 rounded-lg w-24"></div>
                              <div className="h-10 bg-gray-200 rounded-lg w-20"></div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : rides.length === 0 ? (
                <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm overflow-hidden">
                  <CardContent className="p-12 text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl mb-6">
                      <Search className="h-10 w-10 text-gray-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-3">
                      No rides found
                    </h3>
                    <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">
                      {fromLocation || toLocation || genderPreference !== "all" 
                        ? "Try adjusting your search filters to find more rides."
                        : "No rides are currently available. Check back later or create your own ride!"
                      }
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-sm mx-auto">
                      <Button 
                        onClick={clearFilters} 
                        variant="outline"
                        className="flex-1 bg-white/80 border-gray-200"
                      >
                        <Filter className="h-4 w-4 mr-2" />
                        Clear Filters
                      </Button>
                      <Button 
                        onClick={handleRefresh}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                      >
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
                    className="shadow-xl border-0 bg-white/98 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                    
                    <CardContent className="p-0">
                      {/* Enhanced Header */}
                      <div className="p-6 pb-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:shadow-xl transition-all duration-300">
                                {ride.profiles?.name?.charAt(0)?.toUpperCase() || "U"}
                              </div>
                              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                              </div>
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-bold text-xl text-gray-900 group-hover:text-blue-600 transition-colors">
                                  {ride.profiles?.name || "Unknown User"}
                                </h3>
                                {ride.profiles?.gender && (
                                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold shadow-sm ${
                                    ride.profiles.gender === "male"
                                      ? "bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 border border-blue-300"
                                      : "bg-gradient-to-r from-pink-100 to-pink-200 text-pink-700 border border-pink-300"
                                  }`}>
                                    <User className="h-4 w-4" />
                                    {ride.profiles.gender === "male" ? "👨 Male" : "👩 Female"}
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <div className="flex items-center gap-1.5">
                                  <Heart className="h-4 w-4 text-red-400" />
                                  <span className="font-medium">{ride.profiles?.department || "AIUB Student"}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <div className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center">
                                    <span className="text-xs font-bold text-blue-600">#</span>
                                  </div>
                                  <span>{ride.profiles?.student_id || "Student"}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Status Indicators */}
                          <div className="flex flex-col gap-2 items-end">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-green-100 to-green-200 rounded-full border border-green-300 shadow-sm">
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                              <span className="text-sm font-semibold text-green-700">Available</span>
                            </div>
                            
                            {!isMyRide(ride) && (
                              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold shadow-sm ${
                                isGenderCompatible(ride)
                                  ? "bg-gradient-to-r from-green-100 to-green-200 text-green-700 border border-green-300"
                                  : "bg-gradient-to-r from-red-100 to-red-200 text-red-700 border border-red-300"
                              }`}>
                                <Shield className="h-3 w-3" />
                                <span>{isGenderCompatible(ride) ? "Compatible" : "Restricted"}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Enhanced Route & Time Information */}
                      <div className="px-6 pb-4">
                        <div className="bg-gradient-to-r from-gray-50 to-blue-50/50 rounded-xl p-4 border border-gray-200/50">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Route Information */}
                            <div className="space-y-4">
                              <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide">📍 Route</h4>
                              
                              <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-md">
                                    <MapPin className="h-5 w-5 text-white" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">From</p>
                                    <p className="font-bold text-gray-900 text-lg">{ride.from_location}</p>
                                  </div>
                                </div>
                                
                                <div className="flex items-center justify-center">
                                  <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-gray-200 shadow-sm">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-md">
                                    <MapPin className="h-5 w-5 text-white" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">To</p>
                                    <p className="font-bold text-gray-900 text-lg">{ride.to_location}</p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Time & Details */}
                            <div className="space-y-4">
                              <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide">⏰ Schedule</h4>
                              
                              <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                                    <Clock className="h-5 w-5 text-white" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Departure</p>
                                    <p className="font-bold text-gray-900 text-lg">{formatDateTime(ride.ride_time)}</p>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                                    <Users className="h-5 w-5 text-white" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Seats</p>
                                    <p className="font-bold text-gray-900 text-lg">Space Available</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Notes Section */}
                      {ride.notes && (
                        <div className="px-6 pb-4">
                          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-orange-200 rounded-xl p-4">
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                <AlertCircle className="h-4 w-4 text-orange-600" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-orange-800 mb-1">Additional Notes</p>
                                <p className="text-sm text-orange-700 leading-relaxed">{ride.notes}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Enhanced Action Buttons */}
                      <div className="px-6 pb-6">
                        <div className="flex flex-col sm:flex-row gap-3">
                          {isMyRide(ride) ? (
                            <div className="flex items-center justify-center px-6 py-4 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl border border-blue-200 shadow-sm">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                  <User className="h-4 w-4 text-white" />
                                </div>
                                <span className="text-lg font-bold text-blue-700">Your Ride</span>
                              </div>
                            </div>
                          ) : (
                            <>
                              <Button
                                onClick={() => setRequestingRide(ride.id)}
                                disabled={!isGenderCompatible(ride)}
                                className={`flex-1 h-12 text-base font-semibold ${
                                  isGenderCompatible(ride)
                                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                                    : "bg-gray-300 text-gray-500 cursor-not-allowed hover:transform-none"
                                }`}
                              >
                                <MessageSquare className="h-5 w-5 mr-2" />
                                {isGenderCompatible(ride) ? "Send Request" : "Gender Restricted"}
                              </Button>

                              <Button
                                variant="outline"
                                onClick={() => {
                                  const mapsUrl = `https://www.google.com/maps/dir/${encodeURIComponent(
                                    ride.from_location
                                  )}/${encodeURIComponent(ride.to_location)}`;
                                  window.open(mapsUrl, "_blank");
                                }}
                                className="h-12 px-6 bg-white/90 border-gray-300 hover:bg-gray-50 hover:border-gray-400 shadow-sm hover:shadow-md transition-all duration-200"
                              >
                                <ExternalLink className="h-5 w-5 mr-2" />
                                View Route
                              </Button>
                            </>
                          )}
                        </div>

                        {/* Gender Compatibility Warning */}
                        {!isMyRide(ride) && !isGenderCompatible(ride) && (
                          <div className="mt-4 flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
                            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-semibold text-red-800 mb-1">Gender Restriction</p>
                              <p className="text-sm text-red-700">
                                {getGenderCompatibilityMessage(ride)}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Enhanced Request Modal */}
                      {requestingRide === ride.id && (
                        <div className="px-6 pb-6">
                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-lg">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                                <MessageSquare className="h-6 w-6 text-white" />
                              </div>
                              <div>
                                <h4 className="text-xl font-bold text-gray-900">Send Join Request</h4>
                                <p className="text-sm text-gray-600">Introduce yourself to {ride.profiles?.name || "the rider"}</p>
                              </div>
                            </div>
                            
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                  Your Message
                                </label>
                                <textarea
                                  placeholder="Hi! I'd like to join your ride. Let's share the cost and travel together safely! 🚗"
                                  value={requestMessage}
                                  onChange={(e) => setRequestMessage(e.target.value)}
                                  rows={4}
                                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 resize-none"
                                />
                                <div className="flex justify-between items-center mt-2">
                                  <p className="text-xs text-gray-500">
                                    Be friendly and introduce yourself!
                                  </p>
                                  <p className={`text-xs ${requestMessage.length > 500 ? 'text-red-600' : 'text-gray-500'}`}>
                                    {requestMessage.length}/500
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                <Button
                                  onClick={() => handleSendRequest(ride.id)}
                                  disabled={!requestMessage.trim() || requestMessage.length > 500}
                                  className="flex-1 h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                                >
                                  <Send className="h-5 w-5 mr-2" />
                                  Send Request
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setRequestingRide(null);
                                    setRequestMessage("");
                                  }}
                                  className="h-12 px-6 bg-white border-gray-300 hover:bg-gray-50 hover:border-gray-400"
                                >
                                  Cancel
                                </Button>
                              </div>
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
      </div>
    </div>
  );
};

export default FindBuddyPage;
