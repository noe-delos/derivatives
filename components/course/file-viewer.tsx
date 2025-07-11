'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Icon } from '@iconify/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'

interface FileViewerProps {
  fileUrl: string
  title: string
  onDownload?: () => void
}

export function FileViewer({ fileUrl, title, onDownload }: FileViewerProps) {
  const { t } = useTranslation()
  const [downloading, setDownloading] = useState(false)
  const supabase = createClient()

  async function handleDownload() {
    setDownloading(true)
    try {
      // Create a download link
      const link = document.createElement('a')
      link.href = fileUrl
      link.download = title
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      onDownload?.()
    } catch (error) {
      console.error('Download error:', error)
    } finally {
      setDownloading(false)
    }
  }

  function getFileIcon(filename: string) {
    const extension = filename.split('.').pop()?.toLowerCase()
    switch (extension) {
      case 'pdf':
        return 'mdi:file-pdf'
      case 'doc':
      case 'docx':
        return 'mdi:file-word'
      case 'xls':
      case 'xlsx':
        return 'mdi:file-excel'
      case 'ppt':
      case 'pptx':
        return 'mdi:file-powerpoint'
      case 'zip':
      case 'rar':
        return 'mdi:file-zip'
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return 'mdi:file-image'
      default:
        return 'mdi:file-document'
    }
  }

  const fileName = fileUrl.split('/').pop() || title
  const fileExtension = fileName.split('.').pop()?.toUpperCase()

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon icon={getFileIcon(fileName)} className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <Icon icon={getFileIcon(fileName)} className="h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
          {fileExtension && (
            <span className="text-sm text-gray-500 mb-4">
              Fichier {fileExtension}
            </span>
          )}
          
          <div className="flex gap-3">
            <Button onClick={handleDownload} disabled={downloading}>
              {downloading ? (
                <Icon icon="mdi:loading" className="animate-spin h-4 w-4 mr-2" />
              ) : (
                <Icon icon="mdi:download" className="h-4 w-4 mr-2" />
              )}
              {t('courses.downloadResource')}
            </Button>
            
            <Button variant="outline" onClick={() => window.open(fileUrl, '_blank')}>
              <Icon icon="mdi:open-in-new" className="h-4 w-4 mr-2" />
              {t('courses.openInNewTab')}
            </Button>
          </div>
        </div>
        
        {/* PDF Preview for PDF files */}
        {fileName.toLowerCase().endsWith('.pdf') && (
          <div className="mt-6">
            <h4 className="text-sm font-medium mb-2">{t('courses.preview')}</h4>
            <div className="border rounded-lg overflow-hidden" style={{ height: '500px' }}>
              <iframe
                src={`${fileUrl}#toolbar=0`}
                className="w-full h-full"
                title={title}
              />
            </div>
          </div>
        )}

        <div className="mt-4 text-sm text-gray-600">
          <p>📚 Ce document fait partie des ressources du cours. Téléchargez-le pour le consulter hors ligne.</p>
        </div>
      </CardContent>
    </Card>
  )
}