import type { RideFormData, ProfileFormData } from "../types";

export const validateRideData = (data: RideFormData): string[] => {
  const errors: string[] = [];

  if (!data.from_location.trim()) {
    errors.push("From location is required");
  }

  if (!data.to_location.trim()) {
    errors.push("To location is required");
  }

  if (data.from_location === data.to_location) {
    errors.push("From and to locations cannot be the same");
  }

  const allowedLocations = ["Campus", "Kuril", "Jamuna Future Park"];
  if (!allowedLocations.includes(data.from_location)) {
    errors.push("Please select a valid from location");
  }

  if (!allowedLocations.includes(data.to_location)) {
    errors.push("Please select a valid to location");
  }

  if (!data.ride_time || data.ride_time <= new Date()) {
    errors.push("Please select a future date and time");
  }

  return errors;
};

export const validateProfileData = (data: ProfileFormData): string[] => {
  const errors: string[] = [];

  if (!data.name.trim()) {
    errors.push("Name is required");
  }

  if (!data.student_id.trim()) {
    errors.push("Student ID is required");
  }

  // Validate student ID format (XX-XXXXX-X)
  const studentIdRegex = /^\d{2}-\d{5}-\d{1}$/;
  if (!studentIdRegex.test(data.student_id)) {
    errors.push("Student ID must be in format: XX-XXXXX-X");
  }

  if (!data.department.trim()) {
    errors.push("Department is required");
  }

  if (!data.gender) {
    errors.push("Gender is required");
  }

  return errors;
};
