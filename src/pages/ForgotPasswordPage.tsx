import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Car, Mail, ArrowLeft, Send, AlertCircle, Key } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import { useAuthStore } from "../stores/authStore";
import { validateEmail } from "../utils/validation";
import toast from "react-hot-toast";

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const { resetPasswordWithOTP } = useAuthStore(); // Use OTP method
  const navigate = useNavigate();

  const validateForm = () => {
    const emailErrors = validateEmail(email);
    setErrors(emailErrors);
    return emailErrors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await resetPasswordWithOTP(email);
      setEmailSent(true);
      toast.success(
        "Recovery code sent to your email! Please check your inbox.",
        {
          duration: 6000,
        }
      );
    } catch (error: any) {
      console.error("Password reset error:", error);

      // Enhanced error handling
      if (error.message?.includes("User not found")) {
        toast.error("No account found with this email address.");
      } else if (error.message?.includes("Email not confirmed")) {
        toast.error(
          "Please verify your account first before resetting password."
        );
      } else if (error.message?.includes("rate limit")) {
        toast.error(
          "Too many reset attempts. Please wait before trying again."
        );
      } else {
        toast.error(
          error.message || "Failed to send reset email. Please try again."
        );
      }

      let errorMessage = "Failed to send reset email";
      if (error.message?.includes("User not found")) {
        errorMessage = "No account found with this email address";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage, { duration: 5000 });
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4 py-8">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <div className="p-4 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl shadow-lg">
                  <Mail className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              Check Your Email
            </h1>
            <p className="text-gray-600 text-lg">Recovery code sent</p>
          </div>

          {/* Success Card */}
          <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
            <CardContent className="pt-6 px-6 lg:px-8">
              <div className="text-center space-y-4">
                <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                  <Key className="h-12 w-12 text-green-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-green-900 mb-2">
                    6-Digit Recovery Code Sent!
                  </h3>
                  <p className="text-sm text-green-800 leading-relaxed">
                    We've sent a recovery code to:
                  </p>
                  <div className="mt-2 font-mono bg-green-100 px-3 py-2 rounded text-sm font-medium text-green-900">
                    {email}
                  </div>
                </div>

                <div className="text-sm text-gray-600 space-y-2">
                  <p>Please check your email for the 6-digit recovery code.</p>
                  <p className="text-xs text-gray-500">
                    Don't see the email? Check your spam folder.
                  </p>
                </div>

                <div className="pt-4 space-y-3">
                  <Button
                    onClick={() => navigate("/otp-password-reset")}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    <Key className="h-4 w-4 mr-2" />
                    Enter Recovery Code
                  </Button>

                  <Button
                    onClick={() => {
                      setEmailSent(false);
                      setEmail("");
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    Send Another Code
                  </Button>

                  <Link to="/auth">
                    <Button variant="outline" className="w-full">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Sign In
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4 py-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg transform rotate-3">
                <Car className="h-8 w-8 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full animate-pulse"></div>
            </div>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            Reset Password
          </h1>
          <p className="text-gray-600 text-lg">
            Enter your email to receive a recovery code
          </p>
        </div>

        {/* Reset Password Card */}
        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-center text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Forgot Password?
            </CardTitle>
            <p className="text-center text-gray-600 mt-2">
              No worries! We'll send you a 6-digit recovery code.
            </p>
          </CardHeader>

          <CardContent className="pt-0 px-6 lg:px-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="23-51455-1@student.aiub.edu"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.length > 0) {
                      setErrors([]);
                    }
                  }}
                  label="AIUB Student Email"
                  className={`h-12 text-base bg-gray-50 border-gray-300 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 ${
                    errors.length > 0
                      ? "border-red-300 focus:border-red-500"
                      : ""
                  }`}
                  required
                />
                {errors.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {errors.map((error, index) => (
                      <p
                        key={index}
                        className="text-sm text-red-600 flex items-center gap-1"
                      >
                        <AlertCircle className="h-3 w-3" />
                        {error}
                      </p>
                    ))}
                  </div>
                )}
                <p className="text-sm text-gray-500">
                  Use your official AIUB student email address
                </p>
              </div>

              <Button
                type="submit"
                size="lg"
                loading={loading}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              >
                {loading ? (
                  "Sending..."
                ) : (
                  <>
                    <Key className="h-5 w-5 mr-2" />
                    Send Recovery Code
                  </>
                )}
              </Button>
            </form>

            {/* OTP Method Promotion */}
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <div className="p-2 bg-blue-100 rounded-lg shadow-sm">
                    <Key className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="font-semibold text-blue-900 text-sm">
                    🔢 Secure OTP Recovery
                  </h3>
                  <p className="text-sm text-blue-800 leading-relaxed">
                    We use secure 6-digit codes instead of links for better
                    security. The code expires in 1 hour and can only be used
                    once.
                  </p>
                  <div className="text-center pt-2">
                    <Link to="/otp-password-reset">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-blue-200 text-blue-700 hover:bg-blue-50"
                      >
                        <Key className="h-4 w-4 mr-2" />
                        Use OTP Reset Instead
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Back to Sign In */}
            <div className="mt-8 text-center">
              <Link
                to="/auth"
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-200 rounded-md px-2 py-1 inline-flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Sign In
              </Link>
            </div>

            {/* Info Card */}
            <div className="mt-8 p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-100">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <div className="p-2 bg-orange-100 rounded-lg shadow-sm">
                    <Mail className="h-4 w-4 text-orange-600" />
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="font-semibold text-orange-900 text-sm">
                    Recovery Code Instructions
                  </h3>
                  <div className="text-sm text-orange-800 space-y-2">
                    <p>1. Enter your AIUB student email address</p>
                    <p>2. Check your email for the 6-digit recovery code</p>
                    <p>3. Enter the code to verify your identity</p>
                    <p>4. Create a new secure password</p>
                  </div>
                  <div className="text-xs text-orange-700 bg-orange-100/70 p-3 rounded-lg border-l-4 border-orange-300">
                    <strong>Note:</strong> The recovery code will expire in 1
                    hour for security.
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

export default ForgotPasswordPage;
