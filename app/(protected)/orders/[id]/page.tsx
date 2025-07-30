"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Download, Upload, Edit, Save, X } from "lucide-react";
import { useSession } from "next-auth/react";
import OrderStatusActions from "@/components/customer/OrderStatusActions";
import FileUploadComponent from "@/components/file-upload/FileUploadComponent";
import { Modal } from "@/components/ui/modal";

interface File {
  id: string;
  fileName: string;
  fileType: string;
  createdAt: string;
  uploader: {
    name: string;
  };
}

interface Order {
  id: string;
  orderNumber: string;
  subject: string;
  status: string;
  createdAt: string;
  cost: number;
  colorMode: string;
  preferredMailDate: string;
  practice: {
    name: string;
  };
}

export default function OrderDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const { id } = params as { id: string };
  
  const [order, setOrder] = useState<Order | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    subject: "",
    preferredMailDate: "",
    colorMode: ""
  });
  // File upload modal state
  const [showFileUploadModal, setShowFileUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<Record<string, any>>({});

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Fetch order details
        const orderRes = await fetch(`/api/orders/${id}`);
        const orderData = await orderRes.json();
        setOrder(orderData.order || null);
        
        if (orderData.order) {
          setEditForm({
            subject: orderData.order.subject || "",
            preferredMailDate: orderData.order.preferredMailDate ? new Date(orderData.order.preferredMailDate).toISOString().split('T')[0] : "",
            colorMode: orderData.order.colorMode || ""
          });
        }

        // Fetch files
        const filesRes = await fetch(`/api/orders/${id}/files`);
        const filesData = await filesRes.json();
        setFiles(filesData.files || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
      setLoading(false);
    }
    if (id) fetchData();
  }, [id]);

  const handleDownload = async (fileId: string, fileName: string) => {
    try {
      const response = await fetch(`/api/orders/${id}/files/${fileId}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Error downloading file:", error);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm("Are you sure you want to delete this file?")) return;
    
    try {
      const response = await fetch(`/api/orders/${id}/files?fileId=${fileId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setFiles(files.filter(file => file.id !== fileId));
      }
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  };

  const handleSaveEdit = async () => {
    try {
      const response = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });
      
      if (response.ok) {
        const updatedOrder = await response.json();
        setOrder(updatedOrder.order);
        setEditing(false);
      }
    } catch (error) {
      console.error("Error updating order:", error);
    }
  };

  // Only set files on change, don't upload yet
  const handleFilesChange = useCallback((filesRecord: Record<string, any>) => {
    setPendingFiles(prev => {
      // Only update if files have actually changed
      const prevKeys = Object.keys(prev);
      const newKeys = Object.keys(filesRecord);
      if (prevKeys.length !== newKeys.length || newKeys.some(k => prev[k]?.file !== filesRecord[k]?.file)) {
        return filesRecord;
      }
      return prev;
    });
  }, []);

  // Upload files when Upload button is clicked
  const handleUploadFiles = async () => {
    const files: File[] = Object.values(pendingFiles)
      .filter(f => f && f.file)
      .map(f => f.file);
    if (!files || files.length === 0) {
      setUploadError("Please select at least one file to upload.");
      return;
    }
    setUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("file", file as any);
      });
      const res = await fetch(`/api/orders/${id}/files`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to upload files");
      }
      // Refresh files list
      const filesRes = await fetch(`/api/orders/${id}/files`);
      const filesData = await filesRes.json();
      setFiles(filesData.files || []);
      setShowFileUploadModal(false);
      setPendingFiles({});
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload files");
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <main className="p-8">Loading...</main>;
  if (!order) return <main className="p-8">Order not found.</main>;

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={() => router.push("/orders")} className="text-blue-600">
          ← Back to Orders
        </Button>
        {!editing && (
          <Button onClick={() => setEditing(true)} className="flex items-center gap-2">
            <Edit className="w-4 h-4" />
            Edit Order
          </Button>
        )}
      </div>

      <div className="grid gap-6">
        {/* Order Details Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Order Details
              <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
                {order.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {editing ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="orderNumber">Order Number</Label>
                  <Input id="orderNumber" value={order.orderNumber} disabled />
                </div>
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input 
                    id="subject" 
                    value={editForm.subject}
                    onChange={(e) => setEditForm({...editForm, subject: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="preferredMailDate">Preferred Mail Date</Label>
                  <Input 
                    id="preferredMailDate" 
                    type="date"
                    value={editForm.preferredMailDate}
                    onChange={(e) => setEditForm({...editForm, preferredMailDate: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="colorMode">Color Mode</Label>
                  <Select value={editForm.colorMode} onValueChange={(value) => setEditForm({...editForm, colorMode: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="color">Color</SelectItem>
                      <SelectItem value="bw">Black & White</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveEdit} className="flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    Save Changes
                  </Button>
                  <Button variant="outline" onClick={() => setEditing(false)} className="flex items-center gap-2">
                    <X className="w-4 h-4" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div><strong>Order #:</strong> {order.orderNumber}</div>
                <div><strong>Practice:</strong> {order.practice?.name}</div>
                <div><strong>Subject:</strong> {order.subject || 'N/A'}</div>
                <div><strong>Cost:</strong> ${order.cost?.toFixed(2) || '0.00'}</div>
                <div><strong>Color Mode:</strong> {order.colorMode}</div>
                <div><strong>Preferred Mail Date:</strong> {order.preferredMailDate ? new Date(order.preferredMailDate).toLocaleDateString() : 'Not set'}</div>
                <div><strong>Created:</strong> {new Date(order.createdAt).toLocaleString()}</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Files Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Files ({files.length})
              <Button onClick={() => setShowFileUploadModal(true)} className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Upload Files
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {files.length === 0 ? (
              <p className="text-gray-500">No files uploaded yet.</p>
            ) : (
              <div className="space-y-2">
                {files.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex-1">
                      <div className="font-medium">{file.fileName}</div>
                      <div className="text-sm text-gray-500">
                        Uploaded by {file.uploader.name} on {new Date(file.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDownload(file.id, file.fileName)}
                        className="flex items-center gap-1"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteFile(file.id)}
                        className="flex items-center gap-1 text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* File Upload Modal */}
        {showFileUploadModal && (
          <Modal showModal={showFileUploadModal} setShowModal={setShowFileUploadModal} onClose={() => setShowFileUploadModal(false)}>
            <div className="p-0 w-full max-w-6xl flex flex-col h-[70vh] bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="flex flex-row flex-1 overflow-y-auto">
                {/* Left: File Upload */}
                <div className="flex-1 p-8 flex flex-col justify-center">
                  <h2 className="text-2xl font-bold mb-4">Upload Files for Order #{order.orderNumber}</h2>
                  <FileUploadComponent
                    onFilesChange={handleFilesChange}
                    showAllFileTypes={true}
                    requiredFiles={[]}
                  />
                  {uploadError && <div className="text-red-500 mt-2">{uploadError}</div>}
                </div>
                {/* Right: Instructions or Preview (optional) */}
                <div className="hidden md:block w-1/3 bg-gray-50 p-8 border-l flex flex-col justify-center">
                  <h3 className="text-lg font-semibold mb-2">Instructions</h3>
                  <ul className="text-sm text-gray-700 list-disc pl-5 space-y-2">
                    <li>Select one or more files to upload.</li>
                    <li>Accepted file types: CSV, Excel, PDF, DOCX, ZIP, etc.</li>
                    <li>Click <b>Upload</b> to add files to this order.</li>
                    <li>Files will appear in the list after upload.</li>
                  </ul>
                </div>
              </div>
              {/* Footer: Action Buttons */}
              <div className="flex justify-end gap-2 p-6 border-t bg-white sticky bottom-0 z-10">
                <Button onClick={() => setShowFileUploadModal(false)} variant="outline" disabled={uploading}>Cancel</Button>
                <Button onClick={handleUploadFiles} disabled={uploading} className="bg-primary-600 text-white">
                  {uploading ? "Uploading..." : "Upload"}
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {/* Status Actions */}
        {order && (
          <OrderStatusActions 
            order={order} 
            onStatusUpdate={() => {
              // Refresh order data when status changes
              fetch(`/api/orders/${id}`).then(res => res.json()).then(data => {
                setOrder(data.order || null);
              });
            }} 
          />
        )}
      </div>
    </main>
  );
} 