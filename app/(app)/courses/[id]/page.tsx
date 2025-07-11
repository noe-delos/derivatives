'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import Image from 'next/image'
import { Icon } from '@iconify/react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CourseRegistration } from '@/components/course/course-registration'
import { CourseModules } from '@/components/course/course-modules'
import { CourseReviews } from '@/components/course/course-reviews'
import { createClient } from '@/lib/supabase/client'

interface Course {
  id: string
  title: string
  description: string
  notes: string
  picture_url: string
  difficulty: string
  category: {
    name: string
  }
  course_modules: any[]
}

export default function CoursePage() {
  const { t } = useTranslation()
  const params = useParams()
  const router = useRouter()
  const courseId = params.id as string
  
  const [course, setCourse] = useState<Course | null>(null)
  const [isRegistered, setIsRegistered] = useState(false)
  const [userSubscription, setUserSubscription] = useState('free')
  const [moduleProgress, setModuleProgress] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadCourse()
  }, [courseId])

  async function loadCourse() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      // Load course details
      const { data: courseData } = await supabase
        .from('courses')
        .select(`
          *,
          category:categories(name),
          course_modules(
            *,
            module_content(*)
          )
        `)
        .eq('id', courseId)
        .eq('is_published', true)
        .single()

      if (!courseData) {
        router.push('/courses')
        return
      }

      setCourse(courseData)

      if (user) {
        // Check user subscription and registration
        const { data: userData } = await supabase
          .from('users')
          .select('subscription_type')
          .eq('id', user.id)
          .single()

        if (userData) {
          setUserSubscription(userData.subscription_type)
        }

        // Check if user is registered for this course
        const { data: registration } = await supabase
          .from('course_registrations')
          .select('id')
          .eq('user_id', user.id)
          .eq('course_id', courseId)
          .single()

        setIsRegistered(!!registration)

        // Load module progress
        if (registration) {
          const moduleIds = courseData.course_modules.map(m => m.id)
          const { data: progressData } = await supabase
            .from('module_progress')
            .select('module_id, completed')
            .eq('user_id', user.id)
            .in('module_id', moduleIds)

          const progressMap: Record<string, boolean> = {}
          progressData?.forEach(p => {
            progressMap[p.module_id] = p.completed
          })
          setModuleProgress(progressMap)
        }
      }
    } catch (error) {
      console.error('Error loading course:', error)
    } finally {
      setLoading(false)
    }
  }

  function handleModuleClick(moduleId: string) {
    if (isRegistered) {
      router.push(`/courses/${courseId}/modules/${moduleId}`)
    }
  }

  function handleStartCourse() {
    if (isRegistered && course?.course_modules.length > 0) {
      const firstModule = course.course_modules.sort((a, b) => a.order_index - b.order_index)[0]
      router.push(`/courses/${courseId}/modules/${firstModule.id}`)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Icon icon="mdi:loading" className="animate-spin h-8 w-8" />
      </div>
    )
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <Icon icon="mdi:alert-circle" className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-600">{t('courses.courseNotFound')}</h2>
      </div>
    )
  }

  const modulesWithProgress = course.course_modules
    .sort((a, b) => a.order_index - b.order_index)
    .map(module => ({
      ...module,
      completed: moduleProgress[module.id] || false
    }))

  const totalModules = modulesWithProgress.length
  const completedModules = modulesWithProgress.filter(m => m.completed).length
  const courseProgress = totalModules > 0 ? (completedModules / totalModules) * 100 : 0

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Course Header */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Course Image and Info */}
        <div>
          <div className="relative h-64 w-full rounded-lg overflow-hidden mb-4">
            {course.picture_url ? (
              <img
                src={course.picture_url}
                alt={course.title}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600" />
            )}
            {!isRegistered && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="text-center text-white">
                  <Icon icon="mdi:lock" className="h-16 w-16 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold">{t('common.locked')}</h3>
                </div>
              </div>
            )}
          </div>

          {/* Course Title and Meta */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">{course.title}</h1>
            <div className="flex items-center gap-3">
              <Badge variant="secondary">{course.category.name}</Badge>
              {course.difficulty && (
                <Badge variant="outline">{course.difficulty}</Badge>
              )}
              <span className="text-sm text-gray-600">
                {totalModules} {t('common.modules')}
              </span>
            </div>
            {isRegistered && courseProgress > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{t('courses.courseProgress')}:</span>
                <span className="text-sm font-medium">{Math.round(courseProgress)}%</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <CourseRegistration
              courseId={courseId}
              isRegistered={isRegistered}
              userSubscription={userSubscription}
              onRegistrationChange={setIsRegistered}
            />
            {isRegistered && (
              <Button onClick={handleStartCourse}>
                <Icon icon="mdi:play" className="h-4 w-4 mr-2" />
                {courseProgress > 0 ? t('courses.continueCourse') : t('courses.startCourse')}
              </Button>
            )}
          </div>
        </div>

        {/* Modules List */}
        <CourseModules
          modules={modulesWithProgress}
          isRegistered={isRegistered}
          onClick={handleModuleClick}
        />
      </div>

      {/* Course Content Tabs */}
      <Tabs defaultValue="information" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="information">{t('courses.courseInformation')}</TabsTrigger>
          <TabsTrigger value="reviews">{t('courses.courseReviews')}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="information" className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">{t('courses.description')}</h3>
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">{course.description}</p>
              </div>
            </CardContent>
          </Card>

          {course.notes && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">{t('courses.courseNotes')}</h3>
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">{course.notes}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="reviews">
          <CourseReviews courseId={courseId} isRegistered={isRegistered} />
        </TabsContent>
      </Tabs>
    </div>
  )
}