'use client'

import { useState } from 'react'
import ImageToScript from '@/components/ai-assistant/ImageToScript'
import ViralScorePredictor from '@/components/ai-assistant/ViralScorePredictor'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ImageIcon, TrendingUp } from 'lucide-react'

export default function AIToolsPage() {
  const [activeTab, setActiveTab] = useState('viral-score')

  return (
    <div className="max-w-7xl mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid">
          <TabsTrigger value="viral-score" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Viral Score Predictor
          </TabsTrigger>
          <TabsTrigger value="image-to-script" className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Image to Script
          </TabsTrigger>
        </TabsList>

        <TabsContent value="viral-score">
          <ViralScorePredictor />
        </TabsContent>

        <TabsContent value="image-to-script">
          <ImageToScript />
        </TabsContent>
      </Tabs>
    </div>
  )
}
