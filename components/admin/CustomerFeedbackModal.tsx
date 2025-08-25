"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle, MessageSquare, Download, Upload } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface CustomerFeedbackModalProps {
  order: any;
  isOpen: boolean;
  onClose: () => void;
  onUploadProof: (orderId: string, revisionNumber: number, comments: string) => void;
}

export default function CustomerFeedbackModal({ 
  order, 
  isOpen, 
  onClose, 
  onUploadProof 
}: CustomerFeedbackModalProps) {
  const [statusHistory, setStatusHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [proofComments, setProofComments] = useState("");
  const [revisionNumber, setRevisionNumber] = useState(1);

  useEffect(() => {
    if (isOpen && order) {
      fetchStatusHistory();
    }
  }, [isOpen, order]);

  const fetchStatusHistory = async () => {
    if (!order?.id) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/orders/${order.id}/status`);
      if (response.ok) {
        const data = await response.json();
        setStatusHistory(data.statusHistory || []);
      }
    } catch (error) {
      console.error("Failed to fetch status history:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadProof = async () => {
    if (!order?.id || !proofComments.trim()) return;
    
    setUploadingProof(true);
    try {
      await onUploadProof(order.id, revisionNumber, proofComments);
      setProofComments("");
      setRevisionNumber(prev => prev + 1);
      onClose();
    } catch (error) {
      console.error("Failed to upload proof:", error);
    } finally {
      setUploadingProof(false);
    }
  };

  const getStatusIcon = (status: string) => {
    if (status === 'approved') return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (status === 'changes-requested') return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
    return <MessageSquare className="w-4 h-4 text-blue-600" />;
  };

  const getStatusBadge = (status: string) => {
    if (status === 'approved') {
      return <Badge variant="secondary" className="bg-green-100 text-green-800">Approved</Badge>;
    }
    if (status === 'changes-requested') {
      return <Badge variant="outline" className="border-yellow-400 text-yellow-700">Changes Requested</Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            Customer Feedback - {order.orderNumber}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Subject:</span> {order.subject}
                </div>
                <div>
                  <span className="font-medium">Practice:</span> {order.practice?.name || 'N/A'}
                </div>
                <div>
                  <span className="font-medium">Current Status:</span> {getStatusBadge(order.status)}
                </div>
                <div>
                  <span className="font-medium">Customer:</span> {order.user?.name || order.user?.email || 'N/A'}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status History & Customer Feedback */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Communication History</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">Loading...</div>
              ) : statusHistory.length > 0 ? (
                <div className="space-y-4">
                  {statusHistory.map((entry, index) => (
                    <div key={entry.id || index} className="border-l-4 border-blue-200 pl-4 py-2">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(entry.toStatus)}
                          <span className="font-medium">
                            {entry.changedByRole === 'USER' ? 'Customer' : 'Admin'} - {entry.toStatus}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {formatDate(entry.createdAt)}
                        </span>
                      </div>
                      
                      {entry.comments && (
                        <div className="bg-gray-50 p-3 rounded-md">
                          <p className="text-sm text-gray-700">{entry.comments}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">No communication history found</div>
              )}
            </CardContent>
          </Card>

          {/* Upload Revised Proof Section */}
          {order.status === 'changes-requested' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Upload className="w-5 h-5 text-blue-600" />
                  Upload Revised Proof
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="revisionNumber">Revision Number</Label>
                  <input
                    id="revisionNumber"
                    type="number"
                    min="1"
                    value={revisionNumber}
                    onChange={(e) => setRevisionNumber(parseInt(e.target.value) || 1)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <Label htmlFor="proofComments">Comments for Customer</Label>
                  <Textarea
                    id="proofComments"
                    value={proofComments}
                    onChange={(e) => setProofComments(e.target.value)}
                    placeholder="Add any comments or instructions for the customer..."
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleUploadProof}
                    disabled={uploadingProof || !proofComments.trim()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {uploadingProof ? "Uploading..." : "Upload Proof & Notify Customer"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
