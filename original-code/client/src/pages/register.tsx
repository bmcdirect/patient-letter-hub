import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Building, Mail, User, Lock, Eye, EyeOff, Phone, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

const registerSchema = z.object({
  // Personal Information
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  
  // Practice Information
  practiceName: z.string().min(1, 'Practice name is required'),
  practiceEmail: z.string().email('Please enter a valid practice email'),
  practicePhone: z.string().min(10, 'Please enter a valid phone number'),
  practiceAddress: z.string().min(1, 'Practice address is required'),
  practiceCity: z.string().min(1, 'City is required'),
  practiceState: z.string().min(2, 'State is required'),
  practiceZip: z.string().min(5, 'ZIP code is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function Register() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      practiceName: '',
      practiceEmail: '',
      practicePhone: '',
      practiceAddress: '',
      practiceCity: '',
      practiceState: '',
      practiceZip: '',
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormData) => {
      const response = await apiRequest('POST', '/api/auth/register', data);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Account created successfully!',
        description: 'Welcome to PatientLetterHub. You can now start managing your practice communications.',
      });
      setLocation('/dashboard');
    },
    onError: (error: any) => {
      toast({
        title: 'Registration failed',
        description: error.message || 'Failed to create account. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: RegisterFormData) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Create Your Practice Account
          </h1>
          <p className="text-gray-600 text-lg">
            Join thousands of healthcare practices using PatientLetterHub
          </p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl text-center">Get Started Today</CardTitle>
            <CardDescription className="text-center text-base">
              Set up your practice account and start sending professional patient communications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Personal Information Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <User className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Your Information</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      {...form.register('firstName')}
                      className="h-11"
                      spellCheck="true"
                    />
                    {form.formState.errors.firstName && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {form.formState.errors.firstName.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      {...form.register('lastName')}
                      className="h-11"
                      spellCheck="true"
                    />
                    {form.formState.errors.lastName && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {form.formState.errors.lastName.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Your Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      {...form.register('email')}
                      className="h-11 pl-10"
                      placeholder="you@yourpractice.com"
                    />
                  </div>
                  {form.formState.errors.email && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        {...form.register('password')}
                        className="h-11 pl-10 pr-10"
                        placeholder="Min. 8 characters"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {form.formState.errors.password && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {form.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        {...form.register('confirmPassword')}
                        className="h-11 pl-10 pr-10"
                        placeholder="Confirm password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {form.formState.errors.confirmPassword && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {form.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Practice Information Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <Building className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Practice Information</h3>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="practiceName">Practice Name</Label>
                  <Input
                    id="practiceName"
                    {...form.register('practiceName')}
                    className="h-11"
                    placeholder="Your Practice Name"
                    spellCheck="true"
                  />
                  {form.formState.errors.practiceName && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {form.formState.errors.practiceName.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="practiceEmail">Practice Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="practiceEmail"
                        type="email"
                        {...form.register('practiceEmail')}
                        className="h-11 pl-10"
                        placeholder="info@yourpractice.com"
                      />
                    </div>
                    {form.formState.errors.practiceEmail && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {form.formState.errors.practiceEmail.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="practicePhone">Practice Phone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="practicePhone"
                        type="tel"
                        {...form.register('practicePhone')}
                        className="h-11 pl-10"
                        placeholder="(555) 123-4567"
                      />
                    </div>
                    {form.formState.errors.practicePhone && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {form.formState.errors.practicePhone.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="practiceAddress">Practice Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="practiceAddress"
                      {...form.register('practiceAddress')}
                      className="h-11 pl-10"
                      placeholder="123 Main Street"
                      spellCheck="true"
                    />
                  </div>
                  {form.formState.errors.practiceAddress && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {form.formState.errors.practiceAddress.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="practiceCity">City</Label>
                    <Input
                      id="practiceCity"
                      {...form.register('practiceCity')}
                      className="h-11"
                      placeholder="City"
                      spellCheck="true"
                    />
                    {form.formState.errors.practiceCity && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {form.formState.errors.practiceCity.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="practiceState">State</Label>
                    <Input
                      id="practiceState"
                      {...form.register('practiceState')}
                      className="h-11"
                      placeholder="CA"
                      spellCheck="true"
                    />
                    {form.formState.errors.practiceState && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {form.formState.errors.practiceState.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="practiceZip">ZIP Code</Label>
                    <Input
                      id="practiceZip"
                      {...form.register('practiceZip')}
                      className="h-11"
                      placeholder="12345"
                    />
                    {form.formState.errors.practiceZip && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {form.formState.errors.practiceZip.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <Button
                  type="submit"
                  className="w-full h-12 text-lg font-semibold"
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? (
                    'Creating Your Account...'
                  ) : (
                    'Create Practice Account'
                  )}
                </Button>

                <div className="text-center">
                  <p className="text-gray-600">
                    Already have an account?{' '}
                    <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                      Sign in here
                    </Link>
                  </p>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>By creating an account, you agree to our Terms of Service and Privacy Policy</p>
        </div>
      </div>
    </div>
  );
}