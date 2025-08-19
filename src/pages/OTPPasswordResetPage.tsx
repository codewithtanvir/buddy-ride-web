import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Car, Mail, ArrowLeft, Lock } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import { OTPVerification } from "../components/OTPVerification";
import { useAuthStore } from "../stores/authStore";
import { validateEmail } from "../utils/validation";
import toast from "react-hot-toast";

type Step = "email" | "otp" | "password" | "success";

const OTPPasswordResetPage: React.FC = () => {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const { resetPasswordWithOTP, verifyOTPAndResetPassword } = useAuthStore();

  const validatePasswordForm = () => {
    const errors: { password?: string; confirmPassword?: string } = {};

    if (!newPassword) {
      errors.password = "Password is required";
    } else if (newPassword.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate email
    const emailErrors = validateEmail(email);
    if (emailErrors.length > 0) {
      setFormErrors({ email: emailErrors[0] });
      return;
    }

    setLoading(true);
    try {
      await resetPasswordWithOTP(email);
      toast.success("Recovery code sent to your email!");
      setStep("otp");
    } catch (error: any) {
      console.error("Password reset error:", error);

      let errorMessage = "Failed to send recovery code";
      if (error.message?.includes("not found")) {
        errorMessage = "No account found with this email address";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerify = async (otp: string) => {
    setOtpCode(otp);
    setStep("password");
  };

  const handleOTPResend = async () => {
    await resetPasswordWithOTP(email);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePasswordForm()) {
      return;
    }

    setLoading(true);
    try {
      await verifyOTPAndResetPassword(email, otpCode, newPassword);
      toast.success("Password updated successfully!");
      setStep("success");
    } catch (error: any) {
      console.error("Password update error:", error);

      let errorMessage = "Failed to update password";
      if (error.message?.includes("expired")) {
        errorMessage = "Recovery code has expired. Please try again.";
        setStep("email");
      } else if (error.message?.includes("invalid")) {
        errorMessage = "Invalid recovery code. Please try again.";
        setStep("otp");
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const getPasswordStrengthText = (strength: number) => {
    switch (strength) {
      case 0:
      case 1:
        return "Weak";
      case 2:
      case 3:
        return "Medium";
      case 4:
      case 5:
        return "Strong";
      default:
        return "Weak";
    }
  };

  const getPasswordStrengthColor = (strength: number) => {
    switch (strength) {
      case 0:
      case 1:
        return "text-red-600 bg-red-100";
      case 2:
      case 3:
        return "text-orange-600 bg-orange-100";
      case 4:
      case 5:
        return "text-green-600 bg-green-100";
      default:
        return "text-red-600 bg-red-100";
    }
  };

  // OTP Verification Step
  if (step === "otp") {
    return (
      <OTPVerification
        email={email}
        type="recovery"
        onVerify={handleOTPVerify}
        onResend={handleOTPResend}
        onBack={() => setStep("email")}
        title="Reset Password"
        description="Enter the 6-digit recovery code sent to your email."
      />
    );
  }

  // Success Step
  if (step === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4 py-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <div className="p-4 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl shadow-lg">
                  <Lock className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              Password Reset Complete!
            </h1>
            <p className="text-gray-600 text-lg">
              Your password has been successfully updated
            </p>
          </div>

          <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
            <CardContent className="pt-6 px-6 lg:px-8">
              <div className="text-center space-y-4">
                <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                  <Lock className="h-12 w-12 text-green-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-green-900 mb-2">
                    Password Updated Successfully!
                  </h3>
                  <p className="text-sm text-green-800 leading-relaxed">
                    You can now sign in to AIUB Go with your new password.
                  </p>
                </div>

                <div className="pt-4">
                  <Link to="/auth">
                    <Button className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200">
                      Sign In Now
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

  const passwordStrength = getPasswordStrength(newPassword);

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
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
            </div>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            {step === "email" ? "Reset Password" : "Create New Password"}
          </h1>
          <p className="text-gray-600 text-lg">
            {step === "email"
              ? "Enter your email to receive a recovery code"
              : "Choose a strong password for your account"}
          </p>
        </div>

        {/* Form Card */}
        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-center text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {step === "email" ? "Reset Password" : "New Password"}
            </CardTitle>
            <p className="text-center text-gray-600 mt-2">
              {step === "email"
                ? "We'll send a 6-digit recovery code to your email"
                : "Enter your new password details"}
            </p>
          </CardHeader>

          <CardContent className="pt-0 px-6 lg:px-8">
            {step === "email" ? (
              <form onSubmit={handleEmailSubmit} className="space-y-6">
                <Input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (formErrors.email) {
                      setFormErrors((prev) => ({ ...prev, email: undefined }));
                    }
                  }}
                  label="Email Address"
                  error={formErrors.email}
                  required
                  className="h-12 text-base bg-gray-50 border-gray-300 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                />

                <Button
                  type="submit"
                  size="lg"
                  loading={loading}
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  {loading ? (
                    "Sending Code..."
                  ) : (
                    <>
                      <Mail className="h-5 w-5 mr-2" />
                      Send Recovery Code
                    </>
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Input
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (formErrors.password) {
                        setFormErrors((prev) => ({
                          ...prev,
                          password: undefined,
                        }));
                      }
                    }}
                    label="New Password"
                    error={formErrors.password}
                    required
                    className="h-12 text-base bg-gray-50 border-gray-300 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                  />

                  {newPassword && (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm text-gray-600">Strength:</span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${getPasswordStrengthColor(
                          passwordStrength
                        )}`}
                      >
                        {getPasswordStrengthText(passwordStrength)}
                      </span>
                    </div>
                  )}
                </div>

                <Input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (formErrors.confirmPassword) {
                      setFormErrors((prev) => ({
                        ...prev,
                        confirmPassword: undefined,
                      }));
                    }
                  }}
                  label="Confirm New Password"
                  error={formErrors.confirmPassword}
                  required
                  className="h-12 text-base bg-gray-50 border-gray-300 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                />

                <Button
                  type="submit"
                  size="lg"
                  loading={loading}
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  {loading ? (
                    "Updating Password..."
                  ) : (
                    <>
                      <Lock className="h-5 w-5 mr-2" />
                      Update Password
                    </>
                  )}
                </Button>
              </form>
            )}

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

            {/* Password Requirements (only for password step) */}
            {step === "password" && (
              <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                <div className="space-y-3">
                  <h3 className="font-semibold text-blue-900 text-sm">
                    Password Requirements
                  </h3>
                  <div className="text-sm text-blue-800 space-y-1">
                    <div
                      className={`flex items-center gap-2 ${
                        newPassword.length >= 8 ? "text-green-700" : ""
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${
                          newPassword.length >= 8
                            ? "bg-green-500"
                            : "bg-gray-300"
                        }`}
                      ></div>
                      At least 8 characters
                    </div>
                    <div
                      className={`flex items-center gap-2 ${
                        /[A-Z]/.test(newPassword) ? "text-green-700" : ""
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${
                          /[A-Z]/.test(newPassword)
                            ? "bg-green-500"
                            : "bg-gray-300"
                        }`}
                      ></div>
                      At least one uppercase letter
                    </div>
                    <div
                      className={`flex items-center gap-2 ${
                        /[0-9]/.test(newPassword) ? "text-green-700" : ""
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${
                          /[0-9]/.test(newPassword)
                            ? "bg-green-500"
                            : "bg-gray-300"
                        }`}
                      ></div>
                      At least one number
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OTPPasswordResetPage;
