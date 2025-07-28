import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, LogIn, Building2, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useQuery } from '@tanstack/react-query';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function SimpleLogin() {
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [, navigate] = useLocation();
  const [selectedPractice, setSelectedPractice] = useState<string>('');

  const { data: practices } = useQuery({
    queryKey: ['/api/auth/practices'],
    queryFn: async () => {
      const response = await fetch('/api/auth/practices');
      if (!response.ok) throw new Error('Failed to fetch practices');
      return response.json();
    },
  });

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/auth/login', data);
      const result = await response.json();

      // Invalidate and refetch user data
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      await queryClient.refetchQueries({ queryKey: ["/api/auth/user"] });

      toast({
        title: "Login successful",
        description: `Welcome to ${result.user.practiceName}`,
      });

      navigate("/dashboard");
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login failed",
        description: "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (email: string) => {
    form.setValue('email', email);
    form.setValue('password', 'password123');
    form.handleSubmit(handleLogin)();
  };

  const practiceAccounts = [
    { 
      name: 'Riverside Family Medicine',
      accounts: ['admin@riversidefamilymed.com', 'staff1@riversidefamilymed.com']
    },
    { 
      name: 'Bright Smiles Dental',
      accounts: ['admin@brightsmilesdental.com', 'staff1@brightsmilesdental.com']
    },
    { 
      name: 'Golden State Veterinary',
      accounts: ['admin@goldenstatevet.com', 'staff1@goldenstatevet.com']
    },
    { 
      name: 'Pacific Physical Therapy',
      accounts: ['admin@pacificpt.com', 'staff1@pacificpt.com']
    },
    { 
      name: 'Redwood Pediatrics',
      accounts: ['admin@redwoodpediatrics.com', 'staff1@redwoodpediatrics.com']
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Building2 className="h-12 w-12 text-blue-600" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          PatientLetterHub
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Multi-Tenant Healthcare Communication Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-center">Sign In</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <form className="space-y-4" onSubmit={form.handleSubmit(handleLogin)}>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...form.register("email")}
                  className="mt-1"
                />
                {form.formState.errors.email && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative mt-1">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    {...form.register("password")}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {form.formState.errors.password && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Test Accounts</span>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {practiceAccounts.map((practice) => (
                  <div key={practice.name} className="border rounded-lg p-3">
                    <h4 className="font-medium text-sm text-gray-900 mb-2">{practice.name}</h4>
                    <div className="space-y-1">
                      {practice.accounts.map((email) => (
                        <button
                          key={email}
                          onClick={() => handleQuickLogin(email)}
                          className="w-full text-left text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded"
                        >
                          {email} • password123
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This is a multi-tenant demo system. Each practice has separate data and users.
                Click any test account above to login instantly.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}