"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  Eye, 
  Upload, 
  Package, 
  CheckCircle2, 
  Truck, 
  Clock, 
  Link2, 
  Mail, 
  FileText, 
  MoreHorizontal,
  Search,
  RefreshCw,
  AlertTriangle
} from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/header";
import { constructMetadata } from "@/lib/utils";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/orders');
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      const data = await response.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      setStatusUpdating(orderId);
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      // Refresh orders after successful update
      await fetchOrders();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update order status');
    } finally {
      setStatusUpdating(null);
    }
  };

  const handleCopyProofLink = async (order: any) => {
    // Get the latest proof for this order
    const latestProof = order.proofs && order.proofs.length > 0 
      ? order.proofs.sort((a: any, b: any) => b.proofRound - a.proofRound)[0]
      : null;
    
    if (!latestProof) {
      setCopySuccess(`No proof available for Order #${order.orderNumber}`);
      setTimeout(() => setCopySuccess(null), 3000);
      return;
    }
    
    const proofReviewUrl = `${window.location.origin}/orders/${order.id}/proof-review?proofId=${latestProof.id}`;
    try {
      await navigator.clipboard.writeText(proofReviewUrl);
      setCopySuccess(`Proof review link copied for Order #${order.orderNumber} (Proof #${latestProof.proofRound})`);
      setTimeout(() => setCopySuccess(null), 3000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = proofReviewUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopySuccess(`Proof review link copied for Order #${order.orderNumber} (Proof #${latestProof.proofRound})`);
      setTimeout(() => setCopySuccess(null), 3000);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'draft': { color: 'bg-gray-100 text-gray-800', icon: FileText },
      'pending': { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      'in-progress': { color: 'bg-blue-100 text-blue-800', icon: Package },
      'proof-ready': { color: 'bg-purple-100 text-purple-800', icon: Eye },
      'proof-approved': { color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
      'completed': { color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
      'mailed': { color: 'bg-blue-100 text-blue-800', icon: Truck },
      'cancelled': { color: 'bg-red-100 text-red-800', icon: AlertTriangle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </Badge>
    );
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.practiceName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <>
        <DashboardHeader
          heading="Orders"
          text="Check and manage your latest orders."
        />
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading orders...</span>
        </div>
      </>
    );
  }

  return (
    <>
      <DashboardHeader
        heading="Orders"
        text="Check and manage your latest orders."
      />

      {/* Success Message */}
      {copySuccess && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {copySuccess}
        </div>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Order Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="proof-ready">Proof Ready</SelectItem>
                <SelectItem value="proof-approved">Proof Approved</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="mailed">Mailed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={fetchOrders} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Orders ({filteredOrders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No orders found matching your criteria.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Practice</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      {order.orderNumber}
                    </TableCell>
                    <TableCell>
                      {order.practiceName || 'Unknown Practice'}
                    </TableCell>
                    <TableCell>
                      {order.subject || 'No subject'}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(order.status)}
                    </TableCell>
                    <TableCell>
                      ${order.cost ? order.cost.toFixed(2) : '0.00'}
                    </TableCell>
                    <TableCell>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => window.open(`/orders/${order.id}`, '_blank')}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleCopyProofLink(order)}>
                            <Link2 className="w-4 h-4 mr-2" />
                            Copy Proof Link
                          </DropdownMenuItem>
                          {order.status === 'proof-ready' && (
                            <DropdownMenuItem onClick={() => handleStatusUpdate(order.id, 'proof-approved')}>
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Approve Proof
                            </DropdownMenuItem>
                          )}
                          {order.status === 'in-progress' && (
                            <DropdownMenuItem onClick={() => handleStatusUpdate(order.id, 'proof-ready')}>
                              <Upload className="w-4 h-4 mr-2" />
                              Mark Proof Ready
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
