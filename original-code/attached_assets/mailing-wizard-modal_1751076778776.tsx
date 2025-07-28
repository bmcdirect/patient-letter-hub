import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { cn } from "@/lib/utils";

interface MailingWizardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: any;
  practice?: any;
}

// Dynamic form schema based on template requirements
const createFormSchema = (requiredFields: string[] = []) => {
  const baseSchema = {
    subject: z.string().min(1, "Subject is required"),
  };

  const dynamicFields = requiredFields.reduce((acc, field) => {
    acc[field] = z.string().min(1, `${field} is required`);
    return acc;
  }, {} as Record<string, z.ZodString>);

  return z.object({ ...baseSchema, ...dynamicFields });
};

const steps = [
  { number: 1, name: "Event Details" },
  { number: 2, name: "Upload Data" },
  { number: 3, name: "Review & Cost" },
  { number: 4, name: "Payment" },
];

export default function MailingWizardModal({ 
  open, 
  onOpenChange, 
  template, 
  practice 
}: MailingWizardModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [costData, setCostData] = useState<any>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [letterJobId, setLetterJobId] = useState<number | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Create form schema based on template requirements
  const formSchema = createFormSchema(template?.requiredFields || []);
  type FormData = z.infer<typeof formSchema>;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subject: template?.name || '',
    },
  });

  // Reset wizard when modal opens/closes
  useEffect(() => {
    if (open) {
      setCurrentStep(1);
      setAddresses([]);
      setCostData(null);
      setUploadedFile(null);
      setLetterJobId(null);
      form.reset();
    }
  }, [open, form]);

  // Create letter job mutation
  const createJobMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("POST", "/api/letter-jobs", {
        practiceId: practice?.id,
        templateId: template?.id,
        templateType: template?.templateType || 'template',
        eventType: template?.eventType,
        subject: data.subject,
        bodyHtml: template?.bodyHtml,
        eventData: data,
        status: 'draft',
      });
      return response.json();
    },
    onSuccess: (job) => {
      setLetterJobId(job.id);
      setCurrentStep(2);
    },
    onError: (error: Error) => {
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
        description: error.message || "Failed to create letter job",
        variant: "destructive",
      });
    },
  });

  // Upload addresses mutation
  const uploadAddressesMutation = useMutation({
    mutationFn: async (file: File) => {
      // Parse CSV file
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      const addresses = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const address: any = { letterJobId };
        
        headers.forEach((header, index) => {
          switch (header) {
            case 'first_name':
            case 'firstname':
              address.firstName = values[index];
              break;
            case 'last_name':
            case 'lastname':
              address.lastName = values[index];
              break;
            case 'address':
            case 'address1':
            case 'line1':
              address.line1 = values[index];
              break;
            case 'address2':
            case 'line2':
              address.line2 = values[index];
              break;
            case 'city':
              address.city = values[index];
              break;
            case 'state':
              address.state = values[index];
              break;
            case 'zip':
            case 'zipcode':
            case 'zip5':
              address.zip5 = values[index];
              break;
            default:
              // Store additional fields in mergeData
              if (!address.mergeData) address.mergeData = {};
              address.mergeData[header] = values[index];
          }
        });
        
        return address;
      }).filter(addr => addr.firstName && addr.lastName && addr.line1 && addr.city && addr.state && addr.zip5);

      const response = await apiRequest(`/api/letter-jobs/${letterJobId}/addresses`, "POST", {
        addresses,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setAddresses(data.addresses);
      setCurrentStep(3);
      // Calculate cost
      calculateCost();
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Error",
        description: error.message || "Failed to upload addresses",
        variant: "destructive",
      });
    },
  });

  // Calculate cost mutation
  const calculateCostMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(`/api/letter-jobs/${letterJobId}/calculate-cost`, "POST", {
        certified: false,
        pages: 1,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setCostData(data);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to calculate cost",
        variant: "destructive",
      });
    },
  });

  const calculateCost = () => {
    if (letterJobId) {
      calculateCostMutation.mutate();
    }
  };

  const handleStep1Submit = (data: FormData) => {
    createJobMutation.mutate(data);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleStep2Continue = () => {
    if (uploadedFile) {
      uploadAddressesMutation.mutate(uploadedFile);
    } else {
      toast({
        title: "No File Selected",
        description: "Please select a CSV file to upload",
        variant: "destructive",
      });
    }
  };

  const renderLetterPreview = () => {
    if (!template?.bodyHtml) return null;

    const formData = form.getValues();
    let previewHtml = template.bodyHtml;

    // Replace merge tokens with form data
    Object.entries(formData).forEach(([key, value]) => {
      const token = new RegExp(`{{${key}}}`, 'gi');
      previewHtml = previewHtml.replace(token, value as string);
    });

    // Replace practice tokens
    if (practice) {
      previewHtml = previewHtml.replace(/{{PracticeName}}/g, practice.name);
      previewHtml = previewHtml.replace(/{{Phone}}/g, practice.phone || '');
      previewHtml = previewHtml.replace(/{{DoctorName}}/g, practice.defaultSenderName || '');
    }

    // Replace remaining tokens with placeholders
    previewHtml = previewHtml.replace(/{{(\w+)}}/g, '[$1]');

    return (
      <div className="bg-white rounded border p-6 text-sm leading-relaxed max-h-96 overflow-y-auto">
        <div className="text-center mb-6">
          <div className="font-bold text-lg text-dark-navy">{practice?.name}</div>
          <div className="text-gray-600">{practice?.address}</div>
        </div>
        
        <div className="mb-4 text-gray-600">[Date]</div>
        
        <div className="mb-4">
          <div>[FirstName] [LastName]</div>
          <div>[Address1]</div>
          <div>[Address2]</div>
          <div>[City], [State] [ZIP]</div>
        </div>
        
        <div className="mb-4">
          <strong>Dear [FirstName],</strong>
        </div>
        
        <div 
          className="space-y-4 text-gray-700"
          dangerouslySetInnerHTML={{ __html: previewHtml }}
        />
        
        <div className="mt-6">
          <p>Sincerely,</p>
          <div className="mt-4">
            <div className="font-medium">{practice?.defaultSenderName}</div>
            <div className="text-gray-600">{practice?.name}</div>
          </div>
        </div>
      </div>
    );
  };

  const getStepStatus = (stepNumber: number) => {
    if (stepNumber < currentStep) return 'completed';
    if (stepNumber === currentStep) return 'active';
    return 'pending';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-dark-navy">
            {template?.name || 'New Mailing'}
          </DialogTitle>
          
          {/* Progress Steps */}
          <div className="flex items-center mt-6 space-x-4">
            {steps.map((step, index) => {
              const status = getStepStatus(step.number);
              return (
                <div key={step.number} className="flex items-center">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                      status === 'active' && "bg-primary-blue text-white",
                      status === 'completed' && "bg-teal-accent text-white",
                      status === 'pending' && "bg-gray-300 text-gray-600"
                    )}
                  >
                    {step.number}
                  </div>
                  <span className={cn(
                    "ml-2 text-sm font-medium",
                    status === 'active' && "text-primary-blue",
                    status === 'completed' && "text-teal-accent",
                    status === 'pending' && "text-gray-600"
                  )}>
                    {step.name}
                  </span>
                  {index < steps.length - 1 && (
                    <div className={cn(
                      "flex-1 h-0.5 mx-4",
                      status === 'completed' ? "bg-teal-accent" : "bg-gray-300"
                    )} />
                  )}
                </div>
              );
            })}
          </div>
        </DialogHeader>

        <div className="mt-6">
          {/* Step 1: Event Details */}
          {currentStep === 1 && (
            <form onSubmit={form.handleSubmit(handleStep1Submit)} className="space-y-6">
              <h4 className="text-lg font-medium text-dark-navy">Event Details</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="subject">Letter Subject</Label>
                    <Input
                      id="subject"
                      {...form.register("subject")}
                      placeholder="Enter letter subject"
                    />
                    {form.formState.errors.subject && (
                      <p className="text-sm text-red-600">{form.formState.errors.subject.message}</p>
                    )}
                  </div>

                  {/* Dynamic fields based on template requirements */}
                  {template?.requiredFields?.map((field: string) => (
                    <div key={field}>
                      <Label htmlFor={field}>{field.replace(/([A-Z])/g, ' $1').trim()}</Label>
                      {field.toLowerCase().includes('address') || field.toLowerCase().includes('description') ? (
                        <Textarea
                          id={field}
                          {...form.register(field as keyof FormData)}
                          placeholder={`Enter ${field.toLowerCase()}`}
                          rows={3}
                        />
                      ) : (
                        <Input
                          id={field}
                          {...form.register(field as keyof FormData)}
                          placeholder={`Enter ${field.toLowerCase()}`}
                          type={field.toLowerCase().includes('date') ? 'date' : 'text'}
                        />
                      )}
                      {form.formState.errors[field as keyof FormData] && (
                        <p className="text-sm text-red-600">
                          {form.formState.errors[field as keyof FormData]?.message}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                <div>
                  <h5 className="font-medium text-dark-navy mb-4">Letter Preview</h5>
                  <Card className="bg-soft-grey">
                    <CardContent className="p-4">
                      {renderLetterPreview()}
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="flex justify-between pt-6 border-t">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createJobMutation.isPending}
                  className="bg-primary-blue hover:bg-blue-800"
                >
                  {createJobMutation.isPending ? "Creating..." : "Continue to Upload Data"}
                </Button>
              </div>
            </form>
          )}

          {/* Step 2: Upload Data */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h4 className="text-lg font-medium text-dark-navy">Upload Patient Data</h4>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="csvFile">CSV File Upload</Label>
                  <div className="mt-2">
                    <div className="flex items-center justify-center w-full">
                      <label htmlFor="csvFile" className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 mb-4 text-gray-500" />
                          <p className="mb-2 text-sm text-gray-500">
                            <span className="font-semibold">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-gray-500">CSV files only</p>
                        </div>
                        <input 
                          id="csvFile" 
                          type="file" 
                          className="hidden" 
                          accept=".csv"
                          onChange={handleFileUpload}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {uploadedFile && (
                  <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <span className="flex-1 text-sm font-medium">{uploadedFile.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setUploadedFile(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h6 className="font-medium text-dark-navy mb-2">CSV Format Requirements:</h6>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Required columns: FirstName, LastName, Address1, City, State, ZIP</li>
                    <li>• Optional columns: Address2, any additional merge fields</li>
                    <li>• First row should contain column headers</li>
                  </ul>
                </div>
              </div>

              <div className="flex justify-between pt-6 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setCurrentStep(1)}
                >
                  Back
                </Button>
                <Button 
                  onClick={handleStep2Continue}
                  disabled={!uploadedFile || uploadAddressesMutation.isPending}
                  className="bg-primary-blue hover:bg-blue-800"
                >
                  {uploadAddressesMutation.isPending ? "Processing..." : "Continue to Review"}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Review & Cost */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h4 className="text-lg font-medium text-dark-navy">Review & Cost</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <h5 className="font-medium text-dark-navy mb-4">Address Summary</h5>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Total Addresses:</span>
                        <span className="font-medium">{addresses.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Valid Addresses:</span>
                        <span className="font-medium text-green-600">
                          {costData?.validRecipients || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Invalid Addresses:</span>
                        <span className="font-medium text-red-600">
                          {addresses.length - (costData?.validRecipients || 0)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <h5 className="font-medium text-dark-navy mb-4">Cost Breakdown</h5>
                    {costData ? (
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Cost per Letter:</span>
                          <span className="font-medium">${costData.costPerLetter?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Cost:</span>
                          <span className="font-medium">${costData.totalCost?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-primary-blue">
                          <span>Credits Needed:</span>
                          <span className="font-bold">{costData.creditsNeeded}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="animate-pulse space-y-2">
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded"></div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-between pt-6 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setCurrentStep(2)}
                >
                  Back
                </Button>
                <Button 
                  onClick={() => setCurrentStep(4)}
                  disabled={!costData}
                  className="bg-primary-blue hover:bg-blue-800"
                >
                  Continue to Payment
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Payment */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h4 className="text-lg font-medium text-dark-navy">Payment & Approval</h4>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <h5 className="font-medium text-dark-navy mb-4">Ready to Send</h5>
                  <p className="text-gray-600 mb-6">
                    Your mailing has been prepared and is ready to be sent to {costData?.validRecipients} recipients.
                  </p>
                  
                  <div className="bg-green-50 p-4 rounded-lg mb-6">
                    <p className="text-green-800 font-medium">
                      Total Cost: {costData?.creditsNeeded} credits (${costData?.totalCost?.toFixed(2)})
                    </p>
                  </div>

                  <div className="space-y-4">
                    <Button 
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => {
                        toast({
                          title: "Mailing Approved",
                          description: "Your mailing has been submitted for processing.",
                        });
                        onOpenChange(false);
                        // Refresh dashboard data
                        queryClient.invalidateQueries({ queryKey: ["/api/practices"] });
                      }}
                    >
                      Approve & Send Mailing
                    </Button>
                    
                    <p className="text-xs text-gray-500">
                      By clicking "Approve & Send", you authorize the deduction of {costData?.creditsNeeded} credits 
                      from your account and confirm the mailing.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between pt-6 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setCurrentStep(3)}
                >
                  Back
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Save as Draft
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
