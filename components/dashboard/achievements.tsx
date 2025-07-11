'use client'

import { useTranslation } from 'react-i18next'
import { Icon } from '@iconify/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface Achievement {
  id: string
  icon: string
  title: string
  completed: boolean
}

interface AchievementsProps {
  achievements: Achievement[]
}

export function Achievements({ achievements }: AchievementsProps) {
  const { t } = useTranslation()

  const defaultAchievements: Achievement[] = [
    {
      id: '1',
      icon: 'mdi:school',
      title: t('dashboard.firstModuleCompleted'),
      completed: false,
    },
    {
      id: '2',
      icon: 'mdi:chart-line',
      title: t('dashboard.halfTrainingCompleted'),
      completed: false,
    },
    {
      id: '3',
      icon: 'mdi:account-group',
      title: t('dashboard.activeCommunity'),
      completed: false,
    },
  ]

  const displayAchievements = achievements.length > 0 ? achievements : defaultAchievements

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle>{t('dashboard.achievements')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {displayAchievements.map((achievement) => (
            <div
              key={achievement.id}
              className={cn(
                'flex items-center gap-3 p-4 rounded-lg border transition-colors',
                achievement.completed
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-gray-50 border-gray-200 text-gray-400'
              )}
            >
              <Icon icon={achievement.icon} className="h-8 w-8" />
              <span className="text-sm font-medium">{achievement.title}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}