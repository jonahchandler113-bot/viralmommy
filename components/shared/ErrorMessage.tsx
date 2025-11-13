import { AlertCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ErrorMessageProps {
  title?: string
  message: string
  retry?: () => void
  className?: string
  variant?: 'inline' | 'page'
}

export function ErrorMessage({
  title = 'Oops! Something went wrong',
  message,
  retry,
  className,
  variant = 'inline'
}: ErrorMessageProps) {
  if (variant === 'page') {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <div className="inline-flex rounded-full bg-error-100 p-6 mb-4">
            <XCircle className="h-12 w-12 text-error-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-500 mb-6 max-w-md">{message}</p>
          {retry && (
            <Button onClick={retry} variant="default">
              Try Again
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      'rounded-lg border border-error-200 bg-error-50 p-4',
      className
    )}>
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-error-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="text-sm font-medium text-error-900">{title}</h4>
          <p className="text-sm text-error-700 mt-1">{message}</p>
          {retry && (
            <Button
              onClick={retry}
              variant="ghost"
              size="sm"
              className="mt-3 text-error-600 hover:text-error-700 hover:bg-error-100"
            >
              Try Again
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
