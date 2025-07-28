"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { CheckCircle, ArrowLeft } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import FileUploadComponent, { UploadedFile } from "@/components/file-upload/FileUploadComponent";

interface Order {
  id: string;
  orderNumber: string;
  status: string;
}

export default function FileUploadPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, UploadedFile | null>>({});
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  // Fetch user's open/draft orders on mount
  useEffect(() => {
    async function fetchOrders() {
      const res = await fetch("/api/orders/open");
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders);
      }
    }
    fetchOrders();
  }, []);

  const handleBackToOrders = () => {
    router.push("/orders");
  };

  const handleFilesChange = (files: Record<string, any>) => {
    setUploadedFiles(files);
  };

  const handleUploadFiles = async () => {
    if (!selectedOrderId) {
      toast({
        title: "Order Required",
        description: "Please select an order before uploading files.",
        variant: "destructive",
      });
      return;
    }
    const fileCount = Object.values(uploadedFiles).filter(file => file !== null).length;
    if (fileCount === 0) {
      toast({
        title: "No Files Selected",
        description: "Please select at least one file to upload.",
        variant: "destructive",
      });
      return;
    }
    setIsUploading(true);
    const formData = new FormData();
    Object.entries(uploadedFiles).forEach(([key, file]) => {
      if (file) {
        formData.append(key, file.file);
      }
    });
    formData.append("orderId", selectedOrderId);
    try {
      const response = await fetch(`/api/file-upload`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error("Upload failed");
      }
      toast({
        title: "Success",
        description: `Successfully uploaded ${fileCount} file${fileCount > 1 ? "s" : ""}!`,
      });
      setUploadedFiles({});
      setTimeout(() => {
        router.push("/orders");
      }, 1500);
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload files. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const fileCount = Object.values(uploadedFiles).filter(file => file !== null).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="flex flex-col gap-4 p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={handleBackToOrders} className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Orders</span>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Upload Files</h1>
              <p className="text-muted-foreground">Upload files for an order using the professional interface</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <Button onClick={handleUploadFiles} disabled={!selectedOrderId || fileCount === 0 || isUploading} className="bg-primary hover:bg-primary/90 disabled:bg-gray-400 disabled:cursor-not-allowed text-white flex items-center space-x-2">
              <CheckCircle className="h-4 w-4" />
              <span>{isUploading ? 'Uploading...' : fileCount > 0 ? `Upload ${fileCount} File${fileCount !== 1 ? 's' : ''}` : 'Upload Files'}</span>
            </Button>
            <Button variant="outline" onClick={handleBackToOrders} className="flex items-center space-x-2">
              <span>Done</span>
            </Button>
          </div>
        </div>

        {/* Order selection dropdown */}
        <Card className="mb-6 border border-gray-100">
          <CardContent className="p-6">
            <label className="block mb-2 font-medium">Select Order</label>
            <select
              className="w-full border rounded p-2"
              value={selectedOrderId}
              onChange={e => setSelectedOrderId(e.target.value)}
            >
              <option value="">-- Select an open/draft order --</option>
              {orders.map(order => (
                <option key={order.id} value={order.id}>
                  {order.orderNumber} ({order.status})
                </option>
              ))}
            </select>
          </CardContent>
        </Card>

        {/* File Upload Section */}
        <Card className="shadow-sm border border-gray-100">
          <CardContent className="p-6">
            <FileUploadComponent onFilesChange={handleFilesChange} showAllFileTypes={true} requiredFiles={[]} />
          </CardContent>
        </Card>

        {/* Upload Status */}
        {fileCount > 0 && (
          <Card className="mt-6 shadow-sm border border-gray-100">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Ready to Upload</h3>
              <div className="space-y-2">
                {Object.entries(uploadedFiles).map(([key, file]) =>
                  file ? (
                    <div key={key} className="flex items-center justify-between bg-gray-50 rounded p-3">
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-muted-foreground">{file.size}  {key.replace('File', ' File')}</p>
                      </div>
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    </div>
                  ) : null
                )}
              </div>
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Click "Upload Files" to add these files to the selected order
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 