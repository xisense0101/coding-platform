import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  BookOpen, 
  Users, 
  GraduationCap, 
  Shield, 
  BarChart3, 
  Zap,
  CheckCircle,
  ArrowRight,
  Star
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Enterprise Educational Platform - World-Class Learning Management System',
  description: 'Experience the future of education with our comprehensive platform designed for students, teachers, and institutions.',
}

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              🚀 Now in Public Beta
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Enterprise Educational
              <span className="text-blue-600 dark:text-blue-400"> Platform</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
              A comprehensive learning management system that rivals Canvas and Blackboard, 
              built with modern architecture for superior user experience and enterprise-grade security.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-lg px-8">
                <Link href="/auth/register">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8" asChild>
                <Link href="/demo">
                  View Demo
                </Link>
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">10K+</div>
              <div className="text-gray-600 dark:text-gray-300">Active Users</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">1M+</div>
              <div className="text-gray-600 dark:text-gray-300">Questions Answered</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">500+</div>
              <div className="text-gray-600 dark:text-gray-300">Institutions</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">99.9%</div>
              <div className="text-gray-600 dark:text-gray-300">Uptime</div>
            </div>
          </div>
        </div>
      </section>
      {/* Exam App Download Section */}
      <section className="py-8 px-4">
        <div className="container mx-auto max-w-2xl">
          <Card className="shadow-lg border-2 border-blue-100 dark:border-blue-900 bg-white dark:bg-gray-900">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="w-14 h-14 bg-blue-50 dark:bg-blue-800 rounded-lg flex items-center justify-center">
                <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Exam Application for Desktop <Badge variant="secondary" className="ml-2">Beta</Badge></CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-300">Download the secure exam app for Windows. Always get the latest version.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-2 pb-6 flex flex-col items-center">
              <Button asChild size="lg" className="text-lg px-8 bg-blue-600 hover:bg-blue-700 text-white shadow-md">
                <a
                  href="https://github.com/xisense0101/exam-electron/releases/latest/download/blockscode-Setup-1.0.9.exe"
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                >
                  <span className="flex items-center gap-2">
                    <ArrowRight className="h-5 w-5" /> Download for Windows
                  </span>
                </a>
              </Button>
              <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                <span>Latest version is downloaded automatically. <br />File name: <b>blockscode-Setup.exe</b> <br />Windows only. <br />If you have issues, check <a href="https://github.com/xisense0101/exam-electron/releases" target="_blank" rel="noopener noreferrer" className="underline text-blue-600 dark:text-blue-400">all releases</a>.</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Everything You Need for Modern Education
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Our platform combines powerful features with intuitive design to create 
              the ultimate learning experience.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                  <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle>Rich Content Creation</CardTitle>
                <CardDescription>
                  Create engaging courses with our advanced rich text editor, 
                  mathematical equations, and multimedia support.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Quill.js Editor</Badge>
                  <Badge variant="outline">KaTeX Math</Badge>
                  <Badge variant="outline">File Upload</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
                  <GraduationCap className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle>Advanced Exam System</CardTitle>
                <CardDescription>
                  Comprehensive exam builder with multiple question types, 
                  auto-grading, and proctoring capabilities.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">MCQ Questions</Badge>
                  <Badge variant="outline">Code Challenges</Badge>
                  <Badge variant="outline">Live Proctoring</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <CardTitle>Analytics & Insights</CardTitle>
                <CardDescription>
                  Detailed analytics and reporting to track student progress 
                  and improve learning outcomes.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Progress Tracking</Badge>
                  <Badge variant="outline">Performance Reports</Badge>
                  <Badge variant="outline">Custom Dashboards</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <CardTitle>Enterprise Security</CardTitle>
                <CardDescription>
                  Bank-level security with multi-factor authentication, 
                  audit trails, and compliance features.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">MFA</Badge>
                  <Badge variant="outline">RBAC</Badge>
                  <Badge variant="outline">Audit Logs</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <CardTitle>Multi-tenancy</CardTitle>
                <CardDescription>
                  Support multiple organizations with complete isolation, 
                  custom branding, and flexible permissions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Organization Isolation</Badge>
                  <Badge variant="outline">Custom Branding</Badge>
                  <Badge variant="outline">Role Management</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <CardTitle>High Performance</CardTitle>
                <CardDescription>
                  Built for scale with modern architecture supporting 
                  thousands of concurrent users and real-time features.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Next.js 14</Badge>
                  <Badge variant="outline">Supabase</Badge>
                  <Badge variant="outline">Real-time Sync</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-gray-50 dark:bg-gray-800 py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Trusted by Educational Institutions
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              See what our users have to say about their experience.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: "This platform has revolutionized how we conduct online assessments. The proctoring features give us confidence in exam integrity.",
                author: "Dr. Sarah Johnson",
                role: "Computer Science Professor",
                institution: "Tech University",
                rating: 5
              },
              {
                quote: "The analytics dashboard provides incredible insights into student performance. We can identify struggling students early and provide support.",
                author: "Michael Chen",
                role: "Academic Administrator",
                institution: "Global Institute",
                rating: 5
              },
              {
                quote: "As a student, I love the intuitive interface and the way content is organized. The mobile experience is excellent too.",
                author: "Emily Rodriguez",
                role: "Computer Science Student",
                institution: "State College",
                rating: 5
              }
            ].map((testimonial, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <blockquote className="text-gray-600 dark:text-gray-300 mb-6">
                    "{testimonial.quote}"
                  </blockquote>
                  <div className="border-t pt-4">
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {testimonial.author}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {testimonial.role}
                    </div>
                    <div className="text-sm text-blue-600 dark:text-blue-400">
                      {testimonial.institution}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 dark:bg-blue-800 py-20 px-4 text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Transform Your Educational Experience?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of educators and students who are already experiencing 
            the future of online education.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg px-8" asChild>
              <Link href="/auth/register">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 border-white text-white hover:bg-white hover:text-blue-600" asChild>
              <Link href="/contact">
                Contact Sales
              </Link>
            </Button>
          </div>
          
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="flex items-center justify-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <span>30-day free trial</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <span>No setup fees</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <span>24/7 support</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Enterprise Educational Platform</h3>
              <p className="text-gray-400 mb-4">
                The next generation learning management system built for the modern educational institution.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/features" className="hover:text-white">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link href="/demo" className="hover:text-white">Demo</Link></li>
                <li><Link href="/security" className="hover:text-white">Security</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/about" className="hover:text-white">About</Link></li>
                <li><Link href="/careers" className="hover:text-white">Careers</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
                <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/docs" className="hover:text-white">Documentation</Link></li>
                <li><Link href="/support" className="hover:text-white">Help Center</Link></li>
                <li><Link href="/status" className="hover:text-white">Status</Link></li>
                <li><Link href="/privacy" className="hover:text-white">Privacy</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Enterprise Educational Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
