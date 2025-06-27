import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Filter
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  // Fetch quotes data (using mock data for now)
  const { data: quotes = mockQuotes, isLoading, refetch } = useQuery({
    queryKey: ["/api/quotes", statusFilter, showArchived],
    queryFn: async () => {
      // For now, return mock data
      // TODO: Replace with real API call
      return mockQuotes;
    }
  });

  // Convert quote to order mutation
  const convertToOrderMutation = useMutation({
    mutationFn: async (quoteId: number) => {
      const response = await apiRequest(`/api/quotes/${quoteId}/convert`, "POST");
      return response;
    },
    onSuccess: (data, quoteId) => {
      toast({
        title: "Quote Converted",
        description: `Quote successfully converted to order`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
    },
    onError: (error) => {
      toast({
        title: "Conversion Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Archive quote mutation
  const archiveQuoteMutation = useMutation({
    mutationFn: async (quoteId: number) => {
      const response = await apiRequest(`/api/quotes/${quoteId}/archive`, "POST");
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Quote Archived",
        description: "Quote has been moved to archive",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
    },
    onError: (error) => {
      toast({
        title: "Archive Failed",
        description: error.message,
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

  // Actions component
  const QuoteActions = ({ quote }: { quote: Quote }) => {
    const canConvert = quote.status === "Quote" && !quote.converted_order_id;
    const canArchive = quote.status !== "Archived";

    return (
      <div className="flex items-center space-x-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => window.open(`/quote?editId=${quote.id}`, '_blank')}
        >
          <Eye className="h-4 w-4" />
        </Button>
        
        {canConvert && (
          <Button
            size="sm"
            className="bg-primary-blue hover:bg-blue-800"
            onClick={() => convertToOrderMutation.mutate(quote.id)}
            disabled={convertToOrderMutation.isPending}
          >
            {convertToOrderMutation.isPending ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            Convert
          </Button>
        )}

        {quote.converted_order_id && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(`/order/${quote.converted_order_id}`, '_blank')}
          >
            View Order
          </Button>
        )}

        {canArchive && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => archiveQuoteMutation.mutate(quote.id)}
            disabled={archiveQuoteMutation.isPending}
          >
            <Archive className="h-4 w-4" />
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
              {quotes.filter((q: Quote) => q.status === "Quote").length}
            </div>
            <p className="text-sm text-gray-600">Pending Quotes</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {quotes.filter((q: Quote) => q.status === "Converted").length}
            </div>
            <p className="text-sm text-gray-600">Converted</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-600">
              {quotes.filter((q: Quote) => q.status === "Archived").length}
            </div>
            <p className="text-sm text-gray-600">Archived</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-primary-blue">
              ${quotes.reduce((sum: number, q: Quote) => sum + parseFloat(q.total_cost), 0).toFixed(2)}
            </div>
            <p className="text-sm text-gray-600">Total Value</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}