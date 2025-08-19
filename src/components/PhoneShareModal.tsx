import React, { useState } from "react";
import {
  Phone,
  Shield,
  Eye,
  EyeOff,
  AlertTriangle,
  Check,
  Send,
  Copy,
} from "lucide-react";
import { Button } from "./ui/Button";
import { Card, CardContent } from "./ui/Card";
import toast from "react-hot-toast";

interface PhoneShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShare: (sharePhone: boolean, message?: string) => Promise<void>;
  recipientName: string;
  myPhoneNumber?: string;
}

export const PhoneShareModal: React.FC<PhoneShareModalProps> = ({
  isOpen,
  onClose,
  onShare,
  recipientName,
  myPhoneNumber,
}) => {
  const [sharePhone, setSharePhone] = useState(false);
  const [customMessage, setCustomMessage] = useState("");
  const [showPhonePreview, setShowPhonePreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  if (!isOpen) return null;

  const handleShare = async () => {
    if (!acknowledged) {
      toast.error("Please acknowledge the privacy notice");
      return;
    }

    setLoading(true);
    try {
      await onShare(sharePhone, customMessage.trim() || undefined);
      onClose();
      setSharePhone(false);
      setCustomMessage("");
      setAcknowledged(false);
      toast.success(sharePhone ? "Phone number shared!" : "Message sent!");
    } catch (error) {
      console.error("Error sharing:", error);
      toast.error("Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  const maskPhoneNumber = (phone: string) => {
    if (phone.length <= 4) return phone;
    const visiblePart = phone.slice(-4);
    const maskedPart = "*".repeat(phone.length - 4);
    return maskedPart + visiblePart;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white rounded-xl shadow-xl">
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Share Contact Details
            </h3>
            <p className="text-gray-600">
              Send a message to{" "}
              <span className="font-semibold">{recipientName}</span>
            </p>
          </div>

          {/* Phone Sharing Option */}
          {myPhoneNumber && (
            <div className="mb-6">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border-2 border-transparent hover:border-blue-200 transition-all duration-200">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sharePhone}
                    onChange={(e) => setSharePhone(e.target.checked)}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">
                        Share my phone number
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setShowPhonePreview(!showPhonePreview)}
                        className="p-1 h-auto"
                      >
                        {showPhonePreview ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {showPhonePreview
                        ? `Your number: ${myPhoneNumber}`
                        : `Your number: ${maskPhoneNumber(myPhoneNumber)}`}
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Custom Message */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message (Optional)
            </label>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder={
                sharePhone
                  ? "Hi! Here's my number for ride coordination..."
                  : "Hi! I'd like to coordinate about the ride..."
              }
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={3}
              maxLength={200}
            />
            <div className="text-right text-xs text-gray-500 mt-1">
              {customMessage.length}/200 characters
            </div>
          </div>

          {/* Privacy Notice */}
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-medium text-amber-800 mb-2">
                  Privacy Notice
                </h4>
                <ul className="text-sm text-amber-700 space-y-1">
                  <li>• Only share your number with trusted users</li>
                  <li>• Your number will be visible in the chat</li>
                  <li>• You can report inappropriate behavior</li>
                  <li>• Numbers are only shared with ride participants</li>
                </ul>
                <label className="flex items-center mt-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acknowledged}
                    onChange={(e) => setAcknowledged(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-amber-700">
                    I understand the privacy implications
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 rounded-lg border-2"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleShare}
              disabled={!acknowledged || loading}
              className="flex-1 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  {sharePhone ? "Share Number" : "Send Message"}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Phone number display component for messages
export const PhoneNumberDisplay: React.FC<{
  phoneNumber: string;
  isShared: boolean;
  userName: string;
}> = ({ phoneNumber, isShared, userName }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(phoneNumber);
      setCopied(true);
      toast.success("Phone number copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy number");
    }
  };

  if (!isShared) return null;

  return (
    <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Phone className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium text-green-800">
            {userName}'s Phone
          </span>
        </div>
        <Button
          onClick={handleCopy}
          variant="ghost"
          className="text-green-600 hover:text-green-700 p-1 h-auto"
        >
          {copied ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
      <div className="mt-1">
        <a
          href={`tel:${phoneNumber}`}
          className="text-green-700 font-mono font-medium hover:underline"
        >
          {phoneNumber}
        </a>
      </div>
    </div>
  );
};
