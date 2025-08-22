import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Car, Mail, Lock, UserPlus, LogIn } from "lucide-react";
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

const AuthPage: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const { signIn, signUp, pendingVerification } = useAuthStore();
  const navigate = useNavigate();

  // Redirect to email verification if there's a pending verification
  useEffect(() => {
    if (pendingVerification) {
      navigate("/verify-email");
    }
  }, [pendingVerification, navigate]);

  const validateForm = () => {
    const errors: { email?: string; password?: string } = {};

    if (!email) {
      errors.email = "Email is required";
    } else if (!email.endsWith("@student.aiub.edu")) {
      errors.email = "Please use your AIUB student email (@student.aiub.edu)";
    }

    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    } else if (!/[A-Z]/.test(password)) {
      errors.password = "Password must contain at least one uppercase letter";
    } else if (!/[a-z]/.test(password)) {
      errors.password = "Password must contain at least one lowercase letter";
    } else if (!/\d/.test(password)) {
      errors.password = "Password must contain at least one number";
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
      if (isSignUp) {
        await signUp(email, password);
        toast.success(
          "Account created successfully! Please check your email for verification.",
          { duration: 6000 }
        );
      } else {
        await signIn(email, password);
        toast.success("Welcome back to Buddy Ride!");
      }
    } catch (error: any) {
      console.error("Auth error:", error);

      // Handle specific error messages
      let errorMessage = "Authentication failed";
      if (error.message?.includes("Invalid login credentials")) {
        errorMessage = "Invalid email or password";
      } else if (error.message?.includes("Email not confirmed")) {
        errorMessage = "Please check your email and verify your account";
      } else if (error.message?.includes("User already registered")) {
        errorMessage = "An account with this email already exists";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage, { duration: 5000 });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMode = () => {
    setIsSignUp(!isSignUp);
    setFormErrors({});
    setEmail("");
    setPassword("");
  };

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
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            Buddy Ride
          </h1>
          <p className="text-gray-600 text-lg">
            AIUB Student Ride Sharing Platform
          </p>
        </div>

        {/* Auth Card */}
        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-center text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {isSignUp ? "Join Buddy Ride" : "Welcome Back"}
            </CardTitle>
            <p className="text-center text-gray-600 mt-2">
              {isSignUp
                ? "Create your account to start ride sharing"
                : "Sign in to find your next ride buddy"}
            </p>
          </CardHeader>

          <CardContent className="pt-0 px-6 lg:px-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="your-student-id@student.aiub.edu"
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

              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Create a strong password"
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
                  label="Password"
                  error={formErrors.password}
                  required
                  className="h-12 text-base bg-gray-50 border-gray-300 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                />
                {isSignUp && (
                  <p className="text-sm text-gray-500">
                    Minimum 8 characters, with uppercase, lowercase, and a
                    number.
                  </p>
                )}
              </div>

              {/* Forgot Password Link */}
              {!isSignUp && (
                <div className="text-right">
                  <Link
                    to="/forgot-password"
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-200 rounded-md px-2 py-1"
                  >
                    Forgot your password?
                  </Link>
                </div>
              )}

              <Button
                type="submit"
                size="lg"
                loading={loading}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              >
                {loading ? (
                  "Processing..."
                ) : isSignUp ? (
                  <>
                    <UserPlus className="h-5 w-5 mr-2" />
                    Create Account
                  </>
                ) : (
                  <>
                    <LogIn className="h-5 w-5 mr-2" />
                    Sign In
                  </>
                )}
              </Button>
            </form>

            {/* Toggle Mode */}
            <div className="mt-8 text-center">
              <button
                onClick={handleToggleMode}
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-200 rounded-md px-2 py-1"
              >
                {isSignUp
                  ? "Already have an account? Sign in"
                  : "Don't have an account? Sign up"}
              </button>
            </div>

            {/* Info Card */}
            <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <div className="p-2 bg-blue-100 rounded-lg shadow-sm">
                    <Mail className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="font-semibold text-blue-900 text-sm">
                    For AIUB Students Only
                  </h3>
                  <p className="text-sm text-blue-800 leading-relaxed">
                    Use your official AIUB student email address ending with{" "}
                    <span className="font-mono bg-blue-200 px-2 py-1 rounded text-xs font-medium">
                      @student.aiub.edu
                    </span>
                  </p>
                  <div className="text-xs text-blue-700 bg-blue-100/70 p-3 rounded-lg border-l-4 border-blue-300 backdrop-blur-sm">
                    <div className="font-semibold mb-1">📧 Example:</div>
                    <div className="font-mono">23-51455-1@student.aiub.edu</div>
                    <div className="mt-2 text-blue-600">
                      ✨ Your student ID will be automatically extracted from
                      your email address.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-500">
          <p>Secure • Reliable • AIUB Community</p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
