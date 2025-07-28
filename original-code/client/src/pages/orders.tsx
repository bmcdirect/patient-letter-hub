import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TopNavigation } from "@/components/layout/top-navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { useLocation } from "wouter";
import { OrdersTable } from "@/components/dashboard/OrdersTable";
import { 
  Plus, 
  Search, 
  Download
} from "lucide-react";
import { fmtDate } from "@/lib/utils";
import { useSimpleAuth } from "@/hooks/useSimpleAuth";

export default function Orders() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { user } = useSimpleAuth();

  const { data: orders, isLoading } = useQuery({
    queryKey: ["/api/orders"],
    enabled: !!user,
  });

  const filteredOrders = (orders || []).filter(order => {
    const matchesSearch = order.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate order stats
  const orderStats = {
    draft: orders?.filter(o => o.status === 'draft').length || 0,
    inProgress: orders?.filter(o => o.status === 'in-progress').length || 0,
    completed: orders?.filter(o => o.status === 'completed').length || 0,
    delivered: orders?.filter(o => o.status === 'delivered').length || 0,
    total: orders?.length || 0,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNavigation />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavigation />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 overflow-hidden p-8">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
                <p className="text-gray-600">Track and manage patient letter orders</p>
              </div>
              <div className="flex items-center space-x-3">
                <Button variant="outline" className="flex items-center space-x-2">
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </Button>
                <Button 
                  onClick={() => setLocation("/orders/create")}
                  className="bg-primary-500 hover:bg-primary-600 text-white flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>New Order</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Order Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <Card className="shadow-sm border border-gray-100">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-gray-900">{orderStats.draft}</div>
                <div className="text-sm text-gray-600">Draft</div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border border-gray-100">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-yellow-600">{orderStats.inProgress}</div>
                <div className="text-sm text-gray-600">In Progress</div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border border-gray-100">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-600">{orderStats.completed}</div>
                <div className="text-sm text-gray-600">Completed</div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border border-gray-100">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">{orderStats.delivered}</div>
                <div className="text-sm text-gray-600">Delivered</div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border border-gray-100">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-gray-600">{orderStats.total}</div>
                <div className="text-sm text-gray-600">Total Orders</div>
              </CardContent>
            </Card>
          </div>

          {/* Order Filters */}
          <Card className="shadow-sm border border-gray-100 mb-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Practice</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="All Practices" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Practices</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date From</label>
                  <Input type="date" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date To</label>
                  <Input type="date" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Search orders..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                    <Search className="h-4 w-4 text-gray-400 absolute left-3 top-3" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Orders Table */}
          <OrdersTable orders={filteredOrders} isLoading={isLoading} />
        </main>
      </div>
    </div>
  );
}