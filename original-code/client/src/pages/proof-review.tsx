import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, MessageSquare, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function ProofReview() {
  const { orderId } = useParams<{ orderId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [comments, setComments] = useState("");
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showChangesDialog, setShowChangesDialog] = useState(false);
  
  // Null-safe date formatter
  const fmtDate = (d?: string | null) => d ? new Date(d).toLocaleDateString() : '—';
  const fmtTime = (d?: string | null) => d ? new Date(d).toLocaleTimeString() : '—';

  // Fetch order details (customer endpoint, no auth required)
  const { data: order, isLoading: orderLoading } = useQuery({
    queryKey: [`/api/orders/${orderId}/customer`],
    enabled: !!orderId,
  });

  // Fetch revisions for this order (customer endpoint, no auth required)
  const { data: revisions, isLoading: revisionsLoading } = useQuery({
    queryKey: [`/api/orders/${orderId}/revisions/customer`],
    enabled: !!orderId,
  });

  // Fetch approval history for this order (customer endpoint, no auth required)
  const { data: approvals, isLoading: approvalsLoading } = useQuery({
    queryKey: [`/api/orders/${orderId}/approvals`],
    enabled: !!orderId,
  });

  // Get the latest revision
  const latestRevision = (revisions as any[])?.length > 0 ? 
    (revisions as any[]).sort((a: any, b: any) => b.revisionNumber - a.revisionNumber)[0] : null;
  


  // Approve proof mutation
  const approveMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PUT", `/api/orders/${orderId}/approve`, {
        revisionId: latestRevision.id,
        comments: comments || "Approved without comments"
      });
    },
    onSuccess: () => {
      toast({
        title: "Proof Approved",
        description: "Your proof has been approved and forwarded to production.",
      });
      setShowApprovalDialog(false);
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}/customer`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Approval Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Request changes mutation
  const requestChangesMutation = useMutation({
    mutationFn: async () => {
      if (!comments.trim()) {
        throw new Error("Please provide feedback about what changes are needed");
      }
      await apiRequest("PUT", `/api/orders/${orderId}/request-changes`, {
        revisionId: latestRevision.id,
        comments: comments
      });
    },
    onSuccess: () => {
      toast({
        title: "Changes Requested",
        description: "Your feedback has been sent to the design team for revision.",
      });
      setShowChangesDialog(false);
      setComments("");
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}/customer`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Request Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDownloadProof = () => {
    if (!orderId) {
      toast({
        title: "Download Error",
        description: "Invalid order ID",
        variant: "destructive",
      });
      return;
    }
    
    const downloadUrl = `/api/orders/${orderId}/proof-download`;
    window.open(downloadUrl, '_blank');
  };

  if (orderLoading || revisionsLoading || approvalsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading proof for review...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Order Not Found</h2>
            <p className="text-gray-600 mb-4">The order you're looking for doesn't exist or you don't have permission to view it.</p>
            <Button onClick={() => setLocation("/orders")}>
              Back to Orders
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!latestRevision) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Proof Available</h2>
            <p className="text-gray-600 mb-4">There's no proof ready for review yet. Please wait for our design team to upload your proof.</p>
            <Button onClick={() => setLocation("/orders")}>
              Back to Orders
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'waiting-approval-rev1':
      case 'waiting-approval-rev2':
      case 'waiting-approval-rev3':
        return 'destructive';
      case 'approved':
        return 'secondary';
      case 'confirmed':
        return 'outline';
      default:
        return 'default';
    }
  };

  const isWaitingForApproval = (order as any)?.status?.startsWith('waiting-approval');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Proof Review</h1>
              <p className="text-gray-600">Review and approve your design proof</p>
            </div>
            <Badge variant={getStatusBadgeVariant((order as any)?.status)}>
              {(order as any)?.status?.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
            </Badge>
          </div>
        </div>

        {/* Order Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Order Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Order Number</p>
                <p className="font-semibold">{(order as any)?.orderNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Subject</p>
                <p className="font-semibold">{(order as any)?.subject}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Template Type</p>
                <p className="font-semibold">{(order as any)?.templateType}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Proof Display */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Current Proof - Revision {latestRevision.revisionNumber}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 rounded-lg p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Design Proof Ready</h3>
              <p className="text-gray-600 mb-4">
                Uploaded on {fmtDate(latestRevision.createdAt)} at{' '}
                {fmtTime(latestRevision.createdAt)}
              </p>
              <Button 
                onClick={handleDownloadProof}
                className="bg-primary hover:bg-primary/90"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Proof (PDF)
              </Button>
            </div>
            
            {latestRevision.adminNotes && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Design Notes:</h4>
                <p className="text-blue-800">{latestRevision.adminNotes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customer Feedback History */}
        {approvals && (approvals as any[]).length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Revision History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto space-y-4 pr-2">
                {(approvals as any[])
                  .sort((a: any, b: any) => new Date(b.decidedAt).getTime() - new Date(a.decidedAt).getTime())
                  .map((approval: any, index: number) => (
                    <div key={approval.id} className="border-l-4 border-gray-200 pl-4 py-2">
                      <div className="flex items-center gap-2 mb-1">
                        {approval.decision === 'approved' ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-yellow-600" />
                        )}
                        <span className="font-medium">
                          {approval.decision === 'approved' ? 'Approved' : 'Changes Requested'}
                        </span>
                        <span className="text-sm text-gray-500">
                          {fmtDate(approval.decidedAt)}
                        </span>
                      </div>
                      {approval.comments && (
                        <div className="text-sm text-gray-700 mt-1 break-words max-w-full">
                          {approval.comments}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-3">Review Instructions</h3>
            <div className="space-y-2 text-gray-700">
              <p>• Download and carefully review the proof file</p>
              <p>• Check all text for accuracy, spelling, and formatting</p>
              <p>• Verify that images and logos appear correctly</p>
              <p>• Ensure contact information and addresses are correct</p>
              <p>• If approved, your order will proceed to printing and mailing</p>
            </div>
          </CardContent>
        </Card>

        {/* Approval Actions */}
        {isWaitingForApproval && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Your Decision
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Comments (Optional for approval, required for changes)
                </label>
                <Textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Add any comments about the proof or specific changes needed..."
                  rows={4}
                  spellCheck="true"
                  lang="en-US"
                />
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={() => setShowApprovalDialog(true)}
                  disabled={approveMutation.isPending || requestChangesMutation.isPending}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve Proof
                </Button>

                <Button
                  onClick={() => setShowChangesDialog(true)}
                  disabled={approveMutation.isPending || requestChangesMutation.isPending}
                  variant="outline"
                  className="flex-1 border-yellow-400 text-yellow-700 hover:bg-yellow-50 border-2"
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Request Changes
                </Button>
              </div>

              <p className="text-sm text-gray-600 text-center">
                <strong>Important:</strong> Once approved, your order will proceed to production and cannot be changed.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Already decided */}
        {!isWaitingForApproval && (order as any)?.status === 'approved' && (
          <Card>
            <CardContent className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-green-900 mb-2">Proof Approved</h3>
              <p className="text-green-700">This proof has been approved and is now in production.</p>
            </CardContent>
          </Card>
        )}

        <div className="mt-6 text-center">
          <Button variant="outline" onClick={() => setLocation("/orders")}>
            Back to Orders
          </Button>
        </div>
      </div>

      {/* Approval Confirmation Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Approve Proof
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this proof? Once approved, your order will proceed to production and cannot be changed.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                <strong>By approving this proof, you confirm that:</strong>
              </p>
              <ul className="text-sm text-green-700 mt-2 space-y-1">
                <li>• All information is accurate and correct</li>
                <li>• You have reviewed all content thoroughly</li>
                <li>• You authorize production to begin</li>
                <li>• No further changes can be made after approval</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => approveMutation.mutate()}
              disabled={approveMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {approveMutation.isPending ? "Approving..." : "Confirm Approval"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Changes Dialog */}
      <Dialog open={showChangesDialog} onOpenChange={setShowChangesDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              Request Changes
            </DialogTitle>
            <DialogDescription>
              Please provide specific feedback about what changes are needed.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Required: Describe the changes needed
            </label>
            <Textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Please be specific about what needs to be changed (e.g., 'Fix spelling of doctor's name', 'Update phone number to...', 'Logo needs to be larger')"
              rows={4}
              className="resize-none"
              spellCheck="true"
              lang="en-US"
            />
            {comments.trim().length === 0 && (
              <p className="text-sm text-red-600 mt-1">
                Feedback is required when requesting changes
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowChangesDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => requestChangesMutation.mutate()}
              disabled={requestChangesMutation.isPending || comments.trim().length === 0}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              {requestChangesMutation.isPending ? "Sending..." : "Send Feedback"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}