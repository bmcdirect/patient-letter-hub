import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Download, Trash2, FileText, Image, Mail, Archive } from "lucide-react";

// Types
export interface OrderFile {
  id: string;
  fileName: string;
  fileType: string | null;
  fileSize: number | null;
  uploadedBy: string;
  createdAt: string;
  uploader: {
    id: string;
    email: string;
    name: string | null;
  };
}

interface OrderFilesDisplayProps {
  orderId: string;
  onFileDeleted?: () => void;
  canDelete?: boolean;
}

const getFileIcon = (fileType: string | null) => {
  if (!fileType) return FileText;
  
  if (fileType.includes('image')) return Image;
  if (fileType.includes('pdf')) return FileText;
  if (fileType.includes('zip')) return Archive;
  if (fileType.includes('mail') || fileType.includes('envelope')) return Mail;
  
  return FileText;
};

const formatFileSize = (bytes: number | null) => {
  if (!bytes) return 'Unknown size';
  
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default function OrderFilesDisplay({ 
  orderId, 
  onFileDeleted,
  canDelete = false 
}: OrderFilesDisplayProps) {
  const [files, setFiles] = useState<OrderFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch files for this order
  const fetchFiles = async () => {
    try {
      setLoading(true);
      console.log(`🔍 OrderFilesDisplay - Fetching files for order: ${orderId}`);
      
      const response = await fetch(`/api/orders/${orderId}/files`);
      
      console.log(`🔍 OrderFilesDisplay - Response status: ${response.status}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ OrderFilesDisplay - API error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(`Failed to fetch files: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`✅ OrderFilesDisplay - Files received:`, data);
      setFiles(data.files || []);
    } catch (error) {
      console.error('❌ OrderFilesDisplay - Error fetching files:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load files",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId && orderId.trim() !== '') {
      console.log(`🔍 OrderFilesDisplay - useEffect triggered with orderId: ${orderId}`);
      fetchFiles();
    } else {
      console.log(`⚠️ OrderFilesDisplay - Invalid orderId: ${orderId}`);
    }
  }, [orderId]);

  // Download file
  const handleDownload = async (fileId: string, fileName: string) => {
    try {
      const response = await fetch(`/api/files/${fileId}`);
      
      if (!response.ok) {
        throw new Error('Failed to download file');
      }
      
      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Download Started",
        description: `Downloading ${fileName}`,
      });
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "Download Error",
        description: "Failed to download file",
        variant: "destructive"
      });
    }
  };

  // Delete file
  const handleDelete = async (fileId: string, fileName: string) => {
    if (!canDelete) return;
    
    try {
      setDeleting(fileId);
      const response = await fetch(`/api/files/${fileId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete file');
      }
      
      // Remove from local state
      setFiles(files.filter(f => f.id !== fileId));
      
      toast({
        title: "File Deleted",
        description: `${fileName} has been deleted`,
      });
      
      // Notify parent component
      if (onFileDeleted) {
        onFileDeleted();
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: "Delete Error",
        description: "Failed to delete file",
        variant: "destructive"
      });
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Attached Files</h3>
        <div className="text-sm text-gray-500">Loading files...</div>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Attached Files</h3>
        <div className="text-sm text-gray-500">No files attached to this order.</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Attached Files ({files.length})</h3>
      
      <div className="space-y-2">
        {files.map((file) => {
          const Icon = getFileIcon(file.fileType);
          const uploaderName = file.uploader.name || file.uploader.email;
          
          return (
            <div
              key={file.id}
              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <Icon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.fileName}
                  </p>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <span>{formatFileSize(file.fileSize)}</span>
                    <span>•</span>
                    <span>Uploaded by {uploaderName}</span>
                    <span>•</span>
                    <span>{formatDate(file.createdAt)}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownload(file.id, file.fileName)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Download className="h-4 w-4" />
                </Button>
                
                {canDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(file.id, file.fileName)}
                    disabled={deleting === file.id}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
