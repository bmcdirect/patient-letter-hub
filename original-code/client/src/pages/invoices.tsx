import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useSessionAuth } from "@/hooks/useSessionAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Receipt, 
  Download, 
  Eye, 
  MoreHorizontal, 
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";

interface Invoice {
  id: number;
  invoiceNumber: string;
  orderId: number;
  invoiceDate: string;
  dueDate: string;
  subtotal: string;
  totalAmount: string;
  status: string;
  paymentTerms: string;
  paidAt?: string;
  paidAmount?: string;
  notes?: string;
}

const getStatusBadge = (status: string) => {
  const variants = {
    draft: { variant: "secondary" as const, text: "Draft" },
    sent: { variant: "default" as const, text: "Sent" },
    paid: { variant: "secondary" as const, text: "Paid" },
    overdue: { variant: "destructive" as const, text: "Overdue" },
    cancelled: { variant: "outline" as const, text: "Cancelled" }
  };
  
  const config = variants[status as keyof typeof variants] || variants.draft;
  return <Badge variant={config.variant}>{config.text}</Badge>;
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'paid':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'overdue':
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    case 'sent':
      return <Clock className="h-4 w-4 text-blue-500" />;
    default:
      return <Receipt className="h-4 w-4 text-gray-500" />;
  }
};

export default function Invoices() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useSessionAuth();
  const [activeTab, setActiveTab] = useState("all");
  
  // Null-safe date formatter
  const fmtDate = (d?: string | null) => d ? new Date(d).toLocaleDateString() : '—';

  // Redirect if not authenticated
  if (!authLoading && !isAuthenticated) {
    window.location.href = "/api/login";
    return null;
  }

  const { data: invoices = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/invoices"],
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
  });

  const downloadPDFMutation = useMutation({
    mutationFn: async (invoiceId: number) => {
      const response = await fetch(`/api/invoices/${invoiceId}/pdf`);
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `invoice-${invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
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
        title: "Download Failed",
        description: "Failed to download invoice PDF",
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ invoiceId, status }: { invoiceId: number; status: string }) => {
      return await apiRequest("PUT", `/api/invoices/${invoiceId}/status`, { status });
    },
    onSuccess: () => {
      toast({
        title: "Status Updated",
        description: "Invoice status has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
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
        description: "Failed to update invoice status",
        variant: "destructive",
      });
    },
  });

  const handleDownloadPDF = (invoiceId: number) => {
    downloadPDFMutation.mutate(invoiceId);
  };

  const handleStatusUpdate = (invoiceId: number, status: string) => {
    updateStatusMutation.mutate({ invoiceId, status });
  };

  // Filter invoices based on active tab
  const filteredInvoices = invoices.filter((invoice: Invoice) => {
    if (activeTab === "all") return true;
    if (activeTab === "pending") return ["draft", "sent"].includes(invoice.status);
    if (activeTab === "paid") return invoice.status === "paid";
    if (activeTab === "overdue") return invoice.status === "overdue";
    return true;
  });

  // Calculate totals
  const totalAmount = invoices.reduce((sum: number, invoice: Invoice) => 
    sum + parseFloat(invoice.totalAmount), 0
  );
  const paidAmount = invoices
    .filter((invoice: Invoice) => invoice.status === "paid")
    .reduce((sum: number, invoice: Invoice) => sum + parseFloat(invoice.totalAmount), 0);
  const pendingAmount = invoices
    .filter((invoice: Invoice) => ["draft", "sent", "overdue"].includes(invoice.status))
    .reduce((sum: number, invoice: Invoice) => sum + parseFloat(invoice.totalAmount), 0);

  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-32"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Invoice Management</h1>
        <p className="text-gray-600">Track and manage your billing information</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoiced</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {invoices.length} invoice{invoices.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Amount Paid</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${paidAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {invoices.filter(i => i.status === "paid").length} paid
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">${pendingAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {invoices.filter(i => ["draft", "sent", "overdue"].includes(i.status)).length} pending
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
          <CardDescription>Manage your billing history and payment status</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">All Invoices</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="paid">Paid</TabsTrigger>
              <TabsTrigger value="overdue">Overdue</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4">
              {filteredInvoices.length === 0 ? (
                <div className="text-center py-12">
                  <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices found</h3>
                  <p className="text-gray-500">
                    {activeTab === "all" 
                      ? "No invoices have been generated yet." 
                      : `No ${activeTab} invoices found.`}
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInvoices.map((invoice: Invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(invoice.status)}
                              <span>{invoice.invoiceNumber}</span>
                            </div>
                          </TableCell>
                          <TableCell>{fmtDate(invoice.invoiceDate)}</TableCell>
                          <TableCell>{fmtDate(invoice.dueDate)}</TableCell>
                          <TableCell className="font-medium">${parseFloat(invoice.totalAmount).toFixed(2)}</TableCell>
                          <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem 
                                  onClick={() => handleDownloadPDF(invoice.id)}
                                  disabled={downloadPDFMutation.isPending}
                                >
                                  <Download className="mr-2 h-4 w-4" />
                                  Download PDF
                                </DropdownMenuItem>
                                
                                {invoice.status === "draft" && (
                                  <DropdownMenuItem 
                                    onClick={() => handleStatusUpdate(invoice.id, "sent")}
                                    disabled={updateStatusMutation.isPending}
                                  >
                                    Send Invoice
                                  </DropdownMenuItem>
                                )}
                                
                                {invoice.status === "sent" && (
                                  <DropdownMenuItem 
                                    onClick={() => handleStatusUpdate(invoice.id, "paid")}
                                    disabled={updateStatusMutation.isPending}
                                  >
                                    Mark as Paid
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}