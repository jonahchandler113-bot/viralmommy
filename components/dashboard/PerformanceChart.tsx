'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface PerformanceChartProps {
  data: {
    date: string
    views: number
    engagement: number
  }[]
}

const timeframes = [
  { label: '7 Days', value: '7d' },
  { label: '30 Days', value: '30d' },
  { label: '90 Days', value: '90d' },
  { label: 'All Time', value: 'all' },
] as const

export function PerformanceChart({ data }: PerformanceChartProps) {
  const [activeTimeframe, setActiveTimeframe] = useState<'7d' | '30d' | '90d' | 'all'>('7d')
  const [activeMetric, setActiveMetric] = useState<'views' | 'engagement'>('views')

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle>Performance Over Time</CardTitle>

          <div className="flex items-center gap-2">
            {/* Metric Toggle */}
            <div className="inline-flex rounded-lg border border-gray-200 p-1">
              <Button
                variant={activeMetric === 'views' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveMetric('views')}
                className="text-xs"
              >
                Views
              </Button>
              <Button
                variant={activeMetric === 'engagement' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveMetric('engagement')}
                className="text-xs"
              >
                Engagement
              </Button>
            </div>

            {/* Timeframe Selector */}
            <div className="inline-flex rounded-lg border border-gray-200 p-1">
              {timeframes.map((tf) => (
                <Button
                  key={tf.value}
                  variant={activeTimeframe === tf.value ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTimeframe(tf.value)}
                  className="text-xs"
                >
                  {tf.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => {
                  if (activeMetric === 'views') {
                    return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value
                  }
                  return `${value}%`
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
                labelStyle={{ color: '#374151', fontWeight: 600 }}
                formatter={(value: number) => {
                  if (activeMetric === 'views') {
                    return [value.toLocaleString(), 'Views']
                  }
                  return [`${value}%`, 'Engagement']
                }}
              />
              <Line
                type="monotone"
                dataKey={activeMetric}
                stroke={activeMetric === 'views' ? '#8B5CF6' : '#EC4899'}
                strokeWidth={3}
                dot={{ fill: activeMetric === 'views' ? '#8B5CF6' : '#EC4899', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
