import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Student Dashboard - Enterprise Educational Platform',
  description: 'Track your learning progress and access your courses.',
}

export default function StudentDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
