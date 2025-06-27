import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, FileText, Mail, Shield, Users, Zap } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-primary-blue text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Mail className="h-8 w-8" />
              <h1 className="text-xl font-bold">PatientLetterHub</h1>
            </div>
            <Button 
              onClick={handleLogin}
              variant="secondary"
              className="bg-white text-primary-blue hover:bg-gray-100"
            >
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-dark-navy mb-6">
            Healthcare Communication Made Simple
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Generate, print, and mail patient notification letters with complete compliance. 
            Streamline your practice communications with our low-friction SaaS platform.
          </p>
          <Button 
            onClick={handleLogin}
            size="lg"
            className="bg-primary-blue hover:bg-blue-800 text-white px-8 py-4 text-lg"
          >
            Get Started Free
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-soft-grey">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-dark-navy mb-4">
              Everything You Need for Patient Communications
            </h3>
            <p className="text-lg text-gray-600">
              From custom letter creation to automated mailing, we handle it all.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <FileText className="h-10 w-10 text-teal-accent mb-2" />
                <CardTitle>Custom Letters</CardTitle>
                <CardDescription>
                  Upload your own content and customize every aspect of your mailings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Upload custom letter content</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Personalized branding options</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Flexible formatting & design</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-10 w-10 text-primary-blue mb-2" />
                <CardTitle>Complete Compliance</CardTitle>
                <CardDescription>
                  Built-in compliance features and audit trails
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>HIPAA-compliant processing</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Certified mail options</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Delivery tracking & proof</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Zap className="h-10 w-10 text-alert-orange mb-2" />
                <CardTitle>Automated Processing</CardTitle>
                <CardDescription>
                  From upload to mailbox in hours, not days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Address validation & NCOA</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Automated postage calculation</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Professional print & mail</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl font-bold text-dark-navy mb-6">
            Ready to Streamline Your Patient Communications?
          </h3>
          <p className="text-lg text-gray-600 mb-8">
            Join hundreds of healthcare practices using PatientLetterHub
          </p>
          <Button 
            onClick={handleLogin}
            size="lg"
            className="bg-teal-accent hover:bg-teal-600 text-white px-8 py-4 text-lg"
          >
            Start Your Free Trial
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-dark-navy text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Mail className="h-6 w-6" />
            <span className="text-lg font-semibold">PatientLetterHub</span>
          </div>
          <p className="text-gray-300">
            © 2024 PatientLetterHub. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
