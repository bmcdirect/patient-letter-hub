import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

interface UploadedFile {
  file: File;
  name: string;
  size: string;
  type: string;
}

interface FileUploadState {
  dataFile: UploadedFile | null;
  letterFile: UploadedFile | null;
  letterheadFile: UploadedFile | null;
  logoFile: UploadedFile | null;
  envelopeFile: UploadedFile | null;
  signatureFile: UploadedFile | null;
  zipFile: UploadedFile | null;
}

interface UseFileUploadProps {
  orderId?: number;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export const useFileUpload = ({ orderId, onSuccess, onError }: UseFileUploadProps = {}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // File upload states
  const [files, setFiles] = useState<FileUploadState>({
    dataFile: null,
    letterFile: null,
    letterheadFile: null,
    logoFile: null,
    envelopeFile: null,
    signatureFile: null,
    zipFile: null,
  });

  // Upload mutation for post-order file uploads
  const uploadMutation = useMutation({
    mutationFn: async (fileData: { file: File; fileType: string; description?: string }) => {
      if (!orderId) {
        throw new Error("Order ID is required for file upload");
      }

      const formData = new FormData();
      formData.append('file', fileData.file);
      formData.append('fileType', fileData.fileType);
      if (fileData.description) {
        formData.append('description', fileData.description);
      }

      const response = await apiRequest("POST", `/api/orders/${orderId}/files`, formData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "File Uploaded",
        description: "File has been uploaded successfully.",
      });
      
      // Invalidate relevant queries
      if (orderId) {
        queryClient.invalidateQueries({ queryKey: ["/api/orders", orderId, "files"] });
        queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      }
      
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload file",
        variant: "destructive",
      });
      
      if (onError) {
        onError(error);
      }
    },
  });

  // Update a specific file
  const setFile = useCallback((fileType: keyof FileUploadState, file: UploadedFile | null) => {
    setFiles(prev => ({
      ...prev,
      [fileType]: file
    }));
  }, []);

  // Get a specific file
  const getFile = useCallback((fileType: keyof FileUploadState) => {
    return files[fileType];
  }, [files]);

  // Clear all files
  const clearAllFiles = useCallback(() => {
    setFiles({
      dataFile: null,
      letterFile: null,
      letterheadFile: null,
      logoFile: null,
      envelopeFile: null,
      signatureFile: null,
      zipFile: null,
    });
  }, []);

  // Get files for form submission
  const getFilesForSubmission = useCallback(() => {
    const formData = new FormData();
    
    Object.entries(files).forEach(([key, file]) => {
      if (file) {
        formData.append(key, file.file);
      }
    });
    
    return formData;
  }, [files]);

  // Upload a single file (for post-order uploads)
  const uploadSingleFile = useCallback((fileType: keyof FileUploadState, description?: string) => {
    const file = files[fileType];
    if (!file) {
      toast({
        title: "No File Selected",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate({
      file: file.file,
      fileType: fileType,
      description
    });
  }, [files, uploadMutation, toast]);

  // Check if required files are present
  const hasRequiredFiles = useCallback((requiredFiles: string[] = ['dataFile', 'letterFile']) => {
    return requiredFiles.every(fileType => files[fileType as keyof FileUploadState] !== null);
  }, [files]);

  // Get file count
  const getFileCount = useCallback(() => {
    return Object.values(files).filter(file => file !== null).length;
  }, [files]);

  return {
    files,
    setFile,
    getFile,
    clearAllFiles,
    getFilesForSubmission,
    uploadSingleFile,
    hasRequiredFiles,
    getFileCount,
    isUploading: uploadMutation.isPending,
    uploadError: uploadMutation.error,
  };
};

export type { UploadedFile, FileUploadState };