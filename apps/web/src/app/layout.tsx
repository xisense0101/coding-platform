import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/lib/auth/AuthContext'
import { Toaster } from '@/components/ui/toaster'

export const metadata: Metadata = {
  title: 'Enterprise Educational Platform',
  description: 'A comprehensive learning management system for educational institutions',
  keywords: ['education', 'learning', 'management', 'system', 'courses', 'exams'],
  authors: [{ name: 'Enterprise Edu Team' }],
  creator: 'Enterprise Educational Platform',
  publisher: 'Enterprise Educational Platform',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://edu-platform.com',
    title: 'Enterprise Educational Platform',
    description: 'A comprehensive learning management system for educational institutions',
    siteName: 'Enterprise Educational Platform',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Enterprise Educational Platform',
    description: 'A comprehensive learning management system for educational institutions',
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  manifest: '/site.webmanifest',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <AuthProvider>
          <div className="min-h-screen bg-background text-foreground">
            {children}
          </div>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}
