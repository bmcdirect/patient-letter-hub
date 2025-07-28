import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, LogIn, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function OperationsLogin() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("admin@admin.com");
  const [password, setPassword] = useState("admin");
  const [error, setError] = useState("");

  // Operations login mutation
  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const response = await apiRequest("POST", "/api/operations/auth/login", { email, password });
      return response.json();
    },
    onSuccess: (data) => {
      // Redirect to operations dashboard
      setLocation("/admin/dashboard");
    },
    onError: (error: any) => {
      setError(error.message || "Login failed. Please check your credentials.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    loginMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-primary-600 p-3 rounded-full">
              <Shield className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Operations Portal</h1>
          <p className="text-gray-600">PatientLetterHub Operations Dashboard</p>
        </div>

        {/* Login Card */}
        <Card className="shadow-lg border-0">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Operations Sign In</CardTitle>
            <CardDescription className="text-center">
              Enter your operations credentials to access the dashboard
              <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-700">
                Pre-filled with: admin@admin.com / admin
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operations@patientletterhub.com"
                  required
                  disabled={loginMutation.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  disabled={loginMutation.isPending}
                />
              </div>

              <div className="space-y-3">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    <>
                      <LogIn className="h-4 w-4 mr-2" />
                      Sign In to Operations
                    </>
                  )}
                </Button>
                
                <Button 
                  type="button"
                  variant="outline"
                  className="w-full border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700"
                  onClick={() => {
                    setEmail("admin@admin.com");
                    setPassword("admin");
                    loginMutation.mutate({ email: "admin@admin.com", password: "admin" });
                  }}
                  disabled={loginMutation.isPending}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Quick Admin Login
                </Button>
              </div>
            </form>

            {/* Demo Credentials */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Demo Credentials:</h3>
              <div className="text-xs text-gray-600 space-y-1">
                <div>
                  <strong>Operations Admin:</strong><br />
                  Email: operations@patientletterhub.com<br />
                  Password: operations123
                </div>
                <div className="mt-2">
                  <strong>Operations Staff:</strong><br />
                  Email: staff@patientletterhub.com<br />
                  Password: staff123
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-500">
          <p>Operations staff only • Secure access required</p>
        </div>
      </div>
    </div>
  );
}