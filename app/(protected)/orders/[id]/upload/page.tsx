"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { useSession } from "next-auth/react";

interface Order {
  id: string;
  orderNumber: string;
  subject: string;
  status: string;
}

export default function OrderUploadPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const { id } = params as { id: string };
  
  const [order, setOrder] = useState<Order | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function fetchOrder() {
      setLoading(true);
      try {
        const res = await fetch(`/api/orders/${id}`);
        const data = await res.json();
        setOrder(data.order || null);
      } catch (error) {
        setError("Failed to load order details");
      }
      setLoading(false);
    }
    if (id) fetchOrder();
  }, [id]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError("Please select at least one file to upload");
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(false);

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append("file", file);
      });

      const response = await fetch(`/api/orders/${id}/files`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload files");
      }

      setSuccess(true);
      setSelectedFiles([]);
      
      // Reset file input
      const fileInput = document.getElementById("file-input") as HTMLInputElement;
      if (fileInput) fileInput.value = "";

      // Redirect back to order details after a short delay
      setTimeout(() => {
        router.push(`/orders/${id}`);
      }, 2000);

    } catch (error) {
      setError("Failed to upload files. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  if (loading) return <main className="p-8">Loading...</main>;
  if (!order) return <main className="p-8">Order not found.</main>;

  return (
    <main className="p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => router.push(`/orders/${id}`)} className="text-blue-600">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Order
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Files to Order #{order.orderNumber}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Order Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Order Details</h3>
            <div className="text-sm text-gray-600">
              <div><strong>Subject:</strong> {order.subject || 'N/A'}</div>
              <div><strong>Status:</strong> {order.status}</div>
            </div>
          </div>

          {/* File Upload */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="file-input">Select Files</Label>
              <Input
                id="file-input"
                type="file"
                multiple
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.jpg,.jpeg,.png,.gif"
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">
                Supported formats: PDF, DOC, DOCX, XLS, XLSX, CSV, TXT, JPG, PNG, GIF
              </p>
            </div>

            {/* Selected Files List */}
            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <Label>Selected Files ({selectedFiles.length})</Label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm truncate flex-1">{file.name}</span>
                      <span className="text-xs text-gray-500 ml-2">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="text-red-600 hover:text-red-800 ml-2"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                Files uploaded successfully! Redirecting to order details...
              </div>
            )}

            {/* Upload Button */}
            <Button
              onClick={handleUpload}
              disabled={selectedFiles.length === 0 || uploading}
              className="w-full"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload {selectedFiles.length} File{selectedFiles.length !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
} 