import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from "@/components/ui/dialog";
import { Receipt, Download, Loader2 } from "lucide-react";

interface GenerateInvoiceButtonProps {
  orderId: number;
  orderNumber: string;
  orderStatus: string;
  hasInvoice?: boolean;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
}

export function GenerateInvoiceButton({ 
  orderId, 
  orderNumber, 
  orderStatus, 
  hasInvoice = false,
  variant = "default",
  size = "sm"
}: GenerateInvoiceButtonProps) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const generateInvoiceMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/orders/${orderId}/invoice`, {});
      return response.json();
    },
    onSuccess: (invoice) => {
      toast({
        title: "Invoice Generated",
        description: `Invoice ${invoice.invoiceNumber} has been created successfully.`,
      });
      setIsDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
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
        title: "Generation Failed",
        description: error.message || "Failed to generate invoice",
        variant: "destructive",
      });
    },
  });

  // Don't show button if order is not completed
  if (orderStatus !== "completed") {
    return null;
  }

  // If invoice already exists, show download button
  if (hasInvoice) {
    return (
      <Button 
        variant="outline" 
        size={size}
        onClick={() => window.open(`/api/invoices/${orderId}/pdf`, '_blank')}
      >
        <Download className="mr-2 h-4 w-4" />
        Download Invoice
      </Button>
    );
  }

  const handleGenerateInvoice = () => {
    generateInvoiceMutation.mutate();
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size}>
          <Receipt className="mr-2 h-4 w-4" />
          Generate Invoice
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Generate Invoice</DialogTitle>
          <DialogDescription>
            Generate a professional invoice for completed order {orderNumber}.
            This will create a PDF invoice with all order details and cost breakdown.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Receipt className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-900">Invoice Details</h4>
                <p className="text-sm text-blue-700 mt-1">
                  • Auto-generated invoice number (INV-2025-XXXX)
                  <br />
                  • Complete order and cost breakdown
                  <br />
                  • Professional PDF format
                  <br />
                  • Net 30 payment terms
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => setIsDialogOpen(false)}
            disabled={generateInvoiceMutation.isPending}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleGenerateInvoice}
            disabled={generateInvoiceMutation.isPending}
          >
            {generateInvoiceMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Receipt className="mr-2 h-4 w-4" />
                Generate Invoice
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}