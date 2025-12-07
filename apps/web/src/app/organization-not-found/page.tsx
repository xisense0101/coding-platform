"use client"

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AlertCircle, Home } from 'lucide-react'
import { motion } from 'motion/react'

export default function OrganizationNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="text-center px-4 max-w-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <AlertCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />
          
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Organization Not Found
          </h1>
          
          <p className="text-gray-600 mb-8 text-lg leading-relaxed">
            The organization you're trying to access doesn't exist or hasn't been set up yet.
            Please check the URL and try again.
          </p>
          
          <div className="space-y-3">
            <Link href="/" className="block">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg">
                <Home className="w-5 h-5 mr-2" />
                Go to Main Site
              </Button>
            </Link>
            
            <p className="text-sm text-gray-500">
              If you believe this is an error, please contact support.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
