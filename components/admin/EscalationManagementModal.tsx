"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, AlertCircle, Phone, Mail, UserCheck, Shield, MessageSquare } from "lucide-react";

interface EscalationManagementModalProps {
  order: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EscalationManagementModal({ 
  order, 
  isOpen, 
  onClose, 
  onSuccess 
}: EscalationManagementModalProps) {
  const [action, setAction] = useState<string>("");
  const [escalationNotes, setEscalationNotes] = useState("");
  const [resolution, setResolution] = useState("");
  const [contactCustomer, setContactCustomer] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!action) {
      setError("Please select an action to take");
      return;
    }

    if (action === 'CONTACT_CUSTOMER' && !escalationNotes.trim()) {
      setError("Please provide notes when contacting customer");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/orders/${order.id}/escalate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          escalationNotes,
          resolution,
          contactCustomer
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to handle escalation");
      }

      const result = await response.json();
      setSuccess(true);
      
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to handle escalation");
    } finally {
      setSubmitting(false);
    }
  };

  const getProofHistory = () => {
    if (!order?.proofs) return [];
    return order.proofs.sort((a: any, b: any) => a.proofRound - b.proofRound);
  };

  if (!isOpen) return null;

  const proofHistory = getProofHistory();
  const latestProof = proofHistory[proofHistory.length - 1];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-red-700 flex items-center space-x-2">
            <AlertCircle className="w-6 h-6" />
            <span>Escalation Management</span>
          </h2>
          <Button variant="ghost" onClick={onClose} size="sm">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-6">
          {/* Order Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order #{order.orderNumber}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div><strong>Customer:</strong> {order.practice?.name || 'N/A'}</div>
                <div><strong>Subject:</strong> {order.subject || 'N/A'}</div>
                <div><strong>Status:</strong> 
                  <Badge variant="destructive" className="ml-2">Escalated</Badge>
                </div>
                <div><strong>Total Proofs:</strong> {proofHistory.length}</div>
                <div><strong>Latest Proof:</strong> #{latestProof?.proofRound || 'N/A'}</div>
                <div><strong>Escalation Date:</strong> {new Date().toLocaleDateString()}</div>
              </div>
            </CardContent>
          </Card>

          {/* Proof History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <MessageSquare className="w-5 h-5" />
                <span>Proof History & Feedback</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {proofHistory.map((proof: any) => (
                  <div key={proof.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">Proof #{proof.proofRound}</span>
                        <Badge variant={
                          proof.status === 'APPROVED' ? 'default' : 
                          proof.status === 'CHANGES_REQUESTED' ? 'secondary' : 'destructive'
                        }>
                          {proof.status}
                        </Badge>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(proof.uploadedAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {proof.adminNotes && (
                      <div className="text-sm text-gray-700 mb-2">
                        <strong>Admin Notes:</strong> {proof.adminNotes}
                      </div>
                    )}
                    
                    {proof.userFeedback && (
                      <div className="text-sm text-gray-700 bg-yellow-50 p-2 rounded">
                        <strong>Customer Feedback:</strong> {proof.userFeedback}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Escalation Action */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Escalation Action Required</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="action">Select Action <span className="text-red-600">*</span></Label>
                <Select value={action} onValueChange={setAction}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Choose how to handle this escalation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RESOLVE">
                      <div className="flex items-center space-x-2">
                        <Shield className="w-4 h-4" />
                        <span>Resolve Escalation</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="CONTACT_CUSTOMER">
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4" />
                        <span>Contact Customer</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="ESCALATE_TO_MANAGER">
                      <div className="flex items-center space-x-2">
                        <UserCheck className="w-4 h-4" />
                        <span>Escalate to Management</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500 mt-1">
                  Choose the appropriate action to resolve this escalation
                </p>
              </div>

              {action === 'RESOLVE' && (
                <div>
                  <Label htmlFor="resolution">Resolution Details</Label>
                  <Textarea
                    id="resolution"
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    placeholder="Explain how this escalation was resolved..."
                    rows={3}
                    className="mt-1"
                  />
                </div>
              )}

              {action === 'CONTACT_CUSTOMER' && (
                <div>
                  <Label htmlFor="escalation-notes">
                    Contact Notes <span className="text-red-600">*</span>
                  </Label>
                  <Textarea
                    id="escalation-notes"
                    value={escalationNotes}
                    onChange={(e) => setEscalationNotes(e.target.value)}
                    placeholder="Document the customer contact and resolution plan..."
                    rows={3}
                    className="mt-1"
                  />
                </div>
              )}

              {action === 'ESCALATE_TO_MANAGER' && (
                <div>
                  <Label htmlFor="escalation-notes">Escalation Notes</Label>
                  <Textarea
                    id="escalation-notes"
                    value={escalationNotes}
                    onChange={(e) => setEscalationNotes(e.target.value)}
                    placeholder="Explain why this needs management attention..."
                    rows={3}
                    className="mt-1"
                  />
                </div>
              )}

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="contact-customer"
                  checked={contactCustomer}
                  onChange={(e) => setContactCustomer(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="contact-customer">
                  Send customer notification about escalation handling
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Action Summary */}
          {action && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-blue-900">Action Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-blue-800">
                  <div><strong>Action:</strong> {action.replace(/_/g, ' ')}</div>
                  {escalationNotes && <div><strong>Notes:</strong> {escalationNotes}</div>}
                  {resolution && <div><strong>Resolution:</strong> {resolution}</div>}
                  <div><strong>Customer Notification:</strong> {contactCustomer ? 'Yes' : 'No'}</div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error/Success Messages */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Escalation handled successfully! The order status has been updated and appropriate 
                notifications have been sent.
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !action || (action === 'CONTACT_CUSTOMER' && !escalationNotes.trim())}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Handle Escalation
                </>
              )}
            </Button>
          </div>

          {/* Important Notice */}
          <div className="text-center p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-6 h-6 text-red-500 mx-auto mb-2" />
            <p className="text-red-800 text-sm">
              <strong>Important:</strong> This order has exceeded the maximum number of proof revisions 
              and requires immediate attention. Choose the appropriate action to resolve the escalation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
