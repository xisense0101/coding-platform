import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Teacher Dashboard - Enterprise Educational Platform',
  description: 'Manage your courses, track student progress, and create assessments.',
}

export default function TeacherDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
