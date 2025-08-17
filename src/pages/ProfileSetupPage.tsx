import React, { useState } from "react";
import { User, Building, Users, Save } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import { useAuthStore } from "../stores/authStore";
import { validateProfileData } from "../utils/validation";
import toast from "react-hot-toast";

const departments = [
  "Computer Science and Engineering",
  "Electrical and Electronic Engineering",
  "Business Administration",
  "English",
  "Pharmacy",
  "Architecture",
  "Civil Engineering",
  "Textile Engineering",
];

const ProfileSetupPage: React.FC = () => {
  const { updateProfile, user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.profile?.name || "",
    student_id: user?.profile?.student_id || "",
    department: user?.profile?.department || "",
    gender: (user?.profile?.gender as "male" | "female") || "male",
  });
  const [showDepartments, setShowDepartments] = useState(false);

  // Check if user has a temporary student ID
  const hasTemporaryStudentId =
    user?.profile?.student_id?.startsWith("99-") || false;

  // Check if student ID was auto-detected from email
  const hasAutoDetectedStudentId =
    user?.email?.includes("@student.aiub.edu") &&
    !hasTemporaryStudentId &&
    user?.profile?.student_id &&
    user?.profile?.student_id !== "00-00000-0";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validateProfileData(formData);
    if (errors.length > 0) {
      errors.forEach((error) => toast.error(error));
      return;
    }

    setLoading(true);
    try {
      await updateProfile(formData);
      toast.success("Profile setup completed!");
    } catch (error: any) {
      toast.error(error.message || "Failed to setup profile");
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
              <User className="h-6 w-6 lg:h-8 lg:w-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Setup Your Profile
          </h1>
          <p className="text-gray-600 mt-2 text-sm lg:text-base">
            Complete your profile to start using Buddy Ride
          </p>
        </div>

        <Card className="shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-center text-lg lg:text-xl">
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {hasTemporaryStudentId && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Notice:</strong> You have a temporary student ID.
                  Please update it with your actual AIUB student ID in the
                  format XX-XXXXX-X.
                </p>
              </div>
            )}
            {hasAutoDetectedStudentId && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>Great!</strong> Your student ID was automatically
                  detected from your email address. You can update it if needed.
                </p>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="text"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                label="Full Name"
                required
                className="text-sm lg:text-base"
              />

              <Input
                type="text"
                placeholder="XX-XXXXX-X"
                value={formData.student_id}
                onChange={(e) =>
                  setFormData({ ...formData, student_id: e.target.value })
                }
                label="Student ID"
                required
                className="text-sm lg:text-base"
              />

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Department
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowDepartments(!showDepartments)}
                    className="flex h-11 lg:h-12 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm lg:text-base ring-offset-background placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <div className="flex items-center">
                      <Building className="h-4 w-4 text-gray-400 mr-2" />
                      <span
                        className={
                          formData.department
                            ? "text-gray-900"
                            : "text-gray-500"
                        }
                      >
                        {formData.department || "Select your department"}
                      </span>
                    </div>
                  </button>

                  {showDepartments && (
                    <div className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg max-h-60 overflow-y-auto">
                      {departments.map((dept) => (
                        <button
                          key={dept}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, department: dept });
                            setShowDepartments(false);
                          }}
                          className="flex w-full items-center px-3 py-3 text-sm lg:text-base text-gray-700 hover:bg-gray-50 first:rounded-t-md last:rounded-b-md text-left"
                        >
                          {dept}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Gender
                </label>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, gender: "male" })}
                    className={`flex-1 py-3 px-4 rounded-lg border font-medium text-sm lg:text-base ${
                      formData.gender === "male"
                        ? "bg-primary-600 border-primary-600 text-white"
                        : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Users className="h-4 w-4 mr-2 inline" />
                    Male
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, gender: "female" })
                    }
                    className={`flex-1 py-3 px-4 rounded-lg border font-medium text-sm lg:text-base ${
                      formData.gender === "female"
                        ? "bg-primary-600 border-primary-600 text-white"
                        : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Users className="h-4 w-4 mr-2 inline" />
                    Female
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 lg:h-12 text-sm lg:text-base"
                loading={loading}
              >
                <Save className="h-4 w-4 mr-2" />
                Complete Setup
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Backdrop to close dropdown */}
        {showDepartments && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDepartments(false)}
          />
        )}
      </div>
    </div>
  );
};

export default ProfileSetupPage;
