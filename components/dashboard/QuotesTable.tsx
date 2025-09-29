"use client";

import { useState } from "react";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
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
  Edit2,
  ArrowRight,
  Archive,
  Trash2,
  Eye,
  RefreshCw,
} from "lucide-react";

// Table primitives
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Types

interface QuotesTableProps {
  quotes: any[]; // TODO: Replace with correct type
  isLoading: boolean;
  onRefresh: () => void;
  onConvert: (quoteId: string) => void;
  onEdit: (quote: any) => void;
  onDelete: (quoteId: string) => void;
}

export function QuotesTable({
  quotes,
  isLoading,
  onRefresh,
  onConvert,
  onEdit,
  onDelete,
}: QuotesTableProps) {
  // Null-safe date formatter
  const fmtDate = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString() : '—';

  // State for filtering and sorting
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // State for dialogs
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [quoteToDelete, setQuoteToDelete] = useState<string | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<any | null>(null);

  // Filter quotes (server handles sorting by created_at DESC)
  const filteredQuotes = quotes
    .filter(quote => {
      const matchesSearch = quote.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           quote.quoteNumber?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || (quote.status || 'pending') === statusFilter;
      return matchesSearch && matchesStatus;
    });

  const handleDeleteClick = (quoteId: string) => {
    setQuoteToDelete(quoteId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (quoteToDelete) {
      onDelete(quoteToDelete);
      setDeleteDialogOpen(false);
      setQuoteToDelete(null);
    }
  };

  const handleViewQuote = (quote: any) => {
    setSelectedQuote(quote);
    setViewDialogOpen(true);
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case "converted":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Converted</Badge>;
      case "archived":
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Archived</Badge>;
      default:
        return <Badge variant="outline">{status || 'Unknown'}</Badge>;
    }
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
          {[...Array(5)].map((_, i) => (
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
              placeholder="Search quotes..."
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
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="converted">Converted</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
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
                  Quote #
                </TableHead>
                <TableHead className="font-semibold">
                  Subject
                </TableHead>
                <TableHead className="font-semibold">Template</TableHead>
                <TableHead className="font-semibold">
                  Recipients
                </TableHead>
                <TableHead className="font-semibold">
                  Total Cost
                </TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">
                  Created
                </TableHead>
                <TableHead className="font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQuotes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    {searchTerm || statusFilter !== "all" 
                      ? "No quotes match your filters" 
                      : "No quotes found"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredQuotes.map((quote) => (
                  <TableRow key={quote.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span className="text-primary-blue">{quote.quoteNumber}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate" title={quote.subject}>
                        {quote.subject}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="capitalize">{quote.templateType || 'Letter'}</span>
                        {quote.colorMode === "color" && (
                          <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {quote.estimatedRecipients?.toLocaleString() || '0'}
                    </TableCell>
                    <TableCell className="font-medium">
                      ${parseFloat(quote.totalCost || "0").toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(quote.status || 'pending')}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {fmtDate(quote.createdAt)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewQuote(quote)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEdit(quote)}>
                            <Edit2 className="mr-2 h-4 w-4" />
                            Edit Quote
                          </DropdownMenuItem>
                          {quote.status === "pending" && (
                            <DropdownMenuItem 
                              onClick={() => onConvert(quote.id)}
                              className="text-primary-blue font-medium hover:bg-blue-50"
                            >
                              <ArrowRight className="mr-2 h-4 w-4" />
                              Convert to Order
                            </DropdownMenuItem>
                          )}
                          {/* Archive and Delete actions can be implemented as needed */}
                          {quote.status !== "converted" && (
                            <DropdownMenuItem 
                              onClick={() => handleDeleteClick(quote.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
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

        {/* Results Summary */}
        <div className="text-sm text-gray-500">
          Showing {filteredQuotes.length} of {quotes.length} quotes
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Quote</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this quote? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Quote Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Quote Details</DialogTitle>
          </DialogHeader>
          {selectedQuote && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Quote Number</label>
                  <p className="text-lg font-semibold text-primary-blue">{selectedQuote.quoteNumber}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedQuote.status)}</div>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Subject</label>
                <p className="mt-1">{selectedQuote.subject}</p>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Template Type</label>
                  <p className="mt-1 capitalize">{selectedQuote.templateType}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Color Mode</label>
                  <p className="mt-1 capitalize">{selectedQuote.colorMode}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Recipients</label>
                  <p className="mt-1">{selectedQuote.estimatedRecipients?.toLocaleString()}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Enclosures</label>
                  <p className="mt-1">{selectedQuote.enclosures}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Data Cleansing</label>
                  <p className="mt-1">{selectedQuote.dataCleansing ? "Yes" : "No"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">NCOA Update</label>
                  <p className="mt-1">{selectedQuote.ncoaUpdate ? "Yes" : "No"}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Total Cost</label>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  ${parseFloat(selectedQuote.totalCost || "0").toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
              
              {selectedQuote.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Notes</label>
                  <p className="mt-1 text-gray-700">{selectedQuote.notes}</p>
                </div>
              )}
              
              <div className="flex justify-between pt-4 border-t">
                <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                  Close
                </Button>
                
                {selectedQuote.status === "pending" && (
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setViewDialogOpen(false);
                        onEdit(selectedQuote);
                      }}
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      onClick={() => {
                        setViewDialogOpen(false);
                        onConvert(selectedQuote.id);
                      }}
                      className="bg-primary-blue hover:bg-blue-800 text-white font-semibold shadow-lg transition-all duration-200 border-2 border-primary-blue hover:border-blue-800 px-6 relative overflow-hidden"
                      size="lg"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-primary-blue opacity-100"></div>
                      <span className="relative z-10 flex items-center">
                        <ArrowRight className="h-4 w-4 mr-2" />
                        Convert to Order
                      </span>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
} 