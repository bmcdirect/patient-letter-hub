import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail } from "lucide-react";

export default function Login() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-soft-grey flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Mail className="h-8 w-8 text-primary-blue" />
            <h1 className="text-2xl font-bold text-dark-navy">PatientLetterHub</h1>
          </div>
          <p className="text-gray-600">Healthcare Communication Platform</p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Access your patient communication dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleLogin}
              className="w-full bg-primary-blue hover:bg-blue-800"
              size="lg"
            >
              Sign In with Replit
            </Button>
            
            <div className="mt-6 text-center text-sm text-gray-600">
              <p>New to PatientLetterHub?</p>
              <p>Your account will be created automatically on first sign-in.</p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-xs text-gray-500">
          <p>By signing in, you agree to our Terms of Service and Privacy Policy</p>
        </div>
      </div>
    </div>
  );
}