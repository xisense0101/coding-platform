import { redirect } from 'next/navigation'

interface Props {
  params: {
    courseId: string
  }
}

export default function CoursePage({ params }: Props) {
  // Redirect to the proper student course route
  redirect(`/student/courses/${params.courseId}`)
}
