import { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  change?: {
    value: number
    label: string
  }
  icon: LucideIcon
  iconColor?: string
  iconBgColor?: string
  className?: string
}

export function StatCard({
  title,
  value,
  change,
  icon: Icon,
  iconColor = 'text-purple-600',
  iconBgColor = 'bg-purple-100',
  className
}: StatCardProps) {
  const changeIsPositive = change && change.value >= 0

  return (
    <Card className={cn('hover:shadow-md transition-shadow', className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
            {change && (
              <div className="flex items-center gap-1 mt-2">
                <span
                  className={cn(
                    'text-sm font-medium',
                    changeIsPositive ? 'text-success-600' : 'text-error-600'
                  )}
                >
                  {changeIsPositive ? '+' : ''}{change.value}%
                </span>
                <span className="text-sm text-muted-foreground">{change.label}</span>
              </div>
            )}
          </div>
          <div className={cn('rounded-lg p-3', iconBgColor)}>
            <Icon className={cn('h-6 w-6', iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
