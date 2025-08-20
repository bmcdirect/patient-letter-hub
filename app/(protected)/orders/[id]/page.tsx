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
  Edit, 
  Trash2, 
  Eye,
  Calendar,
  DollarSign,
  Building
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  subject?: string;
  cost?: number;
  colorMode?: string;
  preferredMailDate?: string;
  createdAt: string;
  practice?: {
    name: string;
  };
  files?: Array<{
    id: string;
    fileName: string;
    fileType?: string;
    createdAt: string;
  }>;
}

export default function OrderDetailPage() {
  const { isSignedIn, user } = useUser();
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const orderId = params.id as string;

  useEffect(() => {
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }

    fetchOrderDetails();
  }, [isSignedIn, router, orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/orders/${orderId}`);
      
      if (!res.ok) {
        if (res.status === 404) {
          setError("Order not found");
        } else {
          setError("Failed to fetch order details");
        }
        return;
      }

      const data = await res.json();
      setOrder(data);
    } catch (err) {
      setError("Failed to fetch order details");
      console.error("Error fetching order:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = () => {
    router.push(`/orders/${orderId}/upload`);
  };

  const refreshOrderData = () => {
    fetchOrderDetails();
  };

  const handleEditOrder = () => {
    router.push(`/orders/create?edit=${orderId}`);
  };

  const handleDeleteOrder = async () => {
    if (!confirm("Are you sure you want to delete this order? This action cannot be undone.")) {
      return;
    }

    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete order");
      }

      toast({
        title: "Order Deleted",
        description: "Order has been successfully deleted.",
      });

      router.push("/orders");
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete order. Please try again.",
        variant: "destructive",
      });
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
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isSignedIn) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">{error || "Order not found"}</p>
          <Button onClick={() => router.push("/orders")}>Back to Orders</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Order Details</h1>
          <p className="text-gray-600 mt-2">Welcome, {user?.fullName || user?.emailAddresses[0]?.emailAddress}</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={() => router.push("/orders")}>
            Back to Orders
          </Button>
          <Button onClick={handleEditOrder}>
            <Edit className="w-4 h-4 mr-2" />
            Edit Order
          </Button>
        </div>
      </div>

      {/* Order Information */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{order.orderNumber}</span>
            <Badge className={getStatusColor(order.status)}>
              {order.status}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Building className="w-4 h-4 text-gray-500" />
                <span className="font-medium">Practice:</span>
                <span>{order.practice?.name || 'N/A'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-gray-500" />
                <span className="font-medium">Subject:</span>
                <span>{order.subject || 'No subject'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="font-medium">Created:</span>
                <span>{new Date(order.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-gray-500" />
                <span className="font-medium">Total Cost:</span>
                <span className="font-bold text-lg">
                  ${order.cost ? order.cost.toFixed(2) : '0.00'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-medium">Print Mode:</span>
                <span className="capitalize">{order.colorMode || 'N/A'}</span>
              </div>
              {order.preferredMailDate && (
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">Preferred Mail Date:</span>
                  <span>{new Date(order.preferredMailDate).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Files Section */}
      <Card className="mb-6">
        <CardHeader>
                  <CardTitle className="flex items-center justify-between">
          <span>Files</span>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={refreshOrderData}>
              <Eye className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={handleFileUpload}>
              <Upload className="w-4 h-4 mr-2" />
              Upload Files
            </Button>
          </div>
        </CardTitle>
        </CardHeader>
        <CardContent>
          {order.files && order.files.length > 0 ? (
            <div className="space-y-3">
              {order.files.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="font-medium">{file.fileName}</p>
                      <p className="text-sm text-gray-500">
                        {file.fileType} • {new Date(file.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No files uploaded yet</p>
              <Button onClick={handleFileUpload} className="mt-2">
                <Upload className="w-4 h-4 mr-2" />
                Upload First File
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions Section */}
      <Card>
        <CardHeader>
          <CardTitle>Order Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button onClick={handleFileUpload} className="h-20 flex-col">
              <Upload className="w-6 h-6 mb-2" />
              <span>Upload Files</span>
            </Button>
            
            <Button onClick={handleEditOrder} variant="outline" className="h-20 flex-col">
              <Edit className="w-6 h-6 mb-2" />
              <span>Edit Order</span>
            </Button>
            
            <Button 
              onClick={() => router.push(`/orders/${orderId}/proof-review`)} 
              variant="outline" 
              className="h-20 flex-col"
            >
              <Eye className="w-6 h-6 mb-2" />
              <span>Review Proofs</span>
            </Button>
            
            <Button 
              onClick={handleDeleteOrder} 
              variant="destructive" 
              className="h-20 flex-col"
            >
              <Trash2 className="w-6 h-6 mb-2" />
              <span>Delete Order</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 