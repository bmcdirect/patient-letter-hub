import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wand2, Edit, MapPin, X, Shield, FileText, AlertTriangle, UserMinus } from "lucide-react";

interface NewMailingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTemplateSelect: (template: any) => void;
}

export default function NewMailingModal({ open, onOpenChange, onTemplateSelect }: NewMailingModalProps) {
  const [selectedType, setSelectedType] = useState<'guided' | 'custom' | null>(null);

  // Templates removed - keeping only custom mailing functionality

  const handleTemplateSelect = (template: any) => {
    onTemplateSelect(template);
    onOpenChange(false);
  };

  const handleCustomSelect = () => {
    onTemplateSelect({ templateType: 'custom' });
    onOpenChange(false);
  };

  const resetModal = () => {
    setSelectedType(null);
  };

  const getTemplateIcon = (eventType: string) => {
    switch (eventType) {
      case 'relocation':
        return MapPin;
      case 'closure':
        return X;
      case 'hipaa_breach':
        return Shield;
      case 'provider_departure':
        return UserMinus;
      default:
        return FileText;
    }
  };

  const getEventTypeLabel = (eventType: string) => {
    switch (eventType) {
      case 'relocation':
        return 'Practice Relocation';
      case 'closure':
        return 'Practice Closure';
      case 'hipaa_breach':
        return 'HIPAA Breach';
      case 'provider_departure':
        return 'Provider Departure';
      default:
        return eventType;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-dark-navy">
            Create New Mailing
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Mailing Type Selector */}
          <div>
            <h4 className="text-lg font-medium text-dark-navy mb-4">Choose Mailing Type</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Guided templates removed - only custom mailing available */}

              <Card 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedType === 'custom' ? 'border-primary-blue bg-blue-50' : 'border-gray-200'
                }`}
                onClick={() => setSelectedType('custom')}
              >
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4 mb-3">
                    <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                      <Edit className="h-6 w-6 text-teal-accent" />
                    </div>
                    <div>
                      <h5 className="font-semibold text-dark-navy">Custom Letter</h5>
                      <p className="text-sm text-gray-600">Create your own content</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    Write your own letter content or upload a document. Perfect for unique 
                    situations or personalized communications.
                  </p>
                  <div className="mt-3">
                    <Badge className="bg-blue-100 text-blue-800">Advanced</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Templates removed - redirecting directly to order form */}

          {/* Custom Letter */}
          {selectedType === 'custom' && (
            <div>
              <h4 className="text-lg font-medium text-dark-navy mb-4">Custom Letter Content</h4>
              <div className="text-center py-8">
                <Edit className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Ready to create your custom letter?</p>
                <Button onClick={handleCustomSelect} className="bg-primary-blue hover:bg-blue-800">
                  Continue with Custom Letter
                </Button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            {selectedType && (
              <Button onClick={resetModal} variant="outline">
                Back
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
