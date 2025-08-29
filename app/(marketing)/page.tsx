import Link from "next/link";
import { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, FileText, CheckCircle, Truck, Upload, Eye, Mail, Users, Award, Lock, Database, Clock, DollarSign } from "lucide-react";

export const metadata: Metadata = {
  title: "PatientLetterHub - HIPAA-Compliant Patient Communications, Simplified",
  description: "Send patient notifications, provider updates, and compliance letters in minutes — not days. HIPAA-compliant, secure, and affordable patient communication platform.",
  keywords: [
    "HIPAA compliant patient letters",
    "patient communication platform",
    "healthcare compliance letters",
    "patient notifications",
    "medical practice communications",
    "HIPAA secure mailing",
    "patient letter automation",
    "healthcare address hygiene",
    "NCOA updates",
    "patient letter templates"
  ],
  openGraph: {
    title: "PatientLetterHub - HIPAA-Compliant Patient Communications",
    description: "Send patient notifications in minutes — not days. Secure, compliant, and affordable.",
    type: "website",
  },
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 py-20 lg:py-32">
        <div className="container mx-auto px-4 text-center">
          <div className="mx-auto max-w-4xl">
            <Badge variant="secondary" className="mb-6 bg-blue-100 text-blue-800 hover:bg-blue-100">
              <Shield className="mr-2 h-4 w-4" />
              HIPAA Compliant & Secure
            </Badge>
            
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              HIPAA-Compliant Patient Communications,{" "}
              <span className="text-blue-600">Simplified</span>
            </h1>
            
            <p className="mb-8 text-xl text-gray-600 lg:text-2xl">
              Send patient notifications, provider updates, and compliance letters in minutes — not days.
            </p>
            
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link href="/sign-up">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg">
                  Get Started Free
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-3 text-lg">
                Request a Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Problem → Solution Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="mb-8 text-3xl font-bold text-gray-900 lg:text-4xl">
              Tired of manual letters slowing your practice down?
            </h2>
            
            <div className="mb-12 grid gap-6 md:grid-cols-3">
              <div className="flex flex-col items-center">
                <div className="mb-4 rounded-full bg-red-100 p-3">
                  <Clock className="h-8 w-8 text-red-600" />
                </div>
                <p className="text-gray-700">Staff spending hours on mail merges</p>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="mb-4 rounded-full bg-red-100 p-3">
                  <Shield className="h-8 w-8 text-red-600" />
                </div>
                <p className="text-gray-700">High risk of HIPAA violations from human error</p>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="mb-4 rounded-full bg-red-100 p-3">
                  <Users className="h-8 w-8 text-red-600" />
                </div>
                <p className="text-gray-700">Delays that frustrate patients and providers</p>
              </div>
            </div>
            
            <div className="rounded-2xl bg-blue-50 p-8">
              <h3 className="mb-4 text-2xl font-semibold text-blue-900">
                PatientLetterHub fixes all of that.
              </h3>
              <p className="text-lg text-blue-800">
                Upload your patient list, select a template, approve your proof — we handle the mailing.
                <br />
                Every job is secure, tracked, and compliant.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Overview Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-12 text-center text-3xl font-bold text-gray-900 lg:text-4xl">
              Everything you need for compliant patient communications
            </h2>
            
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              <Card className="border-0 bg-white shadow-lg">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 rounded-full bg-green-100 p-3">
                    <Shield className="h-8 w-8 text-green-600" />
                  </div>
                  <CardTitle className="text-lg">HIPAA-Compliant & Secure</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-600">End-to-end encryption and safeguards you can trust.</p>
                </CardContent>
              </Card>
              
              <Card className="border-0 bg-white shadow-lg">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 rounded-full bg-blue-100 p-3">
                    <Database className="h-8 w-8 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">Built-In Address Hygiene</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-600">Automatic NCOA updates keep your patient lists accurate.</p>
                </CardContent>
              </Card>
              
              <Card className="border-0 bg-white shadow-lg">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 rounded-full bg-purple-100 p-3">
                    <Eye className="h-8 w-8 text-purple-600" />
                  </div>
                  <CardTitle className="text-lg">Simple Approvals & Proofs</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-600">Review, edit, and sign off in just a few clicks.</p>
                </CardContent>
              </Card>
              
              <Card className="border-0 bg-white shadow-lg">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 rounded-full bg-orange-100 p-3">
                    <Truck className="h-8 w-8 text-orange-600" />
                  </div>
                  <CardTitle className="text-lg">Fast, Affordable Mailing</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-600">Letters are printed, stuffed, and mailed within days.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-12 text-center text-3xl font-bold text-gray-900 lg:text-4xl">
              How It Works
            </h2>
            
            <div className="grid gap-8 md:grid-cols-3">
              <div className="text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
                  <Upload className="h-10 w-10 text-blue-600" />
                </div>
                <h3 className="mb-3 text-xl font-semibold text-gray-900">Step 1: Upload</h3>
                <p className="text-gray-600">Upload your patient list (CSV, Excel, or EMR export)</p>
              </div>
              
              <div className="text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                  <Eye className="h-10 w-10 text-green-600" />
                </div>
                <h3 className="mb-3 text-xl font-semibold text-gray-900">Step 2: Approve</h3>
                <p className="text-gray-600">Approve your letter and digital proof</p>
              </div>
              
              <div className="text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-orange-100">
                  <Mail className="h-10 w-10 text-orange-600" />
                </div>
                <h3 className="mb-3 text-xl font-semibold text-gray-900">Step 3: Mail</h3>
                <p className="text-gray-600">We print, insert, and deliver via USPS</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Social Proof Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-8 flex justify-center">
              <Badge variant="outline" className="border-green-200 bg-green-50 text-green-800 px-4 py-2">
                <Award className="mr-2 h-4 w-4" />
                Trusted by Healthcare Organizations
              </Badge>
            </div>
            
            <h2 className="mb-6 text-2xl font-semibold text-gray-900 lg:text-3xl">
              Trusted by healthcare organizations and provider groups, including leading practices in Massachusetts.
            </h2>
            
            <div className="mx-auto max-w-2xl rounded-lg bg-white p-8 shadow-sm">
              <div className="mb-4 flex justify-center">
                <div className="rounded-full bg-blue-100 p-3">
                  <Shield className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <p className="text-lg text-gray-700 italic">
                "PatientLetterHub has transformed how we communicate with our patients. The HIPAA compliance and address hygiene features give us peace of mind."
              </p>
              <p className="mt-4 text-sm text-gray-500">— Healthcare Practice Manager, Massachusetts</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="mb-8 text-3xl font-bold text-gray-900 lg:text-4xl">
              Simple, Transparent Pricing
            </h2>
            
            <div className="mb-8 grid gap-8 md:grid-cols-2">
              <Card className="border-2 border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="text-blue-900">Per Job Pricing</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-blue-800">Pay only for what you mail. No monthly fees or hidden costs.</p>
                </CardContent>
              </Card>
              
              <Card className="border-2 border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="text-green-900">Enterprise Plans</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-green-800">Volume discounts & dedicated support for larger organizations.</p>
                </CardContent>
              </Card>
            </div>
            
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-3 text-lg">
                See Pricing →
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA Banner */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700">
        <div className="container mx-auto px-4 text-center">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-4 text-3xl font-bold text-white lg:text-4xl">
              Start sending patient letters today.
            </h2>
            <p className="mb-8 text-xl text-blue-100">
              No training required — just upload, approve, and mail.
            </p>
            <Link href="/sign-up">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 text-lg">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-12 text-white">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6">
              <h3 className="text-xl font-semibold">MASS Communications, Inc.</h3>
              <Badge variant="secondary" className="mt-2 bg-green-100 text-green-800 hover:bg-green-100">
                <Shield className="mr-2 h-3 w-3" />
                HIPAA Compliant
              </Badge>
            </div>
            
            <div className="mb-6 flex flex-wrap justify-center gap-6 text-sm text-gray-300">
              <Link href="/privacy" className="hover:text-white">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-white">Terms of Service</Link>
              <Link href="/contact" className="hover:text-white">Contact</Link>
            </div>
            
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} MASS Communications, Inc. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
