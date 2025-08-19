export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4";
  };
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          content: string;
          created_at: string;
          id: string;
          message_type: string | null;
          phone_number: string | null;
          phone_shared: boolean | null;
          ride_id: string;
          sender_id: string;
        };
        Insert: {
          content: string;
          created_at?: string;
          id?: string;
          message_type?: string | null;
          phone_number?: string | null;
          phone_shared?: boolean | null;
          ride_id: string;
          sender_id: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          id?: string;
          message_type?: string | null;
          phone_number?: string | null;
          phone_shared?: boolean | null;
          ride_id?: string;
          sender_id?: string;
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
      notifications: {
        Row: {
          action_url: string | null;
          created_at: string | null;
          data: Json | null;
          expires_at: string | null;
          id: string;
          message: string;
          priority: string | null;
          read: boolean | null;
          title: string;
          type: string;
          user_id: string;
        };
        Insert: {
          action_url?: string | null;
          created_at?: string | null;
          data?: Json | null;
          expires_at?: string | null;
          id?: string;
          message: string;
          priority?: string | null;
          read?: boolean | null;
          title: string;
          type: string;
          user_id: string;
        };
        Update: {
          action_url?: string | null;
          created_at?: string | null;
          data?: Json | null;
          expires_at?: string | null;
          id?: string;
          message?: string;
          priority?: string | null;
          read?: boolean | null;
          title?: string;
          type?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          department: string | null;
          gender: string | null;
          id: string;
          name: string | null;
          notification_preferences: Json | null;
          phone_number: string | null;
          role: string | null;
          student_id: string | null;
        };
        Insert: {
          created_at?: string;
          department?: string | null;
          gender?: string | null;
          id: string;
          name?: string | null;
          notification_preferences?: Json | null;
          phone_number?: string | null;
          role?: string | null;
          student_id?: string | null;
        };
        Update: {
          created_at?: string;
          department?: string | null;
          gender?: string | null;
          id?: string;
          name?: string | null;
          notification_preferences?: Json | null;
          phone_number?: string | null;
          role?: string | null;
          student_id?: string | null;
        };
        Relationships: [];
      };
      ride_requests: {
        Row: {
          created_at: string;
          id: string;
          message: string | null;
          phone_shared: boolean | null;
          requester_id: string;
          ride_id: string;
          status: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          message?: string | null;
          phone_shared?: boolean | null;
          requester_id: string;
          ride_id: string;
          status?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          message?: string | null;
          phone_shared?: boolean | null;
          requester_id?: string;
          ride_id?: string;
          status?: string | null;
          updated_at?: string;
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
      rides: {
        Row: {
          created_at: string;
          from_location: string;
          id: string;
          notes: string | null;
          ride_time: string | null;
          to_location: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          from_location: string;
          id?: string;
          notes?: string | null;
          ride_time?: string | null;
          to_location: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
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
    };
    Views: {
      admin_stats: {
        Row: {
          active_rides: number | null;
          expired_rides: number | null;
          total_messages: number | null;
          total_requests: number | null;
          total_rides: number | null;
          total_users: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      assign_admin_role: {
        Args: { user_email: string };
        Returns: undefined;
      };
      can_access_ride_chat: {
        Args: { ride_id: string; user_id: string };
        Returns: boolean;
      };
      cleanup_expired_rides_auto: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      get_user_role: {
        Args: Record<PropertyKey, never> | { user_id?: string };
        Returns: string;
      };
      is_admin: {
        Args: Record<PropertyKey, never> | { user_id?: string };
        Returns: boolean;
      };
      list_admin_users: {
        Args: Record<PropertyKey, never>;
        Returns: {
          created_at: string;
          email: string;
          name: string;
          role: string;
          student_id: string;
          user_id: string;
        }[];
      };
      promote_user_to_admin: {
        Args: { user_email: string };
        Returns: Json;
      };
      promote_user_to_admin_by_student_id: {
        Args: { student_id_param: string };
        Returns: Json;
      };
      revoke_admin_access: {
        Args: { user_email: string };
        Returns: Json;
      };
      setup_admin_profile: {
        Args: Record<PropertyKey, never> | { admin_user_id: string };
        Returns: undefined;
      };
      upsert_profile: {
        Args: {
          user_department?: string;
          user_gender?: string;
          user_id: string;
          user_name?: string;
          user_student_id?: string;
        };
        Returns: {
          created_at: string;
          department: string | null;
          gender: string | null;
          id: string;
          name: string | null;
          phone_number: string | null;
          role: string | null;
          student_id: string | null;
        };
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
      DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
      DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Ride = Database["public"]["Tables"]["rides"]["Row"];
export type Message = Database["public"]["Tables"]["messages"]["Row"];
export type RideRequest = Database["public"]["Tables"]["ride_requests"]["Row"];
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];

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
