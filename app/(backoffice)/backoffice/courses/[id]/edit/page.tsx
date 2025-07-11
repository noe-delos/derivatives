'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useRouter, useParams } from 'next/navigation'
import { Icon } from '@iconify/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { createClient } from '@/lib/supabase/client'
import { CoursePreviewCard } from '@/components/course-preview-card'
import { TiptapEditor } from '@/components/editor/tiptap-editor'
import { cn } from '@/lib/utils'

interface Category {
  id: string
  name: string
}

interface Module {
  id: string
  name: string
  order_index: number
  estimated_time_minutes: number
  module_content: ModuleContent[]
}

interface ModuleContent {
  id: string
  content_type: 'video' | 'file' | 'quiz'
  title: string | null
  file_url: string | null
  video_url: string | null
  video_duration_minutes: number | null
  quiz_id: string | null
  order_index: number
}

interface Course {
  id: string
  title: string
  description: string | null
  category_id: string | null
  picture_url: string | null
  notes: string | null
  difficulty: string | null
  order_index: number
  is_published: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export default function EditCoursePage() {
  const { t } = useTranslation()
  const router = useRouter()
  const params = useParams()
  const courseId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [course, setCourse] = useState<Course | null>(null)
  const [modules, setModules] = useState<Module[]>([])
  
  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [pictureFile, setPictureFile] = useState<File | null>(null)
  const [pictureUrl, setPictureUrl] = useState('')
  const [uploadingPicture, setUploadingPicture] = useState(false)
  const [notes, setNotes] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [orderIndex, setOrderIndex] = useState(1)
  const [isPublished, setIsPublished] = useState(false)
  
  // Module creation state
  const [showModuleDialog, setShowModuleDialog] = useState(false)
  const [showModuleDetailDialog, setShowModuleDetailDialog] = useState(false)
  const [currentModule, setCurrentModule] = useState<Partial<Module>>({})
  const [selectedModule, setSelectedModule] = useState<Module | null>(null)
  const [moduleFiles, setModuleFiles] = useState<File[]>([])
  const [uploadingModuleFiles, setUploadingModuleFiles] = useState(false)
  
  // Delete confirmation
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [moduleToDelete, setModuleToDelete] = useState<string | null>(null)
  
  const supabase = createClient()

  useEffect(() => {
    loadCourse()
    loadCategories()
  }, [courseId])

  async function loadCourse() {
    try {
      setLoading(true)
      
      // Load course data
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single()

      if (courseError) throw courseError

      setCourse(courseData)
      setTitle(courseData.title)
      setDescription(courseData.description || '')
      setCategoryId(courseData.category_id || '')
      setPictureUrl(courseData.picture_url || '')
      setNotes(courseData.notes || '')
      setDifficulty(courseData.difficulty || '')
      setOrderIndex(courseData.order_index)
      setIsPublished(courseData.is_published)

      // Load modules with content
      const { data: modulesData, error: modulesError } = await supabase
        .from('course_modules')
        .select(`
          *,
          module_content (*)
        `)
        .eq('course_id', courseId)
        .order('order_index')

      if (modulesError) throw modulesError

      setModules(modulesData || [])
    } catch (error) {
      console.error('Error loading course:', error)
      alert(t('course.errorLoading'))
    } finally {
      setLoading(false)
    }
  }

  async function loadCategories() {
    try {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .order('name')

      if (data) {
        setCategories(data)
      }
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  async function uploadPicture(file: File): Promise<string | null> {
    try {
      setUploadingPicture(true)
      
      const fileExt = file.name.split('.').pop()
      const fileName = `course-${courseId}-${Date.now()}.${fileExt}`
      
      const { data, error } = await supabase.storage
        .from('course-pictures')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('course-pictures')
        .getPublicUrl(fileName)

      return publicUrl
    } catch (error) {
      console.error('Error uploading picture:', error)
      alert(t('course.errorUploadingPicture'))
      return null
    } finally {
      setUploadingPicture(false)
    }
  }

  async function uploadModuleFiles(files: File[], moduleId: string): Promise<string[]> {
    const uploadedUrls: string[] = []
    
    for (const file of files) {
      try {
        const fileExt = file.name.split('.').pop()
        const fileName = `module-${moduleId}-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        
        const { data, error } = await supabase.storage
          .from('course-content')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (error) throw error

        const { data: { publicUrl } } = supabase.storage
          .from('course-content')
          .getPublicUrl(fileName)

        uploadedUrls.push(publicUrl)
      } catch (error) {
        console.error('Error uploading file:', error)
      }
    }
    
    return uploadedUrls
  }

  function handlePictureChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert(t('course.selectImageFile'))
        return
      }
      
      if (file.size > 5 * 1024 * 1024) {
        alert(t('course.fileSizeLimit'))
        return
      }

      setPictureFile(file)
      const previewUrl = URL.createObjectURL(file)
      setPictureUrl(previewUrl)
    }
  }

  function handleModuleFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    setModuleFiles(files)
  }

  async function saveCourse() {
    if (!title || !categoryId || !difficulty) {
      alert(t('course.fillRequiredFields'))
      return
    }

    setSaving(true)
    try {
      let finalPictureUrl = pictureUrl
      
      if (pictureFile) {
        const uploadedUrl = await uploadPicture(pictureFile)
        if (uploadedUrl) {
          finalPictureUrl = uploadedUrl
        }
      }

      await supabase
        .from('courses')
        .update({
          title,
          description,
          category_id: categoryId,
          picture_url: finalPictureUrl,
          notes,
          difficulty,
          order_index: orderIndex,
          is_published: isPublished,
        })
        .eq('id', courseId)

      alert(t('course.savedSuccessfully'))
      router.push('/backoffice/courses')
    } catch (error) {
      console.error('Error saving course:', error)
      alert(t('course.errorSaving'))
    } finally {
      setSaving(false)
    }
  }

  async function createOrUpdateModule() {
    if (!currentModule.name) return

    try {
      setUploadingModuleFiles(true)
      
      let moduleData
      
      if (currentModule.id) {
        // Update existing module
        await supabase
          .from('course_modules')
          .update({
            name: currentModule.name,
            estimated_time_minutes: currentModule.estimated_time_minutes || 0,
          })
          .eq('id', currentModule.id)
        
        moduleData = { id: currentModule.id }
      } else {
        // Create new module
        const { data: newModule, error: moduleError } = await supabase
          .from('course_modules')
          .insert({
            course_id: courseId,
            name: currentModule.name,
            order_index: modules.length + 1,
            estimated_time_minutes: currentModule.estimated_time_minutes || 0,
          })
          .select()
          .single()

        if (moduleError) throw moduleError
        moduleData = newModule
      }

      // Upload files and create module content
      if (moduleFiles.length > 0) {
        const uploadedUrls = await uploadModuleFiles(moduleFiles, moduleData.id)
        
        // Create module content entries for uploaded files
        const contentData = uploadedUrls.map((url, index) => ({
          module_id: moduleData.id,
          content_type: 'file' as const,
          title: moduleFiles[index].name,
          file_url: url,
          order_index: index + 1,
        }))

        await supabase
          .from('module_content')
          .insert(contentData)
      }

      // Reload modules
      await loadCourse()
      setCurrentModule({})
      setModuleFiles([])
      setShowModuleDialog(false)
      setShowModuleDetailDialog(false)
    } catch (error) {
      console.error('Error creating/updating module:', error)
      alert(t('course.errorCreating'))
    } finally {
      setUploadingModuleFiles(false)
    }
  }

  async function deleteModule() {
    if (!moduleToDelete) return

    try {
      await supabase
        .from('course_modules')
        .delete()
        .eq('id', moduleToDelete)

      setModules(modules.filter(m => m.id !== moduleToDelete))
      setShowDeleteDialog(false)
      setModuleToDelete(null)
    } catch (error) {
      console.error('Error deleting module:', error)
      alert(t('course.errorDeleting'))
    }
  }

  function openModuleDetail(module: Module) {
    setSelectedModule(module)
    setCurrentModule(module)
    setShowModuleDetailDialog(true)
  }

  function confirmDeleteModule(moduleId: string) {
    setModuleToDelete(moduleId)
    setShowDeleteDialog(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Icon icon="mdi:loading" className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  // Build preview course object
  const previewCourse = {
    ...(title && { title }),
    ...(description && { description }),
    ...(categoryId && categories.find(c => c.id === categoryId) && { category: categories.find(c => c.id === categoryId) }),
    ...(pictureUrl && { picture_url: pictureUrl }),
    ...(difficulty && { difficulty }),
    created_at: course?.created_at || new Date().toISOString(),
    _count: {
      course_modules: modules.length,
      course_registrations: 0
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <Icon icon="mdi:arrow-left" className="h-4 w-4 mr-2" />
          {t('common.back')}
        </Button>
        <div>
          <h1 className="text-3xl font-medium text-gray-900">{t('backoffice.editCourse')}</h1>
          <p className="text-gray-600 mt-2">{course?.title}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Form on the left (3/5 width) */}
        <div className="lg:col-span-3 space-y-6">
          <h2 className="text-xl font-semibold mb-6">{t('backoffice.courseInformation')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="title">
                {t('backoffice.title')} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('course.courseTitlePlaceholder')}
                className="py-5 rounded-xl shadow-soft bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">
                {t('common.category')} <span className="text-red-500">*</span>
              </Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="py-5 rounded-xl shadow-soft bg-background">
                  <SelectValue placeholder={t('course.selectCategory')} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">
                {t('common.difficulty')} <span className="text-red-500">*</span>
              </Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger className="py-5 rounded-xl shadow-soft bg-background">
                  <SelectValue placeholder={t('course.selectDifficulty')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Beginner">{t('common.beginner')}</SelectItem>
                  <SelectItem value="Intermediate">{t('common.intermediate')}</SelectItem>
                  <SelectItem value="Advanced">{t('common.advanced')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="orderIndex">{t('common.order')}</Label>
              <Input
                id="orderIndex"
                type="number"
                value={orderIndex}
                onChange={(e) => setOrderIndex(parseInt(e.target.value))}
                min="1"
                className="py-5 rounded-xl shadow-soft bg-background"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('common.description')}</Label>
            <div className="rounded-xl shadow-soft bg-background">
              <TiptapEditor
                content={description}
                onChange={setDescription}
                placeholder={t('course.courseDescriptionPlaceholder')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="picture">{t('course.coursePicture')}</Label>
            <div className="space-y-4">
              <div
                className={`relative w-full h-48 border-2 border-dashed rounded-xl transition-colors cursor-pointer ${
                  pictureUrl
                    ? 'border-gray-300 bg-gray-50'
                    : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
                }`}
                onClick={() => document.getElementById('picture')?.click()}
                onDrop={(e) => {
                  e.preventDefault()
                  const file = e.dataTransfer.files[0]
                  if (file && file.type.startsWith('image/')) {
                    const event = { target: { files: [file] } } as any
                    handlePictureChange(event)
                  }
                }}
                onDragOver={(e) => e.preventDefault()}
              >
                {pictureUrl ? (
                  <>
                    <img
                      src={pictureUrl}
                      alt={t('course.previewAlt')}
                      className="w-full h-full object-cover rounded-xl"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8 bg-red-500/80 text-white hover:bg-red-600/90 backdrop-blur-sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setPictureFile(null)
                        setPictureUrl('')
                      }}
                    >
                      <Icon icon="mdi:close" className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <img
                      src="/image-placeholder.png"
                      alt="Upload placeholder"
                      className="w-10 h-10 mb-3 opacity-60"
                    />
                    <p className="text-sm font-medium mb-1">
                      {t('course.clickToUpload')}
                    </p>
                    <p className="text-xs text-gray-400">
                      {t('course.dragAndDropSupported')}
                    </p>
                  </div>
                )}
              </div>
              <Input
                id="picture"
                type="file"
                accept="image/*"
                onChange={handlePictureChange}
                className="hidden"
              />
              {uploadingPicture && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Icon icon="mdi:loading" className="animate-spin h-4 w-4" />
                  {t('course.uploadingPicture')}
                </div>
              )}
              <p className="text-xs text-gray-500">
                {t('course.pictureRequirements')}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">{t('backoffice.notes')}</Label>
            <div className="rounded-xl shadow-soft bg-background">
              <TiptapEditor
                content={notes}
                onChange={setNotes}
                placeholder={t('course.courseNotesPlaceholder')}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isPublished"
              checked={isPublished}
              onCheckedChange={setIsPublished}
            />
            <Label htmlFor="isPublished">{t('course.publishCourse')}</Label>
          </div>
        </div>

        {/* Preview on the right (2/5 width) */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-semibold">{t('backoffice.preview')}</h3>
          <div className="scale-75 origin-top">
            <CoursePreviewCard
              course={previewCourse}
              userProgress={0}
              completionRate={85}
              isDisabled={true}
              isPreview={true}
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={saveCourse} disabled={saving}>
              {saving ? (
                <Icon icon="mdi:loading" className="animate-spin h-4 w-4 mr-2" />
              ) : (
                <Icon icon="mdi:content-save" className="h-4 w-4 mr-2" />
              )}
              {t('common.save')}
            </Button>
          </div>
        </div>
      </div>

      {/* Modules Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {t('backoffice.courseModules')}
            <Button size="sm" onClick={() => setShowModuleDialog(true)}>
              <Icon icon="mdi:plus" className="h-4 w-4 mr-2" />
              {t('course.addModule')}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
              {modules.length === 0 ? (
                <div className="text-center py-8">
                  <Icon icon="mdi:book-outline" className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-sm font-medium text-gray-900 mb-2">{t('course.noModules')}</h3>
                  <p className="text-xs text-gray-500 mb-4">{t('course.addFirstModule')}</p>
                  <Button size="sm" onClick={() => setShowModuleDialog(true)}>
                    <Icon icon="mdi:plus" className="h-4 w-4 mr-2" />
                    {t('course.addModule')}
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {modules.map((module) => (
                    <Card key={module.id} className="hover:shadow-sm transition-shadow">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1">
                            <Badge variant="outline" className="text-xs">#{module.order_index}</Badge>
                            <h4 className="font-medium text-sm truncate">{module.name}</h4>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">{module.estimated_time_minutes}min</span>
                            <span className="text-xs text-gray-500">•</span>
                            <span className="text-xs text-gray-500">{module.module_content?.length || 0} items</span>
                            <div className="flex gap-1 ml-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openModuleDetail(module)}
                                className="h-6 w-6 text-blue-500 hover:text-blue-700"
                              >
                                <Icon icon="mdi:pencil" className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => confirmDeleteModule(module.id)}
                                className="h-6 w-6 text-red-500 hover:text-red-700"
                              >
                                <Icon icon="mdi:delete" className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
        </CardContent>
      </Card>

      {/* Add Module Dialog */}
      <Dialog open={showModuleDialog} onOpenChange={setShowModuleDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('course.addModule')}</DialogTitle>
            <DialogDescription>{t('course.addModuleDescription')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="moduleName">{t('course.moduleName')}</Label>
              <Input
                id="moduleName"
                value={currentModule.name || ''}
                onChange={(e) => setCurrentModule({ ...currentModule, name: e.target.value })}
                placeholder={t('course.moduleNamePlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimatedTime">{t('course.estimatedTimeMinutes')}</Label>
              <Input
                id="estimatedTime"
                type="number"
                value={currentModule.estimated_time_minutes || ''}
                onChange={(e) => setCurrentModule({ ...currentModule, estimated_time_minutes: parseInt(e.target.value) })}
                placeholder={t('course.defaultDurationPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="moduleFiles">{t('course.moduleFiles')}</Label>
              <Input
                id="moduleFiles"
                type="file"
                multiple
                onChange={handleModuleFilesChange}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {moduleFiles.length > 0 && (
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">{t('course.selectedFiles')}:</p>
                  {moduleFiles.map((file, index) => (
                    <div key={index} className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                      {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowModuleDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={createOrUpdateModule} disabled={uploadingModuleFiles}>
              {uploadingModuleFiles ? (
                <Icon icon="mdi:loading" className="animate-spin h-4 w-4 mr-2" />
              ) : (
                <Icon icon="mdi:plus" className="h-4 w-4 mr-2" />
              )}
              {t('course.addModule')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Module Detail Dialog */}
      <Dialog open={showModuleDetailDialog} onOpenChange={setShowModuleDetailDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('course.editModule')}: {selectedModule?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('course.moduleName')}</Label>
                <Input
                  value={currentModule.name || ''}
                  onChange={(e) => setCurrentModule({ ...currentModule, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('course.estimatedTimeMinutes')}</Label>
                <Input
                  type="number"
                  value={currentModule.estimated_time_minutes || ''}
                  onChange={(e) => setCurrentModule({ ...currentModule, estimated_time_minutes: parseInt(e.target.value) })}
                />
              </div>
            </div>

            {/* Module Content */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">{t('course.moduleContent')}</h3>
                <Button size="sm" variant="outline">
                  <Icon icon="mdi:plus" className="h-4 w-4 mr-2" />
                  {t('course.addContent')}
                </Button>
              </div>
              
              {selectedModule?.module_content && selectedModule.module_content.length > 0 ? (
                <div className="space-y-2">
                  {selectedModule.module_content.map((content) => (
                    <div key={content.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Icon 
                          icon={
                            content.content_type === 'video' ? 'mdi:play-circle' :
                            content.content_type === 'file' ? 'mdi:file-document' :
                            'mdi:quiz'
                          } 
                          className={cn(
                            "h-5 w-5",
                            content.content_type === 'video' && "text-red-500",
                            content.content_type === 'file' && "text-blue-500",
                            content.content_type === 'quiz' && "text-green-500"
                          )}
                        />
                        <div>
                          <p className="font-medium text-sm">{content.title || `${content.content_type} content`}</p>
                          <p className="text-xs text-gray-500 capitalize">{content.content_type}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <Icon icon="mdi:pencil" className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500">
                          <Icon icon="mdi:delete" className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <Icon icon="mdi:file-plus" className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">{t('course.noContentYet')}</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>{t('course.addMoreFiles')}</Label>
              <Input
                type="file"
                multiple
                onChange={handleModuleFilesChange}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowModuleDetailDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={createOrUpdateModule} disabled={uploadingModuleFiles}>
              {uploadingModuleFiles ? (
                <Icon icon="mdi:loading" className="animate-spin h-4 w-4 mr-2" />
              ) : (
                <Icon icon="mdi:content-save" className="h-4 w-4 mr-2" />
              )}
              {t('common.save')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('course.confirmDeleteModule')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('course.deleteModuleWarning')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={deleteModule} className="bg-red-600 hover:bg-red-700">
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}