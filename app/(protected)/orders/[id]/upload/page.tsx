"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  FileText, 
  X, 
  Download, 
  Eye, 
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  FileUp
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface OrderFile {
  id: string;
  fileName: string;
  filePath: string;
  fileType?: string;
  uploadedBy: string;
  createdAt: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  subject?: string;
  practice: {
    name: string;
  };
}

export default function OrderUploadPage() {
  const { isSignedIn } = useUser();
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [files, setFiles] = useState<OrderFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const orderId = params.id as string;

  useEffect(() => {
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }

    if (orderId) {
      fetchOrderAndFiles();
    }
  }, [isSignedIn, orderId, router]);

  const fetchOrderAndFiles = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/orders/${orderId}`);
      
      if (!response.ok) {
        toast({
          title: "Error",
          description: "Failed to fetch order",
          variant: "destructive",
        });
        return;
      }

      const data = await response.json();
      setOrder(data.order);
      setFiles(data.order.files || []);
    } catch (err) {
      console.error("Error fetching order:", err);
      toast({
        title: "Error",
        description: "Failed to fetch order",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const newFiles = Array.from(e.dataTransfer.files);
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select files to upload",
        variant: "destructive",
      });
      return;
    }

    // Validate file types and sizes
    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/csv'
    ];

    for (const file of selectedFiles) {
      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds the 50MB limit`,
          variant: "destructive",
        });
        return;
      }
      
      if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|doc|docx|xls|xlsx|jpg|jpeg|png|gif|csv)$/i)) {
        toast({
          title: "Unsupported file type",
          description: `${file.name} is not a supported file type`,
          variant: "destructive",
        });
        return;
      }
    }

    setUploading(true);
    const formData = new FormData();
    selectedFiles.forEach(file => {
      formData.append('files', file);
    });
    formData.append('orderId', orderId);

    try {
      const response = await fetch('/api/file-upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      
      toast({
        title: "Success",
        description: result.message || `${selectedFiles.length} file(s) uploaded successfully`,
      });

      // Refresh files list
      await fetchOrderAndFiles();
      
      // Clear selected files
      setSelectedFiles([]);
      
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload files",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const downloadFile = async (file: OrderFile) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/files/${file.id}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive",
      });
    }
  };

  if (!isSignedIn) {
    return <div>Loading...</div>;
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading order...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-4">The order you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/orders')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Button 
            onClick={() => router.push(`/orders/${orderId}`)} 
            variant="outline" 
            size="sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Order
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Upload Files</h1>
            <p className="text-gray-600">
              Order {order.orderNumber} - {order.subject || 'No subject'}
            </p>
            <p className="text-sm text-gray-500">{order.practice.name}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Upload className="h-5 w-5" />
                <span>Upload New Files</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Drag & Drop Zone */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">
                  Drop files here or click to browse
                </p>
                <p className="text-gray-500 mb-4">
                  Support for PDF, Word, Excel, and image files
                </p>
                <Input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
                />
                <Button
                  onClick={() => document.getElementById('file-upload')?.click()}
                  variant="outline"
                >
                  Choose Files
                </Button>
              </div>

              {/* Selected Files */}
              {selectedFiles.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-medium">Selected Files ({selectedFiles.length})</h3>
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          {file.type.startsWith('image/') ? (
                            <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                              <span className="text-xs text-blue-600">IMG</span>
                            </div>
                          ) : file.type === 'application/pdf' ? (
                            <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center">
                              <span className="text-xs text-red-600">PDF</span>
                            </div>
                          ) : file.type.includes('word') ? (
                            <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                              <span className="text-xs text-blue-600">DOC</span>
                            </div>
                          ) : file.type.includes('excel') ? (
                            <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                              <span className="text-xs text-green-600">XLS</span>
                            </div>
                          ) : (
                            <FileText className="h-8 w-8 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{file.name}</p>
                          <p className="text-sm text-gray-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type || 'Unknown type'}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  
                  <Button 
                    onClick={uploadFiles} 
                    disabled={uploading}
                    className="w-full"
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload {selectedFiles.length} File(s)
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Existing Files */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileUp className="h-5 w-5" />
                <span>Existing Files ({files.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {files.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No files uploaded yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {files.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          {file.fileType === 'admin-proof' ? (
                            <div className="w-8 h-8 bg-purple-100 rounded flex items-center justify-center">
                              <span className="text-xs text-purple-600">PROOF</span>
                            </div>
                          ) : file.fileName.toLowerCase().endsWith('.pdf') ? (
                            <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center">
                              <span className="text-xs text-red-600">PDF</span>
                            </div>
                          ) : file.fileName.match(/\.(doc|docx)$/i) ? (
                            <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                              <span className="text-xs text-blue-600">DOC</span>
                            </div>
                          ) : file.fileName.match(/\.(xls|xlsx)$/i) ? (
                            <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                              <span className="text-xs text-green-600">XLS</span>
                            </div>
                          ) : file.fileName.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                            <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                              <span className="text-xs text-blue-600">IMG</span>
                            </div>
                          ) : (
                            <FileText className="h-8 w-8 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{file.fileName}</p>
                          <p className="text-sm text-gray-500">
                            {file.fileType || 'customer_data'} • Uploaded {new Date(file.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => downloadFile(file)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upload Guidelines */}
          <Card>
            <CardHeader>
              <CardTitle>Upload Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <p>Supported formats: PDF, Word (.doc, .docx), Excel (.xls, .xlsx), Images (.jpg, .png, .gif)</p>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <p>Maximum file size: 50MB per file</p>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <p>Files are automatically associated with this order</p>
              </div>
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <p>Ensure files contain accurate patient data and are properly formatted</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 