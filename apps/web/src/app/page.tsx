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
  Star,
  Lock,
  Eye,
  Monitor,
  Camera,
  Fingerprint,
  ShieldCheck,
  AlertTriangle,
  Code,
  FileCheck,
  Timer,
  Award,
  Globe
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Secure Exam Platform - Enterprise-Grade Assessment System',
  description: 'Experience top-notch exam security with advanced proctoring, multi-layered protection, and comprehensive assessment tools for educational institutions.',
}

export default function HomePage() {
  return (
    <div className="min-h-screen overflow-hidden">
      {/* Hero Section with Animated Background */}
      <section className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-24 px-4 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse-slower"></div>
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse-slowest"></div>
        </div>

        {/* Floating Security Icons */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-[10%] animate-float">
            <Shield className="w-12 h-12 text-blue-400/20" />
          </div>
          <div className="absolute top-40 right-[15%] animate-float-delayed">
            <Lock className="w-16 h-16 text-purple-400/20" />
          </div>
          <div className="absolute bottom-40 left-[20%] animate-float-slow">
            <ShieldCheck className="w-14 h-14 text-cyan-400/20" />
          </div>
          <div className="absolute bottom-20 right-[25%] animate-float">
            <Camera className="w-10 h-10 text-indigo-400/20" />
          </div>
        </div>

        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="text-center mb-16 animate-fade-in-up">
            <Badge variant="secondary" className="mb-6 text-lg px-4 py-2 bg-blue-500/20 border-blue-400/50 backdrop-blur-sm animate-bounce-slow">
              <Shield className="w-4 h-4 mr-2 inline" />
              Military-Grade Security
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">
              Secure Exam Platform
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 animate-gradient">
                Built for Integrity
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto mb-10 leading-relaxed">
              Experience the most <span className="text-blue-400 font-semibold">secure and reliable</span> exam-taking platform with 
              <span className="text-purple-400 font-semibold"> advanced proctoring</span>, real-time monitoring, and comprehensive anti-cheating measures.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button asChild size="lg" className="text-lg px-10 py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-2xl">
                <Link href="/auth/login">
                  Login to Platform
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-10 py-6 border-2 border-white/30 text-white hover:bg-white/10 backdrop-blur-sm transform hover:scale-105 transition-all duration-200" asChild>
                <Link href="#features">
                  Explore Features
                </Link>
              </Button>
            </div>

            {/* Security Badges */}
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-300">
              <div className="flex items-center gap-2 animate-fade-in-up">
                <ShieldCheck className="w-5 h-5 text-green-400" />
                <span>SOC 2 Compliant</span>
              </div>
              <div className="flex items-center gap-2 animate-fade-in-up animation-delay-100">
                <Lock className="w-5 h-5 text-blue-400" />
                <span>256-bit Encryption</span>
              </div>
              <div className="flex items-center gap-2 animate-fade-in-up animation-delay-200">
                <Eye className="w-5 h-5 text-purple-400" />
                <span>Live Proctoring</span>
              </div>
              <div className="flex items-center gap-2 animate-fade-in-up animation-delay-300">
                <Globe className="w-5 h-5 text-cyan-400" />
                <span>99.9% Uptime SLA</span>
              </div>
            </div>
          </div>

          {/* Animated Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:bg-white/10 transform hover:scale-105 transition-all duration-300 animate-fade-in-up">
              <div className="text-4xl font-bold text-blue-400 mb-2 animate-count-up">10K+</div>
              <div className="text-gray-300 font-medium">Active Users</div>
            </div>
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:bg-white/10 transform hover:scale-105 transition-all duration-300 animate-fade-in-up animation-delay-100">
              <div className="text-4xl font-bold text-green-400 mb-2 animate-count-up">1M+</div>
              <div className="text-gray-300 font-medium">Exams Secured</div>
            </div>
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:bg-white/10 transform hover:scale-105 transition-all duration-300 animate-fade-in-up animation-delay-200">
              <div className="text-4xl font-bold text-purple-400 mb-2 animate-count-up">500+</div>
              <div className="text-gray-300 font-medium">Institutions Trust Us</div>
            </div>
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:bg-white/10 transform hover:scale-105 transition-all duration-300 animate-fade-in-up animation-delay-300">
              <div className="text-4xl font-bold text-cyan-400 mb-2 animate-count-up">99.9%</div>
              <div className="text-gray-300 font-medium">Security Score</div>
            </div>
          </div>
        </div>
      </section>
      {/* Security Measures Showcase */}
      <section className="py-20 px-4 bg-gradient-to-b from-white to-blue-50 dark:from-gray-900 dark:to-slate-900">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16 animate-fade-in-up">
            <Badge variant="outline" className="mb-4 text-base px-6 py-2">
              <AlertTriangle className="w-4 h-4 mr-2 inline text-orange-500" />
              Zero Tolerance for Academic Dishonesty
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Multi-Layered Security Architecture
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Our platform employs military-grade security measures to ensure exam integrity and prevent cheating at every level.
            </p>
          </div>

          {/* Security Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            <Card className="group hover:shadow-2xl transition-all duration-300 border-2 hover:border-blue-500 bg-white dark:bg-slate-800 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <CardHeader className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                  <Camera className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold">Live Video Proctoring</CardTitle>
                <CardDescription className="text-base">
                  Real-time webcam monitoring with AI-powered facial recognition and behavior analysis to detect suspicious activities.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-blue-50 dark:bg-blue-900/30">Face Detection</Badge>
                  <Badge variant="secondary" className="bg-blue-50 dark:bg-blue-900/30">Eye Tracking</Badge>
                  <Badge variant="secondary" className="bg-blue-50 dark:bg-blue-900/30">Multiple Faces Alert</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-300 border-2 hover:border-purple-500 bg-white dark:bg-slate-800 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <CardHeader className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                  <Monitor className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold">Screen Recording & Monitoring</CardTitle>
                <CardDescription className="text-base">
                  Continuous screen capture with tab switching detection, window focus monitoring, and copy-paste prevention.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-purple-50 dark:bg-purple-900/30">Screen Capture</Badge>
                  <Badge variant="secondary" className="bg-purple-50 dark:bg-purple-900/30">Tab Detection</Badge>
                  <Badge variant="secondary" className="bg-purple-50 dark:bg-purple-900/30">Clipboard Block</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-300 border-2 hover:border-green-500 bg-white dark:bg-slate-800 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <CardHeader className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                  <Lock className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold">Browser Lockdown Mode</CardTitle>
                <CardDescription className="text-base">
                  Secure browser environment that restricts access to external resources, preventing unauthorized assistance.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-green-50 dark:bg-green-900/30">Full Screen Lock</Badge>
                  <Badge variant="secondary" className="bg-green-50 dark:bg-green-900/30">Right-Click Block</Badge>
                  <Badge variant="secondary" className="bg-green-50 dark:bg-green-900/30">DevTools Disable</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-300 border-2 hover:border-orange-500 bg-white dark:bg-slate-800 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <CardHeader className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                  <Fingerprint className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold">Identity Verification</CardTitle>
                <CardDescription className="text-base">
                  Multi-factor authentication with photo ID verification and biometric checks to ensure the right person takes the exam.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-orange-50 dark:bg-orange-900/30">Photo ID Check</Badge>
                  <Badge variant="secondary" className="bg-orange-50 dark:bg-orange-900/30">Face Match</Badge>
                  <Badge variant="secondary" className="bg-orange-50 dark:bg-orange-900/30">MFA Required</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-300 border-2 hover:border-red-500 bg-white dark:bg-slate-800 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <CardHeader className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                  <Eye className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold">AI Behavior Analysis</CardTitle>
                <CardDescription className="text-base">
                  Machine learning algorithms detect unusual patterns, suspicious movements, and potential cheating indicators in real-time.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-red-50 dark:bg-red-900/30">Gaze Detection</Badge>
                  <Badge variant="secondary" className="bg-red-50 dark:bg-red-900/30">Audio Analysis</Badge>
                  <Badge variant="secondary" className="bg-red-50 dark:bg-red-900/30">Pattern Recognition</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-300 border-2 hover:border-cyan-500 bg-white dark:bg-slate-800 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <CardHeader className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                  <ShieldCheck className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold">Encrypted Data Storage</CardTitle>
                <CardDescription className="text-base">
                  End-to-end encryption for all exam data, recordings, and results with secure cloud storage and compliance certifications.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-cyan-50 dark:bg-cyan-900/30">AES-256</Badge>
                  <Badge variant="secondary" className="bg-cyan-50 dark:bg-cyan-900/30">SOC 2 Type II</Badge>
                  <Badge variant="secondary" className="bg-cyan-50 dark:bg-cyan-900/30">GDPR Compliant</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Exam App Download Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="container mx-auto max-w-4xl relative z-10">
          <div className="text-center mb-12 animate-fade-in-up">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Dedicated Desktop Application
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Maximum security with our purpose-built exam software. Enhanced monitoring, zero distractions, complete control.
            </p>
          </div>

          <Card className="shadow-2xl border-2 border-blue-500/50 bg-gradient-to-br from-slate-800 to-slate-900 backdrop-blur-xl overflow-hidden transform hover:scale-105 transition-all duration-300">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
            <CardHeader className="relative">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center flex-shrink-0 animate-pulse-slow shadow-lg">
                  <Shield className="h-10 w-10 text-white" />
                </div>
                <div className="text-center md:text-left">
                  <CardTitle className="text-3xl font-bold text-white mb-2">
                    Secure Exam Browser
                    <Badge variant="secondary" className="ml-3 bg-blue-500/20 border-blue-400/50 text-blue-300">Beta</Badge>
                  </CardTitle>
                  <CardDescription className="text-gray-300 text-lg">
                    Lockdown browser with advanced security features for Windows. Auto-updates included.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 pb-8 relative">
              <div className="grid md:grid-cols-3 gap-4 mb-8">
                <div className="flex items-start gap-3 text-gray-300">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                  <span>Full-screen lockdown mode</span>
                </div>
                <div className="flex items-start gap-3 text-gray-300">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                  <span>Screen & webcam recording</span>
                </div>
                <div className="flex items-start gap-3 text-gray-300">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                  <span>Network traffic monitoring</span>
                </div>
              </div>

              <div className="flex flex-col items-center">
                <Button asChild size="lg" className="text-xl px-12 py-7 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-2xl transform hover:scale-105 transition-all">
                  <a
                    href="https://github.com/xisense0101/exam-electron/releases/download/1.0.9/blockscode-Setup-1.0.9.exe"
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                  >
                    <span className="flex items-center gap-3">
                      <Monitor className="h-6 w-6" />
                      Download for Windows
                      <ArrowRight className="h-6 w-6" />
                    </span>
                  </a>
                </Button>
                <div className="mt-6 text-sm text-gray-400 text-center space-y-1">
                  <p>Latest version: <span className="text-blue-400 font-semibold">v1.0.9</span></p>
                  <p>File name: <span className="text-white font-mono">blockscode-Setup.exe</span></p>
                  <p className="text-xs">
                    <a href="https://github.com/xisense0101/exam-electron/releases" target="_blank" rel="noopener noreferrer" className="underline text-blue-400 hover:text-blue-300">
                      View all releases on GitHub
                    </a>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Additional Services Section */}
      <section id="features" className="py-20 px-4 bg-white dark:bg-gray-900">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16 animate-fade-in-up">
            <Badge variant="outline" className="mb-4 text-base px-6 py-2">
              <Award className="w-4 h-4 mr-2 inline" />
              Complete Educational Ecosystem
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Beyond Just Exams
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              A comprehensive platform with everything educators and students need for a complete learning experience.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 hover:border-blue-500 bg-gradient-to-br from-white to-blue-50 dark:from-slate-800 dark:to-slate-900">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                  <Code className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-xl">Coding Challenges</CardTitle>
                <CardDescription className="text-base">
                  Built-in code editor with Judge0 integration supporting 40+ programming languages with automated testing.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="border-blue-300">40+ Languages</Badge>
                  <Badge variant="outline" className="border-blue-300">Auto-Grading</Badge>
                  <Badge variant="outline" className="border-blue-300">Test Cases</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 hover:border-green-500 bg-gradient-to-br from-white to-green-50 dark:from-slate-800 dark:to-slate-900">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                  <FileCheck className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-xl">Multiple Question Types</CardTitle>
                <CardDescription className="text-base">
                  MCQs, coding problems, essays, file uploads - support for diverse assessment methods in one platform.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="border-green-300">MCQ</Badge>
                  <Badge variant="outline" className="border-green-300">Coding</Badge>
                  <Badge variant="outline" className="border-green-300">Essay</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 hover:border-purple-500 bg-gradient-to-br from-white to-purple-50 dark:from-slate-800 dark:to-slate-900">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                  <BarChart3 className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-xl">Real-time Analytics</CardTitle>
                <CardDescription className="text-base">
                  Comprehensive dashboards with insights on student performance, exam statistics, and learning patterns.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="border-purple-300">Live Stats</Badge>
                  <Badge variant="outline" className="border-purple-300">Reports</Badge>
                  <Badge variant="outline" className="border-purple-300">Insights</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 hover:border-orange-500 bg-gradient-to-br from-white to-orange-50 dark:from-slate-800 dark:to-slate-900">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                  <BookOpen className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-xl">Course Management</CardTitle>
                <CardDescription className="text-base">
                  Create and organize courses with rich content, multimedia support, and structured learning paths.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="border-orange-300">Rich Editor</Badge>
                  <Badge variant="outline" className="border-orange-300">KaTeX Math</Badge>
                  <Badge variant="outline" className="border-orange-300">Multimedia</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 hover:border-cyan-500 bg-gradient-to-br from-white to-cyan-50 dark:from-slate-800 dark:to-slate-900">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                  <Users className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-xl">Role-Based Access</CardTitle>
                <CardDescription className="text-base">
                  Flexible permission system for admins, teachers, and students with multi-organization support.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="border-cyan-300">RBAC</Badge>
                  <Badge variant="outline" className="border-cyan-300">Multi-tenant</Badge>
                  <Badge variant="outline" className="border-cyan-300">SSO Ready</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 hover:border-indigo-500 bg-gradient-to-br from-white to-indigo-50 dark:from-slate-800 dark:to-slate-900">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                  <Timer className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-xl">Timed Assessments</CardTitle>
                <CardDescription className="text-base">
                  Configurable time limits, auto-submission, and timezone handling for fair global assessments.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="border-indigo-300">Time Limits</Badge>
                  <Badge variant="outline" className="border-indigo-300">Auto-Submit</Badge>
                  <Badge variant="outline" className="border-indigo-300">Scheduling</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-800 py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-full h-full bg-grid-pattern"></div>
        </div>
        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="text-center mb-16 animate-fade-in-up">
            <Badge variant="outline" className="mb-4 text-base px-6 py-2">
              <Star className="w-4 h-4 mr-2 inline text-yellow-500 fill-yellow-500" />
              Trusted Worldwide
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              What Our Users Say
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Join thousands of institutions that rely on our platform for secure, reliable assessments.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: "The security measures are unmatched. We've seen a 95% reduction in academic dishonesty since implementing this platform. The live proctoring and AI detection give us complete confidence.",
                author: "Dr. Sarah Johnson",
                role: "Computer Science Professor",
                institution: "Tech University",
                rating: 5,
                color: "blue"
              },
              {
                quote: "Finally, a platform that takes exam integrity seriously. The multi-layered security, browser lockdown, and real-time monitoring have transformed our assessment process completely.",
                author: "Michael Chen",
                role: "Academic Administrator",
                institution: "Global Institute",
                rating: 5,
                color: "purple"
              },
              {
                quote: "The secure exam app is incredibly professional. I appreciate the fairness it brings - everyone takes exams under the same controlled conditions. The interface is smooth and distraction-free.",
                author: "Emily Rodriguez",
                role: "Computer Science Student",
                institution: "State College",
                rating: 5,
                color: "green"
              }
            ].map((testimonial, index) => (
              <Card key={index} className={`group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 hover:border-${testimonial.color}-500 bg-white dark:bg-slate-800 animate-fade-in-up`} style={{animationDelay: `${index * 100}ms`}}>
                <CardContent className="pt-6">
                  <div className="flex mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400 animate-pulse" style={{animationDelay: `${i * 100}ms`}} />
                    ))}
                  </div>
                  <blockquote className="text-gray-700 dark:text-gray-300 mb-6 text-base leading-relaxed italic">
                    "{testimonial.quote}"
                  </blockquote>
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="font-bold text-gray-900 dark:text-white text-lg">
                      {testimonial.author}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {testimonial.role}
                    </div>
                    <div className={`text-sm font-semibold text-${testimonial.color}-600 dark:text-${testimonial.color}-400 mt-1`}>
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
      <section className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 py-24 px-4 text-white overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse-slower"></div>
        </div>

        <div className="container mx-auto max-w-5xl text-center relative z-10">
          <div className="animate-fade-in-up">
            <h2 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Ready to Experience
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-cyan-200">
                Uncompromising Security?
              </span>
            </h2>
            <p className="text-xl md:text-2xl mb-10 opacity-95 max-w-3xl mx-auto leading-relaxed">
              Join institutions worldwide that trust us with their most important assessments. 
              Experience the peace of mind that comes with true exam integrity.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-14">
              <Button size="lg" className="text-xl px-12 py-7 bg-white text-blue-600 hover:bg-gray-100 shadow-2xl transform hover:scale-105 transition-all" asChild>
                <Link href="/auth/login">
                  Login Now
                  <ArrowRight className="ml-3 h-6 w-6" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-xl px-12 py-7 border-2 border-white text-white hover:bg-white/10 backdrop-blur-sm transform hover:scale-105 transition-all" asChild>
                <Link href="#features">
                  Learn More
                </Link>
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all">
                <CheckCircle className="h-8 w-8 text-green-300 mx-auto mb-3" />
                <span className="text-lg font-semibold">Free Trial</span>
                <p className="text-sm opacity-80 mt-2">No credit card required</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all">
                <CheckCircle className="h-8 w-8 text-green-300 mx-auto mb-3" />
                <span className="text-lg font-semibold">Easy Setup</span>
                <p className="text-sm opacity-80 mt-2">Ready in minutes</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all">
                <CheckCircle className="h-8 w-8 text-green-300 mx-auto mb-3" />
                <span className="text-lg font-semibold">24/7 Support</span>
                <p className="text-sm opacity-80 mt-2">Always here to help</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all">
                <CheckCircle className="h-8 w-8 text-green-300 mx-auto mb-3" />
                <span className="text-lg font-semibold">Secure Cloud</span>
                <p className="text-sm opacity-80 mt-2">Enterprise-grade hosting</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 text-white py-16 px-4 border-t border-gray-800">
        <div className="container mx-auto max-w-7xl">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold">SecureExam</h3>
              </div>
              <p className="text-gray-400 mb-6 leading-relaxed">
                The most secure and comprehensive exam platform for educational institutions worldwide.
              </p>
              <div className="flex gap-2">
                <Badge variant="outline" className="border-gray-700 text-gray-400">SOC 2</Badge>
                <Badge variant="outline" className="border-gray-700 text-gray-400">GDPR</Badge>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold text-lg mb-4 text-white">Product</h4>
              <ul className="space-y-3 text-gray-400">
                <li><Link href="#features" className="hover:text-blue-400 transition-colors flex items-center gap-2"><ArrowRight className="w-4 h-4" /> Features</Link></li>
                <li><Link href="/auth/login" className="hover:text-blue-400 transition-colors flex items-center gap-2"><ArrowRight className="w-4 h-4" /> Login</Link></li>
                <li><Link href="https://github.com/xisense0101/exam-electron/releases" className="hover:text-blue-400 transition-colors flex items-center gap-2"><ArrowRight className="w-4 h-4" /> Download App</Link></li>
                <li><Link href="#" className="hover:text-blue-400 transition-colors flex items-center gap-2"><ArrowRight className="w-4 h-4" /> Security</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-lg mb-4 text-white">Resources</h4>
              <ul className="space-y-3 text-gray-400">
                <li><Link href="#" className="hover:text-blue-400 transition-colors flex items-center gap-2"><ArrowRight className="w-4 h-4" /> Documentation</Link></li>
                <li><Link href="#" className="hover:text-blue-400 transition-colors flex items-center gap-2"><ArrowRight className="w-4 h-4" /> API Reference</Link></li>
                <li><Link href="#" className="hover:text-blue-400 transition-colors flex items-center gap-2"><ArrowRight className="w-4 h-4" /> Help Center</Link></li>
                <li><Link href="#" className="hover:text-blue-400 transition-colors flex items-center gap-2"><ArrowRight className="w-4 h-4" /> System Status</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-lg mb-4 text-white">Contact</h4>
              <ul className="space-y-3 text-gray-400">
                <li><Link href="#" className="hover:text-blue-400 transition-colors flex items-center gap-2"><ArrowRight className="w-4 h-4" /> Support</Link></li>
                <li><Link href="https://github.com/xisense0101" className="hover:text-blue-400 transition-colors flex items-center gap-2"><ArrowRight className="w-4 h-4" /> GitHub</Link></li>
                <li><Link href="#" className="hover:text-blue-400 transition-colors flex items-center gap-2"><ArrowRight className="w-4 h-4" /> Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-blue-400 transition-colors flex items-center gap-2"><ArrowRight className="w-4 h-4" /> Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-gray-400 text-sm">
                &copy; 2025 SecureExam Platform. All rights reserved. Built with security in mind.
              </p>
              <div className="flex items-center gap-4 text-gray-400 text-sm">
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  All Systems Operational
                </span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
