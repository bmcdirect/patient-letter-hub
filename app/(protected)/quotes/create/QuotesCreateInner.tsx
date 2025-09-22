"use client";

import { useState, useEffect } from "react";
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
import { DashboardHeader } from "@/components/dashboard/header";
import MaxWidthWrapper from "@/components/shared/max-width-wrapper";
import { getCostBreakdown } from "@/lib/quote";
import { useSearchParams } from "next/navigation";

const quoteSchema = z.object({
  practiceId: z.string().min(1, "Practice is required"),
  purchaseOrder: z.string().optional(),
  costCenter: z.string().optional(),
  subject: z.string().optional(),
  estimatedRecipients: z.coerce.number().min(1, "At least 1 recipient is required"),
  colorMode: z.enum(["color", "bw"]),
  dataCleansing: z.boolean().default(false),
  ncoaUpdate: z.boolean().default(false),
  firstClassPostage: z.boolean().default(false),
  notes: z.string().optional(),
  totalCost: z.coerce.number().min(0, "Total cost is required"),
});

type QuoteFormData = z.infer<typeof quoteSchema>;

interface Practice {
  id: string;
  name: string;
}

export default function QuotesCreateInner() {
  const router = useRouter();
  const { toast } = useToast();
  const [practices, setPractices] = useState<Practice[]>([]);
  const [loading, setLoading] = useState(true);
  const [costBreakdown, setCostBreakdown] = useState<any>(null);
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const isEditing = !!editId;
  const [initialLoading, setInitialLoading] = useState(isEditing);
  const [practice, setPractice] = useState<any>(null);

  const form = useForm<QuoteFormData>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      colorMode: "color",
      dataCleansing: false,
      ncoaUpdate: false,
      firstClassPostage: false,
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

  // Set practiceId in form when practice is loaded
  useEffect(() => {
    if (practice && practice.id) {
      form.setValue("practiceId", practice.id);
    }
  }, [practice, form]);

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

  // Fetch existing quote if editing
  useEffect(() => {
    if (isEditing) {
      setInitialLoading(true);
      fetch(`/api/quotes/${editId}`)
        .then(res => res.json())
        .then(data => {
          form.reset({
            ...data,
            estimatedRecipients: data.estimatedRecipients || 1,
            colorMode: data.colorMode || "color",
            dataCleansing: !!data.dataCleansing,
            ncoaUpdate: !!data.ncoaUpdate,
            firstClassPostage: !!data.firstClassPostage,
            totalCost: data.totalCost || 0,
          });
        })
        .finally(() => setInitialLoading(false));
    }
  }, [isEditing, editId, form]);

  // Watch form values and update cost breakdown
  useEffect(() => {
    const subscription = form.watch((values) => {
      const estimatedRecipients = values.estimatedRecipients ?? 0;
      const colorMode = values.colorMode ?? "color";
      const dataCleansing = values.dataCleansing ?? false;
      const ncoaUpdate = values.ncoaUpdate ?? false;
      const firstClassPostage = values.firstClassPostage ?? false;
      if (estimatedRecipients > 0) {
        const breakdown = getCostBreakdown({
          estimatedRecipients,
          colorMode,
          dataCleansing,
          ncoaUpdate,
          firstClassPostage,
        });
        setCostBreakdown(breakdown);
        if (form.getValues("totalCost") !== breakdown.totalCost) {
          form.setValue("totalCost", breakdown.totalCost);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const onSubmit = async (data: QuoteFormData) => {
    try {
      // Force-recalculate total cost before submission to ensure accuracy
      const finalCostBreakdown = getCostBreakdown({
        estimatedRecipients: data.estimatedRecipients,
        colorMode: data.colorMode,
        dataCleansing: data.dataCleansing,
        ncoaUpdate: data.ncoaUpdate,
        firstClassPostage: data.firstClassPostage,
      });

      // Create the final submission data with the calculated total cost
      const submissionData = {
        ...data,
        totalCost: finalCostBreakdown.totalCost
      };

      console.log('Submitting quote with calculated cost:', {
        estimatedRecipients: data.estimatedRecipients,
        colorMode: data.colorMode,
        additionalServices: {
          dataCleansing: data.dataCleansing,
          ncoaUpdate: data.ncoaUpdate,
          firstClassPostage: data.firstClassPostage
        },
        calculatedTotalCost: finalCostBreakdown.totalCost,
        costBreakdown: finalCostBreakdown
      });

      const res = await fetch(isEditing ? `/api/quotes/${editId}` : "/api/quotes", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submissionData),
      });
      if (!res.ok) throw new Error(isEditing ? "Failed to update quote" : "Failed to create quote");
      toast({ title: isEditing ? "Quote updated!" : "Quote created!", description: isEditing ? "Your quote has been updated." : "Your quote has been created." });
      router.push("/quotes");
    } catch (err) {
      toast({ title: "Error", description: isEditing ? "Failed to update quote." : "Failed to create quote.", variant: "destructive" });
    }
  };

  return (
    <MaxWidthWrapper>
      <DashboardHeader heading={isEditing ? "Edit Quote" : "Request a Quote"} text={isEditing ? "Update quote information and pricing." : "Generate a quote estimate for your patient letter campaign."} />
      <div className="flex flex-col gap-8 py-8">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card className="shadow-sm border border-gray-100">
            <CardContent className="p-6 space-y-6">
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
                  <Label htmlFor="purchaseOrder">Purchase Order (Optional)</Label>
                  <Input id="purchaseOrder" {...form.register("purchaseOrder")} placeholder="Enter PO number" />
                </div>
                <div>
                  <Label htmlFor="costCenter">Cost Center (Optional)</Label>
                  <Input id="costCenter" {...form.register("costCenter")} placeholder="Enter cost center" />
                </div>
                <div>
                  <Label htmlFor="subject">Letter Subject (Optional)</Label>
                  <Input id="subject" {...form.register("subject")} placeholder="e.g., Practice Relocation Notice" />
                </div>
                <div>
                  <Label htmlFor="estimatedRecipients">Estimated Recipients</Label>
                  <Input id="estimatedRecipients" type="number" min={1} {...form.register("estimatedRecipients", { valueAsNumber: true })} placeholder="Enter estimated number" />
                  {form.formState.errors.estimatedRecipients && (
                    <p className="text-red-500 text-sm mt-1">{form.formState.errors.estimatedRecipients.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Print Options</Label>
                  <RadioGroup
                    value={form.watch("colorMode")}
                    onValueChange={val => form.setValue("colorMode", val as "color" | "bw")}
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
                      <Checkbox id="dataCleansing" checked={form.watch("dataCleansing")} onCheckedChange={val => form.setValue("dataCleansing", !!val)} />
                      <Label htmlFor="dataCleansing">Data Cleansing (+$25 flat fee)</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox id="ncoaUpdate" checked={form.watch("ncoaUpdate")} onCheckedChange={val => form.setValue("ncoaUpdate", !!val)} />
                      <Label htmlFor="ncoaUpdate">NCOA Address Update (+$50 flat fee)</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox id="firstClassPostage" checked={form.watch("firstClassPostage")} onCheckedChange={val => form.setValue("firstClassPostage", !!val)} />
                      <Label htmlFor="firstClassPostage">First Class Postage (+$0.68 per piece)</Label>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea id="notes" {...form.register("notes")} rows={3} placeholder="Any special requirements or notes for this quote..." />
              </div>

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
                        * This is an estimate based on {form.watch("estimatedRecipients")} recipients
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex items-center justify-end gap-4 mt-6">
                <div className="text-sm text-gray-600 mr-auto">
                  💡 Total cost will be automatically calculated based on your selections
                </div>
                <Button type="button" variant="outline" onClick={() => router.push("/quotes")}>Cancel</Button>
                <Button type="submit" className="bg-primary text-white" disabled={initialLoading || loading}>
                  {initialLoading ? (isEditing ? "Updating..." : "Generating...") : (isEditing ? "Update Quote" : "Generate Quote")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </MaxWidthWrapper>
  );
}
