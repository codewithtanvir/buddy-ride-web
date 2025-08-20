import React, { useState } from "react";
import {
  Car,
  Clock,
  MapPin,
  FileText,
  Plus,
  Sparkles,
  Shield,
  Users,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { TextArea } from "../components/ui/TextArea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import { LocationPicker } from "../components/LocationPicker";
import { useAuthStore } from "../stores/authStore";
import { useRideStore } from "../stores/rideStore";
import { supabase } from "../lib/supabase";
import { validateRideData } from "../utils/validation";
import { formatDateTime } from "../utils/formatters";
import toast from "react-hot-toast";

const PostRidePage: React.FC = () => {
  const { user } = useAuthStore();
  const { addRide } = useRideStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    from_location: "",
    to_location: "",
    ride_time: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validateRideData(formData);
    if (errors.length > 0) {
      errors.forEach((error) => toast.error(error));
      return;
    }

    if (!user?.id) {
      toast.error("User not found");
      return;
    }

    if (!user?.profile?.gender) {
      toast.error(
        "Please complete your profile setup including gender information before posting a ride"
      );
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("rides")
        .insert({
          user_id: user.id,
          from_location: formData.from_location.trim(),
          to_location: formData.to_location.trim(),
          ride_time: formData.ride_time.toISOString(),
          notes: formData.notes.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Add the profile to the ride data to match RideWithProfile type
      const rideWithProfile = {
        ...data,
        profiles: user.profile || null,
      };

      addRide(rideWithProfile);
      toast.success(
        "Your ride has been posted! Other students can now find and connect with you."
      );

      // Reset form
      setFormData({
        from_location: "",
        to_location: "",
        ride_time: new Date(Date.now() + 60 * 60 * 1000),
        notes: "",
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to post ride");
    } finally {
      setLoading(false);
    }
  };

  const formatDateTimeForInput = (date: Date) => {
    return date.toISOString().slice(0, 16); // Format for datetime-local input
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-blue-50/30 p-4 lg:p-6 pb-20 lg:pb-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 lg:mb-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-2xl shadow-lg mb-6">
            <Car className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-green-800 to-blue-800 bg-clip-text text-transparent mb-3">
            Post Your Ride
          </h1>
          <p className="text-gray-600 text-base lg:text-lg max-w-md mx-auto">
            Share your travel plans and connect with fellow AIUB students
          </p>

          {/* Safety Policy Info */}
          <div className="mt-6 mx-auto max-w-lg">
            <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <Shield className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <div className="text-sm text-blue-700">
                <span className="font-medium">Safety Policy:</span> Only
                students of the same gender can send requests to your ride for
                everyone's comfort and security.
              </div>
            </div>
          </div>
        </div>

        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm mb-8">
          <CardHeader className="pb-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-t-xl">
            <CardTitle className="flex items-center text-xl lg:text-2xl font-bold text-gray-900">
              <div className="p-2 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg mr-3">
                <Car className="h-6 w-6 text-white" />
              </div>
              Ride Details
            </CardTitle>
            <p className="text-gray-600 text-sm lg:text-base mt-2">
              Fill in your travel information to connect with other students
            </p>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6 lg:space-y-8">
              {/* From Location */}
              <div className="space-y-2">
                <LocationPicker
                  label="From Location"
                  value={formData.from_location}
                  onSelect={(location) =>
                    setFormData({ ...formData, from_location: location })
                  }
                  placeholder="Select departure location"
                />
              </div>

              {/* To Location */}
              <div className="space-y-2">
                <LocationPicker
                  label="To Location"
                  value={formData.to_location}
                  onSelect={(location) =>
                    setFormData({ ...formData, to_location: location })
                  }
                  placeholder="Select destination"
                />
              </div>

              {/* Date & Time */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700 flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg mr-3">
                    <Clock className="h-4 w-4 text-blue-600" />
                  </div>
                  Departure Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={formatDateTimeForInput(formData.ride_time)}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      ride_time: new Date(e.target.value),
                    })
                  }
                  min={formatDateTimeForInput(new Date())}
                  className="flex h-12 lg:h-14 w-full rounded-xl border-2 border-gray-300 bg-white px-4 py-3 text-sm lg:text-base font-medium ring-offset-background placeholder:text-gray-500 focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-200"
                  required
                />
                <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                  <p className="text-sm lg:text-base text-blue-800 font-medium">
                    📅 Selected:{" "}
                    {formatDateTime(formData.ride_time.toISOString())}
                  </p>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-3">
                <label className="flex items-center text-sm font-semibold text-gray-700">
                  <div className="p-2 bg-purple-100 rounded-lg mr-3">
                    <FileText className="h-4 w-4 text-purple-600" />
                  </div>
                  Additional Notes (Optional)
                </label>
                <TextArea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Add any additional details about your ride... (e.g., preferred music, AC/no AC, stops along the way)"
                  rows={4}
                  maxLength={200}
                  className="text-sm lg:text-base border-2 border-gray-300 focus:border-purple-500 focus:ring-4 focus:ring-purple-200 transition-all duration-200 rounded-xl"
                />
                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-500">
                    💡 Tip: Mention any preferences to help students decide
                  </p>
                  <span
                    className={`text-xs font-medium ${formData.notes.length > 180
                        ? "text-red-500"
                        : "text-gray-500"
                      }`}
                  >
                    {formData.notes.length}/200 characters
                  </span>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-14 lg:h-16 text-base lg:text-lg font-semibold bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 rounded-xl"
                loading={loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Posting Your Ride...
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5 mr-3" />
                    Post My Ride
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Enhanced Info Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    ✨ How it works
                  </h3>
                  <div className="text-sm text-gray-600 space-y-2">
                    <div className="flex items-center">
                      <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                      <span>
                        Students with matching routes will discover your ride
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                      <span>They can send personalized join requests</span>
                    </div>
                    <div className="flex items-center">
                      <span className="inline-block w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                      <span>Accept or decline requests from your profile</span>
                    </div>
                    <div className="flex items-center">
                      <span className="inline-block w-2 h-2 bg-orange-500 rounded-full mr-3"></span>
                      <span>Start chatting and coordinate your adventure!</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    🛡️ Safety First
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Only verified AIUB students can see and respond to your
                    ride. All users must use official{" "}
                    <span className="font-semibold text-blue-600">
                      @student.aiub.edu
                    </span>{" "}
                    email addresses for maximum security.
                  </p>
                  <div className="mt-3 flex items-center text-xs text-green-700 bg-green-50 px-3 py-1 rounded-full">
                    <Users className="h-3 w-3 mr-2" />
                    <span className="font-medium">100% AIUB Students Only</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Success Tips */}
        <Card className="mt-6 shadow-xl border-0 bg-gradient-to-r from-blue-50 to-green-50">
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                💡 Tips for a Successful Ride Post
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-600">
                <div className="flex flex-col items-center p-3 bg-white rounded-lg shadow-sm">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                    <span className="text-blue-600 font-bold">1</span>
                  </div>
                  <span className="text-center">
                    Be specific about pickup locations and times
                  </span>
                </div>
                <div className="flex flex-col items-center p-3 bg-white rounded-lg shadow-sm">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mb-2">
                    <span className="text-green-600 font-bold">2</span>
                  </div>
                  <span className="text-center">
                    Mention any preferences in your notes
                  </span>
                </div>
                <div className="flex flex-col items-center p-3 bg-white rounded-lg shadow-sm">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mb-2">
                    <span className="text-purple-600 font-bold">3</span>
                  </div>
                  <span className="text-center">
                    Check your profile for ride requests
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PostRidePage;
