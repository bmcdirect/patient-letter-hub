"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Save, User, Building, Shield, MapPin, Phone, Mail } from "lucide-react";
import { useUser } from "@clerk/nextjs";

// Form validation schema
const profileSchema = z.object({
  // Personal Information
  name: z.string().min(1, "Name is required"),
  title: z.string().min(1, "Professional title is required"),
  email: z.string().email("Please enter a valid email address"),
  
  // Professional Details
  taxonomyCode: z.string().min(1, "Taxonomy code is required"),
  npi1: z.string().min(1, "NPI-1 number is required"),
  npi2: z.string().optional(),
  
  // Practice Information
  practiceName: z.string().min(1, "Practice name is required"),
  practicePhone: z.string().min(10, "Please enter a valid phone number"),
  practiceEmail: z.string().email("Please enter a valid practice email"),
  
  // Address Information
  addressLine1: z.string().min(1, "Address line 1 is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(2, "State is required"),
  zipCode: z.string().min(5, "ZIP code is required"),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface UserData {
  id: string;
  name: string | null;
  title: string | null;
  email: string | null;
  practiceId: string | null;
  practice: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    addressLine1: string | null;
    addressLine2: string | null;
    city: string | null;
    state: string | null;
    zipCode: string | null;
  } | null;
  taxonomyCode: string | null;
  npi1: string | null;
  npi2: string | null;
}

export default function ProfilePage() {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      title: "",
      email: "",
      taxonomyCode: "",
      npi1: "",
      npi2: "",
      practiceName: "",
      practicePhone: "",
      practiceEmail: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      zipCode: "",
    },
  });

  // Fetch user data
  useEffect(() => {
    async function fetchUserData() {
      try {
        const response = await fetch("/api/user");
        if (response.ok) {
          const data = await response.json();
          setUserData(data.user);
          
          // Pre-fill form with existing data
          if (data.user) {
            form.reset({
              name: data.user.name || "",
              title: data.user.title || "",
              email: data.user.email || "",
              taxonomyCode: data.user.taxonomyCode || "",
              npi1: data.user.npi1 || "",
              npi2: data.user.npi2 || "",
              practiceName: data.user.practice?.name || "",
              practicePhone: data.user.practice?.phone || "",
              practiceEmail: data.user.practice?.email || "",
              addressLine1: data.user.practice?.addressLine1 || "",
              addressLine2: data.user.practice?.addressLine2 || "",
              city: data.user.practice?.city || "",
              state: data.user.practice?.state || "",
              zipCode: data.user.practice?.zipCode || "",
            });
          }
        } else {
          console.error("Failed to fetch user data");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    }

    if (clerkLoaded && clerkUser) {
      fetchUserData();
    }
  }, [clerkLoaded, clerkUser, form]);

  // Update form when Clerk user data changes
  useEffect(() => {
    if (clerkUser && !userData?.email) {
      form.setValue("email", clerkUser.emailAddresses[0]?.emailAddress || "");
      form.setValue("name", `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim());
    }
  }, [clerkUser, userData, form]);

  const onSubmit = async (data: ProfileFormData) => {
    setSaving(true);
    
    try {
      const requestBody = {
        userData: {
          name: data.name,
          title: data.title,
          taxonomyCode: data.taxonomyCode,
          npi1: data.npi1,
          npi2: data.npi2,
        },
        practiceData: {
          name: data.practiceName,
          phone: data.practicePhone,
          email: data.practiceEmail,
          addressLine1: data.addressLine1,
          addressLine2: data.addressLine2,
          city: data.city,
          state: data.state,
          zipCode: data.zipCode,
        },
      };

      console.log("🔍 Submitting profile data:", requestBody);

      const response = await fetch("/api/user", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      console.log("🔍 Response status:", response.status);
      console.log("🔍 Response ok:", response.ok);

      if (response.ok) {
        const result = await response.json();
        console.log("✅ Profile update successful:", result);
        setUserData(result.user);
        
        // Check if this was a new user completing their profile
        const wasNewUser = !userData?.practiceId;
        
        toast({
          title: wasNewUser ? "Profile Setup Complete!" : "Profile Updated",
          description: wasNewUser 
            ? "Welcome to PatientLetterHub! You're now ready to start sending patient letters."
            : "Your profile has been updated successfully!",
        });
        
        // Redirect new users to dashboard after profile completion
        if (wasNewUser) {
          setTimeout(() => {
            window.location.href = "/dashboard";
          }, 2000); // Give user 2 seconds to see the success message
        }
      } else {
        const errorText = await response.text();
        console.error("❌ Response error:", errorText);
        throw new Error(`Failed to update profile: ${response.status} ${errorText}`);
      }
    } catch (error) {
      console.error("❌ Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!clerkLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!clerkUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p>Please sign in to access your profile.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const isNewUser = !userData?.practiceId;

  return (
    <main className="flex-1 p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        {isNewUser ? (
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <User className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold mb-2 text-blue-900">Welcome to PatientLetterHub!</h1>
            <p className="text-lg text-blue-700 mb-4">
              Let's get your profile set up so you can start sending HIPAA-compliant patient letters
            </p>
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
              <Shield className="h-4 w-4" />
              Complete Your Profile
            </div>
          </div>
        ) : (
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Profile Management</h1>
            <p className="text-muted-foreground">
              Update your profile information and practice details
            </p>
          </div>
        )}
      </div>

      {isNewUser && (
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <Shield className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">What happens next?</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Your practice information will be securely stored</li>
                  <li>• You'll be redirected to your dashboard</li>
                  <li>• Start creating your first HIPAA-compliant patient letter order</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
              <FormDescription>
                Your personal and professional details
              </FormDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Dr. John Smith" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Professional Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Dentist, Physician, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="john@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Professional Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Professional Details
              </CardTitle>
              <FormDescription>
                Your professional credentials and identification numbers
              </FormDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="taxonomyCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Taxonomy Code</FormLabel>
                      <FormControl>
                        <Input placeholder="207Q00000X" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="npi1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>NPI-1 Number</FormLabel>
                      <FormControl>
                        <Input placeholder="1234567890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="npi2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>NPI-2 Number (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="0987654321" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Practice Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Practice Information
              </CardTitle>
              <FormDescription>
                Details about your medical practice or organization
              </FormDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="practiceName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Practice Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Bright Smiles Dental" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="practicePhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Practice Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="(555) 123-4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="practiceEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Practice Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="info@practice.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Practice Address
              </CardTitle>
              <FormDescription>
                The physical address of your practice
              </FormDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="addressLine1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address Line 1</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Main Street, Suite 100" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="addressLine2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address Line 2 (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Building, Floor, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="Riverside" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Input placeholder="CA" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="zipCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ZIP Code</FormLabel>
                        <FormControl>
                          <Input placeholder="92501" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex flex-col items-center gap-4">
            {isNewUser && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  After completing your profile, you'll be redirected to your dashboard
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${form.formState.isValid ? '100' : '50'}%` }}></div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{form.formState.isValid ? '100% Complete' : '50% Complete'}</p>
              </div>
            )}
            
            <Button 
              type="submit" 
              disabled={saving}
              className="min-w-[160px]"
              size="lg"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {isNewUser ? "Complete Setup & Continue" : "Update Profile"}
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </main>
  );
} 