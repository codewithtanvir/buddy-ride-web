export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      messages: {
        Row: {
          content: string;
          created_at: string | null;
          id: string;
          ride_id: string | null;
          sender_id: string | null;
        };
        Insert: {
          content: string;
          created_at?: string | null;
          id?: string;
          ride_id?: string | null;
          sender_id?: string | null;
        };
        Update: {
          content?: string;
          created_at?: string | null;
          id?: string;
          ride_id?: string | null;
          sender_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "messages_ride_id_fkey";
            columns: ["ride_id"];
            isOneToOne: false;
            referencedRelation: "rides";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      profiles: {
        Row: {
          created_at: string | null;
          department: string | null;
          gender: string | null;
          id: string;
          name: string | null;
          student_id: string | null;
          role?: string | null;
        };
        Insert: {
          created_at?: string | null;
          department?: string | null;
          gender?: string | null;
          id: string;
          name?: string | null;
          student_id?: string | null;
          role?: string | null;
        };
        Update: {
          created_at?: string | null;
          department?: string | null;
          gender?: string | null;
          id?: string;
          name?: string | null;
          student_id?: string | null;
          role?: string | null;
        };
        Relationships: [];
      };
      rides: {
        Row: {
          created_at: string | null;
          from_location: string;
          id: string;
          notes: string | null;
          ride_time: string | null;
          to_location: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          from_location: string;
          id?: string;
          notes?: string | null;
          ride_time?: string | null;
          to_location: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          from_location?: string;
          id?: string;
          notes?: string | null;
          ride_time?: string | null;
          to_location?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "rides_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      ride_requests: {
        Row: {
          created_at: string | null;
          id: string;
          message: string | null;
          requester_id: string | null;
          ride_id: string | null;
          status: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          message?: string | null;
          requester_id?: string | null;
          ride_id?: string | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          message?: string | null;
          requester_id?: string | null;
          ride_id?: string | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ride_requests_requester_id_fkey";
            columns: ["requester_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ride_requests_ride_id_fkey";
            columns: ["ride_id"];
            isOneToOne: false;
            referencedRelation: "rides";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Ride = Database["public"]["Tables"]["rides"]["Row"];
export type Message = Database["public"]["Tables"]["messages"]["Row"];
export type RideRequest = Database["public"]["Tables"]["ride_requests"]["Row"];

export interface RideWithProfile extends Ride {
  profiles: Profile | null;
}

export interface MessageWithProfile extends Message {
  profiles: Profile | null;
}

export interface RideRequestWithProfile extends RideRequest {
  profiles: Profile | null;
  rides?: Ride | null;
}

export interface RideWithRequests extends RideWithProfile {
  ride_requests?: RideRequestWithProfile[];
}
