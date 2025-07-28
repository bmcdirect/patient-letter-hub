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
  Archive, 
  CheckCircle2,
  Eye,
  RefreshCw,
  Filter,
  Trash2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { orderStore } from "@/lib/orderStore";
import { quoteStore } from "@/lib/quoteStore";

interface Quote {
  id: number;
  quote_number: string;
  user_id: string;
  practice_id: number;
  subject: string;
  template_type: string;
  color_mode: string;
  estimated_recipients: number;
  total_cost: string;
  status: string;
  converted_order_id?: number;
  created_at: string;
  updated_at: string;
  // Practice info (joined)
  practice_name?: string;
  practice_email?: string;
}

interface QuotesManagementProps {
  userId: string;
}

export default function QuotesManagement({ userId }: QuotesManagementProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [showQuoteDetails, setShowQuoteDetails] = useState(false);
  const [storeQuotes, setStoreQuotes] = useState<any[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Subscribe to quote store changes
  React.useEffect(() => {
    const unsubscribe = quoteStore.subscribe(() => {
      setStoreQuotes(quoteStore.getQuotes());
    });
    
    // Initialize with current quotes
    setStoreQuotes(quoteStore.getQuotes());
    
    return unsubscribe;
  }, []);

  // Mock data for testing the table structure
  const mockQuotes: Quote[] = [
    {
      id: 1,
      quote_number: "Q-1001",
      user_id: "user123",
      practice_id: 1,
      subject: "Practice Relocation Notice",
      template_type: "custom",
      color_mode: "Color",
      estimated_recipients: 1250,
      total_cost: "1625.00",
      status: "Quote",
      created_at: "2025-06-27T10:00:00Z",
      updated_at: "2025-06-27T10:00:00Z",
      practice_name: "Sunshine Dental",
      practice_email: "info@sunshinedental.com"
    },
    {
      id: 2,
      quote_number: "Q-1002",
      user_id: "user123",
      practice_id: 2,
      subject: "Provider Departure Notification",
      template_type: "custom",
      color_mode: "Black and White",
      estimated_recipients: 800,
      total_cost: "520.00",
      status: "Converted",
      converted_order_id: 15,
      created_at: "2025-06-26T14:30:00Z",
      updated_at: "2025-06-27T09:15:00Z",
      practice_name: "Healthy Smiles Family Dentistry",
      practice_email: "contact@healthysmiles.com"
    },
    {
      id: 3,
      quote_number: "Q-1003",
      user_id: "user123",
      practice_id: 1,
      subject: "HIPAA Breach Notification",
      template_type: "custom",
      color_mode: "Color",
      estimated_recipients: 450,
      total_cost: "585.00",
      status: "Archived",
      created_at: "2025-06-25T11:20:00Z",
      updated_at: "2025-06-25T11:20:00Z",
      practice_name: "Sunshine Dental",
      practice_email: "info@sunshinedental.com"
    }
  ];

  // Fetch quotes data (combining mock data with store quotes)
  const { data: allQuotes = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/quotes", statusFilter, showArchived, storeQuotes.length],
    queryFn: async () => {
      // Use quotes from store instead of mock data
      return storeQuotes.length > 0 ? storeQuotes : mockQuotes;
    }
  });

  // Apply filtering to mock data
  const quotes = allQuotes.filter((quote: Quote) => {
    // Status filtering
    if (statusFilter !== "all" && quote.status !== statusFilter) {
      return false;
    }
    
    // Archive filtering
    if (!showArchived && quote.status === "Archived") {
      return false;
    }
    
    return true;
  });

  // Convert quote to order mutation
  const convertToOrderMutation = useMutation({
    mutationFn: async (quoteId: number) => {
      const quote = quoteStore.getQuote(quoteId);
      if (!quote) throw new Error("Quote not found");

      // Create new order from quote data
      const newOrder = orderStore.addOrder({
        quote_id: quoteId,
        practice_id: quote.practice_id,
        subject: quote.subject,
        template_type: quote.template_type,
        color_mode: quote.color_mode,
        recipient_count: quote.estimated_recipients,
        total_cost: quote.total_cost,
        practice_name: quote.practice_name,
        practice_email: quote.practice_email
      });

      // Update quote status to converted
      const updatedQuote = quoteStore.convertQuoteToOrder(quoteId, newOrder.id);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { orderId: newOrder.order_number, orderDbId: newOrder.id, success: true };
    },
    onSuccess: (data, quoteId) => {
      toast({
        title: "Quote Converted",
        description: `Quote successfully converted to order ${data.orderId}`,
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Conversion Failed",
        description: "Failed to convert quote. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Archive quote mutation (mock handler)
  const archiveQuoteMutation = useMutation({
    mutationFn: async (quoteId: number) => {
      // Mock archive - simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true };
    },
    onSuccess: (data, quoteId) => {
      toast({
        title: "Quote Archived",
        description: "Quote has been moved to archive",
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Archive Failed",
        description: "Failed to archive quote. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete quote mutation (mock handler)
  const deleteQuoteMutation = useMutation({
    mutationFn: async (quoteId: number) => {
      // Mock delete - simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true };
    },
    onSuccess: (data, quoteId) => {
      toast({
        title: "Quote Deleted",
        description: "Quote has been permanently deleted",
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Delete Failed",
        description: "Failed to delete quote. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Filter quotes based on search term
  const filteredQuotes = quotes.filter((quote: Quote) =>
    quote.quote_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quote.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quote.practice_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    const getStatusColor = (status: string) => {
      switch (status.toLowerCase()) {
        case "quote":
          return "bg-blue-100 text-blue-800";
        case "converted":
          return "bg-green-100 text-green-800";
        case "archived":
          return "bg-gray-100 text-gray-800";
        case "expired":
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

  // Functions to handle modal actions
  const handleViewQuote = (quote: Quote) => {
    setSelectedQuote(quote);
    setShowQuoteDetails(true);
  };

  // Actions component
  const QuoteActions = ({ quote }: { quote: Quote }) => {
    const canConvert = quote.status === "Quote" && !quote.converted_order_id;
    const canArchive = quote.status !== "Archived";
    const canDelete = quote.status !== "Converted";

    return (
      <div className="flex items-center space-x-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleViewQuote(quote)}
          title="View Quote Details"
        >
          <Eye className="h-4 w-4" />
        </Button>
        
        {canConvert && (
          <Button
            size="sm"
            className="bg-primary-blue hover:bg-blue-800"
            onClick={() => window.location.href = `/order?fromQuote=${quote.id}`}
            title="Convert to Order"
          >
            <CheckCircle2 className="h-4 w-4" />
          </Button>
        )}

        {quote.converted_order_id && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => toast({ title: "Order View", description: `Would navigate to order ${quote.converted_order_id}` })}
            title="View Converted Order"
          >
            <FileText className="h-4 w-4" />
          </Button>
        )}

        {canArchive && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => archiveQuoteMutation.mutate(quote.id)}
            disabled={archiveQuoteMutation.isPending}
            title="Archive Quote"
          >
            <Archive className="h-4 w-4" />
          </Button>
        )}

        {canDelete && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => deleteQuoteMutation.mutate(quote.id)}
            disabled={deleteQuoteMutation.isPending}
            title="Delete Quote"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
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
          <h2 className="text-2xl font-bold text-dark-navy mb-2">Quote Management</h2>
          <p className="text-gray-600">Manage your quotes and convert them to orders</p>
        </div>
        <Button 
          onClick={() => window.location.href = '/quote'}
          className="bg-primary-blue hover:bg-blue-800 text-white"
        >
          <FileText className="h-4 w-4 mr-2" />
          New Quote
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
                  placeholder="Search quotes by ID, subject, or customer..."
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
                <SelectItem value="Quote">Pending</SelectItem>
                <SelectItem value="Converted">Converted</SelectItem>
                <SelectItem value="Archived">Archived</SelectItem>
                <SelectItem value="Expired">Expired</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => setShowArchived(!showArchived)}
              className={showArchived ? "bg-gray-100" : ""}
            >
              <Archive className="h-4 w-4 mr-2" />
              {showArchived ? "Hide Archive" : "Show Archive"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quotes Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Quotes ({filteredQuotes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : filteredQuotes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No quotes found</p>
              <p className="text-sm">Create your first quote to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-32">
                      <Button variant="ghost" size="sm">
                        Quote ID
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Recipients</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuotes.map((quote: Quote) => (
                    <TableRow key={quote.id} className="hover:bg-gray-50">
                      <TableCell className="font-mono text-sm">
                        {quote.quote_number}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{quote.practice_name || "Unknown Practice"}</div>
                          <div className="text-sm text-gray-500">{quote.practice_email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{quote.subject}</div>
                          <div className="text-sm text-gray-500">
                            {quote.template_type} • {quote.color_mode}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${parseFloat(quote.total_cost).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {quote.estimated_recipients.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={quote.status} />
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(quote.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <QuoteActions quote={quote} />
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
              {allQuotes.filter((q: Quote) => q.status === "Quote").length}
            </div>
            <p className="text-sm text-gray-600">Pending Quotes</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {allQuotes.filter((q: Quote) => q.status === "Converted").length}
            </div>
            <p className="text-sm text-gray-600">Converted</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-600">
              {allQuotes.filter((q: Quote) => q.status === "Archived").length}
            </div>
            <p className="text-sm text-gray-600">Archived</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-primary-blue">
              ${allQuotes.reduce((sum: number, q: Quote) => sum + parseFloat(q.total_cost), 0).toFixed(2)}
            </div>
            <p className="text-sm text-gray-600">Total Value</p>
          </CardContent>
        </Card>
      </div>

      {/* Quote Details Modal */}
      <Dialog open={showQuoteDetails} onOpenChange={setShowQuoteDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Quote Details - {selectedQuote?.quote_number}</DialogTitle>
          </DialogHeader>
          
          {selectedQuote && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Customer</label>
                  <p className="font-medium">{selectedQuote.practice_name}</p>
                  <p className="text-sm text-gray-600">{selectedQuote.practice_email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="mt-1">
                    <StatusBadge status={selectedQuote.status} />
                  </div>
                </div>
              </div>

              {/* Service Details */}
              <div>
                <label className="text-sm font-medium text-gray-500">Service</label>
                <p className="font-medium">{selectedQuote.subject}</p>
                <p className="text-sm text-gray-600">
                  {selectedQuote.template_type} • {selectedQuote.color_mode}
                </p>
              </div>

              {/* Cost Breakdown */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-3">Cost Breakdown</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Recipients:</span>
                    <span>{selectedQuote.estimated_recipients.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Color Mode:</span>
                    <span>{selectedQuote.color_mode}</span>
                  </div>
                  <div className="flex justify-between font-medium text-lg border-t pt-2">
                    <span>Total:</span>
                    <span>${parseFloat(selectedQuote.total_cost).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="text-gray-500">Created</label>
                  <p>{new Date(selectedQuote.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-gray-500">Last Updated</label>
                  <p>{new Date(selectedQuote.updated_at).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowQuoteDetails(false)}
                >
                  Close
                </Button>
                {selectedQuote.status === "Quote" && !selectedQuote.converted_order_id && (
                  <Button
                    className="bg-primary-blue hover:bg-blue-800"
                    onClick={() => {
                      convertToOrderMutation.mutate(selectedQuote.id);
                      setShowQuoteDetails(false);
                    }}
                    disabled={convertToOrderMutation.isPending}
                  >
                    Convert to Order
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