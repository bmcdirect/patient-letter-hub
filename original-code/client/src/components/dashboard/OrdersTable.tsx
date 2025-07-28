import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  Filter,
  ArrowUpDown,
  MoreHorizontal,
  Eye,
  RefreshCw,
  Package,
  Clock,
  CheckCircle2,
  Truck,
  Calendar,
  Upload,
} from "lucide-react";

interface Order {
  id: number;
  orderNumber: string;
  userId: string;
  practiceId: number;
  quoteId?: number;
  quoteNumber?: string;
  subject: string;
  templateType: string;
  colorMode: string;
  estimatedRecipients: number;
  recipientCount: number;
  enclosures: number;
  notes: string;
  dataCleansing: boolean;
  ncoaUpdate: boolean;
  firstClassPostage: boolean;
  totalCost: string;
  status: string;
  invoiceNumber?: string;
  productionStartDate?: string;
  productionEndDate?: string;
  fulfilledAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface OrderFile {
  id: number;
  orderId: number;
  fileName: string;
  originalName: string;
  fileType: string;
  filePath: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: string;
}

interface OrdersTableProps {
  orders: Order[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function OrdersTable({
  orders,
  isLoading,
  onRefresh,
}: OrdersTableProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  // Null-safe date formatter
  const fmtDate = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString() : '—';
  
  const fmtDateTime = (d?: string | null) =>
    d ? new Date(d).toLocaleString() : '—';
  
  // State for filtering and sorting
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState<keyof Order>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  
  // State for dialogs
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedOrderPractice, setSelectedOrderPractice] = useState<any>(null);
  const [selectedOrderFiles, setSelectedOrderFiles] = useState<OrderFile[]>([]);
  const [selectedOrderRevisions, setSelectedOrderRevisions] = useState<any[]>([]);
  const [selectedOrderApprovals, setSelectedOrderApprovals] = useState<any[]>([]);

  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number; status: string }) => {
      const response = await apiRequest("PUT", `/api/orders/${orderId}`, {
        status
      });
      return response.json();
    },
    onSuccess: (_, { status }) => {
      toast({
        title: "Order Updated",
        description: `Order status changed to ${status}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Update Failed",
        description: "Failed to update order status. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Filter and sort orders
  const filteredOrders = orders
    .filter(order => {
      const matchesSearch = order.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (order.quoteNumber && order.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === "all" || (order.status || 'draft') === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      const direction = sortDirection === "asc" ? 1 : -1;
      
      if (typeof aVal === "string" && typeof bVal === "string") {
        return aVal.localeCompare(bVal) * direction;
      }
      if (typeof aVal === "number" && typeof bVal === "number") {
        return (aVal - bVal) * direction;
      }
      return 0;
    });

  const handleSort = (field: keyof Order) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleViewOrder = async (order: Order) => {
    setSelectedOrder(order);
    setViewDialogOpen(true);
    
    // Fetch practice details for the order
    try {
      const practiceResponse = await apiRequest("GET", `/api/practices/${order.practiceId}`);
      const practice = await practiceResponse.json();
      setSelectedOrderPractice(practice);
    } catch (error) {

      setSelectedOrderPractice(null);
    }

    // Fetch real order files using operations endpoint
    try {
      const filesResponse = await apiRequest("GET", `/api/admin/orders/${order.id}/files`);
      const files = await filesResponse.json();
      setSelectedOrderFiles(files || []);
    } catch (error) {
      console.error("Failed to fetch order files:", error);
      setSelectedOrderFiles([]);
    }

    // Fetch order revisions (admin notes) using operations endpoint
    try {
      const revisionsResponse = await apiRequest("GET", `/api/admin/orders/${order.id}/revisions`);
      const revisions = await revisionsResponse.json();
      setSelectedOrderRevisions(revisions || []);
    } catch (error) {
      console.error("Failed to fetch order revisions:", error);
      setSelectedOrderRevisions([]);
    }

    // Fetch order approvals (customer feedback) using operations endpoint
    try {
      const approvalsResponse = await apiRequest("GET", `/api/orders/${order.id}/approvals`);
      const approvals = await approvalsResponse.json();
      setSelectedOrderApprovals(approvals || []);
    } catch (error) {
      console.error("Failed to fetch order approvals:", error);
      setSelectedOrderApprovals([]);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            <Clock className="w-3 h-3 mr-1" />
            Draft
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "in-progress":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Package className="w-3 h-3 mr-1" />
            In Progress
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case "delivered":
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            <Truck className="w-3 h-3 mr-1" />
            Delivered
          </Badge>
        );
      default:
        // Handle waiting-approval statuses
        if (status?.startsWith('waiting-approval')) {
          return (
            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
              <Eye className="w-3 h-3 mr-1" />
              Proof Ready
            </Badge>
          );
        }
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusActions = (order: Order) => {
    const actions = [];
    
    switch (order.status) {
      case "draft":
        actions.push(
          <DropdownMenuItem 
            key="upload"
            onClick={() => setLocation(`/upload?orderId=${order.id}`)}
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload Files
          </DropdownMenuItem>
        );
        actions.push(
          <DropdownMenuItem 
            key="start"
            onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: "in-progress" })}
          >
            <Package className="mr-2 h-4 w-4" />
            Start Production
          </DropdownMenuItem>
        );
        break;
      case "pending":
        actions.push(
          <DropdownMenuItem 
            key="start"
            onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: "in-progress" })}
          >
            <Package className="mr-2 h-4 w-4" />
            Start Production
          </DropdownMenuItem>
        );
        break;
      case "in-progress":
        actions.push(
          <DropdownMenuItem 
            key="complete"
            onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: "completed" })}
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Mark Complete
          </DropdownMenuItem>
        );
        break;
      case "completed":
        actions.push(
          <DropdownMenuItem 
            key="deliver"
            onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: "delivered" })}
          >
            <Truck className="mr-2 h-4 w-4" />
            Mark Delivered
          </DropdownMenuItem>
        );
        break;
      default:
        // Handle waiting-approval statuses
        if (order.status?.startsWith('waiting-approval')) {
          actions.push(
            <DropdownMenuItem 
              key="review-proof"
              onClick={() => setLocation(`/orders/${order.id}/proof-review`)}
            >
              <Eye className="mr-2 h-4 w-4" />
              Review Proof
            </DropdownMenuItem>
          );
        }
        break;
    }
    
    return actions;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="border rounded-lg">
          <div className="p-4 border-b">
            <Skeleton className="h-6 w-48" />
          </div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-4 border-b last:border-b-0">
              <div className="flex justify-between items-center">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Filters and Search */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRefresh}
            className="shrink-0"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Data Table */}
        <div className="border rounded-lg bg-white">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("orderNumber")}
                    className="h-auto p-0 font-semibold"
                  >
                    Order #
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="font-semibold">Quote #</TableHead>
                <TableHead className="font-semibold">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("subject")}
                    className="h-auto p-0 font-semibold"
                  >
                    Subject
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="font-semibold">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("recipientCount")}
                    className="h-auto p-0 font-semibold"
                  >
                    Recipients
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="font-semibold">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("total")}
                    className="h-auto p-0 font-semibold"
                  >
                    Total Cost
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("createdAt")}
                    className="h-auto p-0 font-semibold"
                  >
                    Created
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    {searchTerm || statusFilter !== "all" 
                      ? "No orders match your filters" 
                      : "No orders found"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span className="text-primary-blue">{order.orderNumber}</span>
                        {/* Customer Feedback Indicator */}
                        {(order.status === 'approved' || order.status === 'completed' || order.status.includes('waiting-approval')) && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" title="Customer feedback available - click View Details"></div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {order.quoteNumber ? (
                        <span className="text-gray-600">{order.quoteNumber}</span>
                      ) : (
                        <span className="text-gray-400">Direct Order</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate" title={order.subject}>
                        {order.subject}
                      </div>
                    </TableCell>
                    <TableCell>
                      {order.recipientCount?.toLocaleString() || '0'}
                    </TableCell>
                    <TableCell className="font-medium">
                      ${parseFloat(order.total || "0").toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(order.status)}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {fmtDate(order.createdAt)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewOrder(order)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                            {(order.status === 'approved' || order.status === 'completed' || order.status.includes('waiting-approval')) && (
                              <span className="ml-2 px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                                📩 feedback
                              </span>
                            )}
                          </DropdownMenuItem>
                          {getStatusActions(order)}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Results Summary */}
        <div className="text-sm text-gray-500">
          Showing {filteredOrders.length} of {orders.length} orders
        </div>
      </div>

      {/* Order Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              
              {/* PROMINENT Customer Feedback Alert */}
              {selectedOrderApprovals.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 animate-pulse"></div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-blue-900 text-lg mb-2">
                        📩 Customer Feedback Available
                      </h3>
                      {selectedOrderApprovals
                        .sort((a: any, b: any) => new Date(b.decidedAt).getTime() - new Date(a.decidedAt).getTime())
                        .slice(0, 1) // Show only the latest feedback prominently
                        .map((approval: any) => (
                          <div key={approval.id} className="bg-white p-3 rounded border border-blue-100">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium text-blue-800">
                                Latest Decision: {approval.decision === 'approved' ? '✅ APPROVED' : '⚠️ CHANGES REQUESTED'}
                              </span>
                              <span className="text-sm text-blue-600">
                                {fmtDateTime(approval.decidedAt)}
                              </span>
                            </div>
                            {approval.comments && (
                              <div className="bg-blue-25 p-2 rounded">
                                <p className="text-blue-900 font-medium">Customer Message:</p>
                                <p className="text-blue-800 text-sm mt-1 italic">"{approval.comments}"</p>
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Order Number</label>
                  <p className="text-lg font-semibold text-primary-blue">{selectedOrder.orderNumber}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Quote Number</label>
                  <p className="text-lg font-semibold text-gray-600">
                    {selectedOrder.quoteNumber || "Direct Order"}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedOrder.status)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Created</label>
                  <p className="mt-1">{fmtDate(selectedOrder.createdAt)}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Subject</label>
                <p className="mt-1">{selectedOrder.subject}</p>
              </div>
              
              {/* Practice Information */}
              {selectedOrderPractice && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Practice Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Practice Name</label>
                      <p className="mt-1">{selectedOrderPractice.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Contact Email</label>
                      <p className="mt-1">{selectedOrderPractice.email || "Not provided"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Phone</label>
                      <p className="mt-1">{selectedOrderPractice.phone || "Not provided"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Address</label>
                      <p className="mt-1">{selectedOrderPractice.address || "Not provided"}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Template Type</label>
                  <p className="mt-1 capitalize">{selectedOrder.templateType}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Color Mode</label>
                  <p className="mt-1 capitalize">{selectedOrder.colorMode}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Recipients</label>
                  <p className="mt-1">{selectedOrder.recipientCount.toLocaleString()}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Enclosures</label>
                  <p className="mt-1">{selectedOrder.enclosures}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Data Cleansing</label>
                  <p className="mt-1">{selectedOrder.dataCleansing ? "Yes" : "No"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">NCOA Update</label>
                  <p className="mt-1">{selectedOrder.ncoaUpdate ? "Yes" : "No"}</p>
                </div>
              </div>
              
              {/* Files Section - Real Database Data */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Uploaded Files</h4>
                {selectedOrderFiles.length > 0 ? (
                  <div className="space-y-2">
                    {selectedOrderFiles.map((file) => (
                      <div key={file.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm">
                            {file.originalName} 
                            <span className="text-gray-500 ml-2">
                              ({file.fileType}, {(file.fileSize / 1024).toFixed(1)} KB)
                            </span>
                          </span>
                        </div>
                        <span className="text-xs text-gray-400">
                          {fmtDate(file.uploadedAt)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">
                    No files uploaded for this order yet
                  </div>
                )}
              </div>

              {/* Customer Feedback & Revision History */}
              {(selectedOrderRevisions.length > 0 || selectedOrderApprovals.length > 0) && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Communication History</h4>
                  
                  <div className="max-h-80 overflow-y-auto space-y-4 pr-2">
                    {/* Admin Revisions */}
                    {selectedOrderRevisions.length > 0 && (
                      <div>
                        <h5 className="text-xs font-medium text-gray-600 mb-2">Admin Proof Uploads</h5>
                        <div className="space-y-2">
                          {selectedOrderRevisions
                            .sort((a: any, b: any) => (b.createdAt ? new Date(b.createdAt).getTime() : 0) - (a.createdAt ? new Date(a.createdAt).getTime() : 0))
                            .map((revision: any) => (
                              <div key={revision.id} className="border-l-4 border-blue-300 pl-3 py-1">
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="font-medium">Rev {revision.revisionNumber}</span>
                                  <span className="text-gray-500">
                                    {fmtDate(revision.createdAt)}
                                  </span>
                                </div>
                                {revision.adminNotes && (
                                  <div className="text-sm text-gray-700 mt-1 break-words max-w-full">
                                    {revision.adminNotes}
                                  </div>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Customer Feedback */}
                    {selectedOrderApprovals.length > 0 && (
                      <div>
                        <h5 className="text-xs font-medium text-gray-600 mb-2">Customer Feedback</h5>
                        <div className="space-y-2">
                          {selectedOrderApprovals
                            .sort((a: any, b: any) => new Date(b.decidedAt).getTime() - new Date(a.decidedAt).getTime())
                            .map((approval: any) => (
                              <div key={approval.id} className="border-l-4 border-green-300 pl-3 py-1">
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="font-medium">
                                    {approval.decision === 'approved' ? '✓ Approved' : '⚠ Changes Requested'}
                                  </span>
                                  <span className="text-gray-500">
                                    {fmtDate(approval.decidedAt)}
                                  </span>
                                </div>
                                {approval.comments && (
                                  <div className="text-sm text-gray-700 mt-1 font-medium break-words max-w-full">
                                    {approval.comments}
                                  </div>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-500">Total Cost</label>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  ${parseFloat(selectedOrder.totalCost).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
              
              {selectedOrder.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Notes</label>
                  <p className="mt-1 text-gray-700">{selectedOrder.notes}</p>
                </div>
              )}

              {/* Production Timeline */}
              {(selectedOrder.productionStartDate || selectedOrder.productionEndDate || selectedOrder.fulfilledAt) && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Production Timeline</label>
                  <div className="mt-2 space-y-2">
                    {selectedOrder.productionStartDate && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-500" />
                        <span className="text-sm">Started: {fmtDate(selectedOrder.productionStartDate)}</span>
                      </div>
                    )}
                    {selectedOrder.productionEndDate && (
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Completed: {fmtDate(selectedOrder.productionEndDate)}</span>
                      </div>
                    )}
                    {selectedOrder.fulfilledAt && (
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-purple-500" />
                        <span className="text-sm">Delivered: {fmtDate(selectedOrder.fulfilledAt)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                  Close
                </Button>
                {getStatusActions(selectedOrder).length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button>
                        Update Status
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {getStatusActions(selectedOrder)}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}