"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Package, 
  Search, 
  Eye, 
  Download, 
  FileText, 
  Building, 
  User,
  Calendar,
  Filter,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface OrderFile {
  id: string;
  fileName: string;
  filePath: string;
  fileType?: string;
  uploadedBy: string;
  createdAt: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  subject?: string;
  templateType?: string;
  colorMode?: string;
  cost?: number;
  preferredMailDate?: string;
  productionStartDate?: string;
  productionEndDate?: string;
  fulfilledAt?: string;
  createdAt: string;
  updatedAt: string;
  practice: {
    id: string;
    name: string;
    address?: string;
    phone?: string;
    email?: string;
  };
  user: {
    id: string;
    name?: string;
    email?: string;
    role: string;
  };
  files: OrderFile[];
}

export default function AdminOrdersPage() {
  const { isSignedIn, user: clerkUser } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [practiceFilter, setPracticeFilter] = useState("all");
  const [practices, setPractices] = useState<any[]>([]);

  useEffect(() => {
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }

    // Check if user is admin
    if (clerkUser) {
      fetchOrders();
      fetchPractices();
    }
  }, [isSignedIn, clerkUser, router]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/orders");
      
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data = await response.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast({
        title: "Error",
        description: "Failed to fetch orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPractices = async () => {
    try {
      const response = await fetch("/api/practices");
      if (response.ok) {
        const data = await response.json();
        setPractices(data.practices || []);
      }
    } catch (error) {
      console.error("Error fetching practices:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'delivered':
        return 'bg-emerald-100 text-emerald-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const downloadFile = async (file: OrderFile, orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/files/${file.id}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive",
      });
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.practice.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const matchesPractice = practiceFilter === "all" || order.practice.id === practiceFilter;
    return matchesSearch && matchesStatus && matchesPractice;
  });

  // Calculate order stats
  const orderStats = {
    pending: orders?.filter(o => o.status === 'pending').length || 0,
    draft: orders?.filter(o => o.status === 'draft').length || 0,
    inProgress: orders?.filter(o => o.status === 'in-progress').length || 0,
    completed: orders?.filter(o => o.status === 'completed').length || 0,
    delivered: orders?.filter(o => o.status === 'delivered').length || 0,
    total: orders?.length || 0,
  };

  if (!isSignedIn) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Orders</h1>
            <p className="text-gray-600">Manage all patient letter orders across practices</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              onClick={fetchOrders}
              variant="outline"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Order Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
        <Card className="shadow-sm border border-gray-100">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-900">{orderStats.pending}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </CardContent>
        </Card>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Practice</label>
              <Select value={practiceFilter} onValueChange={setPracticeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Practices" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Practices</SelectItem>
                  {practices.map((practice) => (
                    <SelectItem key={practice.id} value={practice.id}>
                      {practice.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            <div className="flex items-end">
              <Button 
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setPracticeFilter("all");
                }}
                variant="outline"
                className="w-full"
              >
                <Filter className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading orders...</p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Practice
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Files
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                        <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium">No orders found</p>
                        <p className="text-sm">Try adjusting your filters or search terms</p>
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {order.orderNumber}
                            </div>
                            <div className="text-sm text-gray-500">
                              {order.subject || 'No subject'}
                            </div>
                            {order.cost && (
                              <div className="text-sm text-gray-500">
                                ${order.cost.toFixed(2)}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <Building className="h-4 w-4 text-gray-400 mr-2" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {order.practice.name}
                              </div>
                              {order.practice.address && (
                                <div className="text-xs text-gray-500">
                                  {order.practice.address}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <User className="h-4 w-4 text-gray-400 mr-2" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {order.user.name || 'Not specified'}
                              </div>
                              <div className="text-xs text-gray-500">
                                {order.user.email || 'No email'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4 text-blue-500" />
                            <span className="text-sm text-gray-900">
                              {order.files.length} file(s)
                            </span>
                          </div>
                          {order.files.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {order.files.slice(0, 2).map((file) => (
                                <div key={file.id} className="flex items-center justify-between text-xs">
                                  <span className="text-gray-600 truncate max-w-32">
                                    {file.fileName}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => downloadFile(file, order.id)}
                                    className="h-6 px-2"
                                  >
                                    <Download className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                              {order.files.length > 2 && (
                                <div className="text-xs text-gray-500">
                                  +{order.files.length - 2} more
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                            <div className="text-sm text-gray-900">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/orders/${order.id}`)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/orders/${order.id}/upload`)}
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              Files
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
