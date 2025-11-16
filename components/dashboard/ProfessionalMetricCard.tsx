import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface ProfessionalMetricCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  iconColor: string
  iconBgColor: string
  trend?: {
    value: number
    isPositive: boolean
    comparison: string
  }
}

export function ProfessionalMetricCard({
  title,
  value,
  icon: Icon,
  iconColor,
  iconBgColor,
  trend,
}: ProfessionalMetricCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-3 flex-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>

            {trend && (
              <div className="flex items-center gap-2">
                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  trend.isPositive
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {trend.isPositive ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  <span>{trend.isPositive ? '+' : ''}{trend.value}%</span>
                </div>
                <span className="text-xs text-gray-500">{trend.comparison}</span>
              </div>
            )}
          </div>

          <div className={`rounded-xl ${iconBgColor} p-3`}>
            <Icon className={`h-6 w-6 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
