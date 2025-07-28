import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  FolderOpen, 
  Upload, 
  Download, 
  Trash2, 
  File, 
  CheckCircle, 
  FileText,
  Image,
  Archive,
  Mail,
  Eye
} from "lucide-react";
import { useState, useRef } from "react";

interface ProjectFile {
  id: number;
  orderId: number;
  userId: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string | null;
  fileCategory: 'artwork' | 'data_files' | 'postal_docs';
  fileType: string | null;
  version: number | null;
  filePath: string;
  isApproved: boolean;
  approvedBy: string | null;
  approvedAt: string | null;
  uploadedBy: string;
  accessLevel: string;
  description: string | null;
  metadata: any;
  createdAt: string;
  updatedAt: string;
}

interface FileStats {
  artworkFiles: number;
  dataFiles: number;
  postalDocs: number;
  totalSize: number;
  approvedFiles: number;
}

export default function ProjectFiles() {
  const { toast } = useToast();
  const [selectedOrderId, setSelectedOrderId] = useState<number>(26); // Default to existing order
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<'artwork' | 'data_files' | 'postal_docs'>('artwork');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadFileType, setUploadFileType] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch project files for the selected order
  const { data: files = [], isLoading: filesLoading } = useQuery({
    queryKey: ["/api/orders", selectedOrderId, "files"],
    enabled: !!selectedOrderId,
    staleTime: 2 * 60 * 1000,
  });

  // Fetch file statistics
  const { data: fileStats } = useQuery<FileStats>({
    queryKey: ["/api/orders", selectedOrderId, "files", "stats"],
    enabled: !!selectedOrderId,
    staleTime: 2 * 60 * 1000,
  });

  // Fetch allowed file types
  const { data: allowedTypes } = useQuery({
    queryKey: ["/api/files/allowed-types", uploadCategory],
    enabled: !!uploadCategory,
    staleTime: 5 * 60 * 1000,
  });

  // Upload file mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch(`/api/orders/${selectedOrderId}/files`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "File Uploaded",
        description: "File has been uploaded successfully.",
      });
      setIsUploadDialogOpen(false);
      setUploadDescription('');
      setUploadFileType('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      queryClient.invalidateQueries({ queryKey: ["/api/orders", selectedOrderId, "files"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders", selectedOrderId, "files", "stats"] });
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
    },
  });

  // Delete file mutation
  const deleteMutation = useMutation({
    mutationFn: async (fileId: number) => {
      const response = await apiRequest("DELETE", `/api/files/${fileId}`, {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "File Deleted",
        description: "File has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders", selectedOrderId, "files"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders", selectedOrderId, "files", "stats"] });
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
        title: "Delete Failed",
        description: error.message || "Failed to delete file",
        variant: "destructive",
      });
    },
  });

  // Approve file mutation
  const approveMutation = useMutation({
    mutationFn: async (fileId: number) => {
      const response = await apiRequest("POST", `/api/files/${fileId}/approve`, {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "File Approved",
        description: "Artwork file has been approved.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders", selectedOrderId, "files"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders", selectedOrderId, "files", "stats"] });
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
        title: "Approval Failed",
        description: error.message || "Failed to approve file",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = () => {
    const fileInput = fileInputRef.current;
    if (!fileInput?.files?.length) {
      toast({
        title: "No File Selected",
        description: "Please select a file to upload.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    formData.append('category', uploadCategory);
    formData.append('description', uploadDescription);
    formData.append('fileType', uploadFileType);
    formData.append('accessLevel', 'admin');

    uploadMutation.mutate(formData);
  };

  const handleDownload = (fileId: number, fileName: string) => {
    const link = document.createElement('a');
    link.href = `/api/files/${fileId}/download`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    const fmtDate = (d?: string | null) => d ? new Date(d).toLocaleDateString() : '—';
    return fmtDate(dateString);
  };

  const getFileIcon = (mimeType: string | null, fileCategory: string) => {
    if (!mimeType) return <File className="h-4 w-4" />;
    
    if (mimeType.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (mimeType.includes('pdf')) return <FileText className="h-4 w-4" />;
    if (fileCategory === 'postal_docs') return <Mail className="h-4 w-4" />;
    if (fileCategory === 'data_files') return <Archive className="h-4 w-4" />;
    
    return <File className="h-4 w-4" />;
  };

  const getCategoryLabel = (category: string): string => {
    switch (category) {
      case 'artwork': return 'Artwork';
      case 'data_files': return 'Data Files';
      case 'postal_docs': return 'Postal Documents';
      default: return category;
    }
  };

  const getCategoryFiles = (category: string): ProjectFile[] => {
    return files.filter((file: ProjectFile) => file.fileCategory === category);
  };

  if (filesLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Project Files</h1>
          <p className="text-muted-foreground">
            Manage production documentation and project assets
          </p>
        </div>
        
        <Button onClick={() => setIsUploadDialogOpen(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Upload File
        </Button>
      </div>

      {/* File Statistics Cards */}
      {fileStats && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Artwork Files</CardTitle>
              <Image className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{fileStats.artworkFiles}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Data Files</CardTitle>
              <Archive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{fileStats.dataFiles}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Postal Docs</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{fileStats.postalDocs}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{fileStats.approvedFiles}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Size</CardTitle>
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatFileSize(fileStats.totalSize)}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* File Organization Tabs */}
      <Tabs defaultValue="artwork" className="space-y-4">
        <TabsList>
          <TabsTrigger value="artwork">
            <Image className="mr-2 h-4 w-4" />
            Artwork ({getCategoryFiles('artwork').length})
          </TabsTrigger>
          <TabsTrigger value="data_files">
            <Archive className="mr-2 h-4 w-4" />
            Data Files ({getCategoryFiles('data_files').length})
          </TabsTrigger>
          <TabsTrigger value="postal_docs">
            <Mail className="mr-2 h-4 w-4" />
            Postal Docs ({getCategoryFiles('postal_docs').length})
          </TabsTrigger>
        </TabsList>

        {(['artwork', 'data_files', 'postal_docs'] as const).map((category) => (
          <TabsContent key={category} value={category}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FolderOpen className="mr-2 h-5 w-5" />
                  {getCategoryLabel(category)}
                </CardTitle>
                <CardDescription>
                  {category === 'artwork' && 'Proofs, final artwork, and versioned design files'}
                  {category === 'data_files' && 'Processed databases, recipient lists, and data exports'}
                  {category === 'postal_docs' && 'USPS forms, NCOA reports, and delivery confirmations'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {getCategoryFiles(category).length === 0 ? (
                  <div className="text-center py-8">
                    <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-sm font-semibold">No files yet</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Upload your first {getCategoryLabel(category).toLowerCase()} file.
                    </p>
                    <Button 
                      className="mt-4" 
                      onClick={() => {
                        setUploadCategory(category);
                        setIsUploadDialogOpen(true);
                      }}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Upload File
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>File</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Version</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Uploaded</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getCategoryFiles(category).map((file: ProjectFile) => (
                        <TableRow key={file.id}>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {getFileIcon(file.mimeType, file.fileCategory)}
                              <div>
                                <p className="font-medium">{file.originalName}</p>
                                {file.description && (
                                  <p className="text-sm text-muted-foreground">{file.description}</p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {file.fileType || 'General'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {file.version && category === 'artwork' ? `v${file.version}` : '-'}
                          </TableCell>
                          <TableCell>{formatFileSize(file.fileSize)}</TableCell>
                          <TableCell>
                            {file.isApproved ? (
                              <Badge variant="secondary" className="text-green-700 bg-green-50">
                                <CheckCircle className="mr-1 h-3 w-3" />
                                Approved
                              </Badge>
                            ) : (
                              <Badge variant="outline">Pending</Badge>
                            )}
                          </TableCell>
                          <TableCell>{formatDate(file.createdAt)}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownload(file.id, file.originalName)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              {category === 'artwork' && !file.isApproved && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => approveMutation.mutate(file.id)}
                                  disabled={approveMutation.isPending}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteMutation.mutate(file.id)}
                                disabled={deleteMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Project File</DialogTitle>
            <DialogDescription>
              Add a new file to the project documentation
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select 
                value={uploadCategory} 
                onValueChange={(value) => setUploadCategory(value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="artwork">Artwork</SelectItem>
                  <SelectItem value="data_files">Data Files</SelectItem>
                  <SelectItem value="postal_docs">Postal Documents</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="fileType">File Type (Optional)</Label>
              <Input
                id="fileType"
                value={uploadFileType}
                onChange={(e) => setUploadFileType(e.target.value)}
                placeholder="e.g., proof, final_artwork, usps_form"
              />
            </div>

            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                placeholder="Brief description of the file..."
                spellCheck="true"
                lang="en-US"
              />
            </div>

            <div>
              <Label htmlFor="file">File</Label>
              <Input
                id="file"
                type="file"
                ref={fileInputRef}
                accept={allowedTypes?.allowedTypes?.join(',') || undefined}
              />
              {allowedTypes?.allowedTypes && (
                <p className="text-sm text-muted-foreground mt-1">
                  Allowed types: {allowedTypes.allowedTypes.join(', ')}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsUploadDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleFileUpload}
              disabled={uploadMutation.isPending}
            >
              {uploadMutation.isPending ? "Uploading..." : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}