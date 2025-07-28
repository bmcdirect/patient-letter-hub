import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";

interface NewMailingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTemplateSelect: (template: any) => void;
}

export default function NewMailingModal({ open, onOpenChange, onTemplateSelect }: NewMailingModalProps) {
  const handleCustomSelect = () => {
    onTemplateSelect({ templateType: 'custom' });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-dark-navy">
            Create New Mailing
          </DialogTitle>
        </DialogHeader>

        <div className="text-center py-8">
          <Edit className="h-12 w-12 text-primary-blue mx-auto mb-4" />
          <h4 className="text-xl font-medium text-dark-navy mb-4">Create Custom Letter</h4>
          <p className="text-gray-600 mb-6">
            Upload your own letter content and customize the mailing details for maximum flexibility.
          </p>
          <Button onClick={handleCustomSelect} className="bg-primary-blue hover:bg-blue-800">
            Start Custom Letter
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}