'use client'

import { useRef, useEffect } from 'react'
import { Icon } from '@iconify/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface VideoPlayerProps {
  videoUrl: string
  title: string
  onVideoEnd?: () => void
}

export function VideoPlayer({ videoUrl, title, onVideoEnd }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleEnded = () => {
      onVideoEnd?.()
    }

    video.addEventListener('ended', handleEnded)
    return () => video.removeEventListener('ended', handleEnded)
  }, [onVideoEnd])

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon icon="mdi:play-circle" className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
          <video
            ref={videoRef}
            className="w-full h-full"
            controls
            controlsList="nodownload"
            onContextMenu={(e) => e.preventDefault()}
          >
            <source src={videoUrl} type="video/mp4" />
            <source src={videoUrl} type="video/webm" />
            Votre navigateur ne supporte pas la lecture vidéo.
          </video>
        </div>
        <div className="mt-4 text-sm text-gray-600">
          <p>💡 Conseil : Prenez des notes pendant que vous regardez la vidéo pour mieux retenir les concepts.</p>
        </div>
      </CardContent>
    </Card>
  )
}