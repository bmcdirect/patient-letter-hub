import React from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, Building2, User } from 'lucide-react';
import { useSimpleAuth } from '@/hooks/useSimpleAuth';

export default function SimpleHeader() {
  const { user, logout } = useSimpleAuth();

  if (!user) return null;

  return (
    <header className="bg-white border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <Building2 className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">PatientLetterHub</h1>
              <p className="text-sm text-gray-600">{user.practiceName}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-700">
                {user.firstName} {user.lastName}
              </span>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {user.role}
              </span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={logout}
              className="flex items-center space-x-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}