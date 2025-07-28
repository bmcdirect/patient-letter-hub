"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, MessageSquare, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function ProofReviewPage() {
  const params = useParams();
  const orderId = params?.id;
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [revisions, setRevisions] = useState<any[]>([]);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState("");
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showChangesDialog, setShowChangesDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [orderRes, revRes, apprRes] = await Promise.all([
        fetch(`/api/orders/${orderId}/customer`),
        fetch(`/api/orders/${orderId}/revisions/customer`),
        fetch(`/api/orders/${orderId}/approvals`),
      ]);
      setOrder(await orderRes.json());
      setRevisions(await revRes.json());
      setApprovals(await apprRes.json());
      setLoading(false);
    }
    if (orderId) fetchData();
  }, [orderId]);

  const latestRevision = revisions.length > 0 ? [...revisions].sort((a, b) => b.revisionNumber - a.revisionNumber)[0] : null;
  const isWaitingForApproval = order?.status?.startsWith("waiting-approval");

  const handleDownloadProof = () => {
    if (!orderId) return;
    const downloadUrl = `/api/orders/${orderId}/proof-download`;
    window.open(downloadUrl, '_blank');
  };

  const handleApprove = async () => {
    setSubmitting(true);
    await fetch(`/api/orders/${orderId}/approve`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ revisionId: latestRevision.id, comments: comments || "Approved without comments" })
    });
    setShowApprovalDialog(false);
    setSubmitting(false);
    router.refresh();
  };

  const handleRequestChanges = async () => {
    if (!comments.trim()) return;
    setSubmitting(true);
    await fetch(`/api/orders/${orderId}/request-changes`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ revisionId: latestRevision.id, comments })
    });
    setShowChangesDialog(false);
    setComments("");
    setSubmitting(false);
    router.refresh();
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading proof for review...</div>;
  }
  if (!order) {
    return <div className="min-h-screen flex items-center justify-center">Order not found.</div>;
  }
  if (!latestRevision) {
    return <div className="min-h-screen flex items-center justify-center">No proof available yet.</div>;
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Proof Review</h1>
            <p className="text-gray-600">Review and approve your design proof</p>
          </div>
          <Badge variant={getStatusBadgeVariant(order.status)}>
            {order.status?.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
          </Badge>
        </div>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" /> Order Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Order Number</p>
                <p className="font-semibold">{order.orderNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Subject</p>
                <p className="font-semibold">{order.subject}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Template Type</p>
                <p className="font-semibold">{order.templateType}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" /> Current Proof - Revision {latestRevision.revisionNumber}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 rounded-lg p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Design Proof Ready</h3>
              <p className="text-gray-600 mb-4">
                Uploaded on {new Date(latestRevision.createdAt).toLocaleDateString()} at {new Date(latestRevision.createdAt).toLocaleTimeString()}
              </p>
              <Button onClick={handleDownloadProof} className="bg-primary hover:bg-primary/90">
                <Download className="w-4 h-4 mr-2" /> Download Proof (PDF)
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
        {approvals.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" /> Revision History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto space-y-4 pr-2">
                {[...approvals].sort((a, b) => new Date(b.decidedAt).getTime() - new Date(a.decidedAt).getTime()).map((approval) => (
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
                        {new Date(approval.decidedAt).toLocaleDateString()}
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
        {isWaitingForApproval && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" /> Your Decision
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
                  disabled={submitting}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle className="w-4 h-4 mr-2" /> Approve Proof
                </Button>
                <Button
                  onClick={() => setShowChangesDialog(true)}
                  disabled={submitting}
                  variant="outline"
                  className="flex-1 border-yellow-400 text-yellow-700 hover:bg-yellow-50 border-2"
                >
                  <AlertTriangle className="w-4 h-4 mr-2" /> Request Changes
                </Button>
              </div>
              <p className="text-sm text-gray-600 text-center">
                <strong>Important:</strong> Once approved, your order will proceed to production and cannot be changed.
              </p>
            </CardContent>
          </Card>
        )}
        {!isWaitingForApproval && order.status === 'approved' && (
          <Card>
            <CardContent className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-green-900 mb-2">Proof Approved</h3>
              <p className="text-green-700">This proof has been approved and is now in production.</p>
            </CardContent>
          </Card>
        )}
        <div className="mt-6 text-center">
          <Button variant="outline" onClick={() => router.push("/orders")}>Back to Orders</Button>
        </div>
        <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" /> Approve Proof
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
              <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>Cancel</Button>
              <Button onClick={handleApprove} disabled={submitting} className="bg-green-600 hover:bg-green-700">
                {submitting ? "Approving..." : "Confirm Approval"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={showChangesDialog} onOpenChange={setShowChangesDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" /> Request Changes
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
              <Button variant="outline" onClick={() => setShowChangesDialog(false)}>Cancel</Button>
              <Button onClick={handleRequestChanges} disabled={submitting || comments.trim().length === 0} className="bg-yellow-600 hover:bg-yellow-700">
                {submitting ? "Sending..." : "Send Feedback"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
} 