import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Archive,
  CheckCircle2,
  Eye,
  Package,
  FileText,
  Calendar,
  ArrowUpDown,
} from "lucide-react";

interface ArchivedItem {
  id: number;
  number: string;
  type: "quote" | "order";
  subject: string;
  totalCost: string;
  status: string;
  createdAt: string;
  convertedAt?: string;
  archivedAt?: string;
}

interface ArchiveSectionProps {
  archivedQuotes: ArchivedItem[];
  completedOrders: ArchivedItem[];
  isLoading: boolean;
}

export function ArchiveSection({
  archivedQuotes,
  completedOrders,
  isLoading,
}: ArchiveSectionProps) {
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ArchivedItem | null>(null);
  const [sortBy, setSortBy] = useState<"date" | "cost">("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  
  // Null-safe date formatter
  const fmtDate = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString() : '—';

  // Combine and sort archived items
  const allArchivedItems = [...archivedQuotes, ...completedOrders]
    .sort((a, b) => {
      const direction = sortDirection === "asc" ? 1 : -1;
      
      if (sortBy === "date") {
        const aDate = new Date(a.archivedAt || a.createdAt);
        const bDate = new Date(b.archivedAt || b.createdAt);
        return (aDate.getTime() - bDate.getTime()) * direction;
      } else {
        const aCost = parseFloat(a.totalCost);
        const bCost = parseFloat(b.totalCost);
        return (aCost - bCost) * direction;
      }
    });

  const handleSort = (field: "date" | "cost") => {
    if (sortBy === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDirection("desc");
    }
  };

  const handleViewItem = (item: ArchivedItem) => {
    setSelectedItem(item);
    setViewDialogOpen(true);
  };

  const getStatusBadge = (item: ArchivedItem) => {
    switch (item.status) {
      case "converted":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Converted</Badge>;
      case "archived":
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Archived</Badge>;
      case "completed":
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Completed</Badge>;
      case "delivered":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Delivered</Badge>;
      default:
        return <Badge variant="outline">{item.status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5" />
            Archive
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex justify-between items-center p-3 border rounded-lg">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-8 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Archive className="h-5 w-5" />
              Archive ({allArchivedItems.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSort("date")}
                className="h-8 text-xs"
              >
                Date
                <ArrowUpDown className="ml-1 h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSort("cost")}
                className="h-8 text-xs"
              >
                Cost
                <ArrowUpDown className="ml-1 h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {allArchivedItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Archive className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No archived items yet</p>
              <p className="text-sm">Completed quotes and orders will appear here</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {allArchivedItems.map((item) => (
                <div
                  key={`${item.type}-${item.id}`}
                  className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleViewItem(item)}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-gray-100">
                      {item.type === "quote" ? (
                        <FileText className="h-4 w-4 text-gray-600" />
                      ) : (
                        <Package className="h-4 w-4 text-gray-600" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{item.number}</span>
                        {getStatusBadge(item)}
                      </div>
                      <p className="text-sm text-gray-600 truncate max-w-xs" title={item.subject}>
                        {item.subject}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {fmtDate(item.archivedAt || item.createdAt)}
                        </span>
                        <span className="font-medium">
                          ${parseFloat(item.totalCost).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          
          {allArchivedItems.length > 5 && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-500 text-center">
                Showing most recent archived items
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Item Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedItem?.type === "quote" ? (
                <FileText className="h-5 w-5" />
              ) : (
                <Package className="h-5 w-5" />
              )}
              {selectedItem?.type === "quote" ? "Archived Quote" : "Completed Order"}
            </DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    {selectedItem.type === "quote" ? "Quote Number" : "Order Number"}
                  </label>
                  <p className="text-lg font-semibold text-primary-blue">{selectedItem.number}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedItem)}</div>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Subject</label>
                <p className="mt-1">{selectedItem.subject}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Total Cost</label>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  ${parseFloat(selectedItem.totalCost).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Created</label>
                  <p className="mt-1">{fmtDate(selectedItem.createdAt)}</p>
                </div>
                {selectedItem.convertedAt && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Converted</label>
                    <p className="mt-1">{fmtDate(selectedItem.convertedAt)}</p>
                  </div>
                )}
                {selectedItem.archivedAt && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Archived</label>
                    <p className="mt-1">{fmtDate(selectedItem.archivedAt)}</p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end pt-4 border-t">
                <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}