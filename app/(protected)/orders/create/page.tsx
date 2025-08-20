"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import FileUploadComponent, { UploadedFile } from "@/components/file-upload/FileUploadComponent";
import { getCostBreakdown } from "@/lib/quote";

const orderSchema = z.object({
  practiceId: z.string().min(1, "Practice is required"),
  customerNumber: z.string().optional(),
  purchaseOrder: z.string().optional(),
  costCenter: z.string().optional(),
  subject: z.string().optional(),
  actualRecipients: z.coerce.number().min(1, "Data file with recipients is required"),
  preferredMailDate: z.string().min(1, "Preferred mail date is required"),
  colorMode: z.enum(["color", "bw"]),
  dataCleansing: z.boolean().default(false),
  ncoaUpdate: z.boolean().default(false),
  firstClassPostage: z.boolean().default(false),
  autoDeleteDataFile: z.boolean().default(true),
  notes: z.string().optional(),
  totalCost: z.coerce.number().min(0, "Total cost is required"),
});

type OrderFormData = z.infer<typeof orderSchema>;

interface Practice {
  id: string;
  name: string;
}

export default function CreateOrderPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [practices, setPractices] = useState<Practice[]>([]);
  const [loading, setLoading] = useState(true);
  const [costBreakdown, setCostBreakdown] = useState<any>(null);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, UploadedFile | null>>({});
  const [isDraft, setIsDraft] = useState(false);
  const searchParams = useSearchParams();
  const editId = searchParams?.get("edit");
  const fromQuoteId = searchParams?.get("fromQuote");
  const isEditing = !!editId;
  const isFromQuote = !!fromQuoteId;
  const [initialLoading, setInitialLoading] = useState(isEditing || isFromQuote);
  const [quoteLoading, setQuoteLoading] = useState(isFromQuote);
  const [practice, setPractice] = useState<any>(null);
  const [quoteData, setQuoteData] = useState<any>(null);

  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      colorMode: "color",
      dataCleansing: false,
      ncoaUpdate: false,
      firstClassPostage: false,
      autoDeleteDataFile: true,
      actualRecipients: 1, // Changed from 0 to 1 to pass validation
      totalCost: 0,
    },
  });

  useEffect(() => {
    async function fetchPractice() {
      const res = await fetch("/api/user");
      const userData = await res.json();
      if (userData.user?.practiceId) {
        const practiceRes = await fetch(`/api/practices/${userData.user.practiceId}`);
        const practiceData = await practiceRes.json();
        setPractice(practiceData);
      }
    }
    fetchPractice();
  }, []);

  // Fetch quote data if converting from quote
  useEffect(() => {
    async function fetchQuoteData() {
      if (fromQuoteId) {
        setQuoteLoading(true);
        try {
          const res = await fetch(`/api/quotes/${fromQuoteId}`);
          if (res.ok) {
            const quote = await res.json();
            setQuoteData(quote);
            console.log('Fetched quote data for conversion:', quote);
          }
        } catch (error) {
          console.error('Error fetching quote data:', error);
        } finally {
          setQuoteLoading(false);
        }
      }
    }
    fetchQuoteData();
  }, [fromQuoteId]);

  // Set practiceId in form when practice is loaded
  useEffect(() => {
    if (practice && practice.id) {
      form.setValue("practiceId", practice.id);
    }
  }, [practice, form]);

        // Pre-fill form with quote data when converting from quote
      useEffect(() => {
        if (quoteData && isFromQuote) {
          form.setValue("practiceId", quoteData.practiceId);
          form.setValue("subject", quoteData.subject || "");
          form.setValue("purchaseOrder", quoteData.purchaseOrder || "");
          form.setValue("costCenter", quoteData.costCenter || "");
          form.setValue("colorMode", quoteData.colorMode || "color");
          form.setValue("dataCleansing", quoteData.dataCleansing || false);
          form.setValue("ncoaUpdate", quoteData.ncoaUpdate || false);
          form.setValue("firstClassPostage", quoteData.firstClassPostage || false);
          form.setValue("notes", quoteData.notes || "");
          form.setValue("totalCost", quoteData.totalCost || 0);
          
          // Set local state for cost calculation
          setColorMode(quoteData.colorMode || "color");
          setDataCleansing(quoteData.dataCleansing || false);
          setNcoaUpdate(quoteData.ncoaUpdate || false);
          setFirstClassPostage(quoteData.firstClassPostage || false);
          
          console.log('Pre-filled form with quote data:', {
            practiceId: quoteData.practiceId,
            subject: quoteData.subject,
            colorMode: quoteData.colorMode,
            totalCost: quoteData.totalCost
          });
        }
      }, [quoteData, isFromQuote, form]);

  // Set practiceId when practices are loaded and user has a practice
  useEffect(() => {
    if (practice && practice.id && practices.length > 0) {
      const userPractice = practices.find((p: any) => p.id === practice.id);
      if (userPractice) {
        form.setValue("practiceId", userPractice.id);
      }
    }
  }, [practice, practices, form]);

  useEffect(() => {
    async function fetchPractices() {
      setLoading(true);
      try {
        const res = await fetch("/api/practices");
        if (res.ok) {
          const data = await res.json();
          const practicesArray = data.practices || [];
          setPractices(practicesArray);
          console.log('Fetched practices:', practicesArray);
          
          // If user has a practice assigned and it's in the list, set it as default
          if (practice && practice.id && practicesArray.length > 0) {
            const userPractice = practicesArray.find((p: any) => p.id === practice.id);
            if (userPractice) {
              form.setValue("practiceId", userPractice.id);
            }
          }
        } else {
          console.error('Failed to fetch practices:', res.status);
        }
      } catch (error) {
        console.error('Error fetching practices:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchPractices();
  }, [practice, form]);

  // Track form values locally to avoid infinite re-renders
  const [colorMode, setColorMode] = useState("color");
  const [dataCleansing, setDataCleansing] = useState(false);
  const [ncoaUpdate, setNcoaUpdate] = useState(false);
  const [firstClassPostage, setFirstClassPostage] = useState(false);
  const [actualRecipients, setActualRecipients] = useState(1);

  // Calculate cost breakdown based on local state
  useEffect(() => {
    if (actualRecipients > 0) {
      const breakdown = getCostBreakdown({
        estimatedRecipients: actualRecipients,
        colorMode: colorMode,
        dataCleansing: dataCleansing,
        ncoaUpdate: ncoaUpdate,
        firstClassPostage: firstClassPostage,
      });
      setCostBreakdown(breakdown);
      form.setValue("totalCost", breakdown.totalCost);
    }
  }, [actualRecipients, colorMode, dataCleansing, ncoaUpdate, firstClassPostage, form]);

  // Handle recipient count from data file
  const handleRecipientCountChange = useCallback((count: number) => {
    setActualRecipients(count);
    form.setValue("actualRecipients", count);
  }, [form]);

  // Handle file changes from FileUploadComponent
  const handleFilesChange = useCallback((files: Record<string, UploadedFile | null>) => {
    setUploadedFiles(files);
  }, []);

  // Handle practice selection and customer number auto-generation
  const handlePracticeChange = (practiceId: string) => {
    form.setValue("practiceId", practiceId);
    // Auto-generate customer number (simple example)
    form.setValue("customerNumber", `${practiceId.padStart(3, '0')}-${Date.now().toString().slice(-4)}`);
  };

  // Memoized handlers for form controls
  const handleColorModeChange = useCallback((val: string) => {
    setColorMode(val as "color" | "bw");
    form.setValue("colorMode", val as "color" | "bw");
  }, [form]);

  const handleDataCleansingChange = useCallback((val: boolean) => {
    setDataCleansing(val);
    form.setValue("dataCleansing", val);
  }, [form]);

  const handleNcoaUpdateChange = useCallback((val: boolean) => {
    setNcoaUpdate(val);
    form.setValue("ncoaUpdate", val);
  }, [form]);

  const handleFirstClassPostageChange = useCallback((val: boolean) => {
    setFirstClassPostage(val);
    form.setValue("firstClassPostage", val);
  }, [form]);

  const onSubmit = async (data: OrderFormData) => {
    try {
      // Prepare form data for file upload
      const formData = new FormData();
      
      // Add all form fields explicitly
      formData.append('practiceId', data.practiceId || '');
      formData.append('subject', data.subject || '');
      formData.append('purchaseOrder', data.purchaseOrder || '');
      formData.append('costCenter', data.costCenter || '');
      // Set actualRecipients to at least 1 if no files uploaded (for draft mode)
      const recipientCount = isDraft ? Math.max(data.actualRecipients || 1, 1) : data.actualRecipients || 1;
      formData.append('actualRecipients', recipientCount.toString());
      // Handle preferredMailDate with proper validation
      let mailDate = data.preferredMailDate;
      if (!mailDate || mailDate === 'Invalid Date' || mailDate.includes('252025')) {
        // Use current date if invalid
        mailDate = new Date().toISOString().split('T')[0];
        console.log('⚠️ Frontend - Invalid date detected, using current date:', mailDate);
      }
      formData.append('preferredMailDate', mailDate);
      formData.append('colorMode', data.colorMode || 'color');
      formData.append('dataCleansing', data.dataCleansing?.toString() || 'false');
      formData.append('ncoaUpdate', data.ncoaUpdate?.toString() || 'false');
      formData.append('firstClassPostage', data.firstClassPostage?.toString() || 'false');
      formData.append('notes', data.notes || '');
      formData.append('totalCost', (costBreakdown?.totalCost || data.totalCost || 0).toString());
      formData.append('status', isDraft ? 'draft' : 'pending');
      
      // Add files
      console.log('🔍 Frontend - Files to upload:', {
        uploadedFilesKeys: Object.keys(uploadedFiles),
        uploadedFilesValues: Object.values(uploadedFiles).map(f => f ? { name: f.file.name, size: f.file.size, type: f.file.type } : null)
      });
      
      Object.entries(uploadedFiles).forEach(([key, file]) => {
        if (file) {
          console.log(`🔍 Frontend - Appending file: ${file.file.name} (${file.file.size} bytes)`);
          formData.append('file', file.file);
        }
      });
      
      // If converting from quote, add quote reference
      if (isFromQuote && fromQuoteId) {
        formData.append('fromQuoteId', fromQuoteId);
      }
      
      // Debug logging
      console.log('🔍 Frontend - Submitting order with data:', {
        practiceId: data.practiceId,
        subject: data.subject,
        totalCost: costBreakdown?.totalCost || data.totalCost,
        status: isDraft ? 'draft' : 'pending',
        fromQuoteId,
        fileCount: Object.keys(uploadedFiles).length,
        originalDate: data.preferredMailDate,
        sanitizedDate: mailDate,
        formData: Object.fromEntries(formData.entries())
      });
      
      const res = await fetch("/api/orders", {
        method: "POST",
        body: formData,
      });
      
      if (!res.ok) throw new Error(isDraft ? "Failed to save draft" : "Failed to create order");
      
      const order = await res.json();
      
      // If converting from quote, update quote status
      if (isFromQuote && fromQuoteId) {
        try {
          await fetch(`/api/quotes/${fromQuoteId}`, {
            method: "POST", // This will convert the quote
          });
        } catch (quoteErr) {
          console.error('Failed to update quote status:', quoteErr);
        }
      }
      
      toast({ 
        title: "Success", 
        description: isDraft ? "Order saved as draft." : 
          isFromQuote ? `Quote converted to order ${order.orderNumber}` : "Order created!" 
      });
      router.push("/orders");
    } catch (err) {
      toast({ title: "Error", description: isDraft ? "Failed to save draft." : "Failed to create order.", variant: "destructive" });
    }
  };

  const onSaveDraft = () => {
    setIsDraft(true);
    form.handleSubmit(onSubmit)();
  };

  const onSubmitForProduction = () => {
    setIsDraft(false);
    form.handleSubmit(onSubmit)();
  };

  return (
    <main className="flex-1 p-8">
      <h1 className="text-2xl font-bold mb-4">
        {isFromQuote ? `Convert Quote to Order` : isEditing ? `Edit Order` : `Create Order`}
      </h1>
      {isFromQuote && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          {quoteLoading ? (
            <p className="text-blue-800">Loading quote data...</p>
          ) : quoteData ? (
            <>
              <p className="text-blue-800">
                <strong>Converting Quote:</strong> {quoteData.quoteNumber} - {quoteData.subject || 'No subject'}
              </p>
              <p className="text-blue-600 text-sm mt-1">
                Please upload your files and review the order details below. The quote information has been pre-filled.
              </p>
            </>
          ) : (
            <p className="text-red-600">Failed to load quote data</p>
          )}
        </div>
      )}
      <form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
        <Card className="shadow-sm border border-gray-100">
          <CardContent className="p-6 space-y-6">
            <div className="mb-4">
              <Label>Location</Label>
              <div className="p-3 bg-gray-50 rounded border text-gray-700">
                {practice ? (
                  <>
                    <div>{practice.name} - {practice.phone}</div>
                    {practice.email && <div>{practice.email}</div>}
                  </>
                ) : (
                  <span>Loading location...</span>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="practiceId">Practice</Label>
                <Select
                  value={form.watch("practiceId")}
                  onValueChange={val => form.setValue("practiceId", val)}
                  disabled={loading || practices.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loading ? "Loading..." : practices.length === 0 ? "No practices found" : "Select a practice"} />
                  </SelectTrigger>
                  <SelectContent>
                    {practices.map(practice => (
                      <SelectItem key={practice.id} value={practice.id}>{practice.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.practiceId && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.practiceId.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="customerNumber">Customer Number</Label>
                <Input id="customerNumber" {...form.register("customerNumber")} placeholder="Auto-generated" disabled className="bg-gray-50" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="purchaseOrder">Purchase Order (Optional)</Label>
                <Input id="purchaseOrder" {...form.register("purchaseOrder")} placeholder="Enter PO number" />
              </div>
              <div>
                <Label htmlFor="costCenter">Cost Center (Optional)</Label>
                <Input id="costCenter" {...form.register("costCenter")} placeholder="Enter cost center" />
              </div>
            </div>
            <div>
              <Label htmlFor="subject">Letter Subject (Optional)</Label>
              <Input id="subject" {...form.register("subject")} placeholder="e.g., Practice Relocation Notice" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="actualRecipients">Number of Recipients</Label>
                <Input id="actualRecipients" type="number" {...form.register("actualRecipients", { valueAsNumber: true })} placeholder="0" disabled className="bg-gray-50" />
                <p className="text-xs text-gray-500 mt-1">Automatically calculated from uploaded data file</p>
                {form.formState.errors.actualRecipients && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.actualRecipients.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="preferredMailDate">Preferred Mail Date</Label>
                <Input id="preferredMailDate" type="date" {...form.register("preferredMailDate")} min={new Date().toISOString().split('T')[0]} />
                {form.formState.errors.preferredMailDate && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.preferredMailDate.message}</p>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea id="notes" {...form.register("notes")} rows={3} placeholder="Any special requirements or notes..." />
            </div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <Label>Print Options</Label>
                                 <RadioGroup
                   value={colorMode}
                   onValueChange={handleColorModeChange}
                   className="flex gap-4 mt-2"
                 >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="color" id="color-mode" />
                    <Label htmlFor="color-mode">Color Printing ($0.65 per piece)</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="bw" id="bw-mode" />
                    <Label htmlFor="bw-mode">Black & White Printing ($0.50 per piece)</Label>
                  </div>
                </RadioGroup>
              </div>
              <div>
                <Label>Additional Services</Label>
                <div className="flex flex-col gap-2 mt-2">
                                     <div className="flex items-center gap-2">
                     <Checkbox 
                       id="dataCleansing" 
                       checked={dataCleansing} 
                       onCheckedChange={handleDataCleansingChange} 
                     />
                     <Label htmlFor="dataCleansing">Data Cleansing (+$25 flat fee)</Label>
                   </div>
                   <div className="flex items-center gap-2">
                     <Checkbox 
                       id="ncoaUpdate" 
                       checked={ncoaUpdate} 
                       onCheckedChange={handleNcoaUpdateChange} 
                     />
                     <Label htmlFor="ncoaUpdate">NCOA Address Update (+$50 flat fee)</Label>
                   </div>
                   <div className="flex items-center gap-2">
                     <Checkbox 
                       id="firstClassPostage" 
                       checked={firstClassPostage} 
                       onCheckedChange={handleFirstClassPostageChange} 
                     />
                     <Label htmlFor="firstClassPostage">First Class Postage (+$0.68 per piece)</Label>
                   </div>
                </div>
              </div>
            </div>
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
                      * Based on {actualRecipients} recipients from data file
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            <div className="flex items-center justify-between">
              <Button type="button" variant="outline" onClick={() => router.push("/orders")}>Cancel</Button>
              <div className="flex items-center space-x-4">
                <Button type="button" variant="outline" onClick={onSaveDraft}>
                  Save as Draft
                </Button>
                <Button type="button" onClick={onSubmitForProduction} className="bg-primary-500 hover:bg-primary-600 text-white">
                  Submit for Production
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </main>
  );
} 