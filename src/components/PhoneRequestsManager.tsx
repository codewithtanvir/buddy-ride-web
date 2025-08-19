import React, { useState, useEffect } from "react";
import { Phone, Users, Clock, Check, X, AlertTriangle } from "lucide-react";
import { Button } from "./ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { useAuthStore } from "../stores/authStore";
import { supabase } from "../lib/supabase";
import { formatDateTime } from "../utils/formatters";
import toast from "react-hot-toast";

interface PhoneRequest {
  id: string;
  requester_id: string;
  requester_name: string;
  ride_id: string;
  ride_title: string;
  message: string;
  created_at: string;
  status: "pending" | "accepted" | "declined";
}

export const PhoneRequestsManager: React.FC = () => {
  const { user } = useAuthStore();
  const [requests, setRequests] = useState<PhoneRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchPhoneRequests();

      // Set up real-time subscription for new requests
      const subscription = supabase
        .channel(`phone_requests:${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "ride_requests",
          },
          (payload) => {
            console.log("New phone request:", payload);
            fetchPhoneRequests(); // Refresh the list
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [user?.id]);

  const fetchPhoneRequests = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Get requests where I'm the ride owner
      const { data, error } = await supabase
        .from("ride_requests")
        .select(
          `
          id,
          requester_id,
          message,
          created_at,
          status,
          ride_id,
          profiles:requester_id (
            name
          ),
          rides:ride_id (
            from_location,
            to_location,
            user_id
          )
        `
        )
        .eq("rides.user_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedRequests: PhoneRequest[] = (data || []).map((req) => ({
        id: req.id,
        requester_id: req.requester_id!,
        requester_name: (req.profiles as any)?.name || "Unknown User",
        ride_id: req.ride_id!,
        ride_title: `${(req.rides as any)?.from_location} → ${
          (req.rides as any)?.to_location
        }`,
        message: req.message || "Requested contact access",
        created_at: req.created_at!,
        status: req.status as "pending",
      }));

      setRequests(formattedRequests);
    } catch (error) {
      console.error("Error fetching phone requests:", error);
      toast.error("Failed to load phone requests");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestResponse = async (
    requestId: string,
    approved: boolean,
    customMessage?: string
  ) => {
    setResponding(requestId);

    try {
      const request = requests.find((r) => r.id === requestId);
      if (!request) throw new Error("Request not found");

      // Update the request status
      const { error: updateError } = await supabase
        .from("ride_requests")
        .update({
          status: approved ? "accepted" : "declined",
          phone_shared: approved,
          updated_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      if (updateError) throw updateError;

      // Send a system message to the chat
      const messageContent = approved
        ? `✅ ${
            customMessage ||
            `Phone access granted! ${
              user?.profile?.phone_number
                ? `Here's my number: ${user.profile.phone_number}`
                : ""
            }`
          }`
        : `❌ ${customMessage || "Phone access request declined"}`;

      await supabase.from("messages").insert({
        content: messageContent,
        ride_id: request.ride_id,
        sender_id: user?.id!,
        message_type: approved ? "phone_share" : "system",
        phone_number: approved ? user?.profile?.phone_number : undefined,
        phone_shared: approved,
      });

      // Remove from local state
      setRequests((prev) => prev.filter((r) => r.id !== requestId));

      toast.success(approved ? "Phone access granted!" : "Request declined");
    } catch (error) {
      console.error("Error responding to request:", error);
      toast.error("Failed to respond to request");
    } finally {
      setResponding(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Phone className="h-5 w-5 mr-2" />
            Phone Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Phone className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No pending phone requests</p>
            <p className="text-sm mt-1">
              Requests will appear here when riders want your contact info
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Phone className="h-5 w-5 mr-2" />
            Phone Requests
          </div>
          <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm font-medium">
            {requests.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {requests.map((request) => (
          <div
            key={request.id}
            className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {request.requester_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {request.requester_name}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {request.ride_title}
                    </p>
                  </div>
                </div>

                <div className="bg-white/70 rounded-lg p-3 mb-3">
                  <p className="text-gray-800 text-sm">"{request.message}"</p>
                </div>

                <div className="flex items-center text-xs text-gray-500">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatDateTime(request.created_at)}
                </div>
              </div>

              <div className="flex space-x-2 ml-4">
                <Button
                  size="sm"
                  onClick={() => handleRequestResponse(request.id, true)}
                  disabled={responding === request.id}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {responding === request.id ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check className="h-3 w-3 mr-1" />
                      Grant Access
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRequestResponse(request.id, false)}
                  disabled={responding === request.id}
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  <X className="h-3 w-3 mr-1" />
                  Decline
                </Button>
              </div>
            </div>

            {/* Privacy Warning */}
            <div className="mt-3 p-2 bg-amber-100 border border-amber-300 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-amber-700">
                  <p className="font-medium">Privacy Notice</p>
                  <p>
                    Granting access will share your phone number with this user.
                    Only share with people you trust.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
