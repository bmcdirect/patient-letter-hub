import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, FileText, AlertTriangle, CheckCircle, Users, Lock, Database } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service - PatientLetterHub Legal Terms and Conditions",
  description: "Read PatientLetterHub's Terms of Service, including account use, data security, HIPAA compliance, billing, and service limitations for healthcare communications.",
  keywords: [
    "terms of service",
    "PatientLetterHub legal",
    "healthcare service terms",
    "HIPAA compliance terms",
    "data security terms",
    "business associate agreement",
    "healthcare vendor terms"
  ],
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-slate-100 py-20 lg:py-32">
        <div className="container mx-auto px-4 text-center">
          <div className="mx-auto max-w-4xl">
            <Badge variant="secondary" className="mb-6 bg-gray-100 text-gray-800 hover:bg-gray-100">
              <FileText className="mr-2 h-4 w-4" />
              Legal Information
            </Badge>
            
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Terms of{" "}
              <span className="text-gray-600">Service</span>
            </h1>
            
            <p className="mb-8 text-xl text-gray-600 lg:text-2xl">
              Important legal information about using PatientLetterHub
            </p>
          </div>
        </div>
      </section>

      {/* Legal Disclaimer */}
      <section className="py-16 bg-yellow-50 border-b border-yellow-200">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <div className="flex justify-center mb-4">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
            <h2 className="mb-4 text-2xl font-semibold text-yellow-800">
              Legal Disclaimer
            </h2>
            <p className="text-yellow-700">
              <strong>Important:</strong> This document contains legal terms and conditions. We recommend reviewing 
              these terms with your legal counsel, especially regarding healthcare compliance requirements. 
              These terms are effective as of {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.
            </p>
          </div>
        </div>
      </section>

      {/* Terms Overview */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-8 text-3xl font-bold text-gray-900 lg:text-4xl">
              Terms of Service
            </h2>
            
            <div className="mb-8 rounded-2xl bg-blue-50 p-8">
              <h3 className="mb-4 text-2xl font-semibold text-blue-900">
                Agreement to Terms
              </h3>
              <p className="text-lg text-blue-800 leading-relaxed">
                By using PatientLetterHub, you agree to be bound by these Terms of Service ("Terms"). 
                If you disagree with any part of these terms, you may not access or use our service. 
                These terms apply to all users of the service, including healthcare practices, providers, 
                and their authorized personnel.
              </p>
            </div>
            
            <p className="text-lg text-gray-600 leading-relaxed mb-8">
              These Terms of Service govern your use of PatientLetterHub, a HIPAA-compliant patient 
              communication platform operated by MASS Communications, Inc. ("Company," "we," "us," or "our").
            </p>
          </div>
        </div>
      </section>

      {/* Key Terms Sections */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-12 text-center text-3xl font-bold text-gray-900 lg:text-4xl">
              Key Terms and Conditions
            </h2>
            
            <div className="grid gap-8 md:grid-cols-2">
              <Card className="border-0 bg-white shadow-lg">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-blue-100 p-2">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <CardTitle className="text-xl">Account Use & Responsibility</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <span className="text-sm">You are responsible for maintaining the confidentiality of your login credentials</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <span className="text-sm">You must notify us immediately of any unauthorized access</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <span className="text-sm">You are responsible for all activities under your account</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <span className="text-sm">You must be authorized to use the service on behalf of your organization</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-0 bg-white shadow-lg">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-green-100 p-2">
                      <Shield className="h-5 w-5 text-green-600" />
                    </div>
                    <CardTitle className="text-xl">Data Security & HIPAA Compliance</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <span className="text-sm">All patient data must be uploaded through our secure platform</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <span className="text-sm">You may not transmit PHI by email or other unsecured methods</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <span className="text-sm">We maintain safeguards to comply with HIPAA requirements</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <span className="text-sm">You agree to use the platform in accordance with HIPAA standards</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-0 bg-white shadow-lg">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-purple-100 p-2">
                      <Database className="h-5 w-5 text-purple-600" />
                    </div>
                    <CardTitle className="text-xl">Data Management & Retention</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <span className="text-sm">We only retain data as required to fulfill your jobs</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <span className="text-sm">Audit trails are maintained for compliance reporting</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <span className="text-sm">You can request data deletion at any time</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <span className="text-sm">Data is isolated by tenant to prevent cross-access</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-0 bg-white shadow-lg">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-orange-100 p-2">
                      <Lock className="h-5 w-5 text-orange-600" />
                    </div>
                    <CardTitle className="text-xl">Billing & Service Terms</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <span className="text-sm">Services are billed per job or subscription plan</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <span className="text-sm">Payment terms are net 30 days from invoice date</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <span className="text-sm">Subscription plans auto-renew unless cancelled</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <span className="text-sm">Refunds are provided according to our refund policy</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Service Limitations */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-8 text-center text-3xl font-bold text-gray-900 lg:text-4xl">
              Service Limitations & Disclaimers
            </h2>
            
            <div className="mb-8 rounded-2xl bg-red-50 p-8">
              <h3 className="mb-4 text-2xl font-semibold text-red-900">
                Important Limitations
              </h3>
              <p className="text-lg text-red-800 leading-relaxed">
                While we take every measure to ensure compliance and accuracy, PatientLetterHub is not responsible 
                for inaccurate data submitted by customers. We provide the platform and services, but the accuracy 
                and completeness of patient information remains the responsibility of the healthcare practice.
              </p>
            </div>
            
            <div className="space-y-6">
              <div className="border-l-4 border-orange-400 pl-6">
                <h4 className="font-semibold text-gray-900 mb-2">Data Accuracy</h4>
                <p className="text-gray-600">
                  Customers are responsible for the accuracy and completeness of all patient data uploaded to the platform. 
                  We process and mail the information as provided, but cannot verify the accuracy of source data.
                </p>
              </div>
              
              <div className="border-l-4 border-blue-400 pl-6">
                <h4 className="font-semibold text-gray-900 mb-2">Service Availability</h4>
                <p className="text-gray-600">
                  While we strive for 99.9% uptime, we do not guarantee uninterrupted service. We are not liable for 
                  any damages resulting from service interruptions or technical issues.
                </p>
              </div>
              
              <div className="border-l-4 border-green-400 pl-6">
                <h4 className="font-semibold text-gray-900 mb-2">Third-Party Services</h4>
                <p className="text-gray-600">
                  Our service integrates with third-party providers (e.g., USPS for mailing). We are not responsible 
                  for delays or issues caused by these third-party services.
                </p>
              </div>
              
              <div className="border-l-4 border-purple-400 pl-6">
                <h4 className="font-semibold text-gray-900 mb-2">Compliance Verification</h4>
                <p className="text-gray-600">
                  While we maintain HIPAA compliance, customers are responsible for ensuring their use of the platform 
                  meets their specific compliance requirements and for maintaining their own compliance programs.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Business Associate Agreement */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="mb-8 text-3xl font-bold text-gray-900 lg:text-4xl">
              Business Associate Agreement
            </h2>
            
            <div className="mb-8 rounded-2xl bg-blue-50 p-8">
              <h3 className="mb-4 text-2xl font-semibold text-blue-900">
                HIPAA Business Associate
              </h3>
              <p className="text-lg text-blue-800 leading-relaxed">
                PatientLetterHub operates as a Business Associate under HIPAA regulations. We provide a standard 
                Business Associate Agreement (BAA) to all covered entities using our platform, which outlines 
                our responsibilities for protecting patient health information.
              </p>
            </div>
            
            <div className="mb-8 text-left">
              <h4 className="mb-4 text-xl font-semibold text-gray-900">BAA Key Provisions:</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    <span className="text-gray-700">Permitted uses and disclosures of PHI</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    <span className="text-gray-700">Safeguards for protecting PHI</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    <span className="text-gray-700">Breach notification requirements</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    <span className="text-gray-700">Subcontractor requirements</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    <span className="text-gray-700">Termination provisions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    <span className="text-gray-700">Compliance monitoring</span>
                  </div>
                </div>
              </div>
            </div>
            
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg">
              <FileText className="mr-2 h-5 w-5" />
              Download Sample BAA
            </Button>
          </div>
        </div>
      </section>

      {/* Termination & Changes */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-8 text-center text-3xl font-bold text-gray-900 lg:text-4xl">
              Termination & Changes to Terms
            </h2>
            
            <div className="grid gap-8 md:grid-cols-2">
              <Card className="border-0 bg-gray-50">
                <CardHeader>
                  <CardTitle className="text-xl">Termination</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Either party may terminate this agreement with 30 days written notice. Upon termination, 
                    we will cease processing new jobs and securely dispose of your data according to our 
                    data retention policies.
                  </p>
                  <p className="text-sm text-gray-600">
                    Outstanding invoices must be paid within 30 days of termination. We will provide 
                    a final data export if requested within 30 days of termination.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-0 bg-gray-50">
                <CardHeader>
                  <CardTitle className="text-xl">Changes to Terms</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-gray-600">
                    We may update these terms from time to time. Material changes will be communicated 
                    via email at least 30 days before they take effect.
                  </p>
                  <p className="text-sm text-gray-600">
                    Continued use of the service after changes become effective constitutes acceptance 
                    of the new terms. If you disagree with changes, you may terminate your account.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Legal */}
      <section className="py-20 bg-gradient-to-r from-gray-600 to-slate-700">
        <div className="container mx-auto px-4 text-center">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-4 text-3xl font-bold text-white lg:text-4xl">
              Questions About These Terms?
            </h2>
            <p className="mb-8 text-xl text-gray-200">
              Our legal team is here to help clarify any questions about our terms of service
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" className="bg-white text-gray-700 hover:bg-gray-100 px-8 py-3 text-lg">
                Contact Legal Team
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-gray-700 px-8 py-3 text-lg">
                Download Full Terms PDF
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Related Pages Navigation */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            <h3 className="mb-8 text-center text-2xl font-semibold text-gray-900">
              Related Legal Information
            </h3>
            <div className="grid gap-4 md:grid-cols-3">
              <Link href="/privacy">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-lg">Privacy Policy</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">How we protect and handle your data</p>
                  </CardContent>
                </Card>
              </Link>
              
              <Link href="/security">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-lg">Security & Compliance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">Our security measures and compliance</p>
                  </CardContent>
                </Card>
              </Link>
              
              <Link href="/contact">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-lg">Contact Us</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">Get in touch with our team</p>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
