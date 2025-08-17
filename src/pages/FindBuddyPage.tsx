import React, { useState, useEffect } from "react";
import { Search, Clock, MapPin, MessageSquare, Send } from "lucide-react";
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

  useEffect(() => {
    // Load all rides initially, regardless of gender
    fetchRides("", "", "all");
  }, [fetchRides]);

  const handleSearch = () => {
    fetchRides(fromLocation, toLocation, genderPreference);
  };

  const handleSendRequest = async (rideId: string) => {
    if (!user?.id || !requestMessage.trim()) {
      toast.error("Please enter a message");
      return;
    }

    try {
      const { error } = await supabase.from("ride_requests").insert({
        ride_id: rideId,
        requester_id: user.id,
        message: requestMessage.trim(),
        status: "pending",
      });

      if (error) throw error;

      toast.success("Request sent successfully!");
      setRequestingRide(null);
      setRequestMessage("");
    } catch (error) {
      console.error("Error sending request:", error);
      toast.error("Failed to send request");
    }
  };

  const isMyRide = (ride: any) => ride.user_id === user?.id;

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Find a Buddy</h1>
          <p className="text-gray-600 mt-2">
            Search for rides and connect with other students
          </p>
        </div>

        {/* Search Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="h-5 w-5 mr-2" />
              Search Rides
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <LocationPicker
                  label="From"
                  value={fromLocation}
                  onSelect={setFromLocation}
                  placeholder="Any location"
                />
              </div>
              <div>
                <LocationPicker
                  label="To"
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
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All</option>
                  <option value="male">Male only</option>
                  <option value="female">Female only</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleSearch}
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? "Searching..." : "Search"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rides List */}
        <div className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-gray-600">Loading rides...</p>
              </CardContent>
            </Card>
          ) : rides.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-gray-600">
                  No rides found. Try adjusting your search criteria.
                </p>
              </CardContent>
            </Card>
          ) : (
            rides.map((ride) => (
              <Card key={ride.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-4">
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
                      </div>

                      {ride.notes && (
                        <p className="text-gray-700 mb-4">{ride.notes}</p>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">
                            {ride.profiles?.name}
                          </span>
                          <span className="mx-2">•</span>
                          <span>{ride.profiles?.department}</span>
                          <span className="mx-2">•</span>
                          <span>{ride.profiles?.student_id}</span>
                        </div>
                      </div>
                    </div>

                    <div className="ml-4">
                      {isMyRide(ride) ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Your Ride
                        </span>
                      ) : (
                        <Button
                          onClick={() => setRequestingRide(ride.id)}
                          className="flex items-center"
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Request to Join
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Request Modal */}
                  {requestingRide === ride.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="font-medium text-gray-900 mb-2">
                        Send a request to join this ride
                      </h4>
                      <div className="space-y-3">
                        <Input
                          placeholder="Add a message..."
                          value={requestMessage}
                          onChange={(e) => setRequestMessage(e.target.value)}
                          className="w-full"
                        />
                        <div className="flex space-x-2">
                          <Button
                            onClick={() => handleSendRequest(ride.id)}
                            className="flex items-center"
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
