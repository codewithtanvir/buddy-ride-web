import React, { useState } from "react";
import { Car, Clock, MapPin, FileText, Plus } from "lucide-react";
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
    <div className="p-4 lg:p-6 pb-20 lg:pb-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Post a Ride
          </h1>
          <p className="text-gray-600 mt-2 text-sm lg:text-base">
            Share your travel plans with other students
          </p>
        </div>

        <Card className="shadow-sm lg:shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-lg lg:text-xl">
              <Car className="h-5 w-5 mr-2" />
              Ride Details
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-6">
              {/* From Location */}
              <LocationPicker
                label="From Location"
                value={formData.from_location}
                onSelect={(location) =>
                  setFormData({ ...formData, from_location: location })
                }
                placeholder="Select departure location"
              />

              {/* To Location */}
              <LocationPicker
                label="To Location"
                value={formData.to_location}
                onSelect={(location) =>
                  setFormData({ ...formData, to_location: location })
                }
                placeholder="Select destination"
              />

              {/* Date & Time */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Date & Time
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
                  className="flex h-11 lg:h-12 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm lg:text-base ring-offset-background placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
                <p className="text-xs lg:text-sm text-gray-500">
                  Selected: {formatDateTime(formData.ride_time.toISOString())}
                </p>
              </div>

              {/* Notes */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <FileText className="h-4 w-4 mr-2" />
                  Notes (Optional)
                </label>
                <TextArea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Add any additional details about your ride..."
                  rows={3}
                  maxLength={200}
                  className="text-sm lg:text-base"
                />
                <p className="text-xs text-gray-500">
                  {formData.notes.length}/200 characters
                </p>
              </div>

              <Button
                type="submit"
                className="w-full h-11 lg:h-12 text-sm lg:text-base"
                loading={loading}
              >
                <Plus className="h-4 w-4 mr-2" />
                Post Ride
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Info Cards */}
        <div className="mt-8 space-y-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <MapPin className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    How it works
                  </h3>
                  <div className="mt-2 text-sm text-gray-600 space-y-1">
                    <p>
                      • Other students with matching routes and gender will see
                      your ride
                    </p>
                    <p>• They can send requests to join your ride</p>
                    <p>
                      • You can accept or decline requests from your profile
                    </p>
                    <p>
                      • Start chatting and coordinate your trip after
                      acceptance!
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Car className="h-5 w-5 text-green-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Safety First
                  </h3>
                  <p className="mt-2 text-sm text-gray-600">
                    Only verified AIUB students can see and respond to your
                    ride. All users must use official @student.aiub.edu email
                    addresses.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PostRidePage;
