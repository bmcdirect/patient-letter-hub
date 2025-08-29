import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, Award, Clock, Building, Mail, CheckCircle, FileText, DollarSign } from "lucide-react";

export const metadata: Metadata = {
  title: "About PatientLetterHub - Our Mission & Company | MASS Communications",
  description: "Learn about PatientLetterHub's mission to simplify HIPAA-compliant patient communications. Built by MASS Communications with 20+ years of healthcare experience.",
  keywords: [
    "PatientLetterHub company",
    "MASS Communications",
    "healthcare communications",
    "HIPAA compliant mailing",
    "patient letter automation",
    "healthcare print and mail",
    "business associate agreement",
    "healthcare compliance"
  ],
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 py-20 lg:py-32">
        <div className="container mx-auto px-4 text-center">
          <div className="mx-auto max-w-4xl">
            <Badge variant="secondary" className="mb-6 bg-blue-100 text-blue-800 hover:bg-blue-100">
              <Building className="mr-2 h-4 w-4" />
              About MASS Communications
            </Badge>
            
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Our Mission:{" "}
              <span className="text-blue-600">Secure, Simple Patient Communications</span>
            </h1>
            
            <p className="mb-8 text-xl text-gray-600 lg:text-2xl">
              Built by healthcare professionals, for healthcare professionals
            </p>
          </div>
        </div>
      </section>

      {/* Company Story */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            <div className="mb-12 text-center">
              <h2 className="mb-6 text-3xl font-bold text-gray-900 lg:text-4xl">
                Our Story
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                PatientLetterHub is a product of <strong>MASS Communications</strong>, a trusted print and mail provider with 
                <strong> 20+ years of healthcare experience</strong>. We built PatientLetterHub to solve a real problem: 
                healthcare practices wasting valuable staff time on manual mail merges, struggling with compliance, and 
                facing delays in critical patient communications.
              </p>
            </div>
            
            <div className="rounded-2xl bg-blue-50 p-8 mb-12">
              <h3 className="mb-4 text-2xl font-semibold text-blue-900">
                Our mission is simple:
              </h3>
              <p className="text-lg text-blue-800">
                Make HIPAA-compliant patient letters fast, reliable, and affordable for every practice.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why We Built This */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-12 text-center text-3xl font-bold text-gray-900 lg:text-4xl">
              Why We Built PatientLetterHub
            </h2>
            
            <div className="grid gap-8 md:grid-cols-3">
              <Card className="border-0 bg-white shadow-lg">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 rounded-full bg-red-100 p-3">
                    <Clock className="h-8 w-8 text-red-600" />
                  </div>
                  <CardTitle className="text-lg">Staff Time Wasted</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-600">
                    Healthcare staff spending hours on manual mail merges instead of patient care
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-0 bg-white shadow-lg">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 rounded-full bg-orange-100 p-3">
                    <Shield className="h-8 w-8 text-orange-600" />
                  </div>
                  <CardTitle className="text-lg">Compliance Risks</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-600">
                    High risk of HIPAA violations from human error in manual processes
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-0 bg-white shadow-lg">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 rounded-full bg-blue-100 p-3">
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">Patient Delays</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-600">
                    Critical patient communications delayed due to manual processing
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Our Solution */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="mb-8 text-3xl font-bold text-gray-900 lg:text-4xl">
              How PatientLetterHub Solves These Problems
            </h2>
            
            <div className="grid gap-8 md:grid-cols-2">
              <div className="text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
                <h3 className="mb-3 text-xl font-semibold text-gray-900">Automation</h3>
                <p className="text-gray-600">
                  Upload patient lists, select templates, and let our system handle the rest
                </p>
              </div>
              
              <div className="text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
                  <Shield className="h-10 w-10 text-blue-600" />
                </div>
                <h3 className="mb-3 text-xl font-semibold text-gray-900">Compliance</h3>
                <p className="text-gray-600">
                  Built-in HIPAA safeguards and audit trails for complete compliance
                </p>
              </div>
              
              <div className="text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-purple-100">
                  <Mail className="h-10 w-10 text-purple-600" />
                </div>
                <h3 className="mb-3 text-xl font-semibold text-gray-900">Speed</h3>
                <p className="text-gray-600">
                  From upload to mailed in days, not weeks
                </p>
              </div>
              
              <div className="text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-orange-100">
                  <DollarSign className="h-10 w-10 text-orange-600" />
                </div>
                <h3 className="mb-3 text-xl font-semibold text-gray-900">Affordability</h3>
                <p className="text-gray-600">
                  Pay only for what you mail, no hidden fees or monthly costs
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Experience */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="mb-8 text-3xl font-bold text-gray-900 lg:text-4xl">
              Trusted by Healthcare for Over 20 Years
            </h2>
            
            <div className="mb-8 rounded-2xl bg-white p-8 shadow-sm">
              <div className="mb-6 flex justify-center">
                <div className="rounded-full bg-blue-100 p-4">
                  <Award className="h-12 w-12 text-blue-600" />
                </div>
              </div>
              <h3 className="mb-4 text-2xl font-semibold text-gray-900">
                MASS Communications Experience
              </h3>
              <p className="text-lg text-gray-700 leading-relaxed">
                With over two decades serving healthcare organizations, we understand the unique challenges 
                of patient communications. Our expertise spans from single-provider clinics to multi-location 
                health systems, ensuring every job meets the highest standards of accuracy and compliance.
              </p>
            </div>
            
            <div className="grid gap-6 md:grid-cols-3 text-center">
              <div>
                <div className="text-3xl font-bold text-blue-600">20+</div>
                <div className="text-gray-600">Years in Healthcare</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-600">1000+</div>
                <div className="text-gray-600">Healthcare Clients</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-600">1M+</div>
                <div className="text-gray-600">Letters Mailed</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700">
        <div className="container mx-auto px-4 text-center">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-4 text-3xl font-bold text-white lg:text-4xl">
              Ready to Transform Your Patient Communications?
            </h2>
            <p className="mb-8 text-xl text-blue-100">
              Join hundreds of healthcare practices already using PatientLetterHub
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 text-lg">
                Get Started Free
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-3 text-lg">
                Request a Demo
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
              Learn More About PatientLetterHub
            </h3>
            <div className="grid gap-4 md:grid-cols-3">
              <Link href="/security">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-lg">Security & Compliance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">Learn about our enterprise-grade security measures</p>
                  </CardContent>
                </Card>
              </Link>
              
              <Link href="/customers">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-lg">Customer Success</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">See how healthcare practices are succeeding with us</p>
                  </CardContent>
                </Card>
              </Link>
              
              <Link href="/contact">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-lg">Contact Us</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">Get in touch with our healthcare experts</p>
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
