import { Link } from "wouter";
import { Shield, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AccessDenied() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Icon */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-red-100 p-4 rounded-full">
              <Shield className="h-12 w-12 text-red-600" />
            </div>
          </div>
        </div>

        {/* Access Denied Card */}
        <Card className="shadow-lg border-red-200">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-red-700">Access Denied</CardTitle>
            <CardDescription className="text-gray-600">
              You don't have permission to access this area
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-700">
              This section is restricted to PatientLetterHub operations staff only. 
              Customer accounts cannot access administrative functions.
            </p>

            <div className="space-y-3">
              <Button asChild className="w-full">
                <Link href="/">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Return to Dashboard
                </Link>
              </Button>

              <div className="text-sm text-gray-500">
                <p>Need operations access?</p>
                <Link 
                  href="/operations/login" 
                  className="text-primary-600 hover:text-primary-700 underline"
                >
                  Operations Staff Login
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}