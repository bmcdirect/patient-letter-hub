import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { ArrowLeft, Package, Upload, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const orderSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  practiceId: z.string().min(1, "Practice selection is required"),
  templateType: z.string().min(1, "Template type is required"),
  colorMode: z.string().min(1, "Color mode is required"),
  recipientCount: z.number().min(1, "Recipient count must be at least 1"),
  enclosures: z.number().min(0, "Enclosures cannot be negative"),
  notes: z.string().optional(),
  dataCleansing: z.boolean().optional(),
  ncoaUpdate: z.boolean().optional(),
  firstClassPostage: z.boolean().optional(),
});

type OrderFormData = z.infer<typeof orderSchema>;

export default function Order() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      subject: "",
      practiceId: "",
      templateType: "custom",
      colorMode: "Color",
      recipientCount: 100,
      enclosures: 0,
      notes: "",
      dataCleansing: false,
      ncoaUpdate: false,
      firstClassPostage: false,
    },
  });

  // Calculate estimated cost
  const calculateCost = (data: OrderFormData) => {
    const baseRate = data.colorMode === "Color" ? 0.65 : 0.50;
    let total = data.recipientCount * baseRate;
    
    if (data.dataCleansing) total += 25;
    if (data.ncoaUpdate) total += 50;
    if (data.firstClassPostage) total += data.recipientCount * 0.68;
    
    return total;
  };

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (data: OrderFormData) => {
      setIsSubmitting(true);
      // Mock order creation - simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const orderNumber = `O-${Date.now().toString().slice(-4)}`;
      const totalCost = calculateCost(data);
      
      return {
        id: Math.floor(Math.random() * 1000),
        orderNumber,
        totalCost,
        status: "In Progress",
      };
    },
    onSuccess: (result) => {
      toast({
        title: "Order Created Successfully",
        description: `Order ${result.orderNumber} has been created and is now in progress.`,
      });
      
      // Redirect to dashboard after successful creation
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1500);
    },
    onError: (error) => {
      toast({
        title: "Order Creation Failed",
        description: "Failed to create order. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const onSubmit = (data: OrderFormData) => {
    createOrderMutation.mutate(data);
  };

  const watchedValues = form.watch();
  const estimatedCost = calculateCost(watchedValues);

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
                <h1 className="text-xl font-semibold text-dark-navy">Create New Order</h1>
                <p className="text-sm text-gray-600">Set up a new mailing order</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Upload your letter content</p>
                      <p className="text-xs text-gray-500">PDF, DOC, DOCX (Max 10MB)</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Recipient List *</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Upload recipient addresses</p>
                      <p className="text-xs text-gray-500">CSV, Excel (Max 5MB)</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Practice Letterhead</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      <Upload className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                      <p className="text-xs text-gray-600">Optional letterhead</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Logo/Signature</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      <Upload className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                      <p className="text-xs text-gray-600">Optional signature</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Enclosures</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      <Upload className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                      <p className="text-xs text-gray-600">Optional attachments</p>
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

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="bg-primary-blue hover:bg-blue-800"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Creating Order...
                  </>
                ) : (
                  <>
                    <Package className="h-4 w-4 mr-2" />
                    Create Order
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}