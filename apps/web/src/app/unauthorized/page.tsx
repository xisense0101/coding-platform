"use client"

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ShieldAlert } from 'lucide-react'
import { motion } from 'motion/react'

export default function Unauthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50">
      <div className="text-center px-4 max-w-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <ShieldAlert className="w-20 h-20 text-orange-500 mx-auto mb-6" />
          
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Access Denied
          </h1>
          
          <p className="text-gray-600 mb-8 text-lg leading-relaxed">
            You don't have permission to access this organization. 
            Please login with the correct account for this organization.
          </p>
          
          <div className="space-y-3">
            <Link href="/auth/login" className="block">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg">
                Go to Login
              </Button>
            </Link>
            
            <Link href="/" className="block">
              <Button variant="outline" className="w-full py-6 text-lg">
                Go to Main Site
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
