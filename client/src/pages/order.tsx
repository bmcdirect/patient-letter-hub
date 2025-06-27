import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Package, Upload, RefreshCw, FileText, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { orderStore } from "@/lib/orderStore";
import { quoteStore } from "@/lib/quoteStore";

const orderSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  practiceId: z.string().min(1, "Practice selection is required"),
  templateType: z.string().min(1, "Template type is required"),
  colorMode: z.string().min(1, "Color mode is required"),
  recipientCount: z.number().min(1, "Recipient count must be at least 1"),
  enclosures: z.number().min(0, "Enclosures cannot be negative"),
  letterContent: z.string().min(1, "Letter content is required"),
  notes: z.string().optional(),
  dataCleansing: z.boolean().optional(),
  ncoaUpdate: z.boolean().optional(),
  firstClassPostage: z.boolean().optional(),
});

type OrderFormData = z.infer<typeof orderSchema>;

export default function Order() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{[key: string]: File | null}>({
    letterDocument: null,
    recipientList: null,
    letterhead: null,
    logo: null,
    envelopeArtwork: null,
    signature: null,
    enclosures: null,
    zipFile: null
  });
  const [location] = useLocation();
  const { toast } = useToast();

  // Parse URL parameters to determine mode
  const urlParams = new URLSearchParams(window.location.search);
  const quoteId = urlParams.get('fromQuote');
  const orderId = urlParams.get('editOrder');
  const isEditing = !!orderId;
  const isFromQuote = !!quoteId;

  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      subject: "",
      practiceId: "",
      templateType: "custom",
      colorMode: "Color",
      recipientCount: 100,
      enclosures: 0,
      letterContent: "",
      notes: "",
      dataCleansing: false,
      ncoaUpdate: false,
      firstClassPostage: false,
    },
  });

  // Load existing order data for editing
  const { data: existingOrder, isLoading: isLoadingOrder } = useQuery({
    queryKey: ['order', orderId],
    enabled: isEditing,
    queryFn: async () => {
      // Mock API call to fetch existing order
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        id: orderId,
        subject: "Practice Relocation Notice - Edit Mode",
        practiceId: "1",
        templateType: "relocation",
        colorMode: "Color",
        recipientCount: 250,
        enclosures: 1,
        letterContent: "Dear Patient,\n\nWe are writing to inform you that our practice will be relocating to a new address effective [DATE].\n\nOur new address will be:\n[NEW ADDRESS]\n\nAll of your medical records will be transferred to our new location, and we will continue to provide the same high-quality care you expect.\n\nPlease update your records with our new contact information.\n\nSincerely,\n[PRACTICE NAME]",
        notes: "Rush delivery required",
        dataCleansing: true,
        ncoaUpdate: false,
        firstClassPostage: true,
        status: "Draft",
        createdAt: new Date('2024-12-26'),
        updatedAt: new Date('2024-12-27'),
      };
    },
  });

  // Load quote data for conversion
  const { data: quoteData, isLoading: isLoadingQuote } = useQuery({
    queryKey: ['quote', quoteId],
    enabled: isFromQuote,
    queryFn: async () => {
      // Mock API call to fetch quote data
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        id: quoteId,
        subject: "Patient Notification Letters - From Quote",
        practiceId: "2",
        templateType: "custom",
        colorMode: "Black and White",
        estimatedRecipients: 150,
        enclosures: 0,
        notes: "Standard mailing from quote conversion",
        dataCleansing: false,
        ncoaUpdate: true,
        firstClassPostage: false,
      };
    },
  });

  // Pre-populate form when data is loaded
  useEffect(() => {
    if (existingOrder && isEditing) {
      form.reset({
        subject: existingOrder.subject,
        practiceId: existingOrder.practiceId,
        templateType: existingOrder.templateType,
        colorMode: existingOrder.colorMode,
        recipientCount: existingOrder.recipientCount,
        enclosures: existingOrder.enclosures,
        letterContent: existingOrder.letterContent,
        notes: existingOrder.notes || "",
        dataCleansing: existingOrder.dataCleansing,
        ncoaUpdate: existingOrder.ncoaUpdate,
        firstClassPostage: existingOrder.firstClassPostage,
      });
    } else if (quoteData && isFromQuote) {
      form.reset({
        subject: quoteData.subject,
        practiceId: quoteData.practiceId,
        templateType: quoteData.templateType,
        colorMode: quoteData.colorMode,
        recipientCount: quoteData.estimatedRecipients,
        enclosures: quoteData.enclosures,
        letterContent: "", // Start with empty content for quote conversion
        notes: quoteData.notes || "",
        dataCleansing: quoteData.dataCleansing,
        ncoaUpdate: quoteData.ncoaUpdate,
        firstClassPostage: quoteData.firstClassPostage,
      });
    }
  }, [existingOrder, quoteData, form, isEditing, isFromQuote]);

  // File upload handler
  const handleFileUpload = (fieldName: string, file: File | null) => {
    setUploadedFiles(prev => ({
      ...prev,
      [fieldName]: file
    }));
  };

  // Calculate estimated cost
  const calculateCost = (data: OrderFormData) => {
    const baseRate = data.colorMode === "Color" ? 0.65 : 0.50;
    let total = data.recipientCount * baseRate;
    
    if (data.dataCleansing) total += 25;
    if (data.ncoaUpdate) total += 50;
    if (data.firstClassPostage) total += data.recipientCount * 0.68;
    
    return total;
  };

  // Save draft mutation
  const saveDraftMutation = useMutation({
    mutationFn: async (data: OrderFormData) => {
      setIsSavingDraft(true);
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const totalCost = calculateCost(data);
      let result;
      
      if (isEditing) {
        // Update existing order
        orderStore.updateOrderStatus(parseInt(orderId!), "draft");
        result = {
          id: parseInt(orderId!),
          orderNumber: `O-${orderId}`,
          status: "Draft",
          action: "updated",
        };
      } else {
        // Create new draft order
        const orderNumber = `O-${2006 + orderStore.getOrders().length}`;
        const newOrder = {
          id: 106 + orderStore.getOrders().length,
          order_number: orderNumber,
          user_id: "user123",
          practice_id: parseInt(data.practiceId) || 1,
          quote_id: isFromQuote ? parseInt(quoteId!) : null,
          subject: data.subject,
          template_type: data.templateType,
          color_mode: data.colorMode,
          recipient_count: data.recipientCount,
          total_cost: totalCost.toFixed(2),
          status: "draft",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          practice_name: "User Practice",
          practice_email: "user@practice.com",
          notes: data.notes || "",
          letter_content: data.letterContent,
          enclosures: data.enclosures,
          data_cleansing: data.dataCleansing,
          ncoa_update: data.ncoaUpdate,
          first_class_postage: data.firstClassPostage
        };
        
        console.log("Adding new draft order to store:", newOrder);
        orderStore.addOrder(newOrder);
        
        // If this order was created from a quote, mark the quote as converted
        if (isFromQuote) {
          quoteStore.convertQuoteToOrder(parseInt(quoteId!), newOrder.id);
          console.log("Converted quote", quoteId, "to order", newOrder.id);
        }
        
        console.log("Updated order store:", orderStore.getOrders());
        
        result = {
          id: newOrder.id,
          orderNumber,
          status: "Draft",
          action: "saved",
        };
      }
      
      return result;
    },
    onSuccess: (result) => {
      toast({
        title: "Draft Saved",
        description: `Order ${result.orderNumber} has been ${result.action} as draft.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Save Failed",
        description: "Failed to save draft. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSavingDraft(false);
    },
  });

  // Submit for production mutation
  const submitOrderMutation = useMutation({
    mutationFn: async (data: OrderFormData) => {
      setIsSubmitting(true);
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const totalCost = calculateCost(data);
      let result;
      
      if (isEditing) {
        // Update existing order status to in-progress
        orderStore.updateOrderStatus(parseInt(orderId!), "in-progress");
        result = {
          id: parseInt(orderId!),
          orderNumber: `O-${orderId}`,
          totalCost,
          status: "In Progress",
          action: "updated and submitted",
        };
      } else {
        // Create new order with in-progress status
        const orderNumber = `O-${2006 + orderStore.getOrders().length}`;
        const newOrder = {
          id: 106 + orderStore.getOrders().length,
          order_number: orderNumber,
          user_id: "user123",
          practice_id: parseInt(data.practiceId) || 1,
          quote_id: isFromQuote ? parseInt(quoteId!) : null,
          subject: data.subject,
          template_type: data.templateType,
          color_mode: data.colorMode,
          recipient_count: data.recipientCount,
          total_cost: totalCost.toFixed(2),
          status: "in-progress",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          practice_name: "User Practice",
          practice_email: "user@practice.com",
          notes: data.notes || "",
          letter_content: data.letterContent,
          enclosures: data.enclosures,
          data_cleansing: data.dataCleansing,
          ncoa_update: data.ncoaUpdate,
          first_class_postage: data.firstClassPostage
        };
        
        console.log("Adding new production order to store:", newOrder);
        orderStore.addOrder(newOrder);
        
        // If this order was created from a quote, mark the quote as converted
        if (isFromQuote) {
          quoteStore.convertQuoteToOrder(parseInt(quoteId!), newOrder.id);
          console.log("Converted quote", quoteId, "to order", newOrder.id);
        }
        
        console.log("Updated order store:", orderStore.getOrders());
        
        result = {
          id: newOrder.id,
          orderNumber,
          totalCost,
          status: "In Progress",
          action: "submitted",
        };
      }
      
      return result;
    },
    onSuccess: (result) => {
      toast({
        title: "Order Submitted Successfully",
        description: `Order ${result.orderNumber} has been ${result.action} for production.`,
      });
      
      // Redirect to dashboard after successful submission
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1500);
    },
    onError: (error) => {
      toast({
        title: "Submission Failed",
        description: "Failed to submit order. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const onSubmitForProduction = (data: OrderFormData) => {
    submitOrderMutation.mutate(data);
  };

  const onSaveDraft = () => {
    const data = form.getValues();
    saveDraftMutation.mutate(data);
  };

  const watchedValues = form.watch();
  const estimatedCost = calculateCost(watchedValues);

  // Show loading state while fetching data
  if ((isEditing && isLoadingOrder) || (isFromQuote && isLoadingQuote)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary-blue" />
          <p className="text-gray-600">Loading order data...</p>
        </div>
      </div>
    );
  }

  // Determine header text based on mode
  const getHeaderInfo = () => {
    if (isEditing) {
      return {
        title: "Edit Order",
        subtitle: `Editing order ${orderId} • Status: ${existingOrder?.status || 'Draft'}`,
      };
    } else if (isFromQuote) {
      return {
        title: "Convert Quote to Order",
        subtitle: `Converting quote ${quoteId} to production order`,
      };
    }
    return {
      title: "Create New Order",
      subtitle: "Set up a new mailing order",
    };
  };

  const { title, subtitle } = getHeaderInfo();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = "/dashboard"}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-dark-navy">{title}</h1>
                <p className="text-sm text-gray-600">{subtitle}</p>
                {isEditing && existingOrder && (
                  <p className="text-xs text-gray-500">
                    Created: {existingOrder.createdAt.toLocaleDateString()} • 
                    Last modified: {existingOrder.updatedAt.toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
            <div className="text-sm text-gray-600">
              Customer: <span className="font-medium">Dr. Sarah Johnson</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmitForProduction)} className="space-y-8">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Order Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject Line *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Practice Relocation Notice"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="practiceId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Practice *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select practice" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1">Sunshine Dental</SelectItem>
                            <SelectItem value="2">Healthy Smiles Family Dentistry</SelectItem>
                            <SelectItem value="3">Downtown Medical Center</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="letterContent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Letter Content *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter the complete letter content that will be sent to patients..."
                          rows={8}
                          className="min-h-[200px]"
                          {...field}
                        />
                      </FormControl>
                      <p className="text-sm text-gray-600">
                        Use placeholders like [PATIENT_NAME], [PRACTICE_NAME], [DATE] for personalization
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Special Instructions</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any special requirements or notes for this order..."
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Mailing Details */}
            <Card>
              <CardHeader>
                <CardTitle>Mailing Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="templateType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Template Type *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="custom">Custom Letter</SelectItem>
                            <SelectItem value="relocation">Practice Relocation</SelectItem>
                            <SelectItem value="closure">Practice Closure</SelectItem>
                            <SelectItem value="hipaa">HIPAA Breach</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="colorMode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Color Mode *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Color">Color ($0.65 per letter)</SelectItem>
                            <SelectItem value="Black and White">Black & White ($0.50 per letter)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="recipientCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recipient Count *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="enclosures"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Enclosures</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="10"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Additional Services */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Services</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="dataCleansing"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Data Cleansing & De-Duplication (+$25)</FormLabel>
                        <p className="text-sm text-gray-600">
                          Remove duplicates and clean address data
                        </p>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ncoaUpdate"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>NCOA Move Update (+$50)</FormLabel>
                        <p className="text-sm text-gray-600">
                          Update addresses with USPS move data
                        </p>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="firstClassPostage"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>First Class Postage (+$0.68 per recipient)</FormLabel>
                        <p className="text-sm text-gray-600">
                          Upgrade to first class mail delivery
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* File Uploads */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="h-5 w-5 mr-2" />
                  Document Uploads
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Letter Document *</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center relative">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => handleFileUpload('letterDocument', e.target.files?.[0] || null)}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">
                        {uploadedFiles.letterDocument ? uploadedFiles.letterDocument.name : "Upload your letter content"}
                      </p>
                      <p className="text-xs text-gray-500">PDF, DOC, DOCX (Max 10MB)</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Recipient List *</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center relative">
                      <input
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        onChange={(e) => handleFileUpload('recipientList', e.target.files?.[0] || null)}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">
                        {uploadedFiles.recipientList ? uploadedFiles.recipientList.name : "Upload recipient addresses"}
                      </p>
                      <p className="text-xs text-gray-500">CSV, Excel (Max 5MB)</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Practice Letterhead</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center relative">
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={(e) => handleFileUpload('letterhead', e.target.files?.[0] || null)}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <Upload className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                      <p className="text-xs text-gray-600">
                        {uploadedFiles.letterhead ? uploadedFiles.letterhead.name : "Optional letterhead"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Logo/Signature</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center relative">
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={(e) => handleFileUpload('signature', e.target.files?.[0] || null)}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <Upload className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                      <p className="text-xs text-gray-600">
                        {uploadedFiles.signature ? uploadedFiles.signature.name : "Optional signature"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Enclosures</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center relative">
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={(e) => handleFileUpload('enclosures', e.target.files?.[0] || null)}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <Upload className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                      <p className="text-xs text-gray-600">
                        {uploadedFiles.enclosures ? uploadedFiles.enclosures.name : "Optional attachments"}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cost Summary */}
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-900">Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Base cost ({watchedValues.recipientCount} × ${watchedValues.colorMode === "Color" ? "0.65" : "0.50"}):</span>
                    <span>${(watchedValues.recipientCount * (watchedValues.colorMode === "Color" ? 0.65 : 0.50)).toFixed(2)}</span>
                  </div>
                  
                  {watchedValues.dataCleansing && (
                    <div className="flex justify-between">
                      <span>Data Cleansing:</span>
                      <span>$25.00</span>
                    </div>
                  )}
                  
                  {watchedValues.ncoaUpdate && (
                    <div className="flex justify-between">
                      <span>NCOA Update:</span>
                      <span>$50.00</span>
                    </div>
                  )}
                  
                  {watchedValues.firstClassPostage && (
                    <div className="flex justify-between">
                      <span>First Class Postage ({watchedValues.recipientCount} × $0.68):</span>
                      <span>${(watchedValues.recipientCount * 0.68).toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="border-t pt-2 flex justify-between font-bold text-lg">
                    <span>Total Estimated Cost:</span>
                    <span>${estimatedCost.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-between items-center">
              <Button
                type="button"
                variant="outline"
                size="lg"
                disabled={isSavingDraft || isSubmitting}
                onClick={onSaveDraft}
                className="text-gray-700 border-gray-300 hover:bg-gray-50"
              >
                {isSavingDraft ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Saving Draft...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save as Draft
                  </>
                )}
              </Button>

              <div className="flex items-center space-x-4">
                {isEditing && existingOrder && (
                  <div className="text-sm text-gray-600">
                    {existingOrder.status === "Draft" ? (
                      <span className="text-orange-600 font-medium">• Draft Order</span>
                    ) : (
                      <span className="text-red-600 font-medium">• Cannot edit: Order {existingOrder.status}</span>
                    )}
                  </div>
                )}
                
                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting || isSavingDraft || (isEditing && existingOrder?.status !== "Draft")}
                  className="bg-primary-blue hover:bg-blue-800"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Submitting for Production...
                    </>
                  ) : (
                    <>
                      <Package className="h-4 w-4 mr-2" />
                      {isEditing ? "Update & Submit for Production" : "Submit for Production"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}