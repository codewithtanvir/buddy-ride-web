import type { RideFormData, ProfileFormData } from "../types";

// Password validation constants
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_REQUIREMENTS = {
  minLength: PASSWORD_MIN_LENGTH,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: false, // Made optional for better UX
};

export const validatePassword = (password: string): string[] => {
  const errors: string[] = [];

  if (!password) {
    errors.push("Password is required");
    return errors;
  }

  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(
      `Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters long`
    );
  }

  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (PASSWORD_REQUIREMENTS.requireNumbers && !/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  if (
    PASSWORD_REQUIREMENTS.requireSpecialChars &&
    !/[!@#$%^&*(),.?":{}|<>]/.test(password)
  ) {
    errors.push("Password must contain at least one special character");
  }

  // Check for common weak passwords
  const weakPasswords = ["password", "12345678", "qwerty123", "admin123"];
  if (weakPasswords.some((weak) => password.toLowerCase().includes(weak))) {
    errors.push("Password is too common. Please choose a stronger password");
  }

  return errors;
};

export const validateEmail = (email: string): string[] => {
  const errors: string[] = [];

  if (!email) {
    errors.push("Email is required");
    return errors;
  }

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    errors.push("Please enter a valid email address");
  }

  // AIUB email validation
  if (!email.toLowerCase().endsWith("@student.aiub.edu")) {
    errors.push("Please use your AIUB student email (@student.aiub.edu)");
  }

  return errors;
};

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

  // Enhanced location validation with more flexibility
  const allowedLocations = [
    "Campus",
    "Kuril",
    "Jamuna Future Park",
    "Badda",
    "Rampura",
    "Banani",
    "Gulshan",
    "Dhanmondi",
    "Farmgate",
    "Tejgaon",
    "Uttara",
  ];

  if (!allowedLocations.includes(data.from_location)) {
    errors.push("Please select a valid from location");
  }

  if (!allowedLocations.includes(data.to_location)) {
    errors.push("Please select a valid to location");
  }

  // Enhanced ride time validation
  const now = new Date();
  const rideTime = new Date(data.ride_time);
  const minFutureTime = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes from now
  const maxFutureTime = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

  if (!data.ride_time || rideTime <= minFutureTime) {
    errors.push("Ride time must be at least 30 minutes in the future");
  }

  if (rideTime > maxFutureTime) {
    errors.push("Ride time cannot be more than 30 days in the future");
  }

  // Validate notes length if provided
  if (data.notes && data.notes.trim().length > 500) {
    errors.push("Notes cannot be longer than 500 characters");
  }

  return errors;
};

export const validateProfileData = (data: ProfileFormData): string[] => {
  const errors: string[] = [];

  if (!data.name.trim()) {
    errors.push("Name is required");
  } else if (data.name.trim().length < 2) {
    errors.push("Name must be at least 2 characters long");
  } else if (data.name.trim().length > 50) {
    errors.push("Name must be less than 50 characters");
  }

  if (!data.student_id.trim()) {
    errors.push("Student ID is required");
  }

  // Enhanced student ID validation (AIUB format: XX-XXXXX-X)
  const studentIdRegex = /^\d{2}-\d{5}-\d{1}$/;
  if (data.student_id.trim() && !studentIdRegex.test(data.student_id.trim())) {
    errors.push("Student ID must be in format: XX-XXXXX-X (e.g., 22-12345-1)");
  }

  if (!data.department.trim()) {
    errors.push("Department is required");
  }

  if (!data.gender) {
    errors.push("Gender is required");
  } else if (!["male", "female"].includes(data.gender)) {
    errors.push("Gender must be either 'male' or 'female'");
  }

  // Validate phone number if provided
  if (data.phone_number && data.phone_number.trim()) {
    const phonePattern = /^(\+88)?01[3-9]\d{8}$/;
    if (!phonePattern.test(data.phone_number.trim().replace(/\s/g, ""))) {
      errors.push(
        "Please enter a valid Bangladeshi phone number (e.g., 01712345678)"
      );
    }
  }

  return errors;
};

// Validate message content
export const validateMessageContent = (content: string): string[] => {
  const errors: string[] = [];

  if (!content.trim()) {
    errors.push("Message cannot be empty");
    return errors;
  }

  if (content.trim().length > 1000) {
    errors.push("Message cannot be longer than 1000 characters");
  }

  // Check for inappropriate content (basic)
  const inappropriateWords = ["spam", "scam", "fake"];
  if (inappropriateWords.some((word) => content.toLowerCase().includes(word))) {
    errors.push("Message contains inappropriate content");
  }

  return errors;
};

// Validate ride request message
export const validateRideRequestMessage = (message: string): string[] => {
  const errors: string[] = [];

  if (!message.trim()) {
    errors.push("Request message is required");
    return errors;
  }

  // Removed minimum character requirement - any length is allowed
  if (message.trim().length > 500) {
    errors.push("Request message cannot be longer than 500 characters");
  }

  return errors;
};
