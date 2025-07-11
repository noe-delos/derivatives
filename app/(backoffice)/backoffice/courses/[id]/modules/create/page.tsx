'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useRouter, useParams } from 'next/navigation'
import { Icon } from '@iconify/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { createClient } from '@/lib/supabase/client'

interface Course {
  id: string
  title: string
}

interface UploadedFile {
  name: string
  url: string
  size: number
  type: string
}

export default function CreateModulePage() {
  const { t } = useTranslation()
  const router = useRouter()
  const params = useParams()
  const courseId = params.id as string
  const [loading, setLoading] = useState(false)
  const [course, setCourse] = useState<Course | null>(null)
  const [moduleName, setModuleName] = useState('')
  const [estimatedTime, setEstimatedTime] = useState<number>(30)
  const [activeTab, setActiveTab] = useState('video')
  const supabase = createClient()

  // Video upload state
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoUrl, setVideoUrl] = useState('')
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [videoDuration, setVideoDuration] = useState<number | null>(null)

  // File upload state
  const [attachmentFiles, setAttachmentFiles] = useState<UploadedFile[]>([])
  const [uploadingFiles, setUploadingFiles] = useState(false)

  useEffect(() => {
    loadCourseData()
  }, [courseId])

  async function loadCourseData() {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title')
        .eq('id', courseId)
        .single()

      if (error) throw error
      setCourse(data)
    } catch (error) {
      console.error('Error loading course:', error)
      router.push('/backoffice/courses')
    }
  }

  function handleVideoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('video/')) {
        alert(t('module.selectVideoFile'))
        return
      }
      
      // Validate file size (max 100MB)
      if (file.size > 100 * 1024 * 1024) {
        alert(t('module.videoSizeLimit'))
        return
      }

      setVideoFile(file)
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file)
      setVideoUrl(previewUrl)

      // Get video duration
      const video = document.createElement('video')
      video.preload = 'metadata'
      video.onloadedmetadata = () => {
        const duration = Math.round(video.duration / 60) // Convert to minutes
        setVideoDuration(duration)
        setEstimatedTime(duration) // Auto-set estimated time for videos
      }
      video.src = previewUrl
    }
  }

  async function uploadVideo(file: File): Promise<string | null> {
    try {
      setUploadingVideo(true)
      
      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `module-video-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('course-videos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Error uploading video:', error)
        alert(t('module.errorUploadingVideo'))
        return null
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('course-videos')
        .getPublicUrl(fileName)

      return publicUrl
    } catch (error) {
      console.error('Error uploading video:', error)
      alert(t('module.errorUploadingVideo'))
      return null
    } finally {
      setUploadingVideo(false)
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    
    // Validate each file
    for (const file of files) {
      // Validate file size (max 10MB per file)
      if (file.size > 10 * 1024 * 1024) {
        alert(t('module.fileSizeLimit', { fileName: file.name }))
        return
      }
    }

    uploadFiles(files)
  }

  async function uploadFiles(files: File[]) {
    setUploadingFiles(true)
    const newFiles: UploadedFile[] = []

    try {
      for (const file of files) {
        // Generate unique filename
        const fileExt = file.name.split('.').pop()
        const fileName = `module-file-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        
        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from('course-files')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (error) {
          console.error('Error uploading file:', error)
          alert(t('module.errorUploadingFile', { fileName: file.name }))
          continue
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('course-files')
          .getPublicUrl(fileName)

        newFiles.push({
          name: file.name,
          url: publicUrl,
          size: file.size,
          type: file.type
        })
      }

      setAttachmentFiles([...attachmentFiles, ...newFiles])
    } catch (error) {
      console.error('Error uploading files:', error)
    } finally {
      setUploadingFiles(false)
    }
  }

  function removeFile(index: number) {
    setAttachmentFiles(attachmentFiles.filter((_, i) => i !== index))
  }

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  async function createModule() {
    if (!moduleName.trim()) {
      alert(t('module.enterModuleName'))
      return
    }

    if (activeTab === 'video' && !videoFile) {
      alert(t('module.selectVideo'))
      return
    }

    if (activeTab === 'attachments' && attachmentFiles.length === 0) {
      alert(t('module.selectFiles'))
      return
    }

    setLoading(true)
    try {
      // Get next order index
      const { data: existingModules } = await supabase
        .from('course_modules')
        .select('order_index')
        .eq('course_id', courseId)
        .order('order_index', { ascending: false })
        .limit(1)

      const nextOrderIndex = existingModules && existingModules.length > 0 
        ? existingModules[0].order_index + 1 
        : 1

      // Create module
      const { data: module, error: moduleError } = await supabase
        .from('course_modules')
        .insert({
          course_id: courseId,
          name: moduleName,
          order_index: nextOrderIndex,
          estimated_time_minutes: estimatedTime,
        })
        .select()
        .single()

      if (moduleError) throw moduleError

      // Create module content based on active tab
      if (activeTab === 'video' && videoFile) {
        // Upload video
        const videoUploadUrl = await uploadVideo(videoFile)
        if (!videoUploadUrl) {
          throw new Error('Failed to upload video')
        }

        // Create video content
        await supabase
          .from('module_content')
          .insert({
            module_id: module.id,
            content_type: 'video',
            title: moduleName,
            video_url: videoUploadUrl,
            video_duration_minutes: videoDuration,
            order_index: 1,
          })
      } else if (activeTab === 'attachments' && attachmentFiles.length > 0) {
        // Create file content for each attachment
        const contentPromises = attachmentFiles.map((file, index) =>
          supabase
            .from('module_content')
            .insert({
              module_id: module.id,
              content_type: 'file',
              title: file.name,
              file_url: file.url,
              order_index: index + 1,
            })
        )

        await Promise.all(contentPromises)
      }

      // Redirect back to course detail page
      router.push(`/backoffice/courses/${courseId}`)
    } catch (error) {
      console.error('Error creating module:', error)
      alert(t('module.errorCreating'))
    } finally {
      setLoading(false)
    }
  }

  if (!course) {
    return (
      <div className="flex items-center justify-center h-64">
        <Icon icon="mdi:loading" className="animate-spin h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/backoffice/courses">
              {t('backoffice.courses')}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/backoffice/courses/${courseId}`}>
              {course.title}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{t('course.addModule')}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form on the left (1/3 width) */}
        <div className="lg:col-span-1 space-y-6">
          <h2 className="text-xl font-semibold mb-6">{t('course.moduleInformation')}</h2>
          {/* Module Name */}
          <div className="space-y-2">
            <Label htmlFor="moduleName">
              {t('course.moduleName')} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="moduleName"
              value={moduleName}
              onChange={(e) => setModuleName(e.target.value)}
              placeholder={t('course.moduleNamePlaceholder')}
              className="py-5 rounded-xl shadow-soft bg-background"
            />
          </div>

          {/* Estimated Time */}
          <div className="space-y-2">
            <Label htmlFor="estimatedTime">
              {t('course.estimatedTimeMinutes')}
            </Label>
            <Input
              id="estimatedTime"
              type="number"
              value={estimatedTime}
              onChange={(e) => setEstimatedTime(parseInt(e.target.value) || 0)}
              min="1"
              placeholder="30"
              className="py-5 rounded-xl shadow-soft bg-background"
            />
            <p className="text-xs text-gray-500">
              {t('module.estimatedTimeNote')}
            </p>
          </div>

        </div>

        {/* Content upload on the right (2/3 width) */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-semibold">{t('module.moduleContent')}</h3>
          <div className="py-5 rounded-xl shadow-soft bg-background">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="p-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="video">{t('module.video')}</TabsTrigger>
                <TabsTrigger value="attachments">{t('module.attachments')}</TabsTrigger>
              </TabsList>

              {/* Video Upload */}
              <TabsContent value="video" className="space-y-4">
                <div className="space-y-4">
                  <div
                    className={`relative w-full h-64 border-2 border-dashed rounded-xl transition-colors cursor-pointer ${
                      videoUrl
                        ? 'border-gray-300 bg-gray-50'
                        : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
                    }`}
                    onClick={() => document.getElementById('video-upload')?.click()}
                    onDrop={(e) => {
                      e.preventDefault()
                      const file = e.dataTransfer.files[0]
                      if (file && file.type.startsWith('video/')) {
                        const event = { target: { files: [file] } } as any
                        handleVideoChange(event)
                      }
                    }}
                    onDragOver={(e) => e.preventDefault()}
                  >
                    {videoUrl ? (
                      <>
                        <video
                          src={videoUrl}
                          controls
                          className="w-full h-full object-cover rounded-xl"
                        >
                          {t('module.videoNotSupported')}
                        </video>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 h-8 w-8 bg-red-500/80 text-white hover:bg-red-600/90 backdrop-blur-sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setVideoFile(null)
                            setVideoUrl('')
                            setVideoDuration(null)
                          }}
                        >
                          <Icon icon="mdi:close" className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <Icon icon="mdi:video" className="w-12 h-12 mb-3 opacity-60" />
                        <p className="text-sm font-medium mb-1">
                          {t('module.clickToUploadVideo')}
                        </p>
                        <p className="text-xs text-gray-400">
                          {t('course.dragAndDropSupported')}
                        </p>
                      </div>
                    )}
                  </div>
                  <Input
                    id="video-upload"
                    type="file"
                    accept="video/*"
                    onChange={handleVideoChange}
                    className="hidden"
                  />
                  {uploadingVideo && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Icon icon="mdi:loading" className="animate-spin h-4 w-4" />
                      {t('module.uploadingVideo')}
                    </div>
                  )}
                  {videoDuration && (
                    <p className="text-sm text-gray-600">
                      {t('module.videoDuration')}: {videoDuration} {t('common.minutes')}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    {t('module.videoRequirements')}
                  </p>
                </div>
              </TabsContent>

              {/* File Upload */}
              <TabsContent value="attachments" className="space-y-4">
                <div className="space-y-4">
                  <div
                    className="relative w-full h-48 border-2 border-dashed rounded-xl transition-colors cursor-pointer border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100"
                    onClick={() => document.getElementById('files-upload')?.click()}
                    onDrop={(e) => {
                      e.preventDefault()
                      const files = Array.from(e.dataTransfer.files)
                      if (files.length > 0) {
                        const event = { target: { files } } as any
                        handleFileChange(event)
                      }
                    }}
                    onDragOver={(e) => e.preventDefault()}
                  >
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                      <Icon icon="mdi:file-multiple" className="w-12 h-12 mb-3 opacity-60" />
                      <p className="text-sm font-medium mb-1">
                        {t('module.clickToUploadFiles')}
                      </p>
                      <p className="text-xs text-gray-400">
                        {t('course.dragAndDropSupported')}
                      </p>
                    </div>
                  </div>
                  <Input
                    id="files-upload"
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {uploadingFiles && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Icon icon="mdi:loading" className="animate-spin h-4 w-4" />
                      {t('module.uploadingFiles')}
                    </div>
                  )}
                  
                  {/* Uploaded files grid */}
                  {attachmentFiles.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {attachmentFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50"
                        >
                          <Icon icon="mdi:file" className="h-8 w-8 text-gray-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{file.name}</p>
                            <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFile(index)}
                            className="h-6 w-6 text-red-500 hover:text-red-700 flex-shrink-0"
                          >
                            <Icon icon="mdi:close" className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-500">
                    {t('module.fileRequirements')}
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Submit button positioned in preview section */}
          <div className="flex justify-end">
            <Button onClick={createModule} disabled={loading}>
              {loading ? (
                <Icon icon="mdi:loading" className="animate-spin h-4 w-4 mr-2" />
              ) : (
                <Icon icon="mdi:plus" className="h-4 w-4 mr-2" />
              )}
              {t('course.addModule')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}