"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, 
  Upload, 
  Download, 
  Eye, 
  Calendar, 
  DollarSign, 
  Building, 
  User,
  ArrowLeft,
  Clock,
  CheckCircle,
  AlertCircle,
  FileUp,
  X
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
  templateType?: string;
  colorMode?: string;
  cost?: number;
  preferredMailDate?: string;
  productionStartDate?: string;
  productionEndDate?: string;
  fulfilledAt?: string;
  createdAt: string;
  updatedAt: string;
  practice: {
    id: string;
    name: string;
    address?: string;
    phone?: string;
    email?: string;
  };
  user: {
    id: string;
    name?: string;
    email?: string;
    role: string;
  };
  files: OrderFile[];
}

export default function OrderDetailPage() {
  const { isSignedIn, user: clerkUser } = useUser();
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<OrderFile | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const orderId = params.id as string;

  useEffect(() => {
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }

    if (orderId) {
      fetchOrder();
    }
  }, [isSignedIn, orderId, router]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/orders/${orderId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError("Order not found");
        } else if (response.status === 403) {
          setError("You don't have permission to view this order");
        } else {
          setError("Failed to fetch order");
        }
        return;
      }

      const data = await response.json();
      setOrder(data.order);
    } catch (err) {
      console.error("Error fetching order:", err);
      setError("Failed to fetch order");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'delivered':
        return 'bg-emerald-100 text-emerald-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'draft':
        return <FileText className="h-4 w-4" />;
      case 'in-progress':
        return <FileUp className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
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

  const viewFile = async (file: OrderFile) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/files/${file.id}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        
        setPreviewFile(file);
        setPreviewUrl(url);
      }
    } catch (error) {
      console.error('View error:', error);
      toast({
        title: "Error",
        description: "Failed to view file",
        variant: "destructive",
      });
    }
  };

  const closePreview = () => {
    if (previewUrl) {
      window.URL.revokeObjectURL(previewUrl);
    }
    setPreviewFile(null);
    setPreviewUrl(null);
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
            <p className="text-gray-600">Loading order details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => router.push('/orders')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
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
            onClick={() => router.push('/orders')} 
            variant="outline" 
            size="sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Order {order.orderNumber}</h1>
            <p className="text-gray-600">{order.subject || 'No subject'}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Badge className={`${getStatusColor(order.status)} flex items-center space-x-2`}>
            {getStatusIcon(order.status)}
            <span className="capitalize">{order.status}</span>
          </Badge>
          <Button onClick={() => router.push(`/orders/${orderId}/upload`)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Files
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Order Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Order Number</label>
                  <p className="text-lg font-semibold">{order.orderNumber}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(order.status)}>
                      {getStatusIcon(order.status)}
                      <span className="capitalize ml-1">{order.status}</span>
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Subject</label>
                  <p className="text-lg">{order.subject || 'No subject specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Template Type</label>
                  <p className="text-lg">{order.templateType || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Color Mode</label>
                  <p className="text-lg">{order.colorMode || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Cost</label>
                  <p className="text-lg">
                    {order.cost ? `$${order.cost.toFixed(2)}` : 'Not specified'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>



          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Timeline</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="font-medium">Order Created</p>
                    <p className="text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                {order.productionStartDate && (
                  <div className="flex items-center space-x-4">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">Production Started</p>
                      <p className="text-sm text-gray-500">
                        {new Date(order.productionStartDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
                {order.productionEndDate && (
                  <div className="flex items-center space-x-4">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">Production Completed</p>
                      <p className="text-sm text-gray-500">
                        {new Date(order.productionEndDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
                {order.fulfilledAt && (
                  <div className="flex items-center space-x-4">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">Order Fulfilled</p>
                      <p className="text-sm text-gray-500">
                        {new Date(order.fulfilledAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
                {order.preferredMailDate && (
                  <div className="flex items-center space-x-4">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">Preferred Mail Date</p>
                      <p className="text-sm text-gray-500">
                        {new Date(order.preferredMailDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Files */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileUp className="h-5 w-5" />
                <span>Files ({order.files.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {order.files.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No files uploaded yet</p>
                  <Button 
                    onClick={() => router.push(`/orders/${orderId}/upload`)}
                    variant="outline" 
                    className="mt-2"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Files
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {order.files.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="font-medium">{file.fileName}</p>
                          <p className="text-sm text-gray-500">
                            Uploaded {new Date(file.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" onClick={() => viewFile(file)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
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
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Practice Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="h-5 w-5" />
                <span>Practice</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Name</label>
                <p className="font-medium">{order.practice.name}</p>
              </div>
              {order.practice.address && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Address</label>
                  <p className="text-sm">{order.practice.address}</p>
                </div>
              )}
              {order.practice.phone && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <p className="text-sm">{order.practice.phone}</p>
                </div>
              )}
              {order.practice.email && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-sm">{order.practice.email}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* User Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Order Creator</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Name</label>
                <p className="font-medium">{order.user.name || 'Not specified'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-sm">{order.user.email || 'Not specified'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Role</label>
                <Badge variant="outline" className="capitalize">
                  {order.user.role.toLowerCase()}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={() => router.push(`/orders/${orderId}/upload`)}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Files
              </Button>
              <Button variant="outline" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Download All Files
              </Button>
              {/^waiting-approval(-rev\d+)?$/.test(order.status) && (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => router.push(`/orders/${orderId}/proof-review`)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Review Proof
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* File Preview Modal */}
      {previewFile && previewUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">File Preview: {previewFile.fileName}</h2>
              <Button variant="ghost" onClick={closePreview} size="sm">
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              {/* File Info */}
              <div className="text-sm text-gray-600">
                <p><strong>File Type:</strong> {previewFile.fileType || 'Unknown'}</p>
                <p><strong>Uploaded:</strong> {new Date(previewFile.createdAt).toLocaleString()}</p>
              </div>
              
              {/* File Preview */}
              <div className="border rounded-lg p-4 bg-gray-50">
                {previewFile.fileName.toLowerCase().endsWith('.pdf') ? (
                  <iframe
                    src={previewUrl}
                    className="w-full h-96 border-0"
                    title={previewFile.fileName}
                  />
                ) : previewFile.fileName.match(/\.(jpg|jpeg|png|gif|bmp)$/i) ? (
                  <img
                    src={previewUrl}
                    alt={previewFile.fileName}
                    className="max-w-full h-auto mx-auto"
                  />
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Preview not available for this file type</p>
                    <Button 
                      onClick={() => downloadFile(previewFile)} 
                      className="mt-4"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download to View
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Actions */}
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={closePreview}>
                  Close
                </Button>
                <Button onClick={() => downloadFile(previewFile)}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 