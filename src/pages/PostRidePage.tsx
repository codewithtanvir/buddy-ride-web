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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/50 to-emerald-50/50 p-4 lg:p-6 pb-20 lg:pb-6">
      <div className="max-w-3xl mx-auto">
        {/* Simplified Header */}
        <div className="mb-10 lg:mb-12 text-center">
          {/* <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full mb-6">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-green-700">Share Your Journey</span>
          </div> */}
          
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 via-emerald-500 to-blue-500 rounded-3xl shadow-xl mb-6">
            <Car className="h-10 w-10 text-white" />
          </div>
          
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-slate-900 via-green-800 to-emerald-800 bg-clip-text text-transparent mb-4">
            Post Your Ride
          </h1>
          <p className="text-gray-600 text-base sm:text-lg lg:text-xl max-w-2xl mx-auto mb-8">
            Connect with fellow AIUB students and share your journey while saving costs 🚗💰
          </p>

          {/* Simplified Safety Notice */}
          <div className="max-w-xl mx-auto">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Shield className="h-4 w-4 text-white" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-900">🛡️ Same Gender Policy</p>
                  <p className="text-xs text-gray-600">Only students of the same gender can join your ride</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Simplified Main Form */}
        <Card className="shadow-2xl border-0 bg-white/98 backdrop-blur-sm overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Car className="h-7 w-7" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Create Your Ride</h2>
                <p className="text-green-100 text-sm">Fill in your travel details below</p>
              </div>
            </div>
          </div>
              
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Route Section */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                        <MapPin className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">📍 Route Information</h3>
                        <p className="text-sm text-gray-600">Select your pickup and destination</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* From Location */}
                      <div className="space-y-3">
                        <div className="relative">
                          <LocationPicker
                            label="From Location"
                            value={formData.from_location}
                            onSelect={(location) =>
                              setFormData({ ...formData, from_location: location })
                            }
                            placeholder="Select pickup location"
                          />
                          <div className="absolute -right-2 top-8 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
                        </div>
                      </div>

                      {/* Visual Route Connector */}
                      <div className="hidden md:flex items-center justify-center py-8">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <div className="w-8 h-0.5 bg-gray-300"></div>
                          <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                          <div className="w-8 h-0.5 bg-gray-300"></div>
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        </div>
                      </div>

                      {/* To Location */}
                      <div className="space-y-3 md:col-start-2">
                        <div className="relative">
                          <LocationPicker
                            label="To Location"
                            value={formData.to_location}
                            onSelect={(location) =>
                              setFormData({ ...formData, to_location: location })
                            }
                            placeholder="Select destination"
                          />
                          <div className="absolute -right-2 top-8 w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-sm"></div>
                        </div>
                      </div>
                    </div>

                    {/* Route Summary */}
                    {(formData.from_location || formData.to_location) && (
                      <div className="bg-gradient-to-r from-gray-50 to-blue-50/50 rounded-xl p-4 border border-gray-200/50">
                        <div className="flex items-center gap-3">
                          <MapPin className="h-5 w-5 text-blue-600" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-700">Route Preview:</p>
                            <p className="text-gray-900 font-semibold">
                              {formData.from_location || "Select pickup"} → {formData.to_location || "Select destination"}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Enhanced Date & Time Section */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                        <Clock className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">⏰ Schedule</h3>
                        <p className="text-sm text-gray-600">When are you planning to travel?</p>
                      </div>
                    </div>
                    
                    {/* Quick Time Selection */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { 
                          label: "In 1 Hour", 
                          
                          action: () => {
                            const now = new Date();
                            now.setHours(now.getHours() + 1);
                            now.setMinutes(0);
                            setFormData({ ...formData, ride_time: now });
                          }
                        },
                        { 
                          label: "Tomorrow 9 AM", 
                          
                          action: () => {
                            const now = new Date();
                            now.setDate(now.getDate() + 1);
                            now.setHours(9);
                            now.setMinutes(0);
                            setFormData({ ...formData, ride_time: now });
                          }
                        },
                        { 
                          label: "Tomorrow 5 PM", 
                          
                          action: () => {
                            const now = new Date();
                            now.setDate(now.getDate() + 1);
                            now.setHours(17);
                            now.setMinutes(0);
                            setFormData({ ...formData, ride_time: now });
                          }
                        }
                      ].map((option) => (
                        <Button
                          key={option.label}
                          type="button"
                          variant="outline"
                          onClick={option.action}
                          className="h-14 flex-col gap-1 bg-white/80 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                        >
                          <span className="text-sm font-medium">{option.label}</span>
                        </Button>
                      ))}
                    </div>

                    {/* Custom DateTime Picker */}
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-gray-700">
                        Or pick a custom date/time:
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
                        className="w-full h-14 px-4 py-3 bg-white border-2 border-gray-300 rounded-xl text-base font-medium focus:outline-none focus:ring-4 focus:ring-purple-200 focus:border-purple-500 transition-all duration-200"
                        required
                      />
                    </div>

                    {/* Enhanced Selected Time Display */}
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-5 border border-purple-200">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                          <Clock className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-600 mb-1">Your departure time:</p>
                          <p className="text-xl font-bold text-gray-900">
                            {formatDateTime(formData.ride_time.toISOString())}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Notes Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                        <FileText className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">Additional Notes</h3>
                        <p className="text-sm text-gray-600">Share any important details (optional)</p>
                      </div>
                    </div>
                    
                    <TextArea
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                      placeholder="💡 Share details like: pickup specifics, cost sharing preferences,stops along the way..."
                      rows={5}
                      maxLength={300}
                      className="text-base border-2 border-gray-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-200 transition-all duration-200 rounded-xl bg-white"
                    />
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-500">
                        💡 Tip: Clear details help students make better decisions
                      </p>
                      <span className={`text-sm font-medium ${
                        formData.notes.length > 250 ? "text-orange-600" : "text-gray-500"
                      }`}>
                        {formData.notes.length}/300
                      </span>
                    </div>
                  </div>

                  {/* Enhanced Submit Button */}
                  <div className="pt-6 border-t border-gray-200">
                    <Button
                      type="submit"
                      disabled={loading || !formData.from_location || !formData.to_location}
                      className="w-full h-16 text-lg font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-blue-600 hover:from-green-700 hover:via-emerald-700 hover:to-blue-700 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      loading={loading}
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                          Creating Your Ride...
                        </>
                      ) : (
                        <>
                          <Plus className="h-6 w-6 mr-3" />
                          Post My Ride & Connect Students
                        </>
                      )}
                    </Button>
                    
                    {(!formData.from_location || !formData.to_location) && (
                      <p className="text-sm text-orange-600 text-center mt-3 flex items-center justify-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Please select both pickup and destination locations
                      </p>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    };

export default PostRidePage;
