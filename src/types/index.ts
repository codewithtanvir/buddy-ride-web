export * from "./supabase";

export interface AuthUser {
  id: string;
  email?: string;
  profile?: import("./supabase").Profile;
}

export interface RideFormData {
  from_location: string;
  to_location: string;
  ride_time: Date;
  notes?: string;
}

export interface ProfileFormData {
  name: string;
  student_id: string;
  department: string;
  gender: "male" | "female";
  role?: "user" | "admin" | "moderator";
}
