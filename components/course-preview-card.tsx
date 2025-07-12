'use client'

import { useTranslation } from 'react-i18next'
import Image from 'next/image'
import { Icon } from '@iconify/react'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface CoursePreviewCardProps {
  course?: {
    id?: string
    title?: string
    description?: string
    category?: { name: string }
    picture_url?: string
    difficulty?: string
    created_at?: string
    _count?: {
      course_modules?: number
      course_registrations?: number
    }
  }
  userProgress?: number
  completionRate?: number
  isDisabled?: boolean
  isPreview?: boolean
  className?: string
  mode?: 'vertical' | 'horizontal'
  nextModule?: {
    name: string
    type: 'video' | 'file' | 'quiz'
    estimatedTime?: number
  }
  onContinue?: () => void
}

export function CoursePreviewCard({ 
  course, 
  userProgress = 0, 
  completionRate = 0,
  isDisabled = false,
  isPreview = false,
  className = "",
  mode = 'vertical',
  nextModule,
  onContinue
}: CoursePreviewCardProps) {
  const { t } = useTranslation()
  
  const defaultCourse = {
    title: 'Titre du cours',
    description: 'Description du cours',
    category: { name: 'Catégorie' },
    picture_url: '/default-course.png',
    difficulty: 'Intermédiaire',
    created_at: new Date().toISOString(),
    _count: {
      course_modules: 0,
      course_registrations: 0
    }
  }
  
  const displayCourse = { ...defaultCourse, ...course }

  // Random icon for categories
  const categoryIcons = [
    'mdi:chart-line',
    'mdi:calculator',
    'mdi:finance',
    'mdi:bank',
    'mdi:currency-usd',
    'mdi:trending-up'
  ]
  const randomIcon = categoryIcons[Math.floor(Math.random() * categoryIcons.length)]
  
  if (mode === 'horizontal') {
    return (
      <div className="w-full">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className={cn(
            'relative overflow-hidden rounded-xl border bg-card transition-all',
            isDisabled ? 'opacity-60 pointer-events-none' : 'hover:shadow-lg',
            className
          )}
        >
          <div className="flex relative">
            {/* Image Section - Wider */}
            <div className="relative w-52 h-40 flex-shrink-0 p-3">
              <div className="relative w-full h-full overflow-hidden rounded-xl bg-gray-50">
                {displayCourse.picture_url ? (
                  <Image
                    src={displayCourse.picture_url}
                    alt={displayCourse.title}
                    fill
                    className="object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = '/default-course.png'
                    }}
                  />
                ) : (
                  <Image
                    src="/default-course.png"
                    alt="Default course image"
                    fill
                    className="object-cover"
                  />
                )}
                {/* Category Badge - Smaller */}
                <Badge 
                  variant="secondary" 
                  className="absolute top-2 left-2 bg-foreground/80 text-background backdrop-blur-sm text-xs px-1.5 py-0.5"
                >
                  {displayCourse.category?.name}
                </Badge>
              </div>
            </div>

            {/* Content Section */}
            <div className="flex-1 p-4 flex items-center">
              <div className="flex-1 space-y-2">
                {/* Category with icon - Smaller */}
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Icon icon={randomIcon} className="h-3 w-3" />
                  <span>{displayCourse.category?.name}</span>
                </div>
                
                {/* Title */}
                <h3 className="text-lg font-semibold line-clamp-1">
                  {displayCourse.title}
                </h3>
                
                {/* Progress and Button Row */}
                <div className="flex items-center gap-4">
                  {/* Progress */}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">{t('course.progress')}:</span>
                      <span className="font-medium">{userProgress}%</span>
                    </div>
                    <Progress value={userProgress} className="h-2" />
                  </div>
                  
                  {/* Continue Button - Aligned with progress */}
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      onContinue?.()
                    }}
                    size="sm"
                    className="whitespace-nowrap"
                  >
                    {t('course.continue')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Next Module Section */}
        {nextModule && (
          <div className="mt-1 p-3 bg-muted rounded-xl">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Icon 
                  icon={
                    nextModule.type === 'video' ? 'mdi:play-circle' :
                    nextModule.type === 'quiz' ? 'mdi:help-circle' :
                    'mdi:file-document'
                  } 
                  className="h-4 w-4 text-muted-foreground"
                />
                <span className="text-muted-foreground">{t('course.nextModule')}:</span>
                <span className="font-medium">{nextModule.name}</span>
              </div>
              {nextModule.estimatedTime && (
                <span className="text-xs text-muted-foreground">
                  {nextModule.estimatedTime} {t('common.minutes')}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }
  
  // Default vertical mode
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'relative overflow-hidden rounded-xl border bg-card transition-all cursor-pointer',
        isDisabled ? 'opacity-60 pointer-events-none' : 'hover:shadow-lg',
        className
      )}
    >
      {/* Image Banner */}
      <div className="relative h-32 w-full overflow-hidden p-2">
        <div className="relative h-full w-full overflow-hidden rounded-xl bg-gray-50">
          {(displayCourse.picture_url || course?.picture_url) ? (
            <Image
              src={displayCourse.picture_url || course?.picture_url || '/default-course.png'}
              alt={displayCourse.title}
              fill
              className="object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.src = '/default-course.png'
              }}
            />
          ) : (
            <Image
              src="/default-course.png"
              alt="Default course image"
              fill
              className="object-cover"
            />
          )}
        </div>
        
        {/* Category Badge */}
        <Badge 
          variant="secondary" 
          className="absolute top-5 left-5 bg-foreground/80 text-background backdrop-blur-sm"
        >
          {displayCourse.category?.name || defaultCourse.category.name}
        </Badge>
      </div>
      
      {/* Content */}
      <div className="p-3 space-y-2">
        {/* Title */}
        <motion.h3 
          key={displayCourse.title}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-lg font-semibold line-clamp-2 leading-tight"
        >
          {displayCourse.title}
        </motion.h3>
        
        {/* Progress Row */}
        <div className="flex items-center gap-2">
          {/* User Progress */}
          <div className="flex items-center gap-2 flex-1">
            <div className="relative h-10 w-10">
              <svg className="h-10 w-10 -rotate-90">
                <circle
                  cx="20"
                  cy="20"
                  r="16"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  className="text-muted-foreground/20"
                />
                <circle
                  cx="20"
                  cy="20"
                  r="16"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 16}`}
                  strokeDashoffset={`${2 * Math.PI * 16 * (1 - userProgress / 100)}`}
                  className="text-primary transition-all duration-500"
                />
              </svg>
            </div>
            <div>
              <div className="text-sm font-bold">{userProgress}%</div>
              <span className="text-xs text-muted-foreground">
                {t('course.progress')}
              </span>
            </div>
          </div>
          
          <div className="h-8 w-px bg-border" />
          
          {/* Completion Rate */}
          <div className="flex items-center gap-2 flex-1">
            <div className="relative h-10 w-10">
              <svg className="h-10 w-10 -rotate-90">
                <circle
                  cx="20"
                  cy="20"
                  r="16"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  className="text-muted-foreground/20"
                />
                <circle
                  cx="20"
                  cy="20"
                  r="16"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 16}`}
                  strokeDashoffset={`${2 * Math.PI * 16 * (1 - completionRate / 100)}`}
                  className="text-green-500 transition-all duration-500"
                />
              </svg>
            </div>
            <div>
              <div className="text-sm font-bold">{completionRate}%</div>
              <span className="text-xs text-muted-foreground">
                {t('course.completed')}
              </span>
            </div>
          </div>
        </div>
        
        {/* Tags */}
        <div className="flex items-center gap-1">
          <Badge className="py-1 px-2 rounded-md bg-muted text-muted-foreground border-none text-xs">
            {displayCourse.difficulty}
          </Badge>
          <Badge className="py-1 px-2 rounded-md bg-muted text-muted-foreground border-none text-xs">
            <Icon icon="mdi:account-multiple" className="h-3 w-3 mr-1" />
            {displayCourse._count?.course_registrations || 0}
          </Badge>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-muted-foreground truncate">
            {t('course.createdAgo', {
              time: formatDistanceToNow(new Date(displayCourse.created_at), {
                addSuffix: true,
                locale: fr
              })
            })}
          </span>
          
          <span className="text-xs text-muted-foreground">
            {displayCourse._count?.course_modules || 0} {t('course.modules')}
          </span>
          
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 rounded-full"
            disabled={isDisabled}
          >
            <Icon icon="mdi:plus" className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </motion.div>
  )
}