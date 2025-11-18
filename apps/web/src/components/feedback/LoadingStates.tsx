export function LoadingSpinner({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex-1 flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  )
}

export function EmptyState({ 
  title, 
  description, 
  action 
}: { 
  title: string
  description?: string
  action?: React.ReactNode 
}) {
  return (
    <div className="flex-1 flex items-center justify-center min-h-screen">
      <div className="text-center max-w-md">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        {description && (
          <p className="text-gray-600 mb-4">{description}</p>
        )}
        {action}
      </div>
    </div>
  )
}
