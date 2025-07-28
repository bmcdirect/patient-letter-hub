import React, { useState, useEffect } from "react";
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
import { ArrowLeft, AlertTriangle, Calendar } from "lucide-react";
import { getCostBreakdown } from "@/components/quote/quote-form";
import { FileUploadComponent } from "@/components/file-upload";
import type { UploadedFile as FileUploadFile } from "@/components/file-upload";
import { fmtDate } from "@/lib/utils";
import { useSimpleAuth } from "@/hooks/useSimpleAuth";

const orderSchema = z.object({
  practiceId: z.number().min(1, "Practice is required"),
  customerNumber: z.string().optional(),
  purchaseOrder: z.string().optional(),
  costCenter: z.string().optional(),
  subject: z.string().optional(),
  actualRecipients: z.number().min(1, "Data file with recipients is required"),
  preferredMailDate: z.string().min(1, "Preferred mail date is required"),
  colorMode: z.enum(["color", "bw"]),
  dataCleansing: z.boolean().default(false),
  ncoaUpdate: z.boolean().default(false),
  firstClassPostage: z.boolean().default(false),
  autoDeleteDataFile: z.boolean().default(true),
  notes: z.string().optional(),
});

type OrderFormData = z.infer<typeof orderSchema>;

// UploadedFile interface moved to file-upload component

export default function OrderCreate() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [costBreakdown, setCostBreakdown] = useState<any>(null);
  const [selectedPractice, setSelectedPractice] = useState<any>(null);
  const [isDraft, setIsDraft] = useState(false);
  const { user } = useSimpleAuth();

  // File upload management
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, FileUploadFile | null>>({});

  const { data: practices } = useQuery({
    queryKey: ["/api/practices"],
    enabled: !!user,
  });

  const { data: locations } = useQuery({
    queryKey: ["/api/practices/1/locations"],
    enabled: !!user,
  });

  const practicesArray = Array.isArray(practices) ? practices : [];
  const locationsArray = Array.isArray(locations) ? locations : [];

  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      colorMode: "color",
      dataCleansing: false,
      ncoaUpdate: false,
      firstClassPostage: false,
      autoDeleteDataFile: true,
      actualRecipients: 0,
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async (data: OrderFormData) => {
      const formData = new FormData();

      // Add form data
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, value?.toString() || '');
      });

      // Add files from the upload component - all files use "file" field name
      Object.entries(uploadedFiles).forEach(([key, file]) => {
        if (file) {
          formData.append('file', file.file);
        }
      });

      // Add order metadata
      formData.append('totalCost', (costBreakdown?.totalCost || 0).toString());
      formData.append('status', isDraft ? 'draft' : 'pending');

      const response = await apiRequest("POST", `/api/orders`, formData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `Order ${isDraft ? 'saved as draft' : 'created'} successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setLocation("/orders");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${isDraft ? 'save draft' : 'create order'}`,
        variant: "destructive",
      });
    },
  });

  const watchedValues = form.watch();

  // Calculate cost breakdown when form values change
  React.useEffect(() => {
    if (watchedValues.actualRecipients > 0) {
      const breakdown = getCostBreakdown({
        estimatedRecipients: watchedValues.actualRecipients,
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

    // Auto-generate customer number if location selected
    if (location) {
      const customerNumber = `${location.practiceId.toString().padStart(3, '0')}-${Date.now().toString().slice(-4)}`;
      form.setValue("customerNumber", customerNumber);
    }
  };

  // Handle file changes from FileUploadComponent
  const handleFilesChange = (files: Record<string, FileUploadFile | null>) => {
    setUploadedFiles(files);
  };

  // Handle recipient count from data file
  const handleRecipientCountChange = (count: number) => {
    form.setValue('actualRecipients', count);
  };

  const onSubmit = (data: OrderFormData) => {
    createOrderMutation.mutate(data);
  };

  const onSaveDraft = () => {
    setIsDraft(true);
    form.handleSubmit(onSubmit)();
  };

  const onSubmitForProduction = () => {
    setIsDraft(false);
    form.handleSubmit(onSubmit)();
  };

  const hasPractices = locationsArray.length > 0;
  const hasRequiredFiles = uploadedFiles.dataFile && uploadedFiles.letterFile;

  // FileUploadSection is now handled by the FileUploadComponent

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
                onClick={() => setLocation("/orders")}
                className="text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Create New Order</h1>
                <p className="text-gray-600">Create a direct order for patient letter campaign</p>
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
                      You need to set up at least one location before creating orders. 
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

          <form className="space-y-8">
            {/* Customer Information */}
            <Card className="shadow-sm border border-gray-100">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                  <div>
                    <Label htmlFor="customerNumber" className="block text-sm font-medium text-gray-700 mb-2">
                      Customer Number
                    </Label>
                    <Input
                      id="customerNumber"
                      {...form.register("customerNumber")}
                      placeholder="Auto-generated"
                      disabled
                      className="bg-gray-50"
                    />
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="actualRecipients" className="block text-sm font-medium text-gray-700 mb-2">
                        Number of Recipients
                      </Label>
                      <Input
                        id="actualRecipients"
                        type="number"
                        {...form.register("actualRecipients", { valueAsNumber: true })}
                        placeholder="0"
                        disabled
                        className="bg-gray-50"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Automatically calculated from uploaded data file
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="preferredMailDate" className="block text-sm font-medium text-gray-700 mb-2">
                        Preferred Mail Date
                      </Label>
                      <div className="relative">
                        <Input
                          id="preferredMailDate"
                          type="date"
                          {...form.register("preferredMailDate")}
                          min={new Date().toISOString().split('T')[0]}
                        />
                        <Calendar className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                      </div>
                      {form.formState.errors.preferredMailDate && (
                        <p className="text-red-500 text-sm mt-1">{form.formState.errors.preferredMailDate.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Notes
                    </Label>
                    <Textarea
                      id="notes"
                      {...form.register("notes")}
                      rows={3}
                      placeholder="Any special requirements or notes..."
                      spellCheck="true"
                      lang="en-US"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* File Uploads */}
            <Card className="shadow-sm border border-gray-100">
              <CardContent className="p-6">
                <FileUploadComponent 
                  onRecipientCountChange={handleRecipientCountChange}
                  onFilesChange={handleFilesChange}
                  showAllFileTypes={true}
                  requiredFiles={['dataFile', 'letterFile']}
                  formControl={{
                    register: form.register,
                    watch: form.watch,
                    setValue: form.setValue
                  }}
                />
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
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Calculation</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
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
                      <div className="border-t border-gray-200 pt-2">
                        <div className="flex justify-between text-lg font-semibold text-primary-600 mt-2">
                          <span>Total Cost:</span>
                          <span>${costBreakdown.totalCost.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-gray-600">
                      * Based on {watchedValues.actualRecipients} recipients from data file
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Form Actions */}
            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation("/orders")}
              >
                Cancel
              </Button>

              <div className="flex items-center space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onSaveDraft}
                  disabled={createOrderMutation.isPending || !hasPractices}
                >
                  {createOrderMutation.isPending && isDraft ? "Saving..." : "Save as Draft"}
                </Button>
                <Button
                  type="button"
                  onClick={onSubmitForProduction}
                  disabled={createOrderMutation.isPending || !hasPractices || !hasRequiredFiles}
                  className="bg-primary-500 hover:bg-primary-600 text-white"
                >
                  {createOrderMutation.isPending && !isDraft ? "Creating..." : "Submit for Production"}
                </Button>
              </div>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}