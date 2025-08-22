import React, { useState, useEffect } from "react";
import { User, Shield, UserCheck, X, Search, RefreshCw, Crown, Users, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { supabase } from "../../lib/supabase";
import toast from "react-hot-toast";
import type { Profile } from "../../types";

interface AdminUser {
  user_id: string;
  created_at: string;
  email: string;
  name: string;
  student_id: string;
}

export const AdminPromotionTool: React.FC = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [promoting, setPromoting] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load all users
      const { data: usersData, error: usersError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (usersError) throw usersError;
      setUsers(usersData || []);

      // Load current admin users using the database function
      const { data: adminData, error: adminError } = await supabase
        .rpc("list_admin_users");

      if (adminError) {
        console.error("Error loading admin users:", adminError);
        // Fallback: get users with admin role
        const { data: fallbackAdminData } = await supabase
          .from("profiles")
          .select("*")
          .eq("role", "admin");
        
        setAdminUsers(fallbackAdminData?.map(user => ({
          user_id: user.id,
          created_at: user.created_at,
          email: user.id, // Fallback
          name: user.name || "Unknown",
          student_id: user.student_id || "Unknown"
        })) || []);
      } else {
        setAdminUsers(adminData || []);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load user data");
    } finally {
      setLoading(false);
    }
  };

  const promoteToAdmin = async (studentId: string) => {
    setPromoting(studentId);
    try {
      const { data, error } = await supabase
        .rpc("promote_user_to_admin_by_student_id", {
          student_id_param: studentId
        });

      if (error) throw error;

      // The function now returns void, so just check for successful execution
      toast.success(`User ${studentId} promoted to admin successfully!`);
      loadData();
    } catch (error: any) {
      console.error("Error promoting user:", error);
      toast.error(error.message || "Failed to promote user to admin");
    } finally {
      setPromoting(null);
    }
  };

  const revokeAdminAccess = async (userEmail: string) => {
    setRevoking(userEmail);
    try {
      const { data, error } = await supabase
        .rpc("revoke_admin_access", {
          user_email: userEmail
        });

      if (error) throw error;

      // The function now returns void, so just check for successful execution
      toast.success("Admin access revoked successfully!");
      loadData();
    } catch (error: any) {
      console.error("Error revoking admin access:", error);
      toast.error(error.message || "Failed to revoke admin access");
    } finally {
      setRevoking(null);
    }
  };

  const filteredUsers = users.filter(user => 
    user.role !== "admin" && (
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.student_id?.includes(searchQuery) ||
      user.department?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
          <Crown className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Admin Management</h2>
          <p className="text-gray-600">Promote users to admin or revoke admin access</p>
        </div>
        <Button
          onClick={loadData}
          disabled={loading}
          className="ml-auto bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl px-4 py-2 shadow-lg transition-all duration-200"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Current Admins */}
      <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
              <Shield className="h-4 w-4 text-white" />
            </div>
            Current Admins ({adminUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {adminUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No admin users found</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {adminUsers.map((admin) => (
                <div
                  key={admin.user_id}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                      {admin.name?.charAt(0)?.toUpperCase() || "A"}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">{admin.name}</div>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded font-medium">
                          {admin.student_id}
                        </span>
                        <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded font-medium">
                          Admin
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => revokeAdminAccess(admin.email)}
                    disabled={revoking === admin.email}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 rounded-xl transition-all duration-200"
                  >
                    {revoking === admin.email ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Promote Users */}
      <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <UserCheck className="h-4 w-4 text-white" />
            </div>
            Promote Users to Admin
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, student ID, or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 max-w-md bg-white/80 backdrop-blur-sm border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl"
              />
            </div>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchQuery ? "No users found matching your search" : "No users available for promotion"}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 max-h-96 overflow-y-auto">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-200"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                      {user.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">{user.name || "No Name"}</div>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium">
                          {user.student_id}
                        </span>
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded font-medium">
                          {user.department}
                        </span>
                        <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded font-medium">
                          {user.gender}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => promoteToAdmin(user.student_id!)}
                    disabled={promoting === user.student_id || !user.student_id}
                    className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-xl px-4 py-2 shadow-lg transition-all duration-200"
                  >
                    {promoting === user.student_id ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Crown className="h-4 w-4 mr-2" />
                    )}
                    Promote
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Warning Card */}
      <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 shadow-xl">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-yellow-900 mb-2">Important Notice</h3>
              <p className="text-yellow-800 text-sm leading-relaxed">
                Admin privileges grant full access to user management, ride management, and system analytics. 
                Only promote trusted users who need administrative access. Admin access can be revoked at any time.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};