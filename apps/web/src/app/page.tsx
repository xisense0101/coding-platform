"use client";

import { motion, useInView } from "motion/react";
import { useRef, useState } from "react";
import {
  Shield,
  GraduationCap,
  Brain,
  Zap,
  Lock,
  Code,
  BookOpen,
  BarChart3,
  Award,
  ArrowRight,
  CheckCircle,
  Github,
  Mail,
  LogIn,
} from "lucide-react";

export default function App() {
  return (
    <div className="min-h-screen bg-white overflow-y-scroll snap-y snap-mandatory h-screen">
      <SlideOne />
      <SlideTwo />
      <SlideThree />
    </div>
  );
}

// Slide 1: Hero
function SlideOne() {
  return (
    <section className="relative min-h-screen h-screen flex items-center justify-center overflow-hidden bg-white snap-start snap-always">
      {/* Animated SVG Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Geometric Shapes */}
        <svg className="absolute inset-0 w-full h-full opacity-40">
          <defs>
            <linearGradient
              id="grad1"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop
                offset="0%"
                style={{
                  stopColor: "#3B82F6",
                  stopOpacity: 0.3,
                }}
              />
              <stop
                offset="100%"
                style={{
                  stopColor: "#60A5FA",
                  stopOpacity: 0.1,
                }}
              />
            </linearGradient>
          </defs>

          {/* Animated Circles */}
          <motion.circle
            cx="10%"
            cy="20%"
            r="150"
            fill="url(#grad1)"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />
          <motion.circle
            cx="90%"
            cy="80%"
            r="200"
            fill="url(#grad1)"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              duration: 3,
              delay: 0.5,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />

          {/* Curved Lines */}
          <motion.path
            d="M 0 400 Q 400 200 800 400 T 1600 400"
            stroke="#3B82F6"
            strokeWidth="2"
            fill="none"
            opacity="0.2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear",
            }}
          />
          <motion.path
            d="M 0 600 Q 400 800 800 600 T 1600 600"
            stroke="#60A5FA"
            strokeWidth="2"
            fill="none"
            opacity="0.2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{
              duration: 4,
              delay: 1,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        </svg>

        {/* Floating Code Blocks */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: `${10 + i * 12}%`,
              top: `${15 + (i % 4) * 20}%`,
            }}
            animate={{
              y: [0, -40, 0],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: 6 + i,
              repeat: Infinity,
              delay: i * 0.3,
            }}
          >
            <svg
              width="60"
              height="60"
              viewBox="0 0 24 24"
              fill="none"
            >
              <rect
                x="3"
                y="3"
                width="18"
                height="18"
                rx="2"
                stroke="#3B82F6"
                strokeWidth="1.5"
                opacity="0.5"
              />
              <path
                d="M8 9L10 12L8 15"
                stroke="#3B82F6"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M13 15H16"
                stroke="#3B82F6"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </motion.div>
        ))}

        {/* Grid Pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-5">
          <defs>
            <pattern
              id="grid-pattern"
              width="50"
              height="50"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 50 0 L 0 0 0 50"
                fill="none"
                stroke="#3B82F6"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="url(#grid-pattern)"
          />
        </svg>
      </div>

      <div className="relative z-10 text-center px-4 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          {/* Logo/Brand */}
          <motion.div
            className="inline-flex items-center gap-3 mb-8"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
          >
            <div className="relative">
              <motion.div
                className="absolute inset-0 bg-blue-400 rounded-xl blur-lg opacity-50"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <div className="relative w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-400 rounded-xl flex items-center justify-center">
                <Shield className="w-8 h-8 text-white" />
              </div>
            </div>
            <h3 className="text-blue-600 text-2xl">
              BlocksCode
            </h3>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            className="text-gray-900 mb-8 text-6xl lg:text-7xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            Education Management
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
              Reimagined
            </span>
          </motion.h1>

          {/* Description */}
          <motion.p
            className="text-gray-600 max-w-3xl mx-auto text-xl mb-16 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            A comprehensive platform that empowers educators to
            create engaging courses and provides students with
            secure, immersive learning experiences.
          </motion.p>

          {/* Login Button - Center */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <motion.a
              href="/auth/login"
              className="inline-flex items-center gap-3 px-14 py-6 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all shadow-xl hover:shadow-2xl text-lg"
              whileHover={{
                scale: 1.05,
                boxShadow:
                  "0 20px 60px rgba(59, 130, 246, 0.4)",
              }}
              whileTap={{ scale: 0.95 }}
            >
              <LogIn className="w-6 h-6" />
              Login to Platform
            </motion.a>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        <div className="w-6 h-10 border-2 border-blue-400 rounded-full p-1">
          <motion.div
            className="w-1.5 h-1.5 bg-blue-600 rounded-full mx-auto"
            animate={{ y: [0, 20, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
        </div>
      </motion.div>
    </section>
  );
}

// Slide 2: Platform Features
function SlideTwo() {
  const ref = useRef(null);
  const isInView = useInView(ref, {
    once: true,
    margin: "-100px",
  });
  const [activeTab, setActiveTab] = useState<
    "educators" | "students"
  >("educators");

  const educatorFeatures = [
    {
      icon: BookOpen,
      title: "Course Creation",
      description:
        "Build engaging courses with rich multimedia content and structured learning paths",
      color: "from-blue-500 to-blue-600",
    },
    {
      icon: Shield,
      title: "Secure Assessments",
      description:
        "Multi-layered proctoring with AI monitoring and browser lockdown",
      color: "from-purple-500 to-purple-600",
    },
    {
      icon: BarChart3,
      title: "Real-time Analytics",
      description:
        "Track student progress with comprehensive dashboards and reports",
      color: "from-green-500 to-green-600",
    },
    {
      icon: Code,
      title: "Coding Challenges",
      description:
        "Support for 40+ languages with auto-grading and instant feedback",
      color: "from-orange-500 to-orange-600",
    },
  ];

  const studentFeatures = [
    {
      icon: GraduationCap,
      title: "Immersive Learning",
      description:
        "Engage with interactive content and hands-on coding exercises",
      color: "from-cyan-500 to-cyan-600",
    },
    {
      icon: Award,
      title: "Skills Validation",
      description:
        "Earn certificates through secure, proctored exams",
      color: "from-pink-500 to-pink-600",
    },
    {
      icon: Zap,
      title: "Personalized Pace",
      description:
        "Learn at your own speed with adaptive learning paths",
      color: "from-indigo-500 to-indigo-600",
    },
    {
      icon: Brain,
      title: "Smart Assessments",
      description:
        "Multiple question types including MCQ, coding, and essays",
      color: "from-red-500 to-red-600",
    },
  ];

  const features =
    activeTab === "educators"
      ? educatorFeatures
      : studentFeatures;

  return (
    <section
      id="platform"
      ref={ref}
      className="relative min-h-screen h-screen flex items-center justify-center px-4 bg-white overflow-hidden snap-start snap-always"
    >
      {/* Minimal Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <svg className="absolute inset-0 w-full h-full">
          <defs>
            <pattern
              id="dots"
              x="0"
              y="0"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <circle
                cx="2"
                cy="2"
                r="1"
                fill="#3B82F6"
                opacity="0.2"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>

        {/* Subtle floating shapes */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-96 h-96 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(59, 130, 246, 0.05) 0%, transparent 70%)",
              left: `${20 + i * 30}%`,
              top: `${10 + i * 25}%`,
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 8 + i * 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <div className="max-w-7xl mx-auto relative z-10 w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="mb-4 text-gray-900 text-5xl lg:text-6xl">
            Built for{" "}
            <span className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
              Everyone
            </span>
          </h2>
          <p className="text-gray-500 text-xl">
            Powerful tools for educators, immersive experiences
            for students
          </p>
        </motion.div>

        {/* Tab Switcher */}
        <motion.div
          className="flex justify-center gap-3 mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
        >
          <motion.button
            onClick={() => setActiveTab("educators")}
            className={`relative px-12 py-4 rounded-full transition-all overflow-hidden ${
              activeTab === "educators"
                ? "text-white"
                : "text-gray-600 hover:text-blue-600"
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {activeTab === "educators" && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 rounded-full"
                layoutId="activeTab"
                transition={{ type: "spring", duration: 0.6 }}
              />
            )}
            <span className="relative z-10 text-lg">
              For Educators
            </span>
          </motion.button>

          <motion.button
            onClick={() => setActiveTab("students")}
            className={`relative px-12 py-4 rounded-full transition-all overflow-hidden ${
              activeTab === "students"
                ? "text-white"
                : "text-gray-600 hover:text-blue-600"
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {activeTab === "students" && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 rounded-full"
                layoutId="activeTab"
                transition={{ type: "spring", duration: 0.6 }}
              />
            )}
            <span className="relative z-10 text-lg">
              For Students
            </span>
          </motion.button>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto"
          layout
        >
          {features.map((feature, index) => (
            <motion.div
              key={`${activeTab}-${index}`}
              initial={{ opacity: 0, y: 40, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -40, scale: 0.9 }}
              transition={{
                duration: 0.4,
                delay: index * 0.08,
              }}
              whileHover={{ y: -8 }}
              className="relative group"
            >
              <div className="bg-white p-8 rounded-3xl border border-gray-100 hover:border-blue-200 transition-all h-full shadow-sm hover:shadow-xl">
                {/* Gradient overlay on hover */}
                <div
                  className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity`}
                />

                <div className="relative">
                  {/* Icon */}
                  <motion.div
                    className={`mb-6 w-14 h-14 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center shadow-lg`}
                    whileHover={{
                      rotate: [0, -5, 5, -5, 0],
                      scale: 1.1,
                    }}
                    transition={{ duration: 0.5 }}
                  >
                    <feature.icon className="w-7 h-7 text-white" />
                  </motion.div>

                  {/* Content */}
                  <h3 className="mb-3 text-gray-900 group-hover:text-blue-600 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// Slide 3: Get Started
function SlideThree() {
  const ref = useRef(null);
  const isInView = useInView(ref, {
    once: true,
    margin: "-100px",
  });

  const benefits = [
    {
      icon: CheckCircle,
      text: "Start instantly, no barriers",
      color: "from-green-500 to-emerald-600",
    },
    {
      icon: CheckCircle,
      text: "Setup in minutes",
      color: "from-blue-500 to-cyan-600",
    },
    {
      icon: CheckCircle,
      text: "24/7 support available",
      color: "from-purple-500 to-pink-600",
    },
    {
      icon: CheckCircle,
      text: "Enterprise-grade security",
      color: "from-orange-500 to-red-600",
    },
  ];

  return (
    <section
      ref={ref}
      className="relative min-h-screen h-screen flex items-center justify-center px-4 overflow-hidden bg-white snap-start snap-always"
    >
      {/* Minimal Background Pattern - Matching Slide 2 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <svg className="absolute inset-0 w-full h-full">
          <defs>
            <pattern
              id="dots-slide3"
              x="0"
              y="0"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <circle
                cx="2"
                cy="2"
                r="1"
                fill="#3B82F6"
                opacity="0.2"
              />
            </pattern>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="url(#dots-slide3)"
          />
        </svg>

        {/* Subtle floating shapes */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-96 h-96 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(59, 130, 246, 0.05) 0%, transparent 70%)",
              left: `${20 + i * 30}%`,
              top: `${10 + i * 25}%`,
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 8 + i * 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <div className="max-w-7xl mx-auto relative z-10 w-full py-12">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          {/* Heading Section */}
          <motion.div
            className="mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 }}
          >
            <h2 className="mb-4 text-gray-900 text-5xl lg:text-6xl">
              Start Your{" "}
              <span className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                Journey
              </span>{" "}
              Today
            </h2>

            <p className="text-gray-500 text-xl max-w-2xl mx-auto">
              Transform your educational experience with our
              secure, comprehensive platform
            </p>
          </motion.div>

          {/* Benefits Grid - Simpler, More Spacious */}
          <motion.div
            className="flex flex-wrap justify-center gap-6 mb-12 max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.4 }}
          >
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={
                  isInView ? { opacity: 1, scale: 1 } : {}
                }
                transition={{
                  duration: 0.4,
                  delay: 0.5 + index * 0.08,
                }}
                whileHover={{ scale: 1.05 }}
                className="inline-flex items-center gap-3 px-6 py-4 bg-white rounded-full border-2 border-gray-100 hover:border-blue-200 shadow-md hover:shadow-lg transition-all"
              >
                <motion.div
                  className={`w-6 h-6 bg-gradient-to-br ${benefit.color} rounded-full flex items-center justify-center flex-shrink-0`}
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <benefit.icon className="w-4 h-4 text-white" />
                </motion.div>
                <span className="text-gray-700">
                  {benefit.text}
                </span>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-5 justify-center items-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.9 }}
          >
            <motion.a
              href="/auth/login"
              className="group relative px-14 py-5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-full inline-flex items-center gap-3 justify-center transition-all shadow-xl overflow-hidden"
              whileHover={{
                scale: 1.08,
                boxShadow:
                  "0 25px 60px rgba(59, 130, 246, 0.4)",
              }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Animated Background */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600"
                initial={{ x: "-100%" }}
                whileHover={{ x: "100%" }}
                transition={{ duration: 0.6 }}
              />
              <span className="relative z-10">
                Get Started Now
              </span>
              <ArrowRight className="relative z-10 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.a>

            <motion.a
              href="#platform"
              className="px-14 py-5 bg-white text-blue-600 border-2 border-blue-600 rounded-full inline-flex items-center gap-3 justify-center hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl"
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
            >
              <span>Learn More</span>
            </motion.a>
          </motion.div>

          {/* Footer - More Compact */}
          <motion.div
            className="pt-8 border-t border-gray-100 max-w-5xl mx-auto"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 1.1 }}
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-8">
              {/* Brand */}
              <motion.div
                className="flex items-center gap-3"
                whileHover={{ scale: 1.05 }}
              >
                <div className="relative">
                  <motion.div
                    className="absolute inset-0 bg-blue-400 rounded-xl blur-lg opacity-50"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                    }}
                  />
                  <div className="relative w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-400 rounded-xl flex items-center justify-center shadow-lg">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="text-left">
                  <h4 className="text-gray-900">BlocksCode</h4>
                  <p className="text-gray-500 text-sm">
                    Enterprise Education Platform
                  </p>
                </div>
              </motion.div>

              {/* Copyright & Social */}
              <div className="flex items-center gap-6">
                <p className="text-gray-400 text-sm hidden sm:block">
                  &copy; 2025 BlocksCode
                </p>

                {/* Social Links */}
                <div className="flex gap-3">
                  <motion.a
                    href="https://github.com/xisense0101"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-11 h-11 bg-white border-2 border-gray-200 rounded-xl flex items-center justify-center hover:border-blue-600 hover:text-blue-600 hover:bg-blue-50 transition-all shadow-sm hover:shadow-md"
                    whileHover={{ scale: 1.15, rotate: 5 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Github className="w-5 h-5" />
                  </motion.a>
                  <motion.a
                    href="#"
                    className="w-11 h-11 bg-white border-2 border-gray-200 rounded-xl flex items-center justify-center hover:border-blue-600 hover:text-blue-600 hover:bg-blue-50 transition-all shadow-sm hover:shadow-md"
                    whileHover={{ scale: 1.15, rotate: -5 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Mail className="w-5 h-5" />
                  </motion.a>
                </div>
              </div>
            </div>

            {/* Mobile Copyright */}
            <p className="text-gray-400 text-sm text-center mt-6 sm:hidden">
              &copy; 2025 BlocksCode
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
