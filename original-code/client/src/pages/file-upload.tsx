import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TopNavigation } from "@/components/layout/top-navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { FileUploadComponent } from "@/components/file-upload";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
// File types for upload
interface FileUploadFile {
  file: File;
  name: string;
  size: string;
  type: string;
}

export default function FileUploadPage() {
  const [, setLocation] = useLocation();
  const [orderId, setOrderId] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, FileUploadFile | null>>({});
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  // Get orderId from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const orderIdParam = urlParams.get('orderId');
    setOrderId(orderIdParam);
  }, []);

  const handleBackToOrders = () => {
    setLocation('/orders');
  };

  const handleFilesChange = (files: Record<string, any>) => {
    setUploadedFiles(files);
  };

  const handleUploadFiles = async () => {
    if (!orderId) {
      toast({
        title: "Error",
        description: "Order ID is required to upload files.",
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
    
    // Add files to form data
    Object.entries(uploadedFiles).forEach(([key, file]) => {
      if (file) {
        formData.append(key, file.file);
      }
    });

    try {
      const response = await fetch(`/api/orders/${orderId}/files`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      toast({
        title: "Success",
        description: `Successfully uploaded ${fileCount} file${fileCount > 1 ? 's' : ''}!`,
      });

      // Clear uploaded files
      setUploadedFiles({});
      
      // Redirect back to orders after a short delay
      setTimeout(() => {
        setLocation('/orders');
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
    <div className="min-h-screen bg-gray-50">
      <TopNavigation />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 overflow-hidden p-8">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button 
                  variant="outline" 
                  onClick={handleBackToOrders}
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Orders</span>
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Upload Files {orderId ? `- Order ${orderId}` : ''}
                  </h1>
                  <p className="text-gray-600">Upload files for this order using the professional interface</p>
                </div>
              </div>
              <div className="flex space-x-3">
                <Button 
                  onClick={handleUploadFiles}
                  disabled={fileCount === 0 || isUploading}
                  className="bg-primary-blue hover:bg-blue-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white flex items-center space-x-2 opacity-100 visible"
                  style={{ display: 'flex' }}
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>
                    {isUploading ? 'Uploading...' : fileCount > 0 ? `Upload ${fileCount} File${fileCount !== 1 ? 's' : ''}` : 'Upload Files'}
                  </span>
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleBackToOrders}
                  className="flex items-center space-x-2"
                >
                  <span>Done</span>
                </Button>
              </div>
            </div>
          </div>

          {/* File Upload Section */}
          <Card className="shadow-sm border border-gray-100">
            <CardContent className="p-6">
              <FileUploadComponent 
                onFilesChange={handleFilesChange}
                showAllFileTypes={true}
                requiredFiles={[]} // No required files for post-order uploads
              />
            </CardContent>
          </Card>

          {/* Upload Status */}
          {fileCount > 0 && (
            <Card className="mt-6 shadow-sm border border-gray-100">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Ready to Upload</h3>
                <div className="space-y-2">
                  {Object.entries(uploadedFiles).map(([key, file]) => 
                    file ? (
                      <div key={key} className="flex items-center justify-between bg-gray-50 rounded p-3">
                        <div>
                          <p className="font-medium text-gray-900">{file.name}</p>
                          <p className="text-sm text-gray-500">{file.size} • {key.replace('File', ' File')}</p>
                        </div>
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      </div>
                    ) : null
                  )}
                </div>
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-600">
                    Click "Upload Files" to add these files to Order {orderId}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}