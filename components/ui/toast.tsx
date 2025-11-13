import * as React from "react"
import { cn } from "@/lib/utils"
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react"

export interface ToastProps {
  id: string
  title?: string
  description?: string
  variant?: 'success' | 'error' | 'info'
  duration?: number
  onClose?: () => void
}

export function Toast({ title, description, variant = 'info', onClose }: Omit<ToastProps, 'id'>) {
  const variantStyles = {
    success: 'bg-success-50 border-success-200 text-success-900',
    error: 'bg-error-50 border-error-200 text-error-900',
    info: 'bg-purple-50 border-purple-200 text-purple-900',
  }

  const variantIcons = {
    success: CheckCircle2,
    error: AlertCircle,
    info: Info,
  }

  const Icon = variantIcons[variant]

  return (
    <div
      className={cn(
        "pointer-events-auto flex w-full max-w-md rounded-lg border-2 p-4 shadow-lg transition-all animate-in slide-in-from-top-5",
        variantStyles[variant]
      )}
    >
      <div className="flex items-start gap-3 flex-1">
        <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          {title && (
            <div className="font-semibold mb-1">{title}</div>
          )}
          {description && (
            <div className="text-sm opacity-90">{description}</div>
          )}
        </div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-4 flex-shrink-0 rounded-md p-1 hover:bg-black/10 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

interface ToastProviderProps {
  children: React.ReactNode
}

interface ToastContextValue {
  showToast: (toast: Omit<ToastProps, 'id'>) => void
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined)

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = React.useState<ToastProps[]>([])

  const showToast = React.useCallback((toast: Omit<ToastProps, 'id'>) => {
    const id = Math.random().toString(36).substring(7)
    const newToast = { ...toast, id }

    setToasts((prev) => [...prev, newToast])

    // Auto dismiss after duration
    const duration = toast.duration || 5000
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, duration)
  }, [])

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            {...toast}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
