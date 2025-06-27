import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { 
  ArrowUpDown, 
  Search, 
  FileText, 
  CheckCircle2,
  Eye,
  RefreshCw,
  Filter,
  X,
  Package,
  Edit2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { orderStore } from "@/lib/orderStore";

interface Order {
  id: number;
  order_number: string;
  user_id: string;
  practice_id: number;
  quote_id?: number;
  subject: string;
  template_type: string;
  color_mode: string;
  recipient_count: number;
  total_cost: string;
  status: string;
  created_at: string;
  updated_at: string;
  production_start_date?: string;
  production_end_date?: string;
  fulfilled_at?: string;
  // Practice info (joined)
  practice_name?: string;
  practice_email?: string;
}

interface OrdersManagementProps {
  userId: string;
}

export default function OrdersManagement({ userId }: OrdersManagementProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [storeOrders, setStoreOrders] = useState<any[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Subscribe to order store changes
  React.useEffect(() => {
    const unsubscribe = orderStore.subscribe(() => {
      setStoreOrders(orderStore.getOrders());
    });
    
    // Initialize with current orders
    setStoreOrders(orderStore.getOrders());
    
    return unsubscribe;
  }, []);

  // Use store orders as primary data source
  const mockOrders: Order[] = storeOrders.length > 0 ? storeOrders : [
    {
      id: 1,
      order_number: "O-2001",
      user_id: "user123",
      practice_id: 1,
      quote_id: 1,
      subject: "Practice Relocation Notice",
      template_type: "custom",
      color_mode: "Color",
      recipient_count: 1250,
      total_cost: "1625.00",
      status: "In Progress",
      created_at: "2025-06-27T10:00:00Z",
      updated_at: "2025-06-27T10:00:00Z",
      production_start_date: "2025-06-27",
      production_end_date: "2025-06-30",
      practice_name: "Sunshine Dental",
      practice_email: "info@sunshinedental.com"
    },
    {
      id: 2,
      order_number: "O-2002",
      user_id: "user123",
      practice_id: 2,
      subject: "Provider Departure Notification",
      template_type: "custom",
      color_mode: "Black and White",
      recipient_count: 800,
      total_cost: "520.00",
      status: "Completed",
      created_at: "2025-06-26T14:30:00Z",
      updated_at: "2025-06-27T09:15:00Z",
      production_start_date: "2025-06-26",
      production_end_date: "2025-06-29",
      fulfilled_at: "2025-06-29T16:00:00Z",
      practice_name: "Healthy Smiles Family Dentistry",
      practice_email: "contact@healthysmiles.com"
    },
    {
      id: 3,
      order_number: "O-2003",
      user_id: "user123",
      practice_id: 1,
      subject: "HIPAA Breach Notification",
      template_type: "custom",
      color_mode: "Color",
      recipient_count: 450,
      total_cost: "585.00",
      status: "Delivered",
      created_at: "2025-06-25T11:20:00Z",
      updated_at: "2025-06-25T11:20:00Z",
      production_start_date: "2025-06-25",
      production_end_date: "2025-06-28",
      fulfilled_at: "2025-06-28T14:30:00Z",
      practice_name: "Sunshine Dental",
      practice_email: "info@sunshinedental.com"
    },
    {
      id: 4,
      order_number: "O-2004",
      user_id: "user123",
      practice_id: 1,
      subject: "Holiday Schedule Changes",
      template_type: "custom",
      color_mode: "Color",
      recipient_count: 950,
      total_cost: "1237.50",
      status: "Draft",
      created_at: "2025-06-27T14:15:00Z",
      updated_at: "2025-06-27T15:30:00Z",
      practice_name: "Sunshine Dental",
      practice_email: "info@sunshinedental.com"
    },
    {
      id: 5,
      order_number: "O-2005",
      user_id: "user123",
      practice_id: 2,
      subject: "Insurance Update Notice",
      template_type: "custom",
      color_mode: "Black and White",
      recipient_count: 600,
      total_cost: "390.00",
      status: "Draft",
      created_at: "2025-06-27T16:00:00Z",
      updated_at: "2025-06-27T16:00:00Z",
      practice_name: "Healthy Smiles Family Dentistry",
      practice_email: "contact@healthysmiles.com"
    }
  ];

  // Fetch orders data from store only
  const { data: allOrders = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/orders", statusFilter, storeOrders.length],
    queryFn: async () => {
      // Use only store orders (fresh reset data)
      return storeOrders;
    }
  });

  // Apply filtering to mock data
  const orders = allOrders.filter((order: Order) => {
    // Status filtering
    if (statusFilter !== "all" && order.status !== statusFilter) {
      return false;
    }
    
    return true;
  });

  // Complete order mutation
  const completeOrderMutation = useMutation({
    mutationFn: async (orderId: number) => {
      // Update order status in store
      orderStore.updateOrderStatus(orderId, "Completed");
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    },
    onSuccess: (data, orderId) => {
      const orderNumber = `O-${orderId < 10 ? 2000 + orderId : orderId}`;
      toast({
        title: "Order Completed",
        description: `Order ${orderNumber} has been marked as completed`,
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Completion Failed",
        description: "Failed to complete order. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Cancel order mutation
  const cancelOrderMutation = useMutation({
    mutationFn: async (orderId: number) => {
      // Update order status in store
      orderStore.updateOrderStatus(orderId, "Cancelled");
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true };
    },
    onSuccess: (data, orderId) => {
      toast({
        title: "Order Cancelled",
        description: "Order has been cancelled",
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Cancellation Failed",
        description: "Failed to cancel order. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Filter orders based on search term
  const filteredOrders = orders.filter((order: Order) =>
    order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.practice_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Functions to handle modal actions
  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    const getStatusColor = (status: string) => {
      switch (status.toLowerCase()) {
        case "draft":
          return "bg-orange-100 text-orange-800";
        case "in progress":
          return "bg-blue-100 text-blue-800";
        case "completed":
          return "bg-green-100 text-green-800";
        case "delivered":
          return "bg-purple-100 text-purple-800";
        case "cancelled":
          return "bg-red-100 text-red-800";
        default:
          return "bg-gray-100 text-gray-800";
      }
    };

    return (
      <Badge className={getStatusColor(status)}>
        {status}
      </Badge>
    );
  };

  // Actions component
  const OrderActions = ({ order }: { order: Order }) => {
    const canEdit = order.status === "Draft";
    const canComplete = !["Completed", "Delivered", "Cancelled"].includes(order.status);
    const canCancel = !["Cancelled", "Delivered"].includes(order.status);

    const handleEditOrder = (orderId: number) => {
      window.location.href = `/order?editOrder=${orderId}`;
    };

    return (
      <div className="flex items-center space-x-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleViewOrder(order)}
          title="View Order Details"
        >
          <Eye className="h-4 w-4" />
        </Button>

        {canEdit && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleEditOrder(order.id)}
            title="Edit Draft Order"
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        )}
        
        {canComplete && (
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700"
            onClick={() => completeOrderMutation.mutate(order.id)}
            disabled={completeOrderMutation.isPending}
            title="Mark as Completed"
          >
            {completeOrderMutation.isPending ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
          </Button>
        )}

        {canCancel && (
          <Button
            size="sm"
            variant="outline"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => cancelOrderMutation.mutate(order.id)}
            disabled={cancelOrderMutation.isPending}
            title="Cancel Order"
          >
            {cancelOrderMutation.isPending ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <X className="h-4 w-4" />
            )}
          </Button>
        )}

        {canCancel && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => cancelOrderMutation.mutate(order.id)}
            disabled={cancelOrderMutation.isPending}
            title="Cancel Order"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-dark-navy mb-2">Order Management</h2>
          <p className="text-gray-600">Track and manage your active orders</p>
        </div>
        <Button 
          onClick={() => window.location.href = '/order'}
          className="bg-primary-blue hover:bg-blue-800 text-white"
        >
          <Package className="h-4 w-4 mr-2" />
          New Order
        </Button>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search orders by ID, subject, or customer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Delivered">Delivered</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Active Orders ({filteredOrders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No orders found</p>
              <p className="text-sm">Create your first order to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-32">
                      <Button variant="ghost" size="sm">
                        Order ID
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Recipients</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order: Order) => (
                    <TableRow key={order.id} className="hover:bg-gray-50">
                      <TableCell className="font-mono text-sm">
                        {order.order_number}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{order.practice_name || "Unknown Practice"}</div>
                          <div className="text-sm text-gray-500">{order.practice_email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{order.subject}</div>
                          <div className="text-sm text-gray-500">
                            {order.template_type} • {order.color_mode}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={order.status} />
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${parseFloat(order.total_cost).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {order.recipient_count.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <OrderActions order={order} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {allOrders.filter((o: Order) => o.status === "In Progress").length}
            </div>
            <p className="text-sm text-gray-600">In Progress</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {allOrders.filter((o: Order) => o.status === "Completed").length}
            </div>
            <p className="text-sm text-gray-600">Completed</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">
              {allOrders.filter((o: Order) => o.status === "Delivered").length}
            </div>
            <p className="text-sm text-gray-600">Delivered</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-primary-blue">
              ${allOrders.reduce((sum: number, o: Order) => sum + parseFloat(o.total_cost), 0).toFixed(2)}
            </div>
            <p className="text-sm text-gray-600">Total Value</p>
          </CardContent>
        </Card>
      </div>

      {/* Order Details Modal */}
      <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Details - {selectedOrder?.order_number}</DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Customer</label>
                  <p className="font-medium">{selectedOrder.practice_name}</p>
                  <p className="text-sm text-gray-600">{selectedOrder.practice_email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="mt-1">
                    <StatusBadge status={selectedOrder.status} />
                  </div>
                </div>
              </div>

              {/* Service Details */}
              <div>
                <label className="text-sm font-medium text-gray-500">Service</label>
                <p className="font-medium">{selectedOrder.subject}</p>
                <p className="text-sm text-gray-600">
                  {selectedOrder.template_type} • {selectedOrder.color_mode}
                </p>
              </div>

              {/* Production Timeline */}
              {selectedOrder.production_start_date && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-3">Production Timeline</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Start Date:</span>
                      <span>{new Date(selectedOrder.production_start_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Expected Completion:</span>
                      <span>{selectedOrder.production_end_date ? new Date(selectedOrder.production_end_date).toLocaleDateString() : "TBD"}</span>
                    </div>
                    {selectedOrder.fulfilled_at && (
                      <div className="flex justify-between">
                        <span>Completed:</span>
                        <span>{new Date(selectedOrder.fulfilled_at).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Cost Breakdown */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-3">Cost Breakdown</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Recipients:</span>
                    <span>{selectedOrder.recipient_count.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Color Mode:</span>
                    <span>{selectedOrder.color_mode}</span>
                  </div>
                  <div className="flex justify-between font-medium text-lg border-t pt-2">
                    <span>Total:</span>
                    <span>${parseFloat(selectedOrder.total_cost).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowOrderDetails(false)}
                >
                  Close
                </Button>
                {selectedOrder.status === "In Progress" && (
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      completeOrderMutation.mutate(selectedOrder.id);
                      setShowOrderDetails(false);
                    }}
                    disabled={completeOrderMutation.isPending}
                  >
                    Mark Complete
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}