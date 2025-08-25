import React, { useState } from "react";
import { User, Building, Users, Save, X } from "lucide-react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { useAuthStore } from "../stores/authStore";
import { validateProfileData } from "../utils/validation";
import { isStudentIdFromEmail } from "../utils/studentIdExtractor";
import toast from "react-hot-toast";

const departments = [
  "Computer Science and Engineering",
  "Electrical and Electronic Engineering", 
  "Software Engineering",
  "Business Administration",
  "English",
  "Pharmacy",
  "Architecture",
  "Civil Engineering",
  "Textile Engineering",
  "Environmental Science and Engineering",
  "Industrial and Production Engineering",
  "Mathematics",
  "Physics",
  "Chemistry",
  "Economics",
  "Law",
  "Journalism and Media Studies",
  "Development Studies",
];

interface ProfileEditFormProps {
  onCancel: () => void;
  onSuccess: () => void;
}

const ProfileEditForm: React.FC<ProfileEditFormProps> = ({
  onCancel,
  onSuccess,
}) => {
  const { updateProfile, user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.profile?.name || "",
    student_id: user?.profile?.student_id || "",
    department: user?.profile?.department || "",
    gender: (user?.profile?.gender as "male" | "female") || "male",
    phone_number: user?.profile?.phone_number || "",
  });

  // Check if user has a temporary student ID
  const hasTemporaryStudentId =
    user?.profile?.student_id?.startsWith("99-") || false;

  // Check if student ID was auto-detected from email
  const hasAutoDetectedStudentId =
    user?.email &&
    user?.profile?.student_id &&
    !hasTemporaryStudentId &&
    user?.profile?.student_id !== "00-00000-0" &&
    isStudentIdFromEmail(user.email, user.profile.student_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Additional client-side validation
    if (!formData.department.trim()) {
      toast.error("Please select a department");
      return;
    }

    // Only validate editable fields for profile updates
    const editableData = {
      name: formData.name,
      department: formData.department,
      phone_number: formData.phone_number,
    };

    // Basic validation for editable fields only
    if (!editableData.name.trim()) {
      toast.error("Name is required");
      return;
    }

    if (editableData.name.trim().length < 2) {
      toast.error("Name must be at least 2 characters long");
      return;
    }

    if (!editableData.department.trim()) {
      toast.error("Department is required");
      return;
    }

    setLoading(true);
    try {
      // Only send editable fields to prevent security issues
      await updateProfile(editableData);
      toast.success("Profile updated successfully!");
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="pb-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-t-xl">
            <CardTitle className="flex items-center justify-between text-xl font-bold text-gray-900">
              <div className="flex items-center">
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg mr-3">
                  <User className="h-6 w-6 text-white" />
                </div>
                Edit Profile
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancel}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </Button>
            </CardTitle>
            <p className="text-gray-600 text-sm mt-2">
              Update your profile information
            </p>
          </CardHeader>
          <CardContent className="pt-6">
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
                  <strong>Great!</strong> Your student ID ({user?.profile?.student_id}) was automatically
                  detected from your email address ({user?.email}). You can update it if needed.
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
                className="text-base"
              />

              <Input
                type="text"
                placeholder="e.g., 23-51455-1"
                value={formData.student_id}
                label="Student ID"
                required
                className="text-base bg-gray-50"
                disabled
                readOnly
              />
              <div className="flex items-center text-xs text-gray-500 mt-1 px-3">
                <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                Student ID cannot be changed for security reasons
              </div>

              <Input
                type="tel"
                placeholder="e.g., 01712345678"
                value={formData.phone_number}
                onChange={(e) =>
                  setFormData({ ...formData, phone_number: e.target.value })
                }
                label="Phone Number (Optional)"
                className="text-base"
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
                  Gender *
                </label>
                <div className="flex space-x-3">
                  <div
                    className={`flex-1 py-3 px-4 rounded-xl border font-medium text-base bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed ${
                      formData.gender === "male"
                        ? "ring-2 ring-primary-200"
                        : ""
                    }`}
                  >
                    <Users className="h-4 w-4 mr-2 inline" />
                    Male
                    {formData.gender === "male" && (
                      <svg className="h-4 w-4 ml-auto inline text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div
                    className={`flex-1 py-3 px-4 rounded-xl border font-medium text-base bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed ${
                      formData.gender === "female"
                        ? "ring-2 ring-primary-200"
                        : ""
                    }`}
                  >
                    <Users className="h-4 w-4 mr-2 inline" />
                    Female
                    {formData.gender === "female" && (
                      <svg className="h-4 w-4 ml-auto inline text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
                <div className="flex items-center text-xs text-gray-500 mt-1 px-3">
                  <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  Gender cannot be changed for security and safety reasons
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  className="flex-1 h-12 text-base bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg"
                  loading={loading}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Update Profile
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  className="h-12 px-6 border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfileEditForm;
