import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TopNavigation } from "@/components/layout/top-navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Users as UsersIcon, UserPlus, Settings, Shield } from "lucide-react";

export default function Users() {
  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavigation />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 ml-64 p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <UsersIcon className="h-8 w-8" />
                User Management
              </h1>
              <p className="text-gray-600 mt-1">Manage user accounts and permissions</p>
            </div>

            {/* Coming Soon Notice */}
            <Card>
              <CardContent className="p-12 text-center">
                <UsersIcon className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">User Management</h3>
                <p className="text-gray-600 mb-6">
                  User management features are coming soon. This will include user creation, 
                  role assignment, permission management, and user activity monitoring.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                  <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                    <UserPlus className="h-8 w-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">Add Users</span>
                  </div>
                  <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                    <Settings className="h-8 w-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">Manage Roles</span>
                  </div>
                  <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                    <Shield className="h-8 w-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">Set Permissions</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}