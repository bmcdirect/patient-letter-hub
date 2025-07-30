"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, X, AlertCircle, CheckCircle } from "lucide-react";

interface ProofUploadModalProps {
  order: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ProofUploadModal({ order, isOpen, onClose, onSuccess }: ProofUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [revision, setRevision] = useState("1");
  const [comments, setComments] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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
      const formData = new FormData();
      formData.append("proofFile", selectedFile);
      formData.append("adminNotes", comments);
      formData.append("revisionNumber", revision);
      const response = await fetch(`/api/admin/orders/${order.id}/upload-proof`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload proof");
      }
      setSuccess(true);
      setSelectedFile(null);
      setComments("");
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

  const removeFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

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
                <div><strong>Current Status:</strong> {order.status}</div>
              </div>
            </CardContent>
          </Card>

          {/* Proof Upload Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Proof Upload</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Revision Selection */}
              <div>
                <Label htmlFor="revision">Revision Number</Label>
                <Select value={revision} onValueChange={setRevision}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Revision 1</SelectItem>
                    <SelectItem value="2">Revision 2</SelectItem>
                    <SelectItem value="3">Revision 3</SelectItem>
                    <SelectItem value="4">Revision 4</SelectItem>
                    <SelectItem value="5">Revision 5</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500 mt-1">
                  Select the revision number for this proof upload
                </p>
              </div>

              {/* File Upload */}
              <div>
                <Label htmlFor="proof-file-input">Select Proof File</Label>
                <Input
                  id="proof-file-input"
                  type="file"
                  onChange={handleFileSelect}
                  accept=".pdf,.jpg,.jpeg,.png,.gif,.tiff,.bmp"
                  className="mt-1"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Supported formats: PDF, JPG, PNG, GIF, TIFF, BMP
                </p>
              </div>
              {/* Selected File */}
              {selectedFile && (
                <div className="space-y-2">
                  <Label>Selected File</Label>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm truncate flex-1">{selectedFile.name}</span>
                    <span className="text-xs text-gray-500 ml-2">
                      ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedFile(null)}
                      className="text-red-600 hover:text-red-800 ml-2"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              )}

              {/* Comments */}
              <div>
                <Label htmlFor="comments">Comments for Customer</Label>
                <Textarea
                  id="comments"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Add any comments or instructions for the customer..."
                  className="mt-1"
                  rows={3}
                />
              </div>

              {/* Error/Success Messages */}
              {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              {success && (
                <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded">
                  <CheckCircle className="w-4 h-4" />
                  Proof uploaded successfully! Order status updated and customer notified.
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={onClose} disabled={uploading}>
                  Cancel
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || uploading}
                  className="flex items-center gap-2"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload Proof (Rev {revision})
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 