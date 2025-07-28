import { useOperationsAuth } from "@/hooks/useOperationsAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  LogOut, 
  User,
  Settings as SettingsIcon
} from "lucide-react";

export function OperationsHeader() {
  const { operationsUser, logout, isLoggingOut, isOperationsAdmin } = useOperationsAuth();

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Logo and title */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="bg-primary-600 p-2 rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Operations Dashboard</h1>
                <p className="text-sm text-gray-500">PatientLetterHub Staff Portal</p>
              </div>
            </div>
          </div>

          {/* Right side - User info and actions */}
          <div className="flex items-center space-x-4">
            {operationsUser && (
              <>
                {/* User info */}
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {operationsUser.firstName} {operationsUser.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{operationsUser.email}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <Badge variant={isOperationsAdmin ? "default" : "secondary"}>
                      {isOperationsAdmin ? "Admin" : "Staff"}
                    </Badge>
                  </div>
                </div>

                {/* Divider */}
                <div className="h-6 border-l border-gray-300"></div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isLoggingOut}
                    onClick={() => logout()}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    {isLoggingOut ? "Signing Out..." : "Sign Out"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}