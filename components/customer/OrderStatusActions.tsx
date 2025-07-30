"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, AlertTriangle, Clock, User, Shield, MessageSquare } from "lucide-react";
import { StatusManager, type OrderStatus } from "@/lib/status-management";

interface OrderStatusActionsProps {
  order: any;
  onStatusUpdate: () => void;
}

export default function OrderStatusActions({ order, onStatusUpdate }: OrderStatusActionsProps) {
  const [comments, setComments] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [statusHistory, setStatusHistory] = useState<any[]>([]);
  const [availableTransitions, setAvailableTransitions] = useState<any[]>([]);

  useEffect(() => {
    if (order) {
      fetchStatusInfo();
    }
  }, [order]);

  const fetchStatusInfo = async () => {
    try {
      const response = await fetch(`/api/orders/${order.id}/status`);
      if (!response.ok) {
        throw new Error('Failed to fetch status information');
      }
      
      const data = await response.json();
      setAvailableTransitions(data.availableTransitions || []);
      setStatusHistory(data.statusHistory || []);
    } catch (err) {
      console.error('Error fetching status info:', err);
      setError('Failed to load status information');
    }
  };

  const handleStatusAction = async (newStatus: string) => {
    const transition = availableTransitions.find(t => t.to === newStatus);
    if (transition?.requiresComment && (!comments || comments.trim() === '')) {
      setError("Comments are required for this action");
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
          newStatus: newStatus,
          comments: comments.trim() || undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update status');
      }

      setSuccess(true);
      setComments("");
      
      // Refresh status info and notify parent
      setTimeout(() => {
        fetchStatusInfo();
        onStatusUpdate();
        setSuccess(false);
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

  const isWaitingForApproval = order.status?.startsWith('waiting-approval');
  const canApprove = isWaitingForApproval && availableTransitions.some(t => t.to === 'approved');
  const canRequestChanges = isWaitingForApproval && availableTransitions.some(t => t.to.includes('rev'));

  if (!StatusManager.isCustomerActionable(order.status as OrderStatus)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Order Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={getStatusBadgeVariant(order.status)}>
              {StatusManager.getStatusDisplayInfo(order.status as OrderStatus).label}
            </Badge>
          </div>
          <p className="text-sm text-gray-600">
            {StatusManager.getStatusDisplayInfo(order.status as OrderStatus).description}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            No customer action required at this time.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Current Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={getStatusBadgeVariant(order.status)}>
              {StatusManager.getStatusDisplayInfo(order.status as OrderStatus).label}
            </Badge>
          </div>
          <p className="text-sm text-gray-600">
            {StatusManager.getStatusDisplayInfo(order.status as OrderStatus).description}
          </p>
        </CardContent>
      </Card>

      {/* Approval Actions */}
      {isWaitingForApproval && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Review & Decision</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comments (Optional for approval, required for changes)
              </label>
              <Textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Add any comments about the proof or specific changes needed..."
                rows={4}
              />
            </div>

            <div className="flex gap-4">
              {canApprove && (
                <Button
                  onClick={() => handleStatusAction('approved')}
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve Proof
                </Button>
              )}

              {canRequestChanges && (
                <Button
                  onClick={() => handleStatusAction('waiting-approval-rev1')}
                  disabled={loading}
                  variant="outline"
                  className="flex-1 border-yellow-400 text-yellow-700 hover:bg-yellow-50"
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Request Changes
                </Button>
              )}
            </div>

            <p className="text-sm text-gray-600 text-center">
              <strong>Important:</strong> Once approved, your order will proceed to production and cannot be changed.
            </p>

            {/* Error/Success Messages */}
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert>
                <CheckCircle className="w-4 h-4" />
                <AlertDescription>Action completed successfully!</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Status History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="w-5 h-5" />
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
                    <div className="flex items-start gap-2 mt-2">
                      <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded flex-1">
                        {entry.comments}
                      </p>
                    </div>
                  )}
                  {index < statusHistory.length - 1 && <Separator className="mt-3" />}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 