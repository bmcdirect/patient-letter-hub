import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { TopNavigation } from "@/components/layout/top-navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { ArchiveSection } from "@/components/dashboard/ArchiveSection";
import { 
  FileText, 
  Package, 
  LayoutDashboard,
  TrendingUp,
  Archive,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Settings,
  Calendar,
  ListOrdered,
  X,
  Upload,
  Download,
  Eye,
  Edit,
  Trash2,
  Send,
  Receipt,
  CheckCircle,
  XCircle,
  Clock,
  MoreHorizontal,
  Link2,
  Mail,
  Plus,
  Filter,
  Search,
  ArrowUpDown,
  MessageSquare,
  User
} from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function AdminDashboardClean() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();
  const [isArchiveExpanded, setIsArchiveExpanded] = useState(false);
  
  // Null-safe date formatter
  const fmtDate = (d?: string | null) => d ? new Date(d).toLocaleDateString() : '—';
  
  // Modal states
  const [isProofUploadOpen, setIsProofUploadOpen] = useState(false);
  const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false);
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  
  // Form states
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofNotes, setProofNotes] = useState("");
  const [selectedOrderStatus, setSelectedOrderStatus] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailContent, setEmailContent] = useState("");
  const [isFilesModalOpen, setIsFilesModalOpen] = useState(false);
  const [orderFiles, setOrderFiles] = useState<any[]>([]);
  
  // Filter states
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  // Auto-detect tab based on URL route
  useEffect(() => {
    if (location.includes('/admin/orders')) {
      setActiveTab('orders');
    } else if (location.includes('/admin/quotes')) {
      setActiveTab('quotes');
    } else if (location.includes('/admin/billing')) {
      setActiveTab('invoicing');
    } else if (location.includes('/admin/communication')) {
      setActiveTab('communication');
    } else {
      setActiveTab('overview');
    }
  }, [location]);

  // Fetch dashboard data from admin PostgreSQL endpoints
  const { data: dashboardStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/stats"],
  });

  const { 
    data: quotesResponse, 
    isLoading: quotesLoading, 
    refetch: refetchQuotes 
  } = useQuery({
    queryKey: ["/api/admin/quotes"],
  });

  const { 
    data: ordersResponse, 
    isLoading: ordersLoading, 
    refetch: refetchOrders 
  } = useQuery({
    queryKey: ["/api/admin/orders"],
    refetchInterval: 30000, // Refresh every 30 seconds for real-time updates
  });

  const { data: emailsResponse } = useQuery({
    queryKey: ["/api/admin/emails"],
  });

  const { data: invoicesResponse } = useQuery({
    queryKey: ["/api/admin/invoices"],
  });

  // Extract arrays from API responses with proper type safety
  const quotes = Array.isArray(quotesResponse) ? quotesResponse : [];
  const orders = Array.isArray(ordersResponse) ? ordersResponse : [];
  const emails = Array.isArray(emailsResponse) ? emailsResponse : [];
  const invoices = Array.isArray(invoicesResponse) ? invoicesResponse : [];

  // Helper functions
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'draft': return 'secondary';
      case 'waiting-approval-rev1':
      case 'waiting-approval-rev2': 
      case 'waiting-approval-rev3': return 'destructive';
      case 'approved': return 'default';
      case 'in-progress': return 'default';
      case 'completed': return 'secondary';
      case 'delivered': return 'outline';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <Clock className="h-4 w-4" />;
      case 'waiting-approval-rev1':
      case 'waiting-approval-rev2':
      case 'waiting-approval-rev3': return <AlertCircle className="h-4 w-4" />;
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'in-progress': return <RefreshCw className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'delivered': return <Package className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'draft': return 'Ready for Proof';
      case 'waiting-approval-rev1': return 'Waiting Customer Approval (Rev 1)';
      case 'waiting-approval-rev2': return 'Waiting Customer Approval (Rev 2)';
      case 'waiting-approval-rev3': return 'Waiting Customer Approval (Rev 3)';
      case 'approved': return 'Customer Approved';
      case 'in-progress': return 'In Production';
      case 'completed': return 'Completed';
      case 'delivered': return 'Delivered';
      default: return status?.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Unknown';
    }
  };

  const generateProofReviewLink = (orderId: number) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/orders/${orderId}/proof-review`;
  };

  const handleUploadProof = (order: any) => {
    setSelectedOrder(order);
    setIsProofUploadOpen(true);
  };

  const handleViewOrderDetails = (order: any) => {
    setSelectedOrder(order);
    setIsOrderDetailsOpen(true);
  };

  const handleFileDownload = (fileId: number, fileName: string) => {
    const link = document.createElement('a');
    link.href = `/api/files/${fileId}/download`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleViewFiles = async (order: any) => {
    setSelectedOrder(order);
    try {
      const response = await fetch(`/api/admin/orders/${order.id}/files`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setOrderFiles(data || []);
      
      // Open modal ONLY after state is successfully updated
      setIsFilesModalOpen(true);
    } catch (error) {
      console.error('Error fetching order files:', error);
      toast({
        title: "Error", 
        description: "Failed to load order files",
        variant: "destructive"
      });
    }
  };

  const handleGenerateInvoice = (order: any) => {
    setSelectedOrder(order);
    setIsInvoiceDialogOpen(true);
  };

  const handleSendEmail = (order: any) => {
    setSelectedOrder(order);
    setEmailSubject(`Order ${order.orderNumber} Update`);
    setEmailContent(`Dear ${order.practiceName || 'Customer'},\n\nYour order ${order.orderNumber} has been updated.\n\nBest regards,\nPatientLetterHub Team`);
    setIsEmailDialogOpen(true);
  };

  const handleStatusUpdate = (order: any, newStatus: string) => {
    updateOrderStatusMutation.mutate({ orderId: order.id, status: newStatus });
  };

  const handleProofUploadSubmit = () => {
    if (!selectedOrder || !proofFile) {
      toast({
        title: "Missing Information",
        description: "Please select a file to upload.",
        variant: "destructive",
      });
      return;
    }

    uploadProofMutation.mutate({
      orderId: selectedOrder.id,
      file: proofFile,
      notes: proofNotes
    });
  };

  const handleEmailSubmit = () => {
    if (!selectedOrder || !emailSubject || !emailContent) {
      toast({
        title: "Missing Information",
        description: "Please fill in all email fields.",
        variant: "destructive",
      });
      return;
    }

    sendEmailMutation.mutate({
      orderId: selectedOrder.id,
      subject: emailSubject,
      content: emailContent,
      type: 'custom'
    });
  };

  const { data: practices = [] } = useQuery({
    queryKey: ["/api/practices"],
  });

  // Filter and prepare data
  const filteredOrders = orders.filter((order: any) => {
    const matchesStatus = orderStatusFilter === "all" || order.status === orderStatusFilter;
    const matchesSearch = !searchTerm || 
      order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.practiceName?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Order categories
  const ordersAwaitingApproval = orders.filter((order: any) => 
    order.status?.startsWith('waiting-approval')
  ) || [];
  
  const ordersInProgress = orders.filter((order: any) => 
    order.status === 'in-progress' || order.status === 'approved'
  ) || [];
  
  const completedOrdersList = orders.filter((order: any) => 
    order.status === 'completed'
  ) || [];

  // Get next revision number for an order
  const getNextRevisionNumber = async (orderId: number): Promise<number> => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/revisions`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch revisions');
      }
      
      const revisions = await response.json();
      const maxRevision = revisions.reduce((max: number, rev: any) => 
        Math.max(max, rev.revisionNumber || 0), 0
      );
      
      return maxRevision + 1;
    } catch (error) {
      console.error('Error getting next revision number:', error);
      return 1; // Default to revision 1 if error
    }
  };

  // Proof Upload Mutation
  const uploadProofMutation = useMutation({
    mutationFn: async (data: { orderId: number; file: File; notes: string }) => {
      const nextRevisionNumber = await getNextRevisionNumber(data.orderId);
      
      const formData = new FormData();
      formData.append('proofFile', data.file); // Match backend field name
      formData.append('adminNotes', data.notes);
      formData.append('revisionNumber', nextRevisionNumber.toString());
      
      const response = await fetch(`/api/admin/orders/${data.orderId}/upload-proof`, {
        method: 'POST',
        credentials: 'include', // Include authentication
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Failed to upload proof: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Proof Uploaded",
        description: "Design proof uploaded successfully. Customer will be notified.",
      });
      setIsProofUploadOpen(false);
      setProofFile(null);
      setProofNotes("");
      setSelectedOrder(null);
      refetchOrders();
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update Order Status Mutation
  const updateOrderStatusMutation = useMutation({
    mutationFn: async (data: { orderId: number; status: string }) => {
      const response = await fetch(`/api/admin/orders/${data.orderId}/status`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: data.status })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update status: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Status Updated",
        description: "Order status has been updated successfully.",
      });
      refetchOrders();
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: (error: Error) => {
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
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Generate Invoice Mutation  
  const generateInvoiceMutation = useMutation({
    mutationFn: async (orderId: number) => {
      const response = await apiRequest("POST", `/api/orders/${orderId}/invoice`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Invoice Generated",
        description: "Invoice has been generated successfully.",
      });
      setIsInvoiceDialogOpen(false);
      setSelectedOrder(null);
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Send Email Mutation
  const sendEmailMutation = useMutation({
    mutationFn: async (data: { orderId: number; subject: string; content: string; type: string }) => {
      const response = await apiRequest("POST", `/api/orders/${data.orderId}/send-email`, {
        subject: data.subject,
        content: data.content,
        emailType: data.type
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Email Sent",
        description: "Email notification sent successfully.",
      });
      setIsEmailDialogOpen(false);
      setEmailSubject("");
      setEmailContent("");
      setSelectedOrder(null);
      queryClient.invalidateQueries({ queryKey: ["/api/emails"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Send Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Convert quote to order mutation
  const convertToOrderMutation = useMutation({
    mutationFn: async (quoteId: number) => {
      const response = await apiRequest("POST", `/api/quotes/${quoteId}/convert`);
      const result = await response.json();
      return result;
    },
    onSuccess: async (order: any, quoteId) => {
      toast({
        title: "Success",
        description: `Quote converted to order ${order.orderNumber}`,
      });
      
      // Invalidate queries and wait for them to complete - force refetch
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/quotes"], refetchType: 'active' }),
        queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"], refetchType: 'active' }),
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"], refetchType: 'active' })
      ]);
      
      // Also manually refetch to ensure fresh data
      await Promise.all([
        refetchQuotes(),
        refetchOrders()
      ]);
      
      // Small delay to ensure data updates are processed before redirect
      setTimeout(() => {
        setLocation("/order");
      }, 100);
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
        title: "Conversion Failed",
        description: "Failed to convert quote. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete quote mutation
  const deleteQuoteMutation = useMutation({
    mutationFn: async (quoteId: number) => {
      const response = await apiRequest("DELETE", `/api/quotes/${quoteId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Quote Deleted",
        description: "Quote has been permanently deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
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
        title: "Delete Failed",
        description: "Failed to delete quote. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handler functions
  const handleInvoiceGenerate = () => {
    if (selectedOrder) {
      generateInvoiceMutation.mutate(selectedOrder.id);
    }
  };

  const handleEmailSend = () => {
    if (selectedOrder && emailSubject && emailContent) {
      sendEmailMutation.mutate({
        orderId: selectedOrder.id,
        subject: emailSubject,
        content: emailContent,
        type: 'custom'
      });
    }
  };

  const handleQuoteEdit = (quote: any) => {
    setLocation(`/quotes/create?edit=${quote.id}`);
  };

  const handleRefreshAll = async () => {
    await Promise.all([
      refetchQuotes(),
      refetchOrders(),
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] })
    ]);
  };

  // Prepare archive data
  const archivedQuotes = quotes
    .filter((quote: any) => quote.status === "archived" || quote.status === "converted")
    .map((quote: any) => ({
      id: quote.id,
      number: quote.quoteNumber,
      type: "quote" as const,
      subject: quote.subject,
      totalCost: quote.totalCost,
      status: quote.status,
      createdAt: quote.createdAt,
      convertedAt: quote.status === "converted" ? quote.updatedAt : undefined,
      archivedAt: quote.status === "archived" ? quote.updatedAt : undefined,
    }));

  const completedOrdersArchive = orders
    .filter((order: any) => order.status === "completed" || order.status === "delivered")
    .map((order: any) => ({
      id: order.id,
      number: order.orderNumber,
      type: "order" as const,
      subject: order.subject,
      totalCost: order.totalCost,
      status: order.status,
      createdAt: order.createdAt,
      archivedAt: order.fulfilledAt || order.updatedAt,
    }));

  // Calculate fallback stats from real data if API stats not available
  const computedStats = (dashboardStats as any) || {
    activeQuotes: quotes.filter((q: any) => q.status === "pending").length,
    totalOrders: orders.length,
    pendingOrders: orders.filter((o: any) => o.status === "in-progress").length,
    completedOrders: orders.filter((o: any) => o.status === "completed" || o.status === "delivered").length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavigation />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 ml-64 p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <LayoutDashboard className="h-8 w-8" />
                  Operations Dashboard
                </h1>
                <p className="text-gray-600 mt-1">Complete order processing and workflow management</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleRefreshAll} variant="outline" className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Refresh All
                </Button>
                <Button onClick={() => setLocation("/calendar")} variant="outline" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  Calendar
                </Button>
              </div>
            </div>

            {/* Critical Alerts */}
            <div className="space-y-4">
              {/* Proof Approval Alerts */}
              {ordersAwaitingApproval.length > 0 && (
                <Card className="border-orange-200 bg-orange-50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-orange-600" />
                        <div>
                          <h3 className="font-semibold text-orange-900">
                            {ordersAwaitingApproval.length} Order{ordersAwaitingApproval.length === 1 ? '' : 's'} Awaiting Customer Approval
                          </h3>
                          <p className="text-sm text-orange-700">
                            Customers have proof{ordersAwaitingApproval.length === 1 ? '' : 's'} ready for review. Monitor customer decisions and process approvals.
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {ordersAwaitingApproval.slice(0, 3).map((order: any) => (
                          <Button
                            key={order.id}
                            onClick={() => handleViewOrderDetails(order)}
                            size="sm"
                            className="bg-orange-600 hover:bg-orange-700 text-white"
                          >
                            Monitor {order.orderNumber}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Customer Feedback Alert */}
              {orders.filter((order: any) => order.status === 'approved' || order.status === 'completed').length > 0 && (
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <MessageSquare className="h-5 w-5 text-green-600" />
                        <div>
                          <h3 className="font-semibold text-green-900">
                            📩 Customer Feedback Available
                          </h3>
                          <p className="text-sm text-green-700">
                            Orders with customer approval decisions and feedback ready for review. Click "View Details" to see customer messages.
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {orders
                          .filter((order: any) => order.status === 'approved' || order.status === 'completed')
                          .slice(0, 3)
                          .map((order: any) => (
                            <Button
                              key={order.id}
                              onClick={() => handleViewOrderDetails(order)}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              📩 {order.orderNumber}
                            </Button>
                          ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Orders Ready for Production */}
              {ordersInProgress.length > 0 && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <RefreshCw className="h-5 w-5 text-blue-600" />
                        <div>
                          <h3 className="font-semibold text-blue-900">
                            {ordersInProgress.length} Order{ordersInProgress.length === 1 ? '' : 's'} In Production
                          </h3>
                          <p className="text-sm text-blue-700">
                            Approved orders ready for production processing and completion.
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => setActiveTab("orders")}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Manage Production
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Completed Orders Ready for Invoice */}
              {completedOrdersList.length > 0 && (
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Receipt className="h-5 w-5 text-green-600" />
                        <div>
                          <h3 className="font-semibold text-green-900">
                            {completedOrdersList.length} Completed Order{completedOrdersList.length === 1 ? '' : 's'} Ready for Invoice
                          </h3>
                          <p className="text-sm text-green-700">
                            Orders completed and ready for invoice generation and billing.
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => setActiveTab("invoicing")}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        View Orders
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Operational Workflow Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="quotes">Quotes</TabsTrigger>
                <TabsTrigger value="orders" className="relative">
                  Orders
                  {ordersAwaitingApproval.length > 0 && (
                    <Badge variant="destructive" className="ml-2 px-2 py-0 text-xs">
                      {ordersAwaitingApproval.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="invoicing">Invoice Management</TabsTrigger>
                <TabsTrigger value="communication">Communications</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                {/* Overview Stats & Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Active Quotes</CardTitle>
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{computedStats.activeQuotes || 0}</div>
                      <p className="text-xs text-muted-foreground">
                        Pending approval
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                      <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{computedStats.totalOrders || 0}</div>
                      <p className="text-xs text-muted-foreground">
                        All time
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{computedStats.pendingOrders || 0}</div>
                      <p className="text-xs text-muted-foreground">
                        In progress
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Completed</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{computedStats.completedOrders || 0}</div>
                      <p className="text-xs text-muted-foreground">
                        This month
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Management Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setLocation('/admin/quotes')}>
                    <CardContent className="p-6 text-center">
                      <FileText className="h-8 w-8 mx-auto mb-3 text-blue-600" />
                      <h3 className="font-semibold text-gray-900 mb-2">Manage Quotes</h3>
                      <p className="text-sm text-gray-600">View and convert quotes</p>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setLocation('/admin/orders')}>
                    <CardContent className="p-6 text-center">
                      <ListOrdered className="h-8 w-8 mx-auto mb-3 text-green-600" />
                      <h3 className="font-semibold text-gray-900 mb-2">Manage Orders</h3>
                      <p className="text-sm text-gray-600">Order processing workflow</p>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setLocation('/admin/billing')}>
                    <CardContent className="p-6 text-center">
                      <Settings className="h-8 w-8 mx-auto mb-3 text-purple-600" />
                      <h3 className="font-semibold text-gray-900 mb-2">Billing</h3>
                      <p className="text-sm text-gray-600">Invoice and payment management</p>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setLocation('/admin/settings')}>
                    <CardContent className="p-6 text-center">
                      <Calendar className="h-8 w-8 mx-auto mb-3 text-orange-600" />
                      <h3 className="font-semibold text-gray-900 mb-2">Settings</h3>
                      <p className="text-sm text-gray-600">Configure preferences</p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Quotes Management Tab */}
              <TabsContent value="quotes" className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Quotes Management</h2>
                    <p className="text-gray-600">View and manage customer quotes</p>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-2">
                      <Search className="h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search quotes..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-64"
                      />
                    </div>
                    <Select value={orderStatusFilter} onValueChange={setOrderStatusFilter}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Quotes</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="converted">Converted</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Quotes Table */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Quote Management ({quotes.length} quotes)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Quote #</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Practice</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Recipients</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {quotes.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                                No quotes found
                              </TableCell>
                            </TableRow>
                          ) : (
                            quotes.map((quote: any) => (
                              <TableRow key={quote.id}>
                                <TableCell className="font-medium">
                                  <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-blue-600" />
                                    {quote.quoteNumber}
                                  </div>
                                </TableCell>
                                <TableCell>{quote.userEmail || 'Unknown Customer'}</TableCell>
                                <TableCell>{quote.practiceName || 'Unknown Practice'}</TableCell>
                                <TableCell className="max-w-xs truncate">{quote.subject}</TableCell>
                                <TableCell>
                                  <Badge variant={quote.status === 'pending' ? 'secondary' : 
                                                quote.status === 'approved' ? 'default' : 
                                                quote.status === 'converted' ? 'default' : 'destructive'}>
                                    {quote.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>{quote.estimatedRecipients || 0}</TableCell>
                                <TableCell>${parseFloat(quote.totalCost || '0').toFixed(2)}</TableCell>
                                <TableCell>
                                  {fmtDate(quote.createdAt)}
                                </TableCell>
                                <TableCell>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => window.open(`/quotes/${quote.id}`, '_blank')}>
                                        <Eye className="h-4 w-4 mr-2" />
                                        View Details
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => window.open(`/quotes/${quote.id}/edit`, '_blank')}>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit Quote
                                      </DropdownMenuItem>
                                      {quote.status === 'pending' && (
                                        <DropdownMenuItem onClick={() => window.open(`/quotes/${quote.id}/convert`, '_blank')}>
                                          <Link2 className="h-4 w-4 mr-2" />
                                          Convert to Order
                                        </DropdownMenuItem>
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Orders Management Tab */}
              <TabsContent value="orders" className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Order Processing Workflow</h2>
                    <p className="text-gray-600">Manage order lifecycle from design to completion</p>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-2">
                      <Search className="h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search orders..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-64"
                      />
                    </div>
                    <Select value={orderStatusFilter} onValueChange={setOrderStatusFilter}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Orders</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="waiting-approval-rev1">Awaiting Approval Rev1</SelectItem>
                        <SelectItem value="waiting-approval-rev2">Awaiting Approval Rev2</SelectItem>
                        <SelectItem value="waiting-approval-rev3">Awaiting Approval Rev3</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Orders Table */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Order Management ({filteredOrders.length} orders)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Order #</TableHead>
                            <TableHead>Customer Name</TableHead>
                            <TableHead>Practice Name</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead>Mail Date</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredOrders.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                                No orders found matching your criteria
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredOrders.map((order: any) => (
                              <TableRow key={order.id}>
                                <TableCell className="font-medium">
                                  <div className="flex items-center gap-2">
                                    {getStatusIcon(order.status)}
                                    {order.orderNumber}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {order.userFirstName && order.userLastName 
                                    ? `${order.userFirstName} ${order.userLastName}`
                                    : order.userEmail || 'Unknown Customer'
                                  }
                                </TableCell>
                                <TableCell>{order.practiceName || 'Unknown Practice'}</TableCell>
                                <TableCell className="max-w-xs truncate">{order.subject}</TableCell>
                                <TableCell>
                                  <Badge variant={getStatusBadgeVariant(order.status)}>
                                    {getStatusLabel(order.status)}
                                  </Badge>
                                </TableCell>
                                <TableCell className="font-medium">${parseFloat(order.totalCost || '0').toFixed(2)}</TableCell>
                                <TableCell>{fmtDate(order.createdAt)}</TableCell>
                                <TableCell>
                                  {order.preferredMailDate 
                                    ? fmtDate(order.preferredMailDate)
                                    : 'Not set'
                                  }
                                </TableCell>
                                <TableCell>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" className="h-8 w-8 p-0">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56">
                                      <DropdownMenuItem onClick={() => handleViewOrderDetails(order)}>
                                        <Eye className="mr-2 h-4 w-4" />
                                        View Details
                                      </DropdownMenuItem>
                                      
                                      <DropdownMenuItem onClick={() => handleViewFiles(order)}>
                                        <FileText className="mr-2 h-4 w-4" />
                                        View Files
                                      </DropdownMenuItem>
                                      
                                      {order.status === 'draft' && (
                                        <DropdownMenuItem onClick={() => handleUploadProof(order)}>
                                          <Upload className="mr-2 h-4 w-4" />
                                          Upload Proof
                                        </DropdownMenuItem>
                                      )}
                                      
                                      {/* Status Management - Complete Workflow */}
                                      
                                      {order.status === 'pending' && (
                                        <DropdownMenuItem onClick={() => handleStatusUpdate(order, 'draft')}>
                                          <Edit className="mr-2 h-4 w-4" />
                                          Ready for Proof
                                        </DropdownMenuItem>
                                      )}
                                      
                                      {order.status === 'draft' && (
                                        <DropdownMenuItem onClick={() => handleStatusUpdate(order, 'pending')}>
                                          <Clock className="mr-2 h-4 w-4" />
                                          Back to Pending
                                        </DropdownMenuItem>
                                      )}
                                      
                                      {order.status?.startsWith('waiting-approval') && (
                                        <DropdownMenuItem onClick={() => {
                                          const url = generateProofReviewLink(order.id);
                                          navigator.clipboard.writeText(url);
                                          toast({ title: "Link Copied", description: "Proof review link copied to clipboard" });
                                        }}>
                                          <Link2 className="mr-2 h-4 w-4" />
                                          Copy Review Link
                                        </DropdownMenuItem>
                                      )}
                                      
                                      {order.status === 'approved' && (
                                        <DropdownMenuItem onClick={() => handleStatusUpdate(order, 'in-progress')}>
                                          <Package className="mr-2 h-4 w-4" />
                                          Start Production
                                        </DropdownMenuItem>
                                      )}
                                      
                                      {order.status === 'in-progress' && (
                                        <>
                                          <DropdownMenuItem onClick={() => handleStatusUpdate(order, 'completed')}>
                                            <CheckCircle className="mr-2 h-4 w-4" />
                                            Mark Completed
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => handleStatusUpdate(order, 'on-hold')}>
                                            <Clock className="mr-2 h-4 w-4" />
                                            Put On Hold
                                          </DropdownMenuItem>
                                        </>
                                      )}
                                      
                                      {order.status === 'completed' && (
                                        <>
                                          {!order.invoiceId && (
                                            <DropdownMenuItem onClick={() => handleGenerateInvoice(order)}>
                                              <Receipt className="mr-2 h-4 w-4" />
                                              Generate Invoice
                                            </DropdownMenuItem>
                                          )}
                                          {order.invoiceId && (
                                            <DropdownMenuItem onClick={() => {
                                              const invoice = invoices.find((inv: any) => inv.id === order.invoiceId);
                                              if (invoice) {
                                                window.open(`/api/invoices/${invoice.id}/pdf`, '_blank');
                                              }
                                            }}>
                                              <Download className="mr-2 h-4 w-4" />
                                              Download Invoice
                                            </DropdownMenuItem>
                                          )}
                                          <DropdownMenuItem onClick={() => handleStatusUpdate(order, 'delivered')}>
                                            <Send className="mr-2 h-4 w-4" />
                                            Mark Delivered
                                          </DropdownMenuItem>
                                        </>
                                      )}
                                      
                                      {order.status === 'on-hold' && (
                                        <DropdownMenuItem onClick={() => handleStatusUpdate(order, 'in-progress')}>
                                          <RefreshCw className="mr-2 h-4 w-4" />
                                          Resume Production
                                        </DropdownMenuItem>
                                      )}
                                      
                                      {order.status === 'revision-requested' && (
                                        <DropdownMenuItem onClick={() => handleStatusUpdate(order, 'draft')}>
                                          <Edit className="mr-2 h-4 w-4" />
                                          Back to Draft
                                        </DropdownMenuItem>
                                      )}
                                      

                                      
                                      <DropdownMenuItem onClick={() => handleSendEmail(order)}>
                                        <Mail className="mr-2 h-4 w-4" />
                                        Send Email
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Invoice Management Tab */}
              <TabsContent value="invoicing" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Receipt className="h-5 w-5" />
                      Invoice Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Total Invoices</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{invoices.length}</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Pending Payment</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">
                              {invoices.filter((inv: any) => inv.status === 'pending').length}
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Monthly Revenue</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">
                              ${invoices.reduce((sum: number, inv: any) => sum + parseFloat(inv.amount || '0'), 0).toFixed(2)}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      <div className="text-center py-8 text-gray-500">
                        <Receipt className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <h3 className="text-lg font-semibold mb-2">Invoice Management</h3>
                        <p className="text-sm">
                          Complete invoice generation and payment tracking system.<br />
                          View invoice history, manage payment status, and track revenue.
                        </p>
                        <Button 
                          onClick={() => setLocation("/invoices")} 
                          className="mt-4"
                        >
                          View All Invoices
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Communications Tab */}
              <TabsContent value="communication" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="h-5 w-5" />
                      Customer Communications
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Total Messages</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{emails.length}</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Pending Responses</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">
                              {ordersAwaitingApproval.length}
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Active Conversations</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">
                              {orders.filter((order: any) => order.status === 'waiting-approval' || order.status === 'approved').length}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      <div className="text-center py-8 text-gray-500">
                        <Mail className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <h3 className="text-lg font-semibold mb-2">Communication Center</h3>
                        <p className="text-sm">
                          Manage customer communications and approval workflows.<br />
                          Track email notifications, customer feedback, and approval status.
                        </p>
                        <Button 
                          onClick={() => setLocation("/emails")} 
                          className="mt-4"
                        >
                          View All Communications
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Files Modal */}
            <Dialog open={isFilesModalOpen} onOpenChange={setIsFilesModalOpen}>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Order Files - {selectedOrder?.orderNumber}</DialogTitle>
                  <DialogDescription>
                    All files associated with this order including proofs, revisions, and final artwork.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">

                  {orderFiles.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                      <h3 className="mt-2 text-sm font-semibold">No files found</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        No files have been uploaded for this order yet.
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {orderFiles.map((file: any) => (
                        <Card key={file.id}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <FileText className="h-5 w-5 text-blue-600" />
                                <div>
                                  <p className="font-medium">{file.originalName}</p>
                                  <p className="text-sm text-muted-foreground">
                                    Uploaded: {fmtDate(file.uploadedAt)}
                                    {file.notes && ` • ${file.notes}`}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => handleFileDownload(file.id, file.originalName)}
                                >
                                  <Download className="h-4 w-4 mr-1" />
                                  Download
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsFilesModalOpen(false)}>
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Proof Upload Modal */}
            <Dialog open={isProofUploadOpen} onOpenChange={setIsProofUploadOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Upload Design Proof</DialogTitle>
                  <DialogDescription>
                    Upload the design proof for order {selectedOrder?.orderNumber}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Professional File Upload Section */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-gray-400 transition-colors">
                    <div className="flex items-start space-x-3">
                      <FileText className="h-5 w-5 text-gray-400 mt-1" />
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900">
                          Proof File <span className="text-red-500">*</span>
                        </h4>
                        <p className="text-xs text-gray-500 mb-3">PDF, JPG, PNG files supported</p>

                        {proofFile ? (
                          <div className="flex items-center justify-between bg-gray-50 rounded p-2">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{proofFile.name}</p>
                              <p className="text-xs text-gray-500">{(proofFile.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setProofFile(null)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                              className="hidden"
                            />
                            <div className="flex items-center space-x-2 text-blue-600 hover:text-blue-700">
                              <Upload className="h-4 w-4" />
                              <span className="text-sm">Choose file</span>
                            </div>
                          </label>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="proof-notes">Design Notes (Optional)</Label>
                    <Textarea
                      id="proof-notes"
                      value={proofNotes}
                      onChange={(e) => setProofNotes(e.target.value)}
                      placeholder="Add any notes about the design or changes made..."
                      rows={3}
                      className="mt-1"
                      spellCheck="true"
                      lang="en-US"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsProofUploadOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleProofUploadSubmit}
                    disabled={uploadProofMutation.isPending || !proofFile}
                  >
                    {uploadProofMutation.isPending ? "Uploading..." : "Upload Proof"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Order Details Modal */}
            <Dialog open={isOrderDetailsOpen} onOpenChange={setIsOrderDetailsOpen}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Order Details - {selectedOrder?.orderNumber}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {selectedOrder && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Customer</Label>
                        <p className="text-sm font-medium">{selectedOrder.practiceName}</p>
                      </div>
                      <div>
                        <Label>Status</Label>
                        <Badge variant={getStatusBadgeVariant(selectedOrder.status)}>
                          {selectedOrder.status?.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                        </Badge>
                      </div>
                      <div>
                        <Label>Subject</Label>
                        <p className="text-sm">{selectedOrder.subject}</p>
                      </div>
                      <div>
                        <Label>Total Cost</Label>
                        <p className="text-sm font-medium">${parseFloat(selectedOrder.totalCost || '0').toFixed(2)}</p>
                      </div>
                      <div>
                        <Label>Created</Label>
                        <p className="text-sm">{fmtDate(selectedOrder.createdAt)}</p>
                      </div>
                      <div>
                        <Label>Template Type</Label>
                        <p className="text-sm">{selectedOrder.templateType}</p>
                      </div>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsOrderDetailsOpen(false)}>
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Invoice Generate Modal */}
            <Dialog open={isInvoiceDialogOpen} onOpenChange={setIsInvoiceDialogOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Generate Invoice</DialogTitle>
                  <DialogDescription>
                    Generate an invoice for completed order {selectedOrder?.orderNumber}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Order Summary</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Order:</span>
                        <span>{selectedOrder?.orderNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Customer:</span>
                        <span>{selectedOrder?.practiceName}</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>Total:</span>
                        <span>${parseFloat(selectedOrder?.totalCost || '0').toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsInvoiceDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleInvoiceGenerate}
                    disabled={generateInvoiceMutation.isPending}
                  >
                    {generateInvoiceMutation.isPending ? "Generating..." : "Generate Invoice"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Email Dialog */}
            <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Send Email to Customer</DialogTitle>
                  <DialogDescription>
                    Send an email regarding order {selectedOrder?.orderNumber}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email-subject">Subject</Label>
                    <Input
                      id="email-subject"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      placeholder="Enter email subject"
                      className="mt-1"
                      spellCheck="true"
                      lang="en-US"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email-content">Message</Label>
                    <Textarea
                      id="email-content"
                      value={emailContent}
                      onChange={(e) => setEmailContent(e.target.value)}
                      placeholder="Enter your message..."
                      rows={6}
                      className="mt-1"
                      spellCheck="true"
                      lang="en-US"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsEmailDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleEmailSend}
                    disabled={sendEmailMutation.isPending}
                  >
                    {sendEmailMutation.isPending ? "Sending..." : "Send Email"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </div>
    </div>
  );
}
