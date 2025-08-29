import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Building, Award, CheckCircle, Star, TrendingUp, Mail, Clock, Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "Customer Success - Healthcare Organizations Using PatientLetterHub | MASS Communications",
  description: "See how healthcare practices of all sizes are succeeding with PatientLetterHub. From single-provider clinics to multi-location health systems.",
  keywords: [
    "PatientLetterHub customers",
    "healthcare success stories",
    "patient communication success",
    "healthcare practice testimonials",
    "HIPAA compliant mailing success",
    "healthcare vendor success stories"
  ],
};

export default function CustomersPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50 to-blue-100 py-20 lg:py-32">
        <div className="container mx-auto px-4 text-center">
          <div className="mx-auto max-w-4xl">
            <Badge variant="secondary" className="mb-6 bg-indigo-100 text-indigo-800 hover:bg-indigo-100">
              <Users className="mr-2 h-4 w-4" />
              Customer Success
            </Badge>
            
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Serving Healthcare Practices of{" "}
              <span className="text-indigo-600">All Sizes</span>
            </h1>
            
            <p className="mb-8 text-xl text-gray-600 lg:text-2xl">
              From single-provider clinics to multi-location health systems, PatientLetterHub scales to meet your needs
            </p>
          </div>
        </div>
      </section>

      {/* Customer Overview */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="mb-8 text-3xl font-bold text-gray-900 lg:text-4xl">
              Trusted by Healthcare Organizations Nationwide
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              PatientLetterHub has earned the trust of healthcare practices across the country. Our platform 
              is designed to scale from small clinics to large health systems, ensuring every organization 
              gets the same level of security, compliance, and reliability.
            </p>
          </div>
        </div>
      </section>

      {/* Customer Types */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-12 text-center text-3xl font-bold text-gray-900 lg:text-4xl">
              Healthcare Organizations We Serve
            </h2>
            
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              <Card className="border-0 bg-white shadow-lg">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 rounded-full bg-blue-100 p-3">
                    <Building className="h-8 w-8 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">Primary Care Practices</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-600">
                    Family medicine, internal medicine, and general practice clinics
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-0 bg-white shadow-lg">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 rounded-full bg-green-100 p-3">
                    <Users className="h-8 w-8 text-green-600" />
                  </div>
                  <CardTitle className="text-lg">Specialist Groups</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-600">
                    Cardiology, orthopedics, dermatology, and other specialty practices
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-0 bg-white shadow-lg">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 rounded-full bg-purple-100 p-3">
                    <Building className="h-8 w-8 text-purple-600" />
                  </div>
                  <CardTitle className="text-lg">Community Health Centers</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-600">
                    Federally qualified health centers and community clinics
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-0 bg-white shadow-lg">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 rounded-full bg-orange-100 p-3">
                    <Building className="h-8 w-8 text-orange-600" />
                  </div>
                  <CardTitle className="text-lg">Hospital Networks</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-600">
                    Multi-location hospital systems and health networks
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Success Metrics */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="mb-8 text-3xl font-bold text-gray-900 lg:text-4xl">
              Proven Results Across Healthcare
            </h2>
            
            <div className="grid gap-8 md:grid-cols-3">
              <div className="text-center">
                <div className="text-4xl font-bold text-indigo-600 mb-2">1000+</div>
                <div className="text-lg text-gray-600">Healthcare Clients</div>
                <p className="text-sm text-gray-500 mt-2">Serving practices nationwide</p>
              </div>
              
              <div className="text-center">
                <div className="text-4xl font-bold text-indigo-600 mb-2">1M+</div>
                <div className="text-lg text-gray-600">Letters Mailed</div>
                <p className="text-sm text-gray-500 mt-2">With 99.9% accuracy rate</p>
              </div>
              
              <div className="text-center">
                <div className="text-4xl font-bold text-indigo-600 mb-2">20+</div>
                <div className="text-lg text-gray-600">Years Experience</div>
                <p className="text-sm text-gray-500 mt-2">In healthcare communications</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Success Stories */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-12 text-center text-3xl font-bold text-gray-900 lg:text-4xl">
              Customer Success Stories
            </h2>
            
            <div className="grid gap-8 md:grid-cols-2">
              <Card className="border-0 bg-white shadow-lg">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-blue-100 p-2">
                      <Building className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Bright Smiles Dental</CardTitle>
                      <CardDescription>Multi-location dental practice</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="flex items-center gap-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-gray-600 italic">
                      "PatientLetterHub has transformed how we communicate with our patients. The HIPAA compliance 
                      and address hygiene features give us peace of mind. We've reduced our mailing time from weeks 
                      to days."
                    </p>
                  </div>
                  <div className="space-y-2 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Reduced mailing time by 80%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Improved patient response rates</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Eliminated manual mail merge errors</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-0 bg-white shadow-lg">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-green-100 p-2">
                      <Users className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Riverside Medical Group</CardTitle>
                      <CardDescription>Primary care practice network</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="flex items-center gap-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-gray-600 italic">
                      "As a growing practice, we needed a solution that could scale with us. PatientLetterHub 
                      handles our increasing volume while maintaining the same high quality and compliance standards."
                    </p>
                  </div>
                  <div className="space-y-2 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Scaled from 2 to 8 locations</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Maintained 100% HIPAA compliance</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Reduced administrative overhead</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-0 bg-white shadow-lg">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-purple-100 p-2">
                      <Building className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Community Health First</CardTitle>
                      <CardDescription>Federally qualified health center</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="flex items-center gap-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-gray-600 italic">
                      "PatientLetterHub helps us serve our community more effectively. The automated address 
                      hygiene ensures our patients receive important health information, improving outcomes."
                    </p>
                  </div>
                  <div className="space-y-2 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Improved patient engagement</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Reduced returned mail by 90%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Enhanced care coordination</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-0 bg-white shadow-lg">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-orange-100 p-2">
                      <Building className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Metro Cardiology Associates</CardTitle>
                      <CardDescription>Specialty medical practice</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="flex items-center gap-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-gray-600 italic">
                      "The precision and reliability of PatientLetterHub is crucial for our cardiology practice. 
                      We can't afford delays in patient communications, and this platform delivers every time."
                    </p>
                  </div>
                  <div className="space-y-2 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Zero communication delays</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Enhanced patient safety</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Improved practice efficiency</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Why Customers Choose Us */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-12 text-center text-3xl font-bold text-gray-900 lg:text-4xl">
              Why Healthcare Organizations Choose PatientLetterHub
            </h2>
            
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              <Card className="border-0 bg-gray-50">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 rounded-full bg-blue-100 p-3">
                    <Shield className="h-8 w-8 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">HIPAA Compliance</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-600">
                    Built-in compliance features and Business Associate Agreements give you confidence
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-0 bg-gray-50">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 rounded-full bg-green-100 p-3">
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                  <CardTitle className="text-lg">Scalable Solution</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-600">
                    Grows with your practice from single provider to multi-location health system
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-0 bg-gray-50">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 rounded-full bg-purple-100 p-3">
                    <Clock className="h-8 w-8 text-purple-600" />
                  </div>
                  <CardTitle className="text-lg">Time Savings</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-600">
                    Automate manual processes and focus staff time on patient care instead of mail merges
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-0 bg-gray-50">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 rounded-full bg-orange-100 p-3">
                    <Mail className="h-8 w-8 text-orange-600" />
                  </div>
                  <CardTitle className="text-lg">Address Hygiene</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-600">
                    Automatic NCOA updates ensure your patient communications reach their destination
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-0 bg-gray-50">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 rounded-full bg-red-100 p-3">
                    <Award className="h-8 w-8 text-red-600" />
                  </div>
                  <CardTitle className="text-lg">Proven Track Record</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-600">
                    20+ years of experience serving healthcare organizations with reliability
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-0 bg-gray-50">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 rounded-full bg-indigo-100 p-3">
                    <Users className="h-8 w-8 text-indigo-600" />
                  </div>
                  <CardTitle className="text-lg">Expert Support</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-600">
                    Healthcare communication specialists who understand your unique needs
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Industry Recognition */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="mb-8 text-3xl font-bold text-gray-900 lg:text-4xl">
              Industry Recognition & Trust
            </h2>
            
            <div className="mb-8 rounded-2xl bg-white p-8 shadow-sm">
              <div className="mb-6 flex justify-center">
                <div className="rounded-full bg-blue-100 p-4">
                  <Award className="h-12 w-12 text-blue-600" />
                </div>
              </div>
              <h3 className="mb-4 text-2xl font-semibold text-gray-900">
                Trusted by Healthcare Leaders
              </h3>
              <p className="text-lg text-gray-700 leading-relaxed">
                PatientLetterHub has earned the trust of healthcare organizations across the country. 
                Our commitment to security, compliance, and reliability has made us the preferred choice 
                for healthcare communications.
              </p>
            </div>
            
            <div className="grid gap-6 md:grid-cols-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-2">99.9%</div>
                <div className="text-gray-600">Uptime Reliability</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-2">100%</div>
                <div className="text-gray-600">HIPAA Compliance</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-2">24/7</div>
                <div className="text-gray-600">Support Availability</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-blue-700">
        <div className="container mx-auto px-4 text-center">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-4 text-3xl font-bold text-white lg:text-4xl">
              Join Our Success Stories
            </h2>
            <p className="mb-8 text-xl text-indigo-100">
              See how PatientLetterHub can transform your patient communications
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" className="bg-white text-indigo-600 hover:bg-gray-100 px-8 py-3 text-lg">
                Start Free Trial
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-indigo-600 px-8 py-3 text-lg">
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
