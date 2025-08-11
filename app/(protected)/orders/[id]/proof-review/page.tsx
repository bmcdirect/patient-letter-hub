"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Download, CheckCircle, XCircle, AlertTriangle, MessageSquare, Clock } from "lucide-react";

export default function ProofReviewPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  // Debug: log order status
  useEffect(() => {
    if (order) {
      // eslint-disable-next-line no-console
      console.log('Order status:', order.status);
    }
  }, [order]);

  const fetchOrderDetails = async () => {
    try {
      console.log(`🔍 Fetching order details for order ${orderId}`);
      
      // Fetch order details
      const orderResponse = await fetch(`/api/orders/${orderId}`);
      if (!orderResponse.ok) {
        const errorData = await orderResponse.json().catch(() => ({}));
        console.error(`❌ Failed to fetch order details:`, orderResponse.status, errorData);
        throw new Error(`Failed to fetch order details: ${orderResponse.status} ${errorData.error || ''}`);
      }
      const orderData = await orderResponse.json();
      console.log(`✅ Order details fetched:`, orderData.order);
      
      // Fetch proofs separately
      console.log(`🔍 Fetching proofs for order ${orderId}`);
      const proofsResponse = await fetch(`/api/orders/${orderId}/proofs`);
      let proofsData = { proofs: [] };
      
      if (proofsResponse.ok) {
        proofsData = await proofsResponse.json();
        console.log(`✅ Proofs fetched:`, proofsData.proofs);
      } else {
        const errorData = await proofsResponse.json().catch(() => ({}));
        console.warn(`⚠️ Failed to fetch proofs:`, proofsResponse.status, errorData);
        // Don't fail the entire request if proofs fail, just use empty array
      }
      
      // Combine order data with proofs
      const combinedOrder = {
        ...orderData.order,
        files: [...(orderData.order.files || []), ...(proofsData.proofs || [])]
      };
      
      console.log(`✅ Combined order data:`, combinedOrder);
      setOrder(combinedOrder);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load order details';
      console.error(`❌ Error fetching order:`, err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getLatestProof = () => {
    if (!order?.files) return null;
    const proofFiles = order.files.filter((f: any) => f.fileType === 'admin-proof');
    if (proofFiles.length === 0) return null;
    return proofFiles.sort((a: any, b: any) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];
  };

  const getLatestApproval = () => {
    if (!order?.approvals) return null;
    return order.approvals[0]; // Already sorted by createdAt desc
  };

  const handleApproval = async () => {
    const latestProof = getLatestProof();
    if (!latestProof) {
      alert('No proof found to approve. Please contact support.');
      return;
    }

    console.log(`🔍 Approving proof:`, latestProof);
    setSubmitting(true);
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          revisionId: latestProof.id,
          decision: 'approved',
          comments: comments || 'Approved without comments'
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`❌ Approval failed:`, response.status, errorData);
        throw new Error(`Failed to approve proof: ${response.status} ${errorData.error || errorData.details || ''}`);
      }

      const result = await response.json();
      console.log(`✅ Approval successful:`, result);
      setOrder(result.order);
      setComments("");
      alert('Proof approved successfully! Your order will now proceed to production.');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to approve proof';
      console.error('Approval error:', err);
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestChanges = async () => {
    if (!comments.trim()) {
      alert('Please provide feedback about what changes are needed');
      return;
    }

    const latestProof = getLatestProof();
    if (!latestProof) {
      alert('No proof found to request changes for. Please contact support.');
      return;
    }

    console.log(`🔍 Requesting changes for proof:`, latestProof);
    setSubmitting(true);
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          revisionId: latestProof.id,
          decision: 'changes-requested',
          comments: comments
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`❌ Change request failed:`, response.status, errorData);
        throw new Error(`Failed to request changes: ${response.status} ${errorData.error || errorData.details || ''}`);
      }

      const result = await response.json();
      console.log(`✅ Change request successful:`, result);
      setOrder(result.order);
      setComments("");
      alert('Change request submitted successfully! The design team will review your feedback.');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit change request';
      console.error('Change request error:', err);
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'waiting-approval-rev1': { label: 'Waiting for Approval (Rev 1)', variant: 'destructive' },
      'waiting-approval-rev2': { label: 'Waiting for Approval (Rev 2)', variant: 'destructive' },
      'waiting-approval-rev3': { label: 'Waiting for Approval (Rev 3)', variant: 'destructive' },
      'approved': { label: 'Approved', variant: 'secondary' },
      'changes-requested': { label: 'Changes Requested', variant: 'outline' },
      'draft': { label: 'Draft', variant: 'default' },
      'in-progress': { label: 'In Production', variant: 'default' },
      'completed': { label: 'Completed', variant: 'secondary' }
    };
    
    const config = statusConfig[status] || { label: status, variant: 'default' };
    return <Badge variant={config.variant as any}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading proof review...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error Loading Order</h2>
            <p className="text-gray-600 mb-4">{error || 'Order not found'}</p>
            <Button onClick={() => router.push('/orders')}>
              Back to Orders
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const latestProof = getLatestProof();
  const latestApproval = getLatestApproval();
  // More robust check for waiting-approval status
  const isWaitingForApproval = /^waiting-approval(-rev\d+)?$/.test(order.status || '');

  // DEBUG: Add console logging to see what's happening
  console.log('DEBUG - Order status:', order.status);
  console.log('DEBUG - isWaitingForApproval:', isWaitingForApproval);
  console.log('DEBUG - Latest proof:', latestProof);

  if (!latestProof) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Proof Available</h2>
            <p className="text-gray-600 mb-4">There's no proof ready for review yet. Please wait for our design team to upload your proof.</p>
            <Button onClick={() => router.push('/orders')}>
              Back to Orders
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Proof Review - Order #{order.orderNumber}
          </h1>
          <div className="flex items-center gap-4">
            {getStatusBadge(order.status)}
            <span className="text-gray-600">
              Customer: {order.practice?.name || 'Unknown Practice'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Proof Display */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Design Proof - Revision {latestProof.revisionNumber || 1}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-6 rounded-lg text-center">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">{latestProof.fileName}</h3>
                  <p className="text-gray-600 mb-4">
                    Uploaded {new Date(latestProof.createdAt).toLocaleDateString()}
                  </p>
                  <Button 
                    onClick={() => window.open(latestProof.filePath, '_blank')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Proof
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Admin Notes */}
            {latestApproval?.comments && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Design Team Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-gray-800">{latestApproval.comments}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Approval Actions - FORCED TO ALWAYS RENDER FOR DEBUGGING */}
            <Card>
              <CardHeader>
                <CardTitle>Review & Decision</CardTitle>
                {/* DEBUG INFO */}
                <div className="text-xs text-gray-500 bg-yellow-50 p-2 rounded">
                  <strong>DEBUG:</strong> Status: "{order.status}" | isWaitingForApproval: {isWaitingForApproval.toString()}
                </div>
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
                  <Button
                    onClick={handleApproval}
                    disabled={submitting || !isWaitingForApproval}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {submitting ? 'Approving...' : 'Approve Proof'}
                    {!isWaitingForApproval && ' (Disabled)'}
                  </Button>
                  <Button
                    onClick={handleRequestChanges}
                    disabled={submitting || !comments.trim() || !isWaitingForApproval}
                    variant="outline"
                    className="flex-1 border-yellow-400 text-yellow-700 hover:bg-yellow-50"
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    {submitting ? 'Submitting...' : 'Request Changes'}
                    {!isWaitingForApproval && ' (Disabled)'}
                  </Button>
                </div>
                <p className="text-sm text-gray-600 text-center">
                  <strong>Important:</strong> Once approved, your order will proceed to production and cannot be changed.
                </p>
                {!isWaitingForApproval && (
                  <p className="text-sm text-red-600 text-center">
                    <strong>Note:</strong> Buttons are disabled because order status "{order.status}" is not waiting for approval.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Already Decided - Only show if not waiting for approval */}
            {!isWaitingForApproval && order.status === 'approved' && (
              <Card>
                <CardContent className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-green-900 mb-2">Proof Approved</h3>
                  <p className="text-green-700">This proof has been approved and is now in production.</p>
                </CardContent>
              </Card>
            )}

            {!isWaitingForApproval && order.status === 'changes-requested' && (
              <Card>
                <CardContent className="text-center py-8">
                  <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-yellow-900 mb-2">Changes Requested</h3>
                  <p className="text-yellow-700">Your feedback has been submitted. The design team will review and upload a revised proof.</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Details */}
            <Card>
              <CardHeader>
                <CardTitle>Order Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <span className="font-medium">Subject:</span>
                  <p className="text-gray-600">{order.subject}</p>
                </div>
                <div>
                  <span className="font-medium">Template:</span>
                  <p className="text-gray-600">{order.templateType || 'Not specified'}</p>
                </div>
                <div>
                  <span className="font-medium">Color Mode:</span>
                  <p className="text-gray-600">{order.colorMode || 'Not specified'}</p>
                </div>
                <div>
                  <span className="font-medium">Cost:</span>
                  <p className="text-gray-600">${order.cost?.toFixed(2) || '0.00'}</p>
                </div>
                <div>
                  <span className="font-medium">Created:</span>
                  <p className="text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
              </CardContent>
            </Card>

            {/* Revision History */}
            {order.approvals && order.approvals.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Revision History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {order.approvals.map((approval: any, index: number) => (
                      <div key={approval.id} className="border-l-4 border-gray-200 pl-4 py-2">
                        <div className="flex items-center gap-2 mb-1">
                          {approval.status === 'approved' ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-yellow-600" />
                          )}
                          <span className="font-medium">
                            {approval.status === 'approved' ? 'Approved' : 'Changes Requested'}
                          </span>
                          <span className="text-sm text-gray-500">
                            {new Date(approval.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {approval.comments && (
                          <div className="text-sm text-gray-700 mt-1">
                            {approval.comments}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div className="mt-8 text-center">
          <Button variant="outline" onClick={() => router.push('/orders')}>
            Back to Orders
          </Button>
        </div>
      </div>
    </div>
  );
} 