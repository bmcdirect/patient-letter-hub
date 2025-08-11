"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { X, AlertCircle, CheckCircle, Clock, User, Shield } from "lucide-react";
import { StatusManager, type OrderStatus } from "@/lib/status-management";

interface StatusManagementModalProps {
  order: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function StatusManagementModal({ order, isOpen, onClose, onSuccess }: StatusManagementModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [comments, setComments] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [statusHistory, setStatusHistory] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen && order) {
      fetchStatusHistory();
    }
  }, [isOpen, order]);

  const fetchStatusHistory = async () => {
    try {
      const response = await fetch(`/api/orders/${order.id}/status`);
      if (!response.ok) {
        throw new Error('Failed to fetch status information');
      }
      
      const data = await response.json();
      setStatusHistory(data.statusHistory || []);
    } catch (err) {
      console.error('Error fetching status info:', err);
      setError('Failed to load status information');
    }
  };

  const handleStatusChange = async () => {
    if (!selectedStatus) {
      setError("Please select a new status");
      return;
    }

    // Check if comments are required for certain statuses
    const requiresComment = ['on-hold', 'cancelled', 'changes-requested'].includes(selectedStatus);
    if (requiresComment && (!comments || comments.trim() === '')) {
      setError("Comments are required for this status change");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`/api/orders/${order.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newStatus: selectedStatus,
          comments: comments.trim() || undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update status');
      }

      setSuccess(true);
      setSelectedStatus("");
      setComments("");
      
      // Call success callback after a short delay
      setTimeout(() => {
        try {
          if (onSuccess && typeof onSuccess === 'function') {
            onSuccess();
          }
        } catch (callbackError) {
          console.warn('Status management success callback failed:', callbackError);
        }
        onClose();
      }, 2000);

    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to update status. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    return StatusManager.getStatusBadgeVariant(status as OrderStatus);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Status Management - Order #{order.orderNumber}</h2>
          <Button variant="ghost" onClick={onClose} size="sm">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Status Change */}
          <div className="space-y-6">
            {/* Current Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Current Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusBadgeVariant(order.status)}>
                      {StatusManager.getStatusDisplayInfo(order.status as OrderStatus).label}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    {StatusManager.getStatusDisplayInfo(order.status as OrderStatus).description}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Status Change Form */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Change Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Available Statuses - Simple List */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Status
                  </label>
                  <div className="space-y-2 max-h-60 overflow-y-auto border rounded p-3">
                    {[
                      'draft', 'submitted', 'in-review', 'waiting-approval', 
                      'approved', 'in-production', 'production-complete', 
                      'shipped', 'delivered', 'completed', 'cancelled', 'on-hold'
                    ].map((status) => (
                      <label key={status} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                        <input
                          type="radio"
                          name="status"
                          value={status}
                          checked={selectedStatus === status}
                          onChange={(e) => setSelectedStatus(e.target.value)}
                          className="text-blue-600"
                        />
                        <div className="flex items-center gap-2">
                          <Badge variant={getStatusBadgeVariant(status)}>
                            {StatusManager.getStatusDisplayInfo(status as OrderStatus).label}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {StatusManager.getStatusDisplayInfo(status as OrderStatus).description}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                  
                  {selectedStatus && (
                    <div className="mt-2 p-2 bg-blue-50 rounded">
                      <p className="text-sm font-medium text-blue-800">
                        Selected: {StatusManager.getStatusDisplayInfo(selectedStatus as OrderStatus).label}
                      </p>
                      <p className="text-xs text-blue-600">
                        {StatusManager.getStatusDisplayInfo(selectedStatus as OrderStatus).description}
                      </p>
                    </div>
                  )}
                </div>

                {/* Comments */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comments {['on-hold', 'cancelled', 'changes-requested'].includes(selectedStatus) && (
                      <span className="text-red-500">*</span>
                    )}
                  </label>
                  <Textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Add comments about this status change..."
                    rows={3}
                  />
                </div>

                {/* Error/Success Messages */}
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="w-4 h-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert>
                    <CheckCircle className="w-4 h-4" />
                    <AlertDescription>Status updated successfully!</AlertDescription>
                  </Alert>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={onClose} disabled={loading}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleStatusChange}
                    disabled={!selectedStatus || loading}
                    className="flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Updating...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Update Status
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Status History */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Status History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {statusHistory.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No status changes recorded yet.</p>
                  ) : (
                    statusHistory.map((entry, index) => (
                      <div key={entry.id} className="border-l-4 border-gray-200 pl-4 py-2">
                        <div className="flex items-center gap-2 mb-1">
                          {entry.changedByRole === 'ADMIN' ? (
                            <Shield className="w-4 h-4 text-blue-600" />
                          ) : (
                            <User className="w-4 h-4 text-green-600" />
                          )}
                          <Badge variant={getStatusBadgeVariant(entry.fromStatus)}>
                            {StatusManager.getStatusDisplayInfo(entry.fromStatus as OrderStatus).label}
                          </Badge>
                          <span className="text-gray-400">→</span>
                          <Badge variant={getStatusBadgeVariant(entry.toStatus)}>
                            {StatusManager.getStatusDisplayInfo(entry.toStatus as OrderStatus).label}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">{entry.user?.name || 'Unknown User'}</span>
                          <span className="mx-2">•</span>
                          <span>{formatTimestamp(entry.createdAt)}</span>
                        </div>
                        {entry.comments && (
                          <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                            {entry.comments}
                          </p>
                        )}
                        {index < statusHistory.length - 1 && <Separator className="mt-3" />}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Order Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Order Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <span className="font-medium">Customer:</span>
                  <p className="text-gray-600">{order.practice?.name || 'N/A'}</p>
                </div>
                <div>
                  <span className="font-medium">Subject:</span>
                  <p className="text-gray-600">{order.subject || 'N/A'}</p>
                </div>
                <div>
                  <span className="font-medium">Created:</span>
                  <p className="text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="font-medium">Last Updated:</span>
                  <p className="text-gray-600">{new Date(order.updatedAt).toLocaleDateString()}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 