import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Package, Users, TrendingUp, Clock } from 'lucide-react';
import { useSimpleAuth } from '@/hooks/useSimpleAuth';
import SimpleHeader from '@/components/SimpleHeader';
import { useLocation } from 'wouter';

export default function SimpleDashboard() {
  const { user, isLoading } = useSimpleAuth();
  const [, navigate] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SimpleHeader />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SimpleHeader />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome, {user.firstName}!
          </h2>
          <p className="text-gray-600">
            Managing communications for {user.practiceName}
          </p>
        </div>

        {/* Tenant Isolation Demo */}
        <Card className="mb-8 border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-blue-900">
                  Multi-Tenant System Active
                </h3>
                <p className="text-blue-700 mt-1">
                  You are logged in as <strong>{user.email}</strong> with tenant ID <strong>{user.tenantId}</strong>
                </p>
                <p className="text-blue-600 text-sm mt-2">
                  You can only see data for your practice: {user.practiceName}
                </p>
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                Tenant {user.tenantId}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <Plus className="h-5 w-5 mr-2 text-blue-600" />
                Create Quote
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm mb-4">
                Generate a new quote for patient communications
              </p>
              <Button 
                onClick={() => navigate('/quotes/create')}
                className="w-full"
                variant="outline"
              >
                New Quote
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <FileText className="h-5 w-5 mr-2 text-green-600" />
                Create Order
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm mb-4">
                Create a direct order for patient letters
              </p>
              <Button 
                onClick={() => navigate('/orders/create')}
                className="w-full"
                variant="outline"
              >
                New Order
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <Package className="h-5 w-5 mr-2 text-purple-600" />
                View Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm mb-4">
                Manage your practice's orders and track progress
              </p>
              <Button 
                onClick={() => navigate('/orders')}
                className="w-full"
                variant="outline"
              >
                View Orders
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">My Quotes</p>
                  <p className="text-2xl font-bold text-gray-900">0</p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Orders</p>
                  <p className="text-2xl font-bold text-gray-900">0</p>
                </div>
                <Package className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">0</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">This Month</p>
                  <p className="text-2xl font-bold text-gray-900">$0</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No recent activity</p>
              <p className="text-sm text-gray-400 mt-2">
                Your quotes and orders will appear here
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}