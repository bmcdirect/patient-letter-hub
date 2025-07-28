import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { TopNavigation } from "@/components/layout/top-navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";
import { getCostBreakdown } from "@/components/quote/quote-form";

const quoteSchema = z.object({
  practiceId: z.number().min(1, "Practice is required"),
  purchaseOrder: z.string().optional(),
  costCenter: z.string().optional(),
  subject: z.string().optional(),
  estimatedRecipients: z.number().min(1, "At least 1 recipient is required"),
  colorMode: z.enum(["color", "bw"]),
  dataCleansing: z.boolean().default(false),
  ncoaUpdate: z.boolean().default(false),
  firstClassPostage: z.boolean().default(false),
  notes: z.string().optional(),
});

type QuoteFormData = z.infer<typeof quoteSchema>;

export default function QuoteCreate() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [costBreakdown, setCostBreakdown] = useState<any>(null);
  const [selectedPractice, setSelectedPractice] = useState<any>(null);

  // Check for edit mode
  const urlParams = new URLSearchParams(window.location.search);
  const editId = urlParams.get('edit');
  const isEditing = !!editId;

  const { data: practices } = useQuery({
    queryKey: ["/api/practices"],
  });

  const { data: locations } = useQuery({
    queryKey: ["/api/practices/1/locations"],
  });

  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
  });

  // Fetch existing quote data if editing
  const { data: existingQuote, isLoading: isLoadingQuote } = useQuery({
    queryKey: ["/api/quotes", editId],
    enabled: isEditing,
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/quotes/${editId}`);
      return response.json();
    },
  });

  const practicesArray = Array.isArray(practices) ? practices : [];
  const locationsArray = Array.isArray(locations) ? locations : [];

  const form = useForm<QuoteFormData>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      colorMode: "color",
      dataCleansing: false,
      ncoaUpdate: false,
      firstClassPostage: false,
    },
  });

  // Pre-populate form when editing
  React.useEffect(() => {
    if (existingQuote && isEditing) {
      form.reset({
        practiceId: existingQuote.practiceId,
        subject: existingQuote.subject || "",
        estimatedRecipients: existingQuote.estimatedRecipients,
        colorMode: existingQuote.colorMode,
        dataCleansing: existingQuote.dataCleansing,
        ncoaUpdate: existingQuote.ncoaUpdate,
        firstClassPostage: existingQuote.firstClassPostage,
        notes: existingQuote.notes || "",
      });
      
      // Set selected location
      const location = locationsArray.find((l: any) => l.practiceId === existingQuote.practiceId);
      setSelectedPractice(location);
    }
  }, [existingQuote, isEditing, locationsArray, form]);

  const createQuoteMutation = useMutation({
    mutationFn: async (data: QuoteFormData) => {
      const quoteData = {
        ...data,
        totalCost: costBreakdown?.totalCost || 0,
        status: "pending",
      };
      
      if (isEditing) {
        await apiRequest("PUT", `/api/quotes/${editId}`, quoteData);
      } else {
        await apiRequest("POST", "/api/quotes", quoteData);
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: isEditing ? "Quote updated successfully" : "Quote generated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/quotes", editId] });
      setLocation("/quotes");
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
        title: "Error",
        description: "Failed to generate quote",
        variant: "destructive",
      });
    },
  });

  const watchedValues = form.watch();

  // Calculate cost breakdown when form values change
  React.useEffect(() => {
    if (watchedValues.estimatedRecipients > 0) {
      const breakdown = getCostBreakdown({
        estimatedRecipients: watchedValues.estimatedRecipients,
        colorMode: watchedValues.colorMode,
        dataCleansing: watchedValues.dataCleansing,
        ncoaUpdate: watchedValues.ncoaUpdate,
        firstClassPostage: watchedValues.firstClassPostage,
      });
      setCostBreakdown(breakdown);
    }
  }, [watchedValues]);

  // Handle practice selection
  const handlePracticeChange = (practiceId: string) => {
    const location = locationsArray.find((l: any) => l.practiceId.toString() === practiceId);
    setSelectedPractice(location);
    form.setValue("practiceId", parseInt(practiceId));
  };

  const onSubmit = (data: QuoteFormData) => {
    createQuoteMutation.mutate(data);
  };

  const hasPractices = locationsArray.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavigation />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 overflow-hidden p-8">
          <div className="content-narrow mb-8">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => setLocation("/quotes")}
                className="text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {isEditing ? "Edit Quote" : "Create New Quote"}
                </h1>
                <p className="text-gray-600">
                  {isEditing ? "Update quote information and pricing" : "Generate a quote estimate for patient letter campaign"}
                </p>
              </div>
            </div>
          </div>

          {/* Practice Setup Warning */}
          {!hasPractices && (
            <Card className="mb-6 border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-orange-800">Location Setup Required</h3>
                    <p className="text-sm text-orange-700 mt-1">
                      You need to set up at least one location before creating quotes. 
                      <Button 
                        variant="link" 
                        className="text-orange-800 hover:text-orange-900 p-0 h-auto ml-1"
                        onClick={() => setLocation("/locations")}
                      >
                        Go to Locations →
                      </Button>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Customer Information */}
            <Card className="shadow-sm border border-gray-100">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h3>
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <Label htmlFor="practiceId" className="block text-sm font-medium text-gray-700 mb-2">
                      Location Name
                    </Label>
                    <Select 
                      onValueChange={handlePracticeChange}
                      disabled={!hasPractices}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={hasPractices ? "Select location..." : "No locations available"} />
                      </SelectTrigger>
                      <SelectContent>
                        {locationsArray.map((location: any) => (
                          <SelectItem key={location.id} value={location.practiceId.toString()}>
                            {location.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.practiceId && (
                      <p className="text-red-500 text-sm mt-1">{form.formState.errors.practiceId.message}</p>
                    )}
                  </div>
                </div>

                {/* Contact Information - Shows when practice selected */}
                {selectedPractice && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Practice Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Address:</span>
                        <p className="text-gray-900">{selectedPractice.addressLine1 ? `${selectedPractice.addressLine1}, ${selectedPractice.city}, ${selectedPractice.state} ${selectedPractice.zipCode}` : 'Not provided'}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Phone:</span>
                        <p className="text-gray-900">{selectedPractice.phone || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>
                )}


              </CardContent>
            </Card>

            {/* Letter Details */}
            <Card className="shadow-sm border border-gray-100">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Letter Details</h3>
                <div className="space-y-6">
                  {/* Purchase Order and Cost Center Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="purchaseOrder" className="block text-sm font-medium text-gray-700 mb-2">
                        Purchase Order (Optional)
                      </Label>
                      <Input
                        id="purchaseOrder"
                        {...form.register("purchaseOrder")}
                        placeholder="Enter PO number"
                        spellCheck="true"
                        lang="en-US"
                      />
                    </div>
                    <div>
                      <Label htmlFor="costCenter" className="block text-sm font-medium text-gray-700 mb-2">
                        Cost Center (Optional)
                      </Label>
                      <Input
                        id="costCenter"
                        {...form.register("costCenter")}
                        placeholder="Enter cost center"
                        spellCheck="true"
                        lang="en-US"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                      Letter Subject <span className="text-gray-500">(Optional)</span>
                    </Label>
                    <Input
                      id="subject"
                      {...form.register("subject")}
                      placeholder="e.g., Practice Relocation Notice"
                      spellCheck="true"
                      lang="en-US"
                    />
                  </div>

                  <div>
                    <Label htmlFor="estimatedRecipients" className="block text-sm font-medium text-gray-700 mb-2">
                      Estimated Recipients
                    </Label>
                    <Input
                      id="estimatedRecipients"
                      type="number"
                      {...form.register("estimatedRecipients", { valueAsNumber: true })}
                      placeholder="Enter estimated number"
                      min="1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Provide your best estimate for quote calculation
                    </p>
                    {form.formState.errors.estimatedRecipients && (
                      <p className="text-red-500 text-sm mt-1">{form.formState.errors.estimatedRecipients.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Notes
                    </Label>
                    <Textarea
                      id="notes"
                      {...form.register("notes")}
                      rows={3}
                      placeholder="Any special requirements or notes for this quote..."
                      spellCheck="true"
                      lang="en-US"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Printing & Mailing Options */}
            <Card className="shadow-sm border border-gray-100">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Printing & Mailing Options</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Print Options</h4>
                    <RadioGroup 
                      defaultValue="color"
                      onValueChange={(value) => form.setValue("colorMode", value as "color" | "bw")}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="color" id="color-mode" />
                        <Label htmlFor="color-mode" className="text-sm text-gray-700">
                          Color Printing ($0.65 per piece)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="bw" id="bw-mode" />
                        <Label htmlFor="bw-mode" className="text-sm text-gray-700">
                          Black & White Printing ($0.50 per piece)
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Additional Services</h4>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <Checkbox
                          id="data-cleansing"
                          checked={form.watch("dataCleansing")}
                          onCheckedChange={(checked) => form.setValue("dataCleansing", !!checked)}
                        />
                        <Label htmlFor="data-cleansing" className="ml-3 text-sm text-gray-700">
                          Data Cleansing (+$25 flat fee)
                        </Label>
                      </div>
                      <div className="flex items-center">
                        <Checkbox
                          id="ncoa-update"
                          checked={form.watch("ncoaUpdate")}
                          onCheckedChange={(checked) => form.setValue("ncoaUpdate", !!checked)}
                        />
                        <Label htmlFor="ncoa-update" className="ml-3 text-sm text-gray-700">
                          NCOA Address Update (+$50 flat fee)
                        </Label>
                      </div>
                      <div className="flex items-center">
                        <Checkbox
                          id="first-class"
                          checked={form.watch("firstClassPostage")}
                          onCheckedChange={(checked) => form.setValue("firstClassPostage", !!checked)}
                        />
                        <Label htmlFor="first-class" className="ml-3 text-sm text-gray-700">
                          First Class Postage (+$0.68 per piece)
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cost Calculation */}
            {costBreakdown && (
              <Card className="shadow-sm border border-gray-100">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quote Estimation</h3>
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Base Printing Cost:</span>
                        <span className="text-gray-900">${costBreakdown.baseCost.toFixed(2)}</span>
                      </div>
                      {costBreakdown.enclosureCost > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Enclosures:</span>
                          <span className="text-gray-900">${costBreakdown.enclosureCost.toFixed(2)}</span>
                        </div>
                      )}
                      {costBreakdown.dataCleansingCost > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Data Cleansing:</span>
                          <span className="text-gray-900">${costBreakdown.dataCleansingCost.toFixed(2)}</span>
                        </div>
                      )}
                      {costBreakdown.ncoaCost > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">NCOA Address Update:</span>
                          <span className="text-gray-900">${costBreakdown.ncoaCost.toFixed(2)}</span>
                        </div>
                      )}
                      {costBreakdown.postageCost > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">First Class Postage:</span>
                          <span className="text-gray-900">${costBreakdown.postageCost.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="border-t border-blue-300 pt-2">
                        <div className="flex justify-between text-lg font-semibold text-blue-700 mt-2">
                          <span>Estimated Total:</span>
                          <span>${costBreakdown.totalCost.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-blue-600">
                      * This is an estimate based on {watchedValues.estimatedRecipients} recipients
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation("/quotes")}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createQuoteMutation.isPending || !hasPractices || (isEditing && isLoadingQuote)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {createQuoteMutation.isPending ? 
                  (isEditing ? "Updating..." : "Generating...") : 
                  (isEditing ? "Update Quote" : "Generate Quote")}
              </Button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}