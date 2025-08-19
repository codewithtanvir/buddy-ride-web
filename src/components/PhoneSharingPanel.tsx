import React, { useState, useEffect } from "react";
import {
  Phone,
  Shield,
  Users,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Button } from "./ui/Button";
import { Card, CardContent } from "./ui/Card";
import { PhoneShareModal, PhoneNumberDisplay } from "./PhoneShareModal";
import {
  sendChatMessage,
  getPhoneShareHistory,
  checkPhoneAccessPermission,
  formatPhoneNumber,
  validatePhoneNumber,
} from "../utils/phoneSharing";
import { useAuthStore } from "../stores/authStore";
import toast from "react-hot-toast";

interface PhoneSharingPanelProps {
  rideId: string;
  recipientName: string;
  isRideOwner: boolean;
}

export const PhoneSharingPanel: React.FC<PhoneSharingPanelProps> = ({
  rideId,
  recipientName,
  isRideOwner,
}) => {
  const { user } = useAuthStore();
  const [showShareModal, setShowShareModal] = useState(false);
  const [phoneHistory, setPhoneHistory] = useState({
    sharedNumbers: [] as Array<{
      user_id: string;
      user_name: string;
      phone_number: string;
      shared_at: string;
    }>,
    pendingRequests: [] as Array<{
      id: string;
      requester_id: string;
      requester_name: string;
      message: string;
      created_at: string;
    }>,
  });
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (rideId && user?.id) {
      loadPhoneHistory();
      checkAccess();
    }
  }, [rideId, user?.id]);

  const loadPhoneHistory = async () => {
    try {
      const history = await getPhoneShareHistory(rideId);
      setPhoneHistory(history);
    } catch (error) {
      console.error("Error loading phone history:", error);
    }
  };

  const checkAccess = async () => {
    try {
      setLoading(true);
      if (user?.id) {
        const access = await checkPhoneAccessPermission(rideId, user.id);
        setHasAccess(access);
      }
    } catch (error) {
      console.error("Error checking access:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSharePhone = async (sharePhone: boolean, message?: string) => {
    if (!user?.id) return;

    try {
      let phoneNumber = undefined;

      if (sharePhone) {
        phoneNumber = user.profile?.phone_number;
        if (!phoneNumber) {
          toast.error("Please add a phone number to your profile first");
          return;
        }

        if (!validatePhoneNumber(phoneNumber)) {
          toast.error("Please add a valid phone number to your profile");
          return;
        }
      }

      await sendChatMessage({
        rideId,
        senderId: user.id,
        content:
          message ||
          (sharePhone
            ? `Here's my number for ride coordination`
            : "Let's coordinate for the ride"),
        sharePhone,
        phoneNumber,
      });

      // Refresh the history
      await loadPhoneHistory();
    } catch (error) {
      console.error("Error sharing phone:", error);
      throw error;
    }
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Phone className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Contact Sharing</h3>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Shield className="h-4 w-4" />
              <span>Secure</span>
            </div>
          </div>

          {/* Access Status */}
          <div className="mb-4">
            {hasAccess ? (
              <div className="flex items-center space-x-2 text-green-700 bg-green-100 rounded-lg p-2">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  You have access to shared numbers
                </span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-amber-700 bg-amber-100 rounded-lg p-2">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Request access or share your number to see shared contacts
                </span>
              </div>
            )}
          </div>

          {/* Shared Numbers */}
          {phoneHistory.sharedNumbers.length > 0 && hasAccess && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Users className="h-4 w-4 mr-1" />
                Shared Numbers ({phoneHistory.sharedNumbers.length})
              </h4>
              <div className="space-y-2">
                {phoneHistory.sharedNumbers.map((share, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-lg p-3 border border-gray-200"
                  >
                    <PhoneNumberDisplay
                      phoneNumber={formatPhoneNumber(share.phone_number)}
                      isShared={true}
                      userName={share.user_name}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pending Requests */}
          {phoneHistory.pendingRequests.length > 0 && isRideOwner && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                Pending Requests ({phoneHistory.pendingRequests.length})
              </h4>
              <div className="space-y-2">
                {phoneHistory.pendingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="bg-amber-50 border border-amber-200 rounded-lg p-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-amber-900">
                          {request.requester_name}
                        </p>
                        <p className="text-sm text-amber-700 mt-1">
                          {request.message}
                        </p>
                        <p className="text-xs text-amber-600 mt-1">
                          {new Date(request.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex space-x-2 ml-3">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => {
                            // TODO: Implement approve request
                            toast.success(
                              "Request approved (feature coming soon)"
                            );
                          }}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-300 text-red-600 hover:bg-red-50"
                          onClick={() => {
                            // TODO: Implement decline request
                            toast.error(
                              "Request declined (feature coming soon)"
                            );
                          }}
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          Decline
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button
              onClick={() => setShowShareModal(true)}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg"
            >
              <Phone className="h-4 w-4 mr-2" />
              Share Contact Details
            </Button>

            {!isRideOwner && !hasAccess && (
              <Button
                variant="outline"
                className="w-full border-2 border-blue-300 text-blue-700 hover:bg-blue-50 rounded-lg"
                onClick={() => {
                  // TODO: Implement request access
                  toast("Request access feature coming soon", { icon: "ℹ️" });
                }}
              >
                <Shield className="h-4 w-4 mr-2" />
                Request Access to Numbers
              </Button>
            )}
          </div>

          {/* Privacy Note */}
          <div className="mt-4 p-3 bg-gray-100 rounded-lg">
            <div className="flex items-start space-x-2">
              <Shield className="h-4 w-4 text-gray-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-gray-600">
                <p className="font-medium mb-1">Privacy Protected</p>
                <p>
                  Phone numbers are only shared with ride participants and are
                  encrypted in transit. You can report any misuse to our support
                  team.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phone Share Modal */}
      <PhoneShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        onShare={handleSharePhone}
        recipientName={recipientName}
        myPhoneNumber={user?.profile?.phone_number || undefined}
      />
    </>
  );
};
