import React, { useState, useRef, useEffect } from "react";
import { Mail, ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "./ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import toast from "react-hot-toast";

interface OTPVerificationProps {
  email: string;
  type: "signup" | "recovery";
  onVerify: (otp: string) => Promise<void>;
  onResend: () => Promise<void>;
  onBack: () => void;
  title?: string;
  description?: string;
}

export const OTPVerification: React.FC<OTPVerificationProps> = ({
  email,
  type,
  onVerify,
  onResend,
  onBack,
  title,
  description,
}) => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    // Countdown timer for resend
    if (resendCooldown > 0) {
      const timer = setTimeout(
        () => setResendCooldown(resendCooldown - 1),
        1000
      );
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const pastedCode = value.slice(0, 6);
      const newOtp = [...otp];
      for (let i = 0; i < pastedCode.length && i < 6; i++) {
        newOtp[i] = pastedCode[i];
      }
      setOtp(newOtp);

      // Focus last filled input or next empty one
      const nextIndex = Math.min(pastedCode.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    // Handle single character input
    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      // Focus previous input on backspace
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      toast.error("Please enter a complete 6-digit code");
      return;
    }

    setLoading(true);
    try {
      await onVerify(otpCode);
    } catch (error: any) {
      console.error("OTP verification error:", error);

      let errorMessage = "Invalid verification code";
      if (error.message?.includes("expired")) {
        errorMessage =
          "Verification code has expired. Please request a new one.";
      } else if (error.message?.includes("invalid")) {
        errorMessage = "Invalid verification code. Please check and try again.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);

      // Clear OTP and focus first input
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;

    setResendLoading(true);
    try {
      await onResend();
      toast.success("Verification code sent!");
      setResendCooldown(60); // 60 seconds cooldown

      // Clear current OTP
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (error: any) {
      console.error("Resend error:", error);
      toast.error(error.message || "Failed to resend code");
    } finally {
      setResendLoading(false);
    }
  };

  const defaultTitles = {
    signup: "Verify Your Email",
    recovery: "Reset Password",
  };

  const defaultDescriptions = {
    signup: "We've sent a 6-digit verification code to your email address.",
    recovery: "We've sent a 6-digit recovery code to your email address.",
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4 py-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg">
                <Mail className="h-8 w-8 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
            </div>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            {title || defaultTitles[type]}
          </h1>
          <p className="text-gray-600 text-lg">
            {description || defaultDescriptions[type]}
          </p>
        </div>

        {/* OTP Card */}
        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-center text-xl font-semibold text-gray-900">
              Enter Verification Code
            </CardTitle>
            <p className="text-center text-gray-600 text-sm">
              Code sent to{" "}
              <span className="font-medium text-blue-600">{email}</span>
            </p>
          </CardHeader>

          <CardContent className="pt-0 px-6 lg:px-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* OTP Input */}
              <div className="flex justify-center gap-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={6} // Allow paste
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-12 text-center text-xl font-semibold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200"
                    disabled={loading}
                  />
                ))}
              </div>

              <Button
                type="submit"
                size="lg"
                loading={loading}
                disabled={otp.join("").length !== 6}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              >
                {loading ? "Verifying..." : "Verify Code"}
              </Button>
            </form>

            {/* Resend Code */}
            <div className="mt-6 text-center">
              <p className="text-gray-600 text-sm mb-2">
                Didn't receive the code?
              </p>
              <Button
                onClick={handleResend}
                variant="outline"
                size="sm"
                loading={resendLoading}
                disabled={resendCooldown > 0}
                className="text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {resendCooldown > 0
                  ? `Resend in ${resendCooldown}s`
                  : resendLoading
                  ? "Sending..."
                  : "Resend Code"}
              </Button>
            </div>

            {/* Back Button */}
            <div className="mt-8 text-center">
              <button
                onClick={onBack}
                className="text-gray-500 hover:text-gray-700 font-medium transition-colors duration-200 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-200 rounded-md px-2 py-1 inline-flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </button>
            </div>

            {/* Code Info */}
            <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
              <div className="space-y-2">
                <h3 className="font-semibold text-blue-900 text-sm">
                  Verification Tips
                </h3>
                <div className="text-sm text-blue-800 space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    Check your spam/junk folder
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    Code expires in 10 minutes
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    Enter digits only (0-9)
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
