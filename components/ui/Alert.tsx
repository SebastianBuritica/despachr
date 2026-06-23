import { cn } from '@/lib/utils'
import { AlertCircle, CheckCircle, InfoIcon, XCircle } from 'lucide-react'
import { type ReactNode } from 'react'

interface AlertProps {
  children: ReactNode
  type?: 'info' | 'success' | 'warning' | 'error'
  className?: string
}

export function Alert({ children, type = 'info', className }: AlertProps) {
  const styles = {
    info: 'bg-blue-50 border-blue-200 text-blue-900',
    success: 'bg-green-50 border-green-200 text-green-900',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    error: 'bg-red-50 border-red-200 text-red-900',
  }

  const icons = {
    info: <InfoIcon className="w-5 h-5" />,
    success: <CheckCircle className="w-5 h-5" />,
    warning: <AlertCircle className="w-5 h-5" />,
    error: <XCircle className="w-5 h-5" />,
  }

  return (
    <div className={cn('flex gap-3 rounded-lg border p-4', styles[type], className)}>
      <div className="flex-shrink-0">{icons[type]}</div>
      <div className="flex-1">{children}</div>
    </div>
  )
}
