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
import { useRouter } from "next/navigation";
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
  const [practice, setPractice] = useState<any>(null);

  useEffect(() => {
    async function fetchPractice() {
      const res = await fetch("/api/user");
      const userData = await res.json();
      if (userData.user?.practiceId) {
        const practiceRes = await fetch(`/api/practices/${userData.user.practiceId}`);
        setPractice(await practiceRes.json());
      }
    }
    fetchPractice();
  }, []);

  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      colorMode: "color",
      dataCleansing: false,
      ncoaUpdate: false,
      firstClassPostage: false,
      autoDeleteDataFile: true,
      actualRecipients: 0,
      totalCost: 0,
    },
  });

  useEffect(() => {
    async function fetchPractices() {
      setLoading(true);
      const res = await fetch("/api/practices");
      if (res.ok) {
        const data = await res.json();
        setPractices(data.practices || []);
      }
      setLoading(false);
    }
    fetchPractices();
  }, []);

  useEffect(() => {
    if (practice) {
      form.setValue("practiceId", practice.id);
    }
  }, [practice, form]);

  // Track form values locally to avoid infinite re-renders
  const [colorMode, setColorMode] = useState("color");
  const [dataCleansing, setDataCleansing] = useState(false);
  const [ncoaUpdate, setNcoaUpdate] = useState(false);
  const [firstClassPostage, setFirstClassPostage] = useState(false);
  const [actualRecipients, setActualRecipients] = useState(0);

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
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, value?.toString() || '');
      });
      // Add files
      Object.entries(uploadedFiles).forEach(([key, file]) => {
        if (file) {
          formData.append('file', file.file);
        }
      });
      formData.append('totalCost', (costBreakdown?.totalCost || 0).toString());
      formData.append('status', isDraft ? 'draft' : 'pending');
      const res = await fetch("/api/orders", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error(isDraft ? "Failed to save draft" : "Failed to create order");
      toast({ title: "Success", description: isDraft ? "Order saved as draft." : "Order created!" });
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
      <h1 className="text-2xl font-bold mb-4">Create Order</h1>
      <form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
        <Card className="shadow-sm border border-gray-100">
          <CardContent className="p-6 space-y-6">
            <div className="mb-4">
              <Label>Location</Label>
              <div className="p-3 bg-gray-50 rounded border text-gray-700">
                {practice ? (
                  <>
                    <div>{practice.name}</div>
                    <div>{practice.address}</div>
                    <div>{practice.phone}</div>
                  </>
                ) : (
                  <span>Loading location...</span>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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