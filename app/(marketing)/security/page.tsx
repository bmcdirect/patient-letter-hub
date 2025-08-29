import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Lock, Database, Server, Eye, FileText, CheckCircle, Award, Users, Globe, Zap } from "lucide-react";

export const metadata: Metadata = {
  title: "Security & Compliance - Enterprise-Grade Security for Healthcare Data | PatientLetterHub",
  description: "Learn about PatientLetterHub's enterprise-grade security measures, HIPAA compliance, and data protection protocols for healthcare communications.",
  keywords: [
    "HIPAA compliance",
    "healthcare data security",
    "PHI protection",
    "enterprise security",
    "data encryption",
    "audit logging",
    "business associate agreement",
    "healthcare compliance",
    "SOC 2 compliance",
    "data privacy"
  ],
};

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-50 to-emerald-100 py-20 lg:py-32">
        <div className="container mx-auto px-4 text-center">
          <div className="mx-auto max-w-4xl">
            <Badge variant="secondary" className="mb-6 bg-green-100 text-green-800 hover:bg-green-100">
              <Shield className="mr-2 h-4 w-4" />
              Enterprise-Grade Security
            </Badge>
            
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Enterprise-Grade Security for{" "}
              <span className="text-green-600">Healthcare Data</span>
            </h1>
            
            <p className="mb-8 text-xl text-gray-600 lg:text-2xl">
              Built from the ground up with HIPAA compliance and enterprise security standards
            </p>
          </div>
        </div>
      </section>

      {/* Security Overview */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="mb-8 text-3xl font-bold text-gray-900 lg:text-4xl">
              Security Built for Healthcare
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              PatientLetterHub is designed with healthcare security as our top priority. Every aspect of our platform 
              is built to protect patient health information (PHI) and maintain the highest standards of compliance.
            </p>
          </div>
        </div>
      </section>

      {/* Core Security Features */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-12 text-center text-3xl font-bold text-gray-900 lg:text-4xl">
              Core Security Features
            </h2>
            
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              <Card className="border-0 bg-white shadow-lg">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 rounded-full bg-blue-100 p-3">
                    <Lock className="h-8 w-8 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">Encryption</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-600">
                    All files encrypted in transit (TLS 1.2+) and at rest (AES-256)
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-0 bg-white shadow-lg">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 rounded-full bg-green-100 p-3">
                    <Users className="h-8 w-8 text-green-600" />
                  </div>
                  <CardTitle className="text-lg">Access Controls</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-600">
                    Role-based permissions ensure only authorized users access PHI
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-0 bg-white shadow-lg">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 rounded-full bg-purple-100 p-3">
                    <Eye className="h-8 w-8 text-purple-600" />
                  </div>
                  <CardTitle className="text-lg">Audit Logging</CardTitle>
                </CardHeader>
                <CardContent className="text-content">
                  <p className="text-gray-600">
                    Every action logged for compliance reporting and security monitoring
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-0 bg-white shadow-lg">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 rounded-full bg-orange-100 p-3">
                    <Server className="h-8 w-8 text-orange-600" />
                  </div>
                  <CardTitle className="text-lg">Infrastructure</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-600">
                    U.S.-based servers with SOC 2 and HIPAA-compliant providers
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* HIPAA Compliance */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-8 text-center text-3xl font-bold text-gray-900 lg:text-4xl">
              Committed to HIPAA Compliance
            </h2>
            
            <div className="mb-12 rounded-2xl bg-green-50 p-8">
              <h3 className="mb-4 text-2xl font-semibold text-green-900">
                HIPAA Compliance Built-In
              </h3>
              <p className="text-lg text-green-800 leading-relaxed">
                PatientLetterHub is built from the ground up with HIPAA compliance in mind. We understand the critical 
                importance of protecting patient health information and have implemented comprehensive safeguards 
                throughout our platform.
              </p>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Data Encryption</h4>
                    <p className="text-sm text-gray-600">All PHI encrypted in transit and at rest using industry-standard protocols</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Access Controls</h4>
                    <p className="text-sm text-gray-600">Role-based permissions ensure data is only available to authorized users</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Audit Trails</h4>
                    <p className="text-sm text-gray-600">Detailed logs support compliance audits and security monitoring</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Risk Assessments</h4>
                    <p className="text-sm text-gray-600">Regular security assessments and employee training maintain our security posture</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Business Associate Agreements</h4>
                    <p className="text-sm text-gray-600">We enter into BAAs with all customers to formalize our compliance commitment</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Data Isolation</h4>
                    <p className="text-sm text-gray-600">Jobs and PHI isolated by tenant to prevent cross-access</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technical Architecture */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-12 text-center text-3xl font-bold text-gray-900 lg:text-4xl">
              Built for Scale, Reliability, and Compliance
            </h2>
            
            <div className="grid gap-8 md:grid-cols-2">
              <Card className="border-0 bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl">Frontend Security</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Next.js 14 with responsive design</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Secure authentication via Clerk</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">CSRF protection and input validation</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-0 bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl">Backend Security</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Node.js with hardened security</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">PostgreSQL with encryption</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">API rate limiting and monitoring</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-0 bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl">Infrastructure</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">U.S.-based cloud infrastructure</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">SOC 2 Type II compliance</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Daily backups and failover support</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-0 bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl">Data Protection</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Tenant isolation and data segregation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">End-to-end encryption</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Comprehensive audit logging</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Business Associate Agreement */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="mb-8 text-3xl font-bold text-gray-900 lg:text-4xl">
              Business Associate Agreement (BAA)
            </h2>
            
            <div className="mb-8 rounded-2xl bg-blue-50 p-8">
              <h3 className="mb-4 text-2xl font-semibold text-blue-900">
                HIPAA Business Associate
              </h3>
              <p className="text-lg text-blue-800 leading-relaxed">
                As a healthcare communications provider, PatientLetterHub qualifies as a Business Associate under HIPAA. 
                We provide a standard Business Associate Agreement (BAA) to all covered entities using our platform.
              </p>
            </div>
            
            <div className="mb-8 text-left">
              <h4 className="mb-4 text-xl font-semibold text-gray-900">Our BAA outlines:</h4>
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
                    <span className="text-gray-700">Reporting obligations in event of breach</span>
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
                    <span className="text-gray-700">Compliance monitoring and reporting</span>
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

      {/* Compliance Certifications */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="mb-8 text-3xl font-bold text-gray-900 lg:text-4xl">
              Compliance & Certifications
            </h2>
            
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="border-0 bg-white shadow-lg">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 rounded-full bg-green-100 p-3">
                    <Shield className="h-8 w-8 text-green-600" />
                  </div>
                  <CardTitle className="text-lg">HIPAA Compliance</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-sm text-gray-600">
                    Full compliance with Health Insurance Portability and Accountability Act
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-0 bg-white shadow-lg">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 rounded-full bg-blue-100 p-3">
                    <Award className="h-8 w-8 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">SOC 2 Type II</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-sm text-gray-600">
                    Service Organization Control 2 Type II certification
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-0 bg-white shadow-lg">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 rounded-full bg-purple-100 p-3">
                    <Globe className="h-8 w-8 text-purple-600" />
                  </div>
                  <CardTitle className="text-lg">U.S. Based</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-sm text-gray-600">
                    All infrastructure and data processing within United States
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-emerald-700">
        <div className="container mx-auto px-4 text-center">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-4 text-3xl font-bold text-white lg:text-4xl">
              Trust Your Patient Data with Us
            </h2>
            <p className="mb-8 text-xl text-green-100">
              Join healthcare organizations that trust PatientLetterHub with their sensitive communications
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" className="bg-white text-green-600 hover:bg-gray-100 px-8 py-3 text-lg">
                Start Free Trial
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-green-600 px-8 py-3 text-lg">
                Schedule Security Review
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
              Learn More About Our Security
            </h3>
            <div className="grid gap-4 md:grid-cols-3">
              <Link href="/about">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-lg">About Us</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">Learn about our company and mission</p>
                  </CardContent>
                </Card>
              </Link>
              
              <Link href="/customers">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-lg">Customer Success</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">See how healthcare practices trust us</p>
                  </CardContent>
                </Card>
              </Link>
              
              <Link href="/contact">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-lg">Contact Security Team</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">Get answers to your security questions</p>
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
