import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Mail, Send, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { useState } from "react";

interface EmailNotification {
  id: number;
  orderId: number | null;
  invoiceId: number | null;
  userId: string;
  practiceId: number | null;
  recipientEmail: string;
  emailType: string;
  subject: string;
  content: string;
  status: string;
  sentAt: string;
  createdAt: string;
}

export default function Emails() {
  const { toast } = useToast();
  const [selectedEmail, setSelectedEmail] = useState<EmailNotification | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const { data: emails = [], isLoading, error } = useQuery({
    queryKey: ["/api/emails"],
    staleTime: 2 * 60 * 1000, // 2 minutes
    onError: (error: Error) => {
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
    },
  });

  // Test email mutation for development
  const testEmailMutation = useMutation({
    mutationFn: async ({ emailType, orderId }: { emailType: string; orderId: number }) => {
      const response = await apiRequest("POST", "/api/test-email", { emailType, orderId });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Test Email Sent",
        description: "Check the console for email details.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/emails"] });
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
        title: "Test Failed",
        description: error.message || "Failed to send test email",
        variant: "destructive",
      });
    },
  });

  const getEmailTypeIcon = (emailType: string) => {
    switch (emailType) {
      case 'order_status_change':
        return <Clock className="h-4 w-4" />;
      case 'invoice_generated':
        return <CheckCircle className="h-4 w-4" />;
      case 'proof_ready':
        return <AlertCircle className="h-4 w-4" />;
      case 'order_completed':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Mail className="h-4 w-4" />;
    }
  };

  const getEmailTypeLabel = (emailType: string) => {
    switch (emailType) {
      case 'order_status_change':
        return 'Status Update';
      case 'invoice_generated':
        return 'Invoice Generated';
      case 'proof_ready':
        return 'Proof Ready';
      case 'order_completed':
        return 'Order Completed';
      default:
        return emailType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const getStatusBadge = (status: string) => {
    const variant = status === 'sent' ? 'secondary' : status === 'failed' ? 'destructive' : 'outline';
    return <Badge variant={variant}>{status}</Badge>;
  };

  const formatDate = (dateString: string) => {
    const fmtDate = (d?: string | null) => d ? new Date(d).toLocaleString() : '—';
    return fmtDate(dateString);
  };

  const handlePreviewEmail = (email: EmailNotification) => {
    setSelectedEmail(email);
    setIsPreviewOpen(true);
  };

  if (isLoading) {
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
          <h1 className="text-3xl font-bold tracking-tight">Email Notifications</h1>
          <p className="text-muted-foreground">
            View and manage your email notification history
          </p>
        </div>
        
        {/* Development Test Panel */}
        <Card className="w-80">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Test Email System</CardTitle>
            <CardDescription className="text-sm">
              Send test emails for development
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select onValueChange={(emailType) => {
              testEmailMutation.mutate({ emailType, orderId: 26 }); // Using existing order ID
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select email type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="order_status_change">Status Update</SelectItem>
                <SelectItem value="invoice_generated">Invoice Generated</SelectItem>
                <SelectItem value="proof_ready">Proof Ready</SelectItem>
                <SelectItem value="order_completed">Order Completed</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Emails are simulated with console.log output
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Email Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Emails</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{emails.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sent</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {emails.filter((e: EmailNotification) => e.status === 'sent').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status Updates</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {emails.filter((e: EmailNotification) => e.emailType === 'order_status_change').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Invoices</CardTitle>
            <Send className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {emails.filter((e: EmailNotification) => e.emailType === 'invoice_generated').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Email History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Email History</CardTitle>
          <CardDescription>
            Recent email notifications sent to your practice
          </CardDescription>
        </CardHeader>
        <CardContent>
          {emails.length === 0 ? (
            <div className="text-center py-8">
              <Mail className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No emails sent</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Email notifications will appear here once orders are processed.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {emails.map((email: EmailNotification) => (
                  <TableRow key={email.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getEmailTypeIcon(email.emailType)}
                        <span className="text-sm font-medium">
                          {getEmailTypeLabel(email.emailType)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="truncate">{email.subject}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{email.recipientEmail}</p>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(email.status)}
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(email.sentAt)}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePreviewEmail(email)}
                      >
                        Preview
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Email Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
            <DialogDescription>
              {selectedEmail && getEmailTypeLabel(selectedEmail.emailType)} - {selectedEmail?.sentAt}
            </DialogDescription>
          </DialogHeader>
          
          {selectedEmail && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Subject</label>
                  <p className="text-sm text-muted-foreground">{selectedEmail.subject}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Recipient</label>
                  <p className="text-sm text-muted-foreground">{selectedEmail.recipientEmail}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <p className="text-sm text-muted-foreground">
                    {getEmailTypeLabel(selectedEmail.emailType)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <p className="text-sm text-muted-foreground">{selectedEmail.status}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Email Content</label>
                <div 
                  className="mt-2 p-4 border rounded-lg bg-muted/50 overflow-auto"
                  dangerouslySetInnerHTML={{ __html: selectedEmail.content }}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}