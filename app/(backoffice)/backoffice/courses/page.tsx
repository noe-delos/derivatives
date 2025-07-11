'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRouter } from 'next/navigation'
import { Icon } from '@iconify/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import { CoursePreviewCard } from '@/components/course-preview-card'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Course {
  id: string
  title: string
  description: string
  difficulty: string
  picture_url: string
  is_published: boolean
  order_index: number
  created_at: string
  category: {
    name: string
  }
  course_modules: any[]
  course_registrations: any[]
  _count?: {
    course_modules: number
    course_registrations: number
  }
}

export default function CoursesManagementPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadCourses()
  }, [])

  useEffect(() => {
    const filtered = courses.filter(course =>
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.difficulty.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredCourses(filtered)
  }, [courses, searchTerm])

  async function loadCourses() {
    try {
      const { data } = await supabase
        .from('courses')
        .select(`
          *,
          category:categories(name),
          course_modules(id),
          course_registrations(id)
        `)
        .order('order_index', { ascending: true })

      if (data) {
        const coursesWithCount = data.map(course => ({
          ...course,
          _count: {
            course_modules: course.course_modules?.length || 0,
            course_registrations: course.course_registrations?.length || 0
          }
        }))
        setCourses(coursesWithCount)
      }
    } catch (error) {
      console.error('Error loading courses:', error)
    } finally {
      setLoading(false)
    }
  }

  async function togglePublishStatus(courseId: string, isPublished: boolean) {
    try {
      await supabase
        .from('courses')
        .update({ is_published: !isPublished })
        .eq('id', courseId)

      setCourses(courses.map(course =>
        course.id === courseId ? { ...course, is_published: !isPublished } : course
      ))
    } catch (error) {
      console.error('Error updating course status:', error)
    }
  }

  async function deleteCourse(courseId: string) {
    try {
      await supabase
        .from('courses')
        .delete()
        .eq('id', courseId)

      setCourses(courses.filter(course => course.id !== courseId))
      setShowDeleteDialog(false)
      setSelectedCourse(null)
    } catch (error) {
      console.error('Error deleting course:', error)
    }
  }

  async function updateCourseOrder(courseId: string, newOrder: number) {
    try {
      await supabase
        .from('courses')
        .update({ order_index: newOrder })
        .eq('id', courseId)

      loadCourses() // Reload to get updated order
    } catch (error) {
      console.error('Error updating course order:', error)
    }
  }

  function handleCreateCourse() {
    router.push('/backoffice/courses/create')
  }

  function handleEditCourse(courseId: string) {
    router.push(`/backoffice/courses/${courseId}/edit`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Icon icon="mdi:loading" className="animate-spin h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('backoffice.courseManagement')}</h1>
          <p className="text-gray-600 mt-2">{t('backoffice.manageCourses')}</p>
        </div>
        <Button onClick={handleCreateCourse}>
          <Icon icon="mdi:plus" className="h-4 w-4 mr-2" />
          {t('backoffice.createCourse')}
        </Button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Icon icon="mdi:magnify" className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('backoffice.searchCourses')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 py-5 rounded-xl shadow-soft bg-background"
          />
        </div>
        <Badge variant="secondary" className="py-2 px-4 text-sm">
          {filteredCourses.length} {t('backoffice.courses')}
        </Badge>
      </div>

      {/* Courses Grid */}
      {filteredCourses.length === 0 ? (
        <div className="text-center py-16">
          <Icon icon="mdi:book-outline" className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">{t('backoffice.noCourses')}</h3>
          <p className="text-gray-500 mb-6">{t('backoffice.createFirstCourse')}</p>
          <Button onClick={handleCreateCourse}>
            <Icon icon="mdi:plus" className="h-4 w-4 mr-2" />
            {t('backoffice.createCourse')}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredCourses.map((course) => (
            <div key={course.id} className="group relative cursor-pointer">
              <CoursePreviewCard
                course={course}
                userProgress={0}
                completionRate={85}
                isDisabled={false}
                className="h-64 w-full"
              />
              
              {/* Status Badge */}
              <div className="absolute top-2 right-2">
                <Badge 
                  variant={course.is_published ? "default" : "secondary"}
                  className="shadow-md"
                >
                  {course.is_published ? t('backoffice.published') : t('backoffice.draft')}
                </Badge>
              </div>

              {/* Action Buttons Overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl flex flex-col items-center justify-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => router.push(`/backoffice/courses/${course.id}`)}
                  className="bg-white/90 text-black hover:bg-white"
                >
                  <Icon icon="mdi:cog" className="h-4 w-4 mr-1" />
                  {t('backoffice.manage')}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleEditCourse(course.id)}
                  className="bg-white/90 text-black hover:bg-white"
                >
                  <Icon icon="mdi:pencil" className="h-4 w-4 mr-1" />
                  {t('common.edit')}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      size="sm" 
                      variant="secondary"
                      className="bg-white/90 text-black hover:bg-white px-2"
                    >
                      <Icon icon="mdi:dots-vertical" className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      onClick={() => togglePublishStatus(course.id, course.is_published)}
                    >
                      <Icon 
                        icon={course.is_published ? 'mdi:eye-off' : 'mdi:eye'} 
                        className="h-4 w-4 mr-2" 
                      />
                      {course.is_published ? t('backoffice.unpublish') : t('backoffice.publish')}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => router.push(`/courses/${course.id}`)}
                    >
                      <Icon icon="mdi:eye" className="h-4 w-4 mr-2" />
                      {t('backoffice.preview')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => {
                        setSelectedCourse(course)
                        setShowDeleteDialog(true)
                      }}
                      className="text-red-600"
                    >
                      <Icon icon="mdi:delete" className="h-4 w-4 mr-2" />
                      {t('common.delete')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Order Index */}
              <div className="absolute bottom-2 left-2">
                <Badge variant="outline" className="bg-background/90 backdrop-blur-sm">
                  #{course.order_index}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('backoffice.deleteCourse')}</DialogTitle>
            <DialogDescription>
              {t('backoffice.deleteCourseConfirm', { title: selectedCourse?.title })}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => selectedCourse && deleteCourse(selectedCourse.id)}
            >
              {t('common.delete')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}