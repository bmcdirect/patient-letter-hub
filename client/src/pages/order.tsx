import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, FileText, Image, Users, FileImage } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function Order() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    template: "",
    letterBody: "",
    colorMode: "black-white"
  });
  const [files, setFiles] = useState({
    logo: null as File | null,
    signature: null as File | null,
    extraPages: null as File | null,
    recipients: null as File | null
  });

  const createOrderMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch('/api/orders', {
        method: 'POST',
        body: data,
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to create order');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Order Created Successfully",
        description: `Your letter job has been created with ID: ${data.job_id}`,
      });
      setLocation('/tracking');
    },
    onError: (error: Error) => {
      toast({
        title: "Order Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleFileChange = (field: keyof typeof files, file: File | null) => {
    setFiles(prev => ({ ...prev, [field]: file }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = new FormData();
    data.append('template', formData.template);
    data.append('letterBody', formData.letterBody);
    data.append('colorMode', formData.colorMode);
    
    if (files.logo) data.append('logo', files.logo);
    if (files.signature) data.append('signature', files.signature);
    if (files.extraPages) data.append('extraPages', files.extraPages);
    if (files.recipients) data.append('recipients', files.recipients);
    
    createOrderMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold">Create New Mailing</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Letter Details
              </CardTitle>
              <CardDescription>
                Configure your letter template and content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="template">Template Type</Label>
                <Select 
                  value={formData.template} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, template: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="practice-relocation">Practice Relocation</SelectItem>
                    <SelectItem value="practice-closure">Practice Closure</SelectItem>
                    <SelectItem value="provider-departure">Provider Departure</SelectItem>
                    <SelectItem value="hipaa-breach">HIPAA Breach Notification</SelectItem>
                    <SelectItem value="appointment-reminder">Appointment Reminder</SelectItem>
                    <SelectItem value="custom">Custom Letter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="letterBody">Letter Content</Label>
                <Textarea
                  id="letterBody"
                  placeholder="Enter your letter content here..."
                  value={formData.letterBody}
                  onChange={(e) => setFormData(prev => ({ ...prev, letterBody: e.target.value }))}
                  rows={8}
                  className="resize-none"
                />
              </div>
              
              <div>
                <Label htmlFor="colorMode">Print Mode</Label>
                <Select 
                  value={formData.colorMode} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, colorMode: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="black-white">Black & White</SelectItem>
                    <SelectItem value="full-color">Full Color</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                File Uploads
              </CardTitle>
              <CardDescription>
                Upload your practice logo, signature, additional pages, and recipient list
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="logo" className="flex items-center gap-2">
                    <Image className="h-4 w-4" />
                    Practice Logo
                  </Label>
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange('logo', e.target.files?.[0] || null)}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
                
                <div>
                  <Label htmlFor="signature" className="flex items-center gap-2">
                    <FileImage className="h-4 w-4" />
                    Signature
                  </Label>
                  <Input
                    id="signature"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange('signature', e.target.files?.[0] || null)}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                  />
                </div>
                
                <div>
                  <Label htmlFor="extraPages" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Extra Pages (PDF)
                  </Label>
                  <Input
                    id="extraPages"
                    type="file"
                    accept=".pdf"
                    onChange={(e) => handleFileChange('extraPages', e.target.files?.[0] || null)}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                  />
                </div>
                
                <div>
                  <Label htmlFor="recipients" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Recipients (CSV)
                  </Label>
                  <Input
                    id="recipients"
                    type="file"
                    accept=".csv"
                    onChange={(e) => handleFileChange('recipients', e.target.files?.[0] || null)}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation('/')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createOrderMutation.isPending}
              className="flex-1"
            >
              {createOrderMutation.isPending ? "Creating Order..." : "Create Mailing Order"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}