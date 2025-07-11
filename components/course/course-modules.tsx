'use client'

import { useTranslation } from 'react-i18next'
import { Icon } from '@iconify/react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface ModuleContent {
  id: string
  content_type: 'video' | 'file' | 'quiz'
  title: string
  video_duration_minutes?: number
}

interface Module {
  id: string
  name: string
  order_index: number
  estimated_time_minutes: number
  completed: boolean
  module_content: ModuleContent[]
}

interface CourseModulesProps {
  modules: Module[]
  isRegistered: boolean
  onClick?: (moduleId: string) => void
}

export function CourseModules({ modules, isRegistered, onClick }: CourseModulesProps) {
  const { t } = useTranslation()

  const totalModules = modules.length
  const completedModules = modules.filter(m => m.completed).length
  const progressPercentage = totalModules > 0 ? (completedModules / totalModules) * 100 : 0

  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">{t('courses.courseModules')}</h3>
            <span className="text-sm text-gray-600">
              {completedModules}/{totalModules} {t('common.completed')}
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        <div className="space-y-3">
          {modules.map((module, index) => (
            <div
              key={module.id}
              className={cn(
                'flex items-center gap-4 p-4 rounded-lg border transition-colors',
                isRegistered && onClick ? 'cursor-pointer hover:bg-gray-50' : '',
                !isRegistered && 'opacity-50',
                module.completed && 'bg-green-50 border-green-200'
              )}
              onClick={() => isRegistered && onClick?.(module.id)}
            >
              <div className="flex-shrink-0">
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                  module.completed 
                    ? 'bg-green-500 text-white' 
                    : isRegistered 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'bg-gray-100 text-gray-400'
                )}>
                  {module.completed ? (
                    <Icon icon="mdi:check" className="h-4 w-4" />
                  ) : (
                    index + 1
                  )}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-medium truncate">{module.name}</h4>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-sm text-gray-600">
                    {module.estimated_time_minutes} {t('common.minutes')}
                  </span>
                  <div className="flex items-center gap-2">
                    {module.module_content.map((content) => (
                      <Badge key={content.id} variant="outline" className="text-xs">
                        <Icon 
                          icon={
                            content.content_type === 'video' ? 'mdi:play' :
                            content.content_type === 'file' ? 'mdi:file' :
                            'mdi:quiz'
                          } 
                          className="h-3 w-3 mr-1" 
                        />
                        {content.content_type === 'video' ? t('backoffice.video') :
                         content.content_type === 'file' ? t('backoffice.file') :
                         t('backoffice.quiz')}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {!isRegistered && (
                <Icon icon="mdi:lock" className="h-5 w-5 text-gray-400" />
              )}

              {module.completed && (
                <Badge variant="default" className="bg-green-500">
                  {t('common.completed')}
                </Badge>
              )}
            </div>
          ))}
        </div>

        {!isRegistered && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 mb-4">
              {t('courses.registrationRequired')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}