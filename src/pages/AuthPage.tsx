import React, { useState } from "react";
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
  const { signIn, signUp } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    if (!email.endsWith("@student.aiub.edu")) {
      toast.error("Please use your AIUB student email (@student.aiub.edu)");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password);
        toast.success(
          "Account created successfully! Please check your email for verification."
        );
      } else {
        await signIn(email, password);
        toast.success("Signed in successfully!");
      }
    } catch (error: any) {
      toast.error(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-blue-100 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 lg:mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-primary-600 rounded-lg">
              <Car className="h-6 w-6 lg:h-8 lg:w-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Buddy Ride
          </h1>
          <p className="text-gray-600 mt-2 text-sm lg:text-base">
            AIUB Student Ride Sharing
          </p>
        </div>

        <Card className="shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-center text-lg lg:text-xl">
              {isSignUp ? "Create Account" : "Sign In"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="email"
                placeholder="23-51455-1@student.aiub.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                label="AIUB Student Email"
                required
                className="text-sm lg:text-base"
              />

              <Input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                label="Password"
                required
                className="text-sm lg:text-base"
              />

              <Button
                type="submit"
                className="w-full h-11 lg:h-12 text-sm lg:text-base"
                loading={loading}
              >
                {isSignUp ? (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Create Account
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                {isSignUp
                  ? "Already have an account? Sign in"
                  : "Don't have an account? Sign up"}
              </button>
            </div>

            <div className="mt-6 p-3 lg:p-4 bg-blue-50 rounded-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Mail className="h-4 w-4 lg:h-5 lg:w-5 text-blue-400 mt-0.5" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    For AIUB Students Only
                  </h3>
                  <div className="mt-2 text-xs lg:text-sm text-blue-700">
                    <p className="mb-2">
                      Use your official AIUB student email address ending with
                      @student.aiub.edu
                    </p>
                    <p className="text-xs">
                      Example: 23-51455-1@student.aiub.edu
                      <br />
                      Your student ID will be automatically detected from your
                      email.
                    </p>
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

export default AuthPage;
