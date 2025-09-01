import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Mail, Phone, MapPin, Clock, Users, MessageSquare, Building } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact PatientLetterHub - Get in Touch with Healthcare Communication Experts",
  description: "Contact PatientLetterHub for questions about HIPAA-compliant patient communications, pricing, or technical support. Our healthcare experts are here to help.",
  keywords: [
    "contact PatientLetterHub",
    "healthcare communication support",
    "HIPAA compliance questions",
    "patient letter support",
    "healthcare vendor contact",
    "technical support healthcare",
    "sales inquiry healthcare"
  ],
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 py-20 lg:py-32">
        <div className="container mx-auto px-4 text-center">
          <div className="mx-auto max-w-4xl">
            <Badge variant="secondary" className="mb-6 bg-blue-100 text-blue-800 hover:bg-blue-100">
              <MessageSquare className="mr-2 h-4 w-4" />
              Get in Touch
            </Badge>
            
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Let's Talk About Your{" "}
              <span className="text-blue-600">Patient Communications</span>
            </h1>
            
            <p className="mb-8 text-xl text-gray-600 lg:text-2xl">
              Our healthcare communication experts are here to help you succeed
            </p>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            <div className="grid gap-12 lg:grid-cols-2">
              {/* Contact Form */}
              <div>
                <h2 className="mb-8 text-3xl font-bold text-gray-900">
                  Send Us a Message
                </h2>
                
                <form className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input id="firstName" placeholder="Your first name" required />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input id="lastName" placeholder="Your last name" required />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input id="email" type="email" placeholder="your.email@practice.com" required />
                  </div>
                  
                  <div>
                    <Label htmlFor="practice">Practice/Organization Name *</Label>
                    <Input id="practice" placeholder="Your practice name" required />
                  </div>
                  
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" type="tel" placeholder="(555) 123-4567" />
                  </div>
                  
                  <div>
                    <Label htmlFor="inquiryType">Inquiry Type *</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select inquiry type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sales">Sales Inquiry</SelectItem>
                        <SelectItem value="demo">Request Demo</SelectItem>
                        <SelectItem value="support">Technical Support</SelectItem>
                        <SelectItem value="compliance">Compliance Questions</SelectItem>
                        <SelectItem value="pricing">Pricing Information</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="message">Message *</Label>
                    <Textarea 
                      id="message" 
                      placeholder="Tell us about your patient communication needs..."
                      rows={5}
                      required
                    />
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <input type="checkbox" id="agreement" className="mt-1" required />
                    <Label htmlFor="agreement" className="text-sm text-gray-600">
                      I agree to PatientLetterHub's{" "}
                      <Link href="/privacy" className="text-blue-600 hover:underline">
                        Privacy Policy
                      </Link>{" "}
                      and{" "}
                      <Link href="/terms" className="text-blue-600 hover:underline">
                        Terms of Service
                      </Link>
                    </Label>
                  </div>
                  
                  <Button type="submit" size="lg" className="w-full bg-blue-600 hover:bg-blue-700">
                    Send Message
                  </Button>
                </form>
              </div>
              
              {/* Contact Information */}
              <div>
                <h2 className="mb-8 text-3xl font-bold text-gray-900">
                  Get in Touch
                </h2>
                
                <div className="space-y-6">
                  <Card className="border-0 bg-gray-50">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-blue-100 p-2">
                          <Mail className="h-5 w-5 text-blue-600" />
                        </div>
                        <CardTitle className="text-lg">Email Us</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">
                        <a href="mailto:info@patientletterhub.com" className="text-blue-600 hover:underline">
                          info@patientletterhub.com
                        </a>
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        We typically respond within 2 business hours
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-0 bg-gray-50">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-green-100 p-2">
                          <Phone className="h-5 w-5 text-green-600" />
                        </div>
                        <CardTitle className="text-lg">Call Us</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">
                        <a href="tel:+1-978-840-9880" className="text-green-600 hover:underline">
                          (978) 840-9880
                        </a>
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        Monday - Friday, 8:00 AM - 6:00 PM EST
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-0 bg-gray-50">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-purple-100 p-2">
                          <MapPin className="h-5 w-5 text-purple-600" />
                        </div>
                        <CardTitle className="text-lg">Visit Us</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">
                        MASS Communications, Inc.<br />
                        150 Industrial Road<br />
                        Leominster, MA 01453
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-0 bg-gray-50">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-orange-100 p-2">
                          <Clock className="h-5 w-5 text-orange-600" />
                        </div>
                        <CardTitle className="text-lg">Business Hours</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">
                        Monday - Friday: 8:00 AM - 6:00 PM EST<br />
                        Saturday: 9:00 AM - 1:00 PM EST<br />
                        Sunday: Closed
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Contact Us */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-12 text-center text-3xl font-bold text-gray-900 lg:text-4xl">
              Why Healthcare Organizations Choose PatientLetterHub
            </h2>
            
            <div className="grid gap-8 md:grid-cols-3">
              <Card className="border-0 bg-white shadow-lg">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 rounded-full bg-blue-100 p-3">
                    <Shield className="h-8 w-8 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">HIPAA Expertise</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-600">
                    Our team understands healthcare compliance requirements and can answer all your questions
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-0 bg-white shadow-lg">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 rounded-full bg-green-100 p-3">
                    <Users className="h-8 w-8 text-green-600" />
                  </div>
                  <CardTitle className="text-lg">Dedicated Support</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-600">
                    Get personalized support from healthcare communication specialists
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-0 bg-white shadow-lg">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 rounded-full bg-purple-100 p-3">
                    <Building className="h-8 w-8 text-purple-600" />
                  </div>
                  <CardTitle className="text-lg">20+ Years Experience</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-600">
                    Decades of experience serving healthcare organizations of all sizes
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-12 text-center text-3xl font-bold text-gray-900 lg:text-4xl">
              Frequently Asked Questions
            </h2>
            
            <div className="space-y-6">
              <Card className="border-0 bg-gray-50">
                <CardHeader>
                  <CardTitle className="text-lg">How quickly can you respond to urgent requests?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    We typically respond to all inquiries within 2 business hours. For urgent matters, 
                    please call us directly at (978) 840-9880.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-0 bg-gray-50">
                <CardHeader>
                  <CardTitle className="text-lg">Do you offer emergency support for healthcare practices?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Yes, we understand that patient communications can be time-sensitive. We offer 
                    priority support for urgent healthcare communication needs.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-0 bg-gray-50">
                <CardHeader>
                  <CardTitle className="text-lg">Can you help with HIPAA compliance questions?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Absolutely. Our team includes healthcare compliance experts who can help you 
                    understand how PatientLetterHub maintains HIPAA compliance and what that means for your practice.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-0 bg-gray-50">
                <CardHeader>
                  <CardTitle className="text-lg">Do you offer on-site training or demonstrations?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    We offer virtual demonstrations and training sessions. For larger healthcare organizations, 
                    we can arrange on-site visits when appropriate.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700">
        <div className="container mx-auto px-4 text-center">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-4 text-3xl font-bold text-white lg:text-4xl">
              Ready to Get Started?
            </h2>
            <p className="mb-8 text-xl text-blue-100">
              Contact us today to learn how PatientLetterHub can transform your patient communications
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 text-lg">
                Request a Demo
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-3 text-lg">
                View Pricing
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
              
              <Link href="/security">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-lg">Security & Compliance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">Understand our security measures</p>
                  </CardContent>
                </Card>
              </Link>
              
              <Link href="/pricing">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-lg">Pricing</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">See our transparent pricing structure</p>
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
