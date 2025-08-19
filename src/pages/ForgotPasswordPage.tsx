import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Car, Mail, ArrowLeft, Send } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import { useAuthStore } from "../stores/authStore";
import toast from "react-hot-toast";

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [formErrors, setFormErrors] = useState<{ email?: string }>({});
  const { resetPassword } = useAuthStore();

  const validateForm = () => {
    const errors: { email?: string } = {};

    if (!email) {
      errors.email = "Email is required";
    } else if (!email.endsWith("@student.aiub.edu")) {
      errors.email = "Please use your AIUB student email (@student.aiub.edu)";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email);
      setEmailSent(true);
      toast.success("Password reset email sent! Please check your inbox.", {
        duration: 6000,
      });
    } catch (error: any) {
      console.error("Password reset error:", error);

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
            <p className="text-gray-600 text-lg">Password reset link sent</p>
          </div>

          {/* Success Card */}
          <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
            <CardContent className="pt-6 px-6 lg:px-8">
              <div className="text-center space-y-4">
                <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                  <Mail className="h-12 w-12 text-green-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-green-900 mb-2">
                    Email Sent Successfully!
                  </h3>
                  <p className="text-sm text-green-800 leading-relaxed">
                    We've sent a password reset link to:
                  </p>
                  <div className="mt-2 font-mono bg-green-100 px-3 py-2 rounded text-sm font-medium text-green-900">
                    {email}
                  </div>
                </div>

                <div className="text-sm text-gray-600 space-y-2">
                  <p>Please check your email and click the reset link.</p>
                  <p className="text-xs text-gray-500">
                    Don't see the email? Check your spam folder or try again.
                  </p>
                </div>

                <div className="pt-4 space-y-3">
                  <Button
                    onClick={() => {
                      setEmailSent(false);
                      setEmail("");
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    Send Another Email
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
            Enter your email to receive a reset link
          </p>
        </div>

        {/* Reset Password Card */}
        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-center text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Forgot Password?
            </CardTitle>
            <p className="text-center text-gray-600 mt-2">
              No worries! We'll send you reset instructions.
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
                    if (formErrors.email) {
                      setFormErrors((prev) => ({ ...prev, email: undefined }));
                    }
                  }}
                  label="AIUB Student Email"
                  error={formErrors.email}
                  required
                  className="h-12 text-base bg-gray-50 border-gray-300 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                />
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
                    <Send className="h-5 w-5 mr-2" />
                    Send Reset Link
                  </>
                )}
              </Button>
            </form>

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
                    Password Reset Instructions
                  </h3>
                  <div className="text-sm text-orange-800 space-y-2">
                    <p>1. Enter your AIUB student email address</p>
                    <p>2. Check your email for the reset link</p>
                    <p>3. Click the link to create a new password</p>
                    <p>4. Sign in with your new password</p>
                  </div>
                  <div className="text-xs text-orange-700 bg-orange-100/70 p-3 rounded-lg border-l-4 border-orange-300">
                    <strong>Note:</strong> The reset link will expire in 1 hour
                    for security.
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
