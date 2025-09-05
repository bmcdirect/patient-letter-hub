"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Download, CheckCircle, XCircle, AlertTriangle, MessageSquare, Clock, AlertCircle, Phone, Mail } from "lucide-react";

export default function ProofReviewPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showEscalationDialog, setShowEscalationDialog] = useState(false);
  const [escalationReason, setEscalationReason] = useState("");

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      // Fetch order details with proofs
      const orderResponse = await fetch(`/api/orders/${orderId}`);
      if (!orderResponse.ok) {
        throw new Error('Failed to fetch order details');
      }
      const orderData = await orderResponse.json();
      
      // Fetch proofs separately
      const proofsResponse = await fetch(`/api/orders/${orderId}/proofs`);
      const proofsData = await proofsResponse.ok ? await proofsResponse.json() : { proofs: [] };
      
      // Combine order data with proofs
      setOrder({
        ...orderData,
        proofs: proofsData.proofs || []
      });
    } catch (err) {
      setError('Failed to load order details');
      console.error('Error fetching order:', err);
    } finally {
      setLoading(false);
    }
  };

  const getLatestProof = () => {
    if (!order?.proofs || order.proofs.length === 0) return null;
    // Find the latest PENDING proof for response
    const pendingProof = order.proofs.find((proof: any) => proof.status === 'PENDING');
    return pendingProof || null;
  };

  const getLatestProofForDisplay = () => {
    if (!order?.proofs || order.proofs.length === 0) return null;
    return order.proofs[0]; // Latest proof for display purposes
  };

  const getProofHistory = () => {
    if (!order?.proofs || order.proofs.length === 0) return [];
    return order.proofs.sort((a: any, b: any) => a.proofRound - b.proofRound);
  };

  const handleProofResponse = async (action: 'APPROVED' | 'CHANGES_REQUESTED') => {
    const latestProof = getLatestProof();
    if (!latestProof) return;

    if (action === 'CHANGES_REQUESTED' && !feedback.trim()) {
      alert('Please provide feedback when requesting changes.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/orders/${orderId}/proofs/${latestProof.id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          feedback: action === 'CHANGES_REQUESTED' ? feedback : null
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to respond to proof');
      }

      const result = await response.json();
      
      // Check if escalation is needed
      if (result.orderStatus === 'escalated') {
        setShowEscalationDialog(true);
        setEscalationReason('Multiple proof revisions require escalation');
      } else {
        // Refresh the order data after status change
        await fetchOrderDetails();
        setFeedback("");
        alert(result.message);
      }
    } catch (err) {
      console.error('Proof response error:', err);
      alert('Failed to respond to proof. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEscalationAcknowledgment = () => {
    setShowEscalationDialog(false);
    setEscalationReason("");
    alert('Thank you for your feedback. Our team will contact you directly to resolve this situation.');
    router.push('/orders');
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

  const latestProof = getLatestProof(); // For response (PENDING only)
  const displayProof = getLatestProofForDisplay(); // For display (latest overall)
  const proofHistory = getProofHistory();
  const isWaitingForApproval = /^waiting-approval(-rev\d+)?$/.test(order.status || '');
  const isEscalated = order.status === 'escalated';

  if (!displayProof) {
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

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'destructive';
      case 'APPROVED':
        return 'default';
      case 'CHANGES_REQUESTED':
        return 'secondary';
      case 'ESCALATED':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Pending Review';
      case 'APPROVED':
        return 'Approved';
      case 'CHANGES_REQUESTED':
        return 'Changes Requested';
      case 'ESCALATED':
        return 'Escalated';
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Proof Review</h1>
            <Button variant="outline" onClick={() => router.push('/orders')}>
              Back to Orders
            </Button>
          </div>
          
          {/* Order Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order #{order.orderNumber}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div><strong>Subject:</strong> {order.subject || 'N/A'}</div>
                <div><strong>Practice:</strong> {order.practice?.name || 'N/A'}</div>
                <div><strong>Status:</strong> 
                  <Badge variant={getStatusBadgeVariant(order.status)} className="ml-2">
                    {order.status?.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Unknown'}
                  </Badge>
                </div>
                <div><strong>Current Proof:</strong> #{displayProof.proofRound}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Escalation Warning */}
        {isEscalated && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Escalation Required:</strong> This order has exceeded the maximum number of proof revisions. 
              Our team will contact you directly to resolve this situation.
            </AlertDescription>
          </Alert>
        )}

        {/* Current Proof */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Current Proof</CardTitle>
              <Badge variant={getStatusBadgeVariant(displayProof.status)}>
                {getStatusLabel(displayProof.status)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Proof File */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileText className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="font-medium">Proof File</p>
                    <p className="text-sm text-gray-600">
                      Uploaded on {new Date(displayProof.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    const downloadUrl = `/api/orders/${orderId}/proofs/${displayProof.id}/download`;
                    window.open(downloadUrl, '_blank');
                  }}
                >
                  <Download className="w-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>

            {/* Admin Notes */}
            {displayProof.adminNotes && (
              <div className="border rounded-lg p-4 bg-blue-50">
                <h4 className="font-medium text-blue-900 mb-2">Designer Notes:</h4>
                <p className="text-blue-800">{displayProof.adminNotes}</p>
              </div>
            )}

            {/* Proof History */}
            {proofHistory.length > 1 && (
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3">Proof History:</h4>
                <div className="space-y-2">
                  {proofHistory.map((proof: any) => (
                    <div key={proof.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">Proof #{proof.proofRound}</span>
                        <Badge variant={getStatusBadgeVariant(proof.status)} size="sm">
                          {getStatusLabel(proof.status)}
                        </Badge>
                      </div>
                      <span className="text-gray-500">
                        {new Date(proof.uploadedAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {isWaitingForApproval && !isEscalated && latestProof && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Feedback (Required for changes)
                  </label>
                  <Textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Please provide specific feedback about what changes are needed..."
                    rows={4}
                    className="w-full"
                  />
                </div>

                <div className="flex gap-4">
                  <Button
                    onClick={() => handleProofResponse('APPROVED')}
                    disabled={submitting}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve Proof
                  </Button>

                  <Button
                    onClick={() => handleProofResponse('CHANGES_REQUESTED')}
                    disabled={submitting || !feedback.trim()}
                    variant="outline"
                    className="flex-1 border-yellow-400 text-yellow-700 hover:bg-yellow-50"
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Request Changes
                  </Button>
                </div>

                <p className="text-sm text-gray-600 text-center">
                  <strong>Important:</strong> Once approved, your order will proceed to production and cannot be changed.
                </p>
              </div>
            )}

            {/* No Pending Proof Message */}
            {isWaitingForApproval && !isEscalated && !latestProof && (
              <div className="text-center py-6">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">All Proofs Responded To</h3>
                <p className="text-gray-600">
                  You have already responded to all available proofs. Please wait for our team to upload a new proof based on your feedback.
                </p>
              </div>
            )}

            {/* Escalated State */}
            {isEscalated && (
              <div className="text-center py-6">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Manual Intervention Required</h3>
                <p className="text-gray-600 mb-4">
                  This order has exceeded the maximum number of proof revisions. 
                  Our customer service team will contact you directly to resolve this situation.
                </p>
                <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4" />
                    <span>Call: 978-840-9880</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4" />
                    <span>Email Support</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Escalation Dialog */}
      <Dialog open={showEscalationDialog} onOpenChange={setShowEscalationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span>Proof Escalation Required</span>
            </DialogTitle>
            <DialogDescription>
              This order has exceeded the maximum number of proof revisions and requires manual intervention.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Feedback (Optional)
              </label>
              <Textarea
                value={escalationReason}
                onChange={(e) => setEscalationReason(e.target.value)}
                placeholder="Please provide any additional context that might help our team..."
                rows={3}
              />
            </div>
            
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Our customer service team will contact you directly to resolve this situation. 
                You can expect a call or email within 24 hours.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button onClick={handleEscalationAcknowledgment} className="w-full">
              Acknowledge & Return to Orders
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 