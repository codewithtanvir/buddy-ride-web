import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle, ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import { OTPVerification } from "../components/OTPVerification";
import { useAuthStore } from "../stores/authStore";
import toast from "react-hot-toast";

const EmailVerificationPage: React.FC = () => {
  const [verified, setVerified] = useState(false);
  const navigate = useNavigate();

  const { pendingVerification, verifyEmailOTP, resendEmailOTP, user } =
    useAuthStore();

  // If user is already verified or no pending verification, redirect
  React.useEffect(() => {
    if (user && user.profile && user.profile.name && user.profile.department) {
      // Profile is complete, redirect to homepage
      navigate("/");
    } else if (user && (!user.profile || !user.profile.name || !user.profile.department)) {
      // User exists but profile is incomplete, redirect to profile setup
      navigate("/profile-setup");
    } else if (!pendingVerification) {
      navigate("/auth");
    }
  }, [user, pendingVerification]);

  const handleVerifyOTP = async (otp: string) => {
    if (!pendingVerification) {
      throw new Error("No pending verification");
    }

    await verifyEmailOTP(pendingVerification, otp);
    setVerified(true);

    // Small delay then redirect to profile setup
    setTimeout(() => {
      navigate("/profile-setup");
    }, 2000);
  };

  const handleResendOTP = async () => {
    if (!pendingVerification) {
      throw new Error("No pending verification");
    }

    await resendEmailOTP(pendingVerification);
  };

  const handleBack = () => {
    navigate("/auth");
  };

  // Don't render if no pending verification
  if (!pendingVerification) {
    return null;
  }

  // Success state
  if (verified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4 py-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <div className="p-4 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl shadow-lg">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              Email Verified!
            </h1>
            <p className="text-gray-600 text-lg">
              Your account has been successfully verified
            </p>
          </div>

          <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
            <CardContent className="pt-6 px-6 lg:px-8">
              <div className="text-center space-y-4">
                <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-green-900 mb-2">
                    Welcome to AIUB Go!
                  </h3>
                  <p className="text-sm text-green-800 leading-relaxed">
                    Your email has been verified. Let's set up your profile to
                    start finding ride buddies!
                  </p>
                </div>

                <div className="text-sm text-gray-600">
                  Redirecting to profile setup...
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <OTPVerification
      email={pendingVerification}
      type="signup"
      onVerify={handleVerifyOTP}
      onResend={handleResendOTP}
      onBack={handleBack}
      title="Verify Your Email"
      description="Welcome to AIUB Go! Please verify your email to continue."
    />
  );
};

export default EmailVerificationPage;
