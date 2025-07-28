import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TopNavigation } from "@/components/layout/top-navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { 
  FileText, 
  Package, 
  LayoutDashboard,
  Plus,
  Eye,
  Settings,
  Shield,
  TrendingUp
} from "lucide-react";
import { useLocation } from "wouter";
import { useSimpleAuth } from "@/hooks/useSimpleAuth";
import { fmtDate } from "@/lib/utils";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user, isLoading } = useSimpleAuth();

  // Move all hooks to top level - no conditional hooks
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    enabled: !!user,
  });

  const { data: quotesResponse, isLoading: quotesLoading } = useQuery({
    queryKey: ["/api/quotes"],
    enabled: !!user,
  });

  const { data: ordersResponse, isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/orders"],
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNavigation />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 ml-64 p-8">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!user) {
    setLocation('/login');
    return null;
  }

  // Extract customer's data - API returns arrays directly
  const quotes = quotesResponse || [];
  const orders = ordersResponse || [];

  // Customer stats - use API stats first, fall back to calculated values if needed
  const customerStats = {
    myQuotes: stats?.myQuotes ?? quotes.length,
    myOrders: stats?.myOrders ?? orders.length,
    pendingQuotes: stats?.pendingQuotes ?? quotes.filter((q: any) => q.status === "pending").length,
    activeOrders: stats?.activeOrders ?? orders.filter((o: any) => o.status === "in-progress").length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavigation />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 ml-64 p-8">
          <div className="content-wide space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <LayoutDashboard className="h-8 w-8" />
                  Welcome, {user.firstName}!
                </h1>
                <p className="text-gray-600 mt-1">Managing communications for {user.practiceName}</p>
              </div>
            </div>

            {/* Tenant Isolation Info */}
            <Card className="border-blue-200 bg-blue-50">
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

            {/* Customer Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">My Quotes</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{customerStats.myQuotes}</div>
                  <p className="text-xs text-muted-foreground">Total quotes</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">My Orders</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{customerStats.myOrders}</div>
                  <p className="text-xs text-muted-foreground">Total orders</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Quotes</CardTitle>
                  <FileText className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{customerStats.pendingQuotes}</div>
                  <p className="text-xs text-muted-foreground">Awaiting approval</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
                  <Package className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{customerStats.activeOrders}</div>
                  <p className="text-xs text-muted-foreground">In progress</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setLocation('/quotes/create')}>
                <CardContent className="p-6 text-center">
                  <Plus className="h-8 w-8 mx-auto mb-3 text-blue-600" />
                  <h3 className="font-semibold text-gray-900 mb-2">Request New Quote</h3>
                  <p className="text-sm text-gray-600">Get pricing for your next project</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setLocation('/orders/create')}>
                <CardContent className="p-6 text-center">
                  <Package className="h-8 w-8 mx-auto mb-3 text-green-600" />
                  <h3 className="font-semibold text-gray-900 mb-2">Add New Order</h3>
                  <p className="text-sm text-gray-600">Create a new order directly</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* My Recent Quotes */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      My Recent Quotes
                    </span>
                    <Button size="sm" onClick={() => setLocation('/quotes')}>View All</Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {quotesLoading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      ))}
                    </div>
                  ) : quotes.slice(0, 3).map((quote: any) => (
                    <div key={quote.id} className="flex justify-between items-center py-3 border-b last:border-b-0">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900">{quote.quoteNumber}</p>
                        <p className="text-sm text-gray-600 truncate">{quote.subject}</p>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={
                          quote.status === "pending" 
                            ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                            : quote.status === "approved"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-gray-50 text-gray-700 border-gray-200"
                        }
                      >
                        {quote.status}
                      </Badge>
                    </div>
                  ))}
                  {quotes.length === 0 && (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-500">No quotes yet</p>
                      <Button 
                        onClick={() => setLocation('/quotes/create')} 
                        size="sm" 
                        className="mt-2"
                      >
                        Request Your First Quote
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* My Recent Orders */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      My Recent Orders
                    </span>
                    <Button size="sm" onClick={() => setLocation('/orders')}>View All</Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {ordersLoading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      ))}
                    </div>
                  ) : orders.slice(0, 3).map((order: any) => (
                    <div key={order.id} className="flex justify-between items-center py-3 border-b last:border-b-0">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900">{order.orderNumber}</p>
                        <p className="text-sm text-gray-600 truncate">{order.subject}</p>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={
                          order.status === "in-progress"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : order.status === "completed"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-gray-50 text-gray-700 border-gray-200"
                        }
                      >
                        {order.status}
                      </Badge>
                    </div>
                  ))}
                  {orders.length === 0 && (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-500">No orders yet</p>
                      <p className="text-xs text-gray-400 mt-1">Orders will appear here after quotes are approved</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}