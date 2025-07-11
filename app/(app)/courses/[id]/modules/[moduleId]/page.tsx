'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Icon } from '@iconify/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ModuleSidebar } from '@/components/course/module-sidebar'
import { VideoPlayer } from '@/components/course/video-player'
import { FileViewer } from '@/components/course/file-viewer'
import { QuizPreview } from '@/components/course/quiz-preview'
import { QuizRenderer } from '@/components/course/quiz-renderer'
import { createClient } from '@/lib/supabase/client'

interface ModuleContent {
  id: string
  content_type: 'video' | 'file' | 'quiz'
  title: string
  file_url?: string
  video_url?: string
  video_duration_minutes?: number
  quiz_id?: string
  order_index: number
}

interface Module {
  id: string
  name: string
  order_index: number
  estimated_time_minutes: number
  completed: boolean
  course_id: string
  module_content: ModuleContent[]
}

interface Quiz {
  id: string
  title: string
  description: string
  timer_minutes: number | null
  quiz_questions: any[]
}

export default function ModuleViewerPage() {
  const { t } = useTranslation()
  const params = useParams()
  const router = useRouter()
  
  const courseId = params.id as string
  const moduleId = params.moduleId as string
  
  const [modules, setModules] = useState<Module[]>([])
  const [currentModule, setCurrentModule] = useState<Module | null>(null)
  const [currentContent, setCurrentContent] = useState<ModuleContent | null>(null)
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null)
  const [quizAttempts, setQuizAttempts] = useState(0)
  const [showQuiz, setShowQuiz] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isRegistered, setIsRegistered] = useState(false)
  const [moduleProgress, setModuleProgress] = useState<Record<string, boolean>>({})
  const supabase = createClient()

  useEffect(() => {
    loadModuleData()
  }, [courseId, moduleId])

  async function loadModuleData() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Check if user is registered for this course
      const { data: registration } = await supabase
        .from('course_registrations')
        .select('id')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .single()

      if (!registration) {
        router.push(`/courses/${courseId}`)
        return
      }
      setIsRegistered(true)

      // Load all course modules
      const { data: modulesData } = await supabase
        .from('course_modules')
        .select(`
          *,
          module_content(*)
        `)
        .eq('course_id', courseId)
        .order('order_index', { ascending: true })

      if (modulesData) {
        // Load module progress
        const moduleIds = modulesData.map(m => m.id)
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

        const modulesWithProgress = modulesData.map(module => ({
          ...module,
          completed: progressMap[module.id] || false,
          module_content: module.module_content.sort((a: any, b: any) => a.order_index - b.order_index)
        }))

        setModules(modulesWithProgress)

        // Find current module
        const current = modulesWithProgress.find(m => m.id === moduleId)
        if (current) {
          setCurrentModule(current)
          // Set first content as default
          if (current.module_content.length > 0) {
            setCurrentContent(current.module_content[0])
            await loadContentData(current.module_content[0])
          }
        }
      }
    } catch (error) {
      console.error('Error loading module data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadContentData(content: ModuleContent) {
    if (content.content_type === 'quiz' && content.quiz_id) {
      // Load quiz data
      const { data: quizData } = await supabase
        .from('quizzes')
        .select(`
          *,
          quiz_questions(
            *,
            question_choices(*)
          )
        `)
        .eq('id', content.quiz_id)
        .single()

      if (quizData) {
        setCurrentQuiz(quizData)

        // Load user's quiz attempts
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: attempts } = await supabase
            .from('quiz_attempts')
            .select('id')
            .eq('user_id', user.id)
            .eq('quiz_id', content.quiz_id)

          setQuizAttempts(attempts?.length || 0)
        }
      }
    }
    setShowQuiz(false)
  }

  async function handleContentSelect(selectedModuleId: string, contentId: string) {
    const module = modules.find(m => m.id === selectedModuleId)
    if (!module) return

    setCurrentModule(module)
    const content = module.module_content.find(c => c.id === contentId)
    if (content) {
      setCurrentContent(content)
      await loadContentData(content)
    }

    // Update URL
    router.push(`/courses/${courseId}/modules/${selectedModuleId}`)
  }

  async function markModuleCompleted() {
    if (!currentModule) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    try {
      await supabase
        .from('module_progress')
        .upsert({
          user_id: user.id,
          module_id: currentModule.id,
          completed: true,
          completed_at: new Date().toISOString()
        })

      // Update local state
      setModuleProgress(prev => ({
        ...prev,
        [currentModule.id]: true
      }))

      setModules(prev => prev.map(m => 
        m.id === currentModule.id ? { ...m, completed: true } : m
      ))

      // Move to next module
      const currentIndex = modules.findIndex(m => m.id === currentModule.id)
      if (currentIndex < modules.length - 1) {
        const nextModule = modules[currentIndex + 1]
        router.push(`/courses/${courseId}/modules/${nextModule.id}`)
      } else {
        // Course completed
        router.push(`/courses/${courseId}`)
      }
    } catch (error) {
      console.error('Error marking module completed:', error)
    }
  }

  function handleQuizComplete(score: number, needsCorrection: boolean) {
    setShowQuiz(false)
    setQuizAttempts(prev => prev + 1)
    
    if (!needsCorrection && score >= 70) {
      // Auto-complete module if quiz passed
      markModuleCompleted()
    }
  }

  function handleVideoEnd() {
    // Auto-complete module when video ends
    if (currentContent?.content_type === 'video') {
      markModuleCompleted()
    }
  }

  function handleFileDownload() {
    // Mark as viewed when file is downloaded
    if (currentContent?.content_type === 'file') {
      markModuleCompleted()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Icon icon="mdi:loading" className="animate-spin h-8 w-8" />
      </div>
    )
  }

  if (!isRegistered || !currentModule || !currentContent) {
    return (
      <div className="text-center py-12">
        <Icon icon="mdi:alert-circle" className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-600">{t('courses.moduleNotFound')}</h2>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <ModuleSidebar
        modules={modules}
        currentModuleId={moduleId}
        currentContentId={currentContent.id}
        courseId={courseId}
        onContentSelect={handleContentSelect}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{currentModule.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">{currentContent.title}</Badge>
                <Badge variant={currentModule.completed ? "default" : "secondary"}>
                  {currentModule.completed ? t('common.completed') : t('common.inProgress')}
                </Badge>
              </div>
            </div>
            
            {!currentModule.completed && (
              <Button onClick={markModuleCompleted}>
                <Icon icon="mdi:check" className="h-4 w-4 mr-2" />
                {t('courses.markCompleted')}
              </Button>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {showQuiz && currentQuiz ? (
            <QuizRenderer
              quiz={currentQuiz}
              onComplete={handleQuizComplete}
              onCancel={() => setShowQuiz(false)}
            />
          ) : (
            <>
              {currentContent.content_type === 'video' && currentContent.video_url && (
                <VideoPlayer
                  videoUrl={currentContent.video_url}
                  title={currentContent.title}
                  onVideoEnd={handleVideoEnd}
                />
              )}

              {currentContent.content_type === 'file' && currentContent.file_url && (
                <FileViewer
                  fileUrl={currentContent.file_url}
                  title={currentContent.title}
                  onDownload={handleFileDownload}
                />
              )}

              {currentContent.content_type === 'quiz' && currentQuiz && (
                <QuizPreview
                  quiz={currentQuiz}
                  attempts={quizAttempts}
                  onStartQuiz={() => setShowQuiz(true)}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}