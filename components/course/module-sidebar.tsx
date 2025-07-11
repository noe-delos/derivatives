'use client'

import { useTranslation } from 'react-i18next'
import { useRouter, useParams } from 'next/navigation'
import { Icon } from '@iconify/react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface ModuleContent {
  id: string
  content_type: 'video' | 'file' | 'quiz'
  title: string
  order_index: number
}

interface Module {
  id: string
  name: string
  order_index: number
  completed: boolean
  module_content: ModuleContent[]
}

interface ModuleSidebarProps {
  modules: Module[]
  currentModuleId: string
  currentContentId?: string
  courseId: string
  onContentSelect: (moduleId: string, contentId: string) => void
}

export function ModuleSidebar({ 
  modules, 
  currentModuleId, 
  currentContentId,
  courseId,
  onContentSelect 
}: ModuleSidebarProps) {
  const { t } = useTranslation()
  const router = useRouter()

  const totalModules = modules.length
  const completedModules = modules.filter(m => m.completed).length
  const progressPercentage = totalModules > 0 ? (completedModules / totalModules) * 100 : 0

  function getContentIcon(contentType: string) {
    switch (contentType) {
      case 'video':
        return 'mdi:play-circle'
      case 'file':
        return 'mdi:file-document'
      case 'quiz':
        return 'mdi:quiz'
      default:
        return 'mdi:circle'
    }
  }

  return (
    <div className="w-80 bg-white border-r flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/courses/${courseId}`)}
          className="mb-4"
        >
          <Icon icon="mdi:arrow-left" className="h-4 w-4 mr-2" />
          {t('common.back')}
        </Button>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t('courses.courseProgress')}</span>
            <span className="text-sm text-gray-600">
              {completedModules}/{totalModules}
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      </div>

      {/* Modules List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {modules
            .sort((a, b) => a.order_index - b.order_index)
            .map((module) => (
              <div key={module.id} className="space-y-2">
                <div className={cn(
                  'flex items-center gap-2 p-2 rounded-lg',
                  module.id === currentModuleId && 'bg-blue-50'
                )}>
                  <div className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium',
                    module.completed 
                      ? 'bg-green-500 text-white' 
                      : module.id === currentModuleId
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                  )}>
                    {module.completed ? (
                      <Icon icon="mdi:check" className="h-3 w-3" />
                    ) : (
                      module.order_index + 1
                    )}
                  </div>
                  <span className={cn(
                    'text-sm font-medium flex-1',
                    module.id === currentModuleId && 'text-blue-700'
                  )}>
                    {module.name}
                  </span>
                </div>

                {/* Module Content */}
                {module.id === currentModuleId && (
                  <div className="ml-4 space-y-1">
                    {module.module_content
                      .sort((a, b) => a.order_index - b.order_index)
                      .map((content) => (
                        <button
                          key={content.id}
                          onClick={() => onContentSelect(module.id, content.id)}
                          className={cn(
                            'w-full flex items-center gap-2 p-2 rounded text-left transition-colors',
                            content.id === currentContentId
                              ? 'bg-blue-100 text-blue-700'
                              : 'hover:bg-gray-50'
                          )}
                        >
                          <Icon 
                            icon={getContentIcon(content.content_type)} 
                            className="h-4 w-4 flex-shrink-0" 
                          />
                          <span className="text-sm truncate">{content.title}</span>
                        </button>
                      ))}
                  </div>
                )}
              </div>
            ))}
        </div>
      </ScrollArea>
    </div>
  )
}