"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Upload, X, AlertCircle, CheckCircle, Clock, FileText } from "lucide-react";

interface ProofUploadModalProps {
  order: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ProofUploadModal({ order, isOpen, onClose, onSuccess }: ProofUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [escalationReason, setEscalationReason] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [currentProofRound, setCurrentProofRound] = useState(0);
  const [needsEscalation, setNeedsEscalation] = useState(false);

  useEffect(() => {
    if (isOpen && order) {
      fetchCurrentProofInfo();
    }
  }, [isOpen, order]);

  const fetchCurrentProofInfo = async () => {
    try {
      const response = await fetch(`/api/orders/${order.id}/proofs`);
      if (response.ok) {
        const data = await response.json();
        setCurrentProofRound(data.currentProofRound || 0);
        setNeedsEscalation(data.needsEscalation || false);
      }
    } catch (error) {
      console.error('Failed to fetch proof info:', error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a proof file to upload");
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(false);

    try {
      // Use the new PostgreSQL-based proof upload endpoint
      const formData = new FormData();
      formData.append("proofFile", selectedFile);
      formData.append("adminNotes", adminNotes);
      if (needsEscalation) {
        formData.append("escalationReason", escalationReason);
      }

      const response = await fetch(`/api/admin/orders/${order.id}/upload-proof`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload proof");
      }

      const data = await response.json();

      setSuccess(true);
      setSelectedFile(null);
      setAdminNotes("");
      setEscalationReason("");

      // Reset file input
      const fileInput = document.getElementById("proof-file-input") as HTMLInputElement;
      if (fileInput) fileInput.value = "";

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to upload proof. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  const nextProofRound = currentProofRound + 1;
  const isEscalationRequired = nextProofRound >= 3;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Upload Proof for Order #{order.orderNumber}</h2>
          <Button variant="ghost" onClick={onClose} size="sm">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-6">
          {/* Order Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>Order #:</strong> {order.orderNumber}</div>
                <div><strong>Customer:</strong> {order.practice?.name || 'N/A'}</div>
                <div><strong>Subject:</strong> {order.subject || 'N/A'}</div>
                <div><strong>Current Status:</strong> 
                  <Badge variant="outline" className="ml-2">{order.status}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Proof Round Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Proof #{nextProofRound}</span>
                {isEscalationRequired && (
                  <Badge variant="destructive">Escalation Required</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>Previous Proofs:</span>
                  <span className="font-medium">{currentProofRound}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Next Proof Round:</span>
                  <span className="font-medium text-blue-600">#{nextProofRound}</span>
                </div>
                {isEscalationRequired && (
                  <Alert className="border-orange-200 bg-orange-50">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-800">
                      <strong>Warning:</strong> This will be proof #{nextProofRound}. After 3+ revisions, 
                      orders require manual escalation and customer contact.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upload Proof File</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="proof-file-input">Select Proof File</Label>
                  <Input
                    id="proof-file-input"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.gif"
                    onChange={handleFileSelect}
                    className="mt-1"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Accepted formats: PDF, JPG, PNG, GIF
                  </p>
                </div>

                {selectedFile && (
                  <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-green-800 font-medium">{selectedFile.name}</span>
                    <span className="text-green-600 text-sm">
                      ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Admin Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Design Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="admin-notes">Notes for Customer (Optional)</Label>
                  <Textarea
                    id="admin-notes"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add any notes about this proof or design decisions..."
                    rows={3}
                    className="mt-1"
                  />
                </div>

                {isEscalationRequired && (
                  <div>
                    <Label htmlFor="escalation-reason">
                      Escalation Reason <span className="text-red-600">*</span>
                    </Label>
                    <Textarea
                      id="escalation-reason"
                      value={escalationReason}
                      onChange={(e) => setEscalationReason(e.target.value)}
                      placeholder="Explain why this proof requires escalation..."
                      rows={3}
                      className="mt-1"
                      required
                    />
                    <p className="text-sm text-red-600 mt-1">
                      Required for proof #{nextProofRound} due to escalation threshold
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Error/Success Messages */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Proof uploaded successfully! Proof #{nextProofRound} is ready for customer review.
                {isEscalationRequired && " ESCALATION REQUIRED - Customer will be contacted directly."}
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={uploading || !selectedFile || (isEscalationRequired && !escalationReason.trim())}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Proof #{nextProofRound}
                </>
              )}
            </Button>
          </div>

          {/* Escalation Warning */}
          {isEscalationRequired && (
            <div className="text-center p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <AlertCircle className="w-8 h-8 text-orange-500 mx-auto mb-2" />
              <p className="text-orange-800 text-sm">
                <strong>Important:</strong> After uploading proof #{nextProofRound}, this order will be 
                automatically escalated and our customer service team will contact the customer directly.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 