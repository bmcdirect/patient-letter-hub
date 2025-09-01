"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Package, TrendingUp, Clock } from "lucide-react";
import { ProductionCalendar } from "@/components/calendar/ProductionCalendar";
import { useNavigationClick } from "@/hooks/useNavigationClick";
import { useUser } from "@clerk/nextjs";

export default function DashboardPage() {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const [user, setUser] = useState<any>(null);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const handleNavigation = useNavigationClick();
  const [stats, setStats] = useState({
    quotes: 0,
    activeOrders: 0,
    pending: 0,
    thisMonth: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user data
        const userRes = await fetch('/api/user');
        if (userRes.ok) {
          const userData = await userRes.json();
          setUser(userData);
        }

        // Fetch quotes
        const quotesRes = await fetch('/api/quotes');
        if (quotesRes.ok) {
          const quotesData = await quotesRes.json();
          setQuotes(quotesData.quotes || []);
        }

        // Fetch orders
        const ordersRes = await fetch('/api/orders');
        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          setOrders(ordersData.orders || []);
        }

        // Calculate stats
        const activeOrders = orders.filter(o => o.status === 'in-progress' || o.status === 'waiting-approval').length;
        const pending = orders.filter(o => o.status === 'pending' || o.status === 'draft').length;
        const thisMonth = orders
          .filter(o => {
            const orderDate = new Date(o.createdAt);
            const now = new Date();
            return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
          })
          .reduce((sum, o) => sum + (o.cost || 0), 0);

        setStats({
          quotes: quotes.length,
          activeOrders,
          pending,
          thisMonth,
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (clerkLoaded && clerkUser) {
      fetchData();
    }
  }, [clerkLoaded, clerkUser]);

  if (!clerkLoaded || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!clerkUser) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">Please sign in to access your dashboard.</p>
        </div>
      </div>
    );
  }

  // Get user's display name from Clerk
  const getUserDisplayName = () => {
    if (clerkUser.firstName && clerkUser.lastName) {
      return `${clerkUser.firstName} ${clerkUser.lastName}`;
    } else if (clerkUser.firstName) {
      return clerkUser.firstName;
    } else if (clerkUser.fullName) {
      return clerkUser.fullName;
    } else {
      return clerkUser.emailAddresses[0]?.emailAddress.split('@')[0] || 'User';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome, {getUserDisplayName()}!
        </h2>
        <p className="text-gray-600">
          Managing communications for {user?.practice?.name || 'your practice'}
        </p>
      </div>

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
            <a href="/quotes/create">
              <Button 
                className="w-full"
                variant="outline"
              >
                New Quote
              </Button>
            </a>
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
            <a href="/orders/create">
              <Button 
                className="w-full"
                variant="outline"
              >
                New Order
              </Button>
            </a>
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
            <a href="/orders">
              <Button 
                className="w-full"
                variant="outline"
              >
                View Orders
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">My Quotes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.quotes}</p>
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
                <p className="text-2xl font-bold text-gray-900">{stats.activeOrders}</p>
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
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Production Calendar - Replaces Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Production Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductionCalendar
            orders={orders}
            quotes={quotes}
            onEventClick={(event, domEvent) => {
              if (event.entityType === 'order') {
                handleNavigation(`/orders/${event.entityId}`)(domEvent);
              } else if (event.entityType === 'quote') {
                handleNavigation('/quotes')(domEvent);
              }
            }}
            onExportSchedule={() => {
              // Default CSV export
              const csvContent = [
                ['Date', 'Practice', 'Type', 'Order/Quote #', 'Status', 'Event'],
                ...orders.map(order => [
                  order.preferredMailDate ? new Date(order.preferredMailDate).toLocaleDateString() : new Date(order.createdAt).toLocaleDateString(),
                  order.practiceName || order.practice?.name || '',
                  'Order',
                  order.orderNumber,
                  order.status,
                  order.subject || ''
                ]),
                ...quotes.map(quote => [
                  new Date(quote.createdAt).toLocaleDateString(),
                  quote.practiceName || '',
                  'Quote',
                  quote.quoteNumber,
                  quote.status,
                  quote.subject || ''
                ])
              ].map(row => row.join(',')).join('\n');

              const blob = new Blob([csvContent], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `production-schedule-${new Date().toLocaleDateString()}.csv`;
              a.click();
              window.URL.revokeObjectURL(url);
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
