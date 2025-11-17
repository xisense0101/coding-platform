import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface ErrorMessageProps {
  title?: string
  message: string
  retry?: () => void
}

export function ErrorMessage({ title = 'Error', message, retry }: ErrorMessageProps) {
  return (
    <Alert variant="destructive" className="my-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>{message}</span>
        {retry && (
          <button
            onClick={retry}
            className="ml-4 rounded px-3 py-1 text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900"
          >
            Retry
          </button>
        )}
      </AlertDescription>
    </Alert>
  )
}

export function ErrorPage({ title = 'Something went wrong', message = 'An error occurred while loading this page.', retry }: ErrorMessageProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4 p-8">
      <AlertCircle className="h-16 w-16 text-destructive" />
      <h2 className="text-2xl font-bold">{title}</h2>
      <p className="text-center text-muted-foreground">{message}</p>
      {retry && (
        <button
          onClick={retry}
          className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Try Again
        </button>
      )}
    </div>
  )
}
