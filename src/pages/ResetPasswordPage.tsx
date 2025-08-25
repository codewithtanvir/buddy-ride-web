import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Car, Lock, ArrowLeft, Eye, EyeOff, CheckCircle } from "lucide-react";
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

const ResetPasswordPage: React.FC = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordReset, setPasswordReset] = useState(false);
  const [formErrors, setFormErrors] = useState<{
    password?: string;
    confirmPassword?: string;
  }>({});

  const { updatePassword } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Check if we have the required tokens/session
  useEffect(() => {
    const accessToken = searchParams.get("access_token");
    const refreshToken = searchParams.get("refresh_token");

    if (!accessToken || !refreshToken) {
      toast.error("Invalid or expired reset link");
      navigate("/forgot-password");
    }
  }, [searchParams]);

  const validateForm = () => {
    const errors: { password?: string; confirmPassword?: string } = {};

    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    } else if (password.length < 8) {
      // Warning but not error
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await updatePassword(password);
      setPasswordReset(true);
      toast.success("Password updated successfully!");
    } catch (error: any) {
      console.error("Password update error:", error);

      let errorMessage = "Failed to update password";
      if (error.message?.includes("session")) {
        errorMessage = "Reset link expired. Please request a new one.";
        setTimeout(() => navigate("/forgot-password"), 3000);
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage, { duration: 5000 });
    } finally {
      setLoading(false);
    }
  };

  if (passwordReset) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4 py-8">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <div className="p-4 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl shadow-lg">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              Password Updated!
            </h1>
            <p className="text-gray-600 text-lg">
              Your password has been successfully changed
            </p>
          </div>

          {/* Success Card */}
          <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
            <CardContent className="pt-6 px-6 lg:px-8">
              <div className="text-center space-y-4">
                <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-green-900 mb-2">
                    Password Reset Complete!
                  </h3>
                  <p className="text-sm text-green-800 leading-relaxed">
                    Your password has been updated successfully. You can now
                    sign in with your new password.
                  </p>
                </div>

                <div className="pt-4">
                  <Button
                    onClick={() => navigate("/auth")}
                    className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                  >
                    Sign In Now
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const passwordStrength = getPasswordStrength(password);

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
            Create New Password
          </h1>
          <p className="text-gray-600 text-lg">
            Choose a strong password for your account
          </p>
        </div>

        {/* Reset Password Card */}
        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-center text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Set New Password
            </CardTitle>
            <p className="text-center text-gray-600 mt-2">
              Your new password must be different from previous passwords.
            </p>
          </CardHeader>

          <CardContent className="pt-0 px-6 lg:px-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
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
                    className="h-12 text-base bg-gray-50 border-gray-300 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-10 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>

                {password && (
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

                <p className="text-sm text-gray-500">
                  At least 6 characters (8+ recommended)
                </p>
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
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
                    className="h-12 text-base bg-gray-50 border-gray-300 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-10 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

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

            {/* Password Requirements */}
            <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
              <div className="space-y-3">
                <h3 className="font-semibold text-blue-900 text-sm">
                  Password Requirements
                </h3>
                <div className="text-sm text-blue-800 space-y-1">
                  <div
                    className={`flex items-center gap-2 ${
                      password.length >= 6 ? "text-green-700" : ""
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        password.length >= 6 ? "bg-green-500" : "bg-gray-300"
                      }`}
                    ></div>
                    At least 6 characters
                  </div>
                  <div
                    className={`flex items-center gap-2 ${
                      password.length >= 8 ? "text-green-700" : ""
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        password.length >= 8 ? "bg-green-500" : "bg-gray-300"
                      }`}
                    ></div>
                    8+ characters (recommended)
                  </div>
                  <div
                    className={`flex items-center gap-2 ${
                      /[A-Z]/.test(password) ? "text-green-700" : ""
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        /[A-Z]/.test(password) ? "bg-green-500" : "bg-gray-300"
                      }`}
                    ></div>
                    At least one uppercase letter
                  </div>
                  <div
                    className={`flex items-center gap-2 ${
                      /[0-9]/.test(password) ? "text-green-700" : ""
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        /[0-9]/.test(password) ? "bg-green-500" : "bg-gray-300"
                      }`}
                    ></div>
                    At least one number
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

export default ResetPasswordPage;
