import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Lock, Eye, Users, Database, Globe, CheckCircle, AlertTriangle, Award, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy - PatientLetterHub Data Protection & Privacy Practices",
  description: "Learn how PatientLetterHub protects your privacy and handles data in compliance with HIPAA, GDPR, and industry standards for healthcare communications.",
  keywords: [
    "privacy policy",
    "data protection",
    "HIPAA privacy",
    "healthcare data privacy",
    "GDPR compliance",
    "patient data protection",
    "data security privacy"
  ],
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-50 to-indigo-100 py-20 lg:py-32">
        <div className="container mx-auto px-4 text-center">
          <div className="mx-auto max-w-4xl">
            <Badge variant="secondary" className="mb-6 bg-purple-100 text-purple-800 hover:bg-purple-100">
              <Shield className="mr-2 h-4 w-4" />
              Data Protection
            </Badge>
            
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Privacy{" "}
              <span className="text-purple-600">Policy</span>
            </h1>
            
            <p className="mb-8 text-xl text-gray-600 lg:text-2xl">
              How we protect your privacy and handle your data
            </p>
          </div>
        </div>
      </section>

      {/* Privacy Overview */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-8 text-3xl font-bold text-gray-900 lg:text-4xl">
              Our Commitment to Privacy
            </h2>
            
            <div className="mb-8 rounded-2xl bg-purple-50 p-8">
              <h3 className="mb-4 text-2xl font-semibold text-purple-900">
                PatientLetterHub respects your privacy and protects your data.
              </h3>
              <p className="text-lg text-purple-800 leading-relaxed">
                We are committed to protecting the privacy and security of all information entrusted to us. 
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
                when you use our platform.
              </p>
            </div>
            
            <p className="text-lg text-gray-600 leading-relaxed mb-8">
              This Privacy Policy applies to PatientLetterHub, operated by MASS Communications, Inc. 
              ("Company," "we," "us," or "our"). We are committed to maintaining the privacy and security 
              of your information in accordance with applicable laws and regulations, including HIPAA, GDPR, 
              and other privacy standards.
            </p>
          </div>
        </div>
      </section>

      {/* Key Privacy Principles */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-12 text-center text-3xl font-bold text-gray-900 lg:text-4xl">
              Our Privacy Principles
            </h2>
            
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              <Card className="border-0 bg-white shadow-lg">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 rounded-full bg-red-100 p-3">
                    <Lock className="h-8 w-8 text-red-600" />
                  </div>
                  <CardTitle className="text-lg">No Data Sales</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-600">
                    We never sell or share your practice or patient information with third parties
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-0 bg-white shadow-lg">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 rounded-full bg-blue-100 p-3">
                    <Shield className="h-8 w-8 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">End-to-End Encryption</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-600">
                    All data is encrypted in transit and at rest using industry-standard protocols
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-0 bg-white shadow-lg">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 rounded-full bg-green-100 p-3">
                    <Database className="h-8 w-8 text-green-600" />
                  </div>
                  <CardTitle className="text-lg">Minimal Retention</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-600">
                    We only retain data as required to fulfill your jobs and maintain audit trails
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-0 bg-white shadow-lg">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 rounded-full bg-purple-100 p-3">
                    <Users className="h-8 w-8 text-purple-600" />
                  </div>
                  <CardTitle className="text-lg">User Control</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-600">
                    You can request deletion of your data at any time
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Information We Collect */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-8 text-3xl font-bold text-gray-900 lg:text-4xl">
              Information We Collect
            </h2>
            
            <div className="space-y-8">
              <Card className="border-0 bg-blue-50">
                <CardHeader>
                  <CardTitle className="text-xl text-blue-900">Account Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-blue-800 mb-4">
                    When you create an account, we collect:
                  </p>
                  <ul className="space-y-2 text-blue-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                      <span>Name, email address, and contact information</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                      <span>Practice or organization details</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                      <span>Authentication credentials (managed securely)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                      <span>Billing and payment information</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card className="border-0 bg-green-50">
                <CardHeader>
                  <CardTitle className="text-xl text-green-900">Patient Health Information (PHI)</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-green-800 mb-4">
                    To provide our services, we may process:
                  </p>
                  <ul className="space-y-2 text-green-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>Patient names and contact information</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>Medical practice information</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>Communication content and templates</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>Mailing addresses and delivery information</span>
                    </li>
                  </ul>
                  <div className="mt-4 p-3 bg-green-100 rounded-lg">
                    <p className="text-sm text-green-800">
                      <strong>Important:</strong> All PHI is handled in strict compliance with HIPAA regulations 
                      and our Business Associate Agreement (BAA).
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-0 bg-purple-50">
                <CardHeader>
                  <CardTitle className="text-xl text-purple-900">Usage and Technical Data</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-purple-800 mb-4">
                    We automatically collect certain technical information:
                  </p>
                  <ul className="space-y-2 text-purple-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-purple-600 mt-0.5" />
                      <span>Log files and system performance data</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-purple-600 mt-0.5" />
                      <span>Platform usage statistics and analytics</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-purple-600 mt-0.5" />
                      <span>Security and audit logs for compliance</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-purple-600 mt-0.5" />
                      <span>Error reports and system diagnostics</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* How We Use Information */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-8 text-3xl font-bold text-gray-900 lg:text-4xl">
              How We Use Your Information
            </h2>
            
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900">Primary Service Delivery</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Process patient communications</p>
                      <p className="text-sm text-gray-600">Generate and mail patient letters according to your specifications</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Manage your account</p>
                      <p className="text-sm text-gray-600">Provide access to our platform and manage billing</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Customer support</p>
                      <p className="text-sm text-gray-600">Respond to your questions and provide assistance</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900">Security & Compliance</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Maintain security</p>
                      <p className="text-sm text-gray-600">Protect against fraud, abuse, and security threats</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Compliance monitoring</p>
                      <p className="text-sm text-gray-600">Ensure HIPAA compliance and maintain audit trails</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Legal obligations</p>
                      <p className="text-sm text-gray-600">Meet regulatory requirements and respond to legal requests</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-8 rounded-2xl bg-yellow-50 p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-6 w-6 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-yellow-800 mb-2">We Never:</h4>
                  <ul className="space-y-1 text-yellow-700">
                    <li>• Sell your data to third parties</li>
                    <li>• Use your data for marketing without consent</li>
                    <li>• Share patient information with unauthorized parties</li>
                    <li>• Use your data for purposes unrelated to service delivery</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Data Protection & Security */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-8 text-3xl font-bold text-gray-900 lg:text-4xl">
              Data Protection & Security
            </h2>
            
            <div className="space-y-6">
              <Card className="border-0 bg-gray-50">
                <CardHeader>
                  <CardTitle className="text-xl">Encryption & Security</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    We implement industry-standard security measures to protect your data:
                  </p>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• <strong>TLS 1.2+ encryption</strong> for all data in transit</li>
                    <li>• <strong>AES-256 encryption</strong> for data at rest</li>
                    <li>• <strong>Multi-factor authentication</strong> for account access</li>
                    <li>• <strong>Regular security audits</strong> and penetration testing</li>
                    <li>• <strong>Role-based access controls</strong> to limit data exposure</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card className="border-0 bg-gray-50">
                <CardHeader>
                  <CardTitle className="text-xl">Data Retention & Deletion</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Our data retention practices are designed to balance service delivery with privacy:
                  </p>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• <strong>Active jobs:</strong> Data retained until job completion + 30 days</li>
                    <li>• <strong>Audit trails:</strong> Retained for 7 years for compliance purposes</li>
                    <li>• <strong>Account data:</strong> Retained while account is active</li>
                    <li>• <strong>Data deletion:</strong> Available upon request within 30 days</li>
                    <li>• <strong>Secure disposal:</strong> All deleted data is permanently erased</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card className="border-0 bg-gray-50">
                <CardHeader>
                  <CardTitle className="text-xl">Third-Party Services</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    We use carefully selected third-party services that meet our security standards:
                  </p>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• <strong>Cloud infrastructure:</strong> SOC 2 and HIPAA-compliant providers</li>
                    <li>• <strong>Payment processing:</strong> PCI DSS compliant payment gateways</li>
                    <li>• <strong>Email services:</strong> Secure, encrypted communication</li>
                    <li>• <strong>All vendors:</strong> Subject to our security requirements and BAAs</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Your Privacy Rights */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-8 text-3xl font-bold text-gray-900 lg:text-4xl">
              Your Privacy Rights
            </h2>
            
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-0 bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">Access & Portability</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    You have the right to access your personal information and request a copy of your data 
                    in a portable format. We will respond to such requests within 30 days.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-0 bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">Correction & Updates</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    You can update or correct your account information at any time through your account 
                    settings or by contacting our support team.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-0 bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">Data Deletion</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    You can request deletion of your account and associated data. We will process 
                    deletion requests within 30 days, subject to legal retention requirements.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-0 bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">Opt-Out Rights</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    You can opt out of non-essential communications and marketing emails. 
                    Service-related communications cannot be opted out of.
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <div className="mt-8 text-center">
              <p className="text-gray-600 mb-4">
                To exercise any of these rights, please contact us at:
              </p>
              <Button variant="outline" className="border-purple-600 text-purple-600 hover:bg-purple-50">
                <Mail className="mr-2 h-4 w-4" />
                privacy@patientletterhub.com
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Compliance Standards */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="mb-8 text-3xl font-bold text-gray-900 lg:text-4xl">
              Compliance with Privacy Standards
            </h2>
            
            <div className="mb-8 rounded-2xl bg-green-50 p-8">
              <h3 className="mb-4 text-2xl font-semibold text-green-900">
                Our privacy practices are designed to align with:
              </h3>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="text-center">
                  <div className="mx-auto mb-4 rounded-full bg-green-100 p-3">
                    <Shield className="h-8 w-8 text-green-600" />
                  </div>
                  <h4 className="font-semibold text-green-900">HIPAA</h4>
                  <p className="text-sm text-green-700">Health Insurance Portability and Accountability Act</p>
                </div>
                <div className="text-center">
                  <div className="mx-auto mb-4 rounded-full bg-blue-100 p-3">
                    <Globe className="h-8 w-8 text-blue-600" />
                  </div>
                  <h4 className="font-semibold text-blue-900">GDPR</h4>
                  <p className="text-sm text-blue-700">General Data Protection Regulation (EU)</p>
                </div>
                <div className="text-center">
                  <div className="mx-auto mb-4 rounded-full bg-purple-100 p-3">
                    <Award className="h-8 w-8 text-purple-600" />
                  </div>
                  <h4 className="font-semibold text-purple-900">Industry Standards</h4>
                  <p className="text-sm text-purple-700">Best practices for healthcare data protection</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact & Updates */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-indigo-700">
        <div className="container mx-auto px-4 text-center">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-4 text-3xl font-bold text-white lg:text-4xl">
              Questions About Privacy?
            </h2>
            <p className="mb-8 text-xl text-purple-100">
              Our privacy team is here to help with any questions about data protection
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-3 text-lg">
                Contact Privacy Team
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-purple-600 px-8 py-3 text-lg">
                Download Privacy Policy PDF
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
              Related Information
            </h3>
            <div className="grid gap-4 md:grid-cols-3">
              <Link href="/terms">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-lg">Terms of Service</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">Legal terms and conditions</p>
                  </CardContent>
                </Card>
              </Link>
              
              <Link href="/security">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-lg">Security & Compliance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">Our security measures</p>
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
