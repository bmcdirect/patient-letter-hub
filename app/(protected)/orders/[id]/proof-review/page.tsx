"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, FileText, Calendar, User, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface ProofData {
  id: string;
  proofRound: number;
  fileName: string;
  fileType: string;
  fileSize: number;
  status: string;
  createdAt: string;
}

interface OrderData {
  id: string;
  orderNumber: string;
  practiceName: string;
  status: string;
}

export default function ProofReviewPage() {
  const params = useParams();
  const orderId = params.id as string;
  const { toast } = useToast();
  
  const [order, setOrder] = useState<OrderData | null>(null);
  const [proof, setProof] = useState<ProofData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [comments, setComments] = useState("");
  const [action, setAction] = useState<'approve' | 'request_changes' | null>(null);

  useEffect(() => {
    const fetchProof = async () => {
        try {
          const urlParams = new URLSearchParams(window.location.search);
          const proofId = urlParams.get('proofId');
          
          if (!proofId) {
            toast({
              title: "Error",
              description: "Proof ID is required",
              variant: "destructive",
            });
            return;
          }

          const response = await fetch(`/api/orders/${orderId}/proof-review?proofId=${proofId}`);
          
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to fetch proof');
          }

          const data = await response.json();
          setOrder(data.order);
          setProof(data.proof);
        } catch (error: any) {
          toast({
            title: "Error",
            description: error.message || "Failed to load proof",
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
    };

    fetchProof();
  }, [orderId]);

  const handleSubmit = async () => {
    if (!action || !proof) {
      toast({
        title: "Error",
        description: "Please select an action",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`/api/orders/${orderId}/proof-review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          proofId: proof.id,
          action,
          comments: comments.trim() || null
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit proof review');
      }

      const data = await response.json();
      
      toast({
        title: "Success",
        description: data.message,
      });

      // Redirect to orders page after a short delay
      setTimeout(() => {
        window.location.href = '/orders';
      }, 2000);

    } catch (error: any) {
      console.error('Error submitting proof review:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit proof review",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!order || !proof) {
    return (
      <div className="container mx-auto py-8">
        <Alert>
          <AlertDescription>
            Proof not found or you don't have permission to view it.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Proof Review</h1>
        <p className="text-gray-600">Review and approve your patient letter proof</p>
      </div>

      {/* Order Information */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Order Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Order Number</label>
              <p className="text-lg font-semibold">{order.orderNumber}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Practice</label>
              <p className="text-lg font-semibold">{order.practiceName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Current Status</label>
              <Badge variant="outline" className="mt-1">
                {order.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Badge>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Proof Round</label>
              <p className="text-lg font-semibold">Round {proof.proofRound}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Proof Information */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Proof Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">File Name</label>
              <p className="text-lg font-semibold">{proof.fileName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">File Type</label>
              <p className="text-lg font-semibold">{proof.fileType}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">File Size</label>
              <p className="text-lg font-semibold">
                {proof.fileSize ? `${(proof.fileSize / 1024).toFixed(1)} KB` : 'Unknown'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Created</label>
              <p className="text-lg font-semibold">
                {new Date(proof.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Proof Preview */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Proof Preview</CardTitle>
          <CardDescription>
            Review your patient letter proof carefully before making a decision.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Proof Information */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-blue-900">Proof #{proof.proofRound}</h4>
                  <p className="text-sm text-blue-700">
                    {proof.fileName} • {Math.round(proof.fileSize / 1024)} KB
                  </p>
                  <p className="text-sm text-blue-600">
                    Uploaded: {new Date(proof.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-blue-600 border-blue-300">
                    {proof.status}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Proof Display */}
            <div className="border rounded-lg overflow-hidden">
              {proof.fileType?.startsWith('image/') ? (
                <div className="p-4 text-center">
                  <img 
                    src={`/api/orders/${orderId}/proofs/${proof.id}/download`}
                    alt={`Proof #${proof.proofRound}`}
                    className="max-w-full max-h-96 mx-auto rounded shadow-sm"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling.style.display = 'block';
                    }}
                  />
                  <div style={{ display: 'none' }} className="p-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>Image preview not available</p>
                    <p className="text-sm">Please download the file to view</p>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="mb-2">Document Preview</p>
                  <p className="text-sm mb-4">
                    This proof document cannot be previewed inline.
                  </p>
                  <div className="flex justify-center space-x-4">
                    <Button 
                      variant="outline" 
                      onClick={() => window.open(`/api/orders/${orderId}/proofs/${proof.id}/download`, '_blank')}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      View Document
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = `/api/orders/${orderId}/proofs/${proof.id}/download`;
                        link.download = proof.fileName || `proof-${proof.proofRound}.pdf`;
                        link.click();
                      }}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Important Notice */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-yellow-800 mb-1">Important</h4>
                  <p className="text-sm text-yellow-700">
                    Please review all details carefully before approving. Once approved, 
                    this proof will proceed to production. If you need changes, 
                    please request them with specific comments.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Review Actions */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Review Actions</CardTitle>
          <CardDescription>
            Please review the proof carefully and choose your action below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Comments */}
          <div>
            <label htmlFor="comments" className="block text-sm font-medium text-gray-700 mb-2">
              Comments (Optional)
            </label>
            <Textarea
              id="comments"
              placeholder="Add any comments or feedback about the proof..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={4}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={() => setAction('approve')}
              variant={action === 'approve' ? 'default' : 'outline'}
              className="flex-1"
              disabled={submitting}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve Proof
            </Button>
            <Button
              onClick={() => setAction('request_changes')}
              variant={action === 'request_changes' ? 'destructive' : 'outline'}
              className="flex-1"
              disabled={submitting}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Request Changes
            </Button>
          </div>

          {/* Submit Button */}
          {action && (
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full"
            >
              {submitting ? 'Submitting...' : `Submit ${action === 'approve' ? 'Approval' : 'Change Request'}`}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Alert>
        <AlertDescription>
          <strong>Important:</strong> Please review the proof carefully before approving. 
          Once approved, the order will proceed to production. If you need changes, 
          please provide specific feedback in the comments section.
        </AlertDescription>
      </Alert>
    </div>
  );
}