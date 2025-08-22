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
  "Architecture",
  "English",
  "Pharmacy",
  "Industrial and Production Engineering",
  "Law", 
  "Economics",
  "Journalism and Media Studies",
];

const ProfileSetupPage: React.FC = () => {
  const { updateProfile, user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.profile?.name || "",
    student_id: user?.profile?.student_id || "",
    department: user?.profile?.department || "",
    gender: (user?.profile?.gender as "male" | "female") || "male",
    phone_number: user?.profile?.phone_number || "",
  });

  // Check if this is a profile edit (user already has profile data)
  const isEditing = !!(user?.profile?.name && user?.profile?.student_id && user?.profile?.department);

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

    // Additional client-side validation
    if (!formData.department.trim()) {
      toast.error("Please select a department");
      return;
    }

    const errors = validateProfileData(formData);
    if (errors.length > 0) {
      errors.forEach((error) => toast.error(error));
      return;
    }

    setLoading(true);
    try {
      await updateProfile(formData);
      toast.success(isEditing ? "Profile updated successfully!" : "Profile setup completed!");
    } catch (error: any) {
      toast.error(error.message || (isEditing ? "Failed to update profile" : "Failed to setup profile"));
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
            {isEditing ? "Edit Your Profile" : "Setup Your Profile"}
          </h1>
          <p className="text-gray-600 mt-2 text-sm lg:text-base">
            {isEditing 
              ? "Update your profile information" 
              : "Complete your profile to start using Buddy Ride"
            }
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
                placeholder="e.g., Md. Rahman Khan or Fatima Sultana"
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
                placeholder="e.g., 23-51455-1"
                value={formData.student_id}
                onChange={(e) =>
                  setFormData({ ...formData, student_id: e.target.value })
                }
                label="Student ID"
                required
                className="text-sm lg:text-base"
              />

              <Input
                type="tel"
                placeholder="e.g., 01712345678"
                value={formData.phone_number}
                onChange={(e) =>
                  setFormData({ ...formData, phone_number: e.target.value })
                }
                label="Phone Number (Optional)"
                className="text-sm lg:text-base"
              />

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Department *
                </label>
                
                {/* Native select styled to match design */}
                <div className="relative">
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    required
                    className="flex h-12 w-full items-center rounded-xl border border-gray-200 bg-white px-4 py-3 pr-12 text-base ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 hover:border-gray-300 shadow-sm appearance-none cursor-pointer"
                  >
                    <option value="" disabled className="text-gray-400">
                      Select your department
                    </option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept} className="text-gray-900 py-2">
                        {dept}
                      </option>
                    ))}
                  </select>
                  
                  {/* Custom styling overlay */}
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <Building className="h-4 w-4 text-gray-400" />
                  </div>
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                    <svg
                      className="h-4 w-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
                
                {/* Visual feedback for selected department */}
                {formData.department && (
                  <div className="flex items-center px-3 py-2 bg-primary-50 border border-primary-200 rounded-lg">
                    <svg
                      className="h-4 w-4 text-primary-600 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-primary-700 text-sm font-medium">
                      Selected: {formData.department}
                    </span>
                  </div>
                )}
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
                {isEditing ? "Update Profile" : "Complete Setup"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfileSetupPage;
