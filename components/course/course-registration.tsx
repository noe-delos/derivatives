'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRouter } from 'next/navigation'
import { Icon } from '@iconify/react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'

interface CourseRegistrationProps {
  courseId: string
  isRegistered: boolean
  userSubscription: string
  onRegistrationChange: (registered: boolean) => void
}

export function CourseRegistration({ 
  courseId, 
  isRegistered, 
  userSubscription,
  onRegistrationChange 
}: CourseRegistrationProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const supabase = createClient()

  async function handleRegistration() {
    if (userSubscription === 'free') {
      // Check if this is the first course (free users get access to first course only)
      const { data: courses } = await supabase
        .from('courses')
        .select('id')
        .eq('is_published', true)
        .order('order_index', { ascending: true })
        .limit(1)

      if (courses && courses[0]?.id !== courseId) {
        // Show subscription dialog for non-first courses
        setDialogOpen(true)
        return
      }
    }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      if (isRegistered) {
        // Unregister from course
        await supabase
          .from('course_registrations')
          .delete()
          .eq('user_id', user.id)
          .eq('course_id', courseId)
      } else {
        // Register to course
        await supabase
          .from('course_registrations')
          .insert({
            user_id: user.id,
            course_id: courseId
          })
      }

      onRegistrationChange(!isRegistered)
    } catch (error) {
      console.error('Registration error:', error)
    } finally {
      setLoading(false)
    }
  }

  function handleUpgrade(plan: 'premium_800' | 'premium_2000') {
    // In a real app, this would integrate with a payment processor
    router.push(`/upgrade?plan=${plan}`)
  }

  if (isRegistered) {
    return (
      <Button onClick={handleRegistration} disabled={loading} variant="outline">
        {loading ? (
          <Icon icon="mdi:loading" className="animate-spin h-4 w-4 mr-2" />
        ) : (
          <Icon icon="mdi:check" className="h-4 w-4 mr-2" />
        )}
        {t('courses.registered')}
      </Button>
    )
  }

  return (
    <>
      <Button onClick={handleRegistration} disabled={loading}>
        {loading ? (
          <Icon icon="mdi:loading" className="animate-spin h-4 w-4 mr-2" />
        ) : (
          <Icon icon="mdi:lock-open" className="h-4 w-4 mr-2" />
        )}
        {t('courses.registerToCourse')}
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('courses.unlockCourse')}</DialogTitle>
            <DialogDescription>
              Ce cours nécessite un abonnement premium pour être débloqué.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold">Premium 800€</h3>
              <p className="text-sm text-gray-600">Accès à tous les cours de base</p>
              <Button 
                className="w-full mt-2" 
                onClick={() => handleUpgrade('premium_800')}
              >
                Choisir ce plan
              </Button>
            </div>
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold">Premium 2000€</h3>
              <p className="text-sm text-gray-600">Accès complet + support personnalisé</p>
              <Button 
                className="w-full mt-2" 
                onClick={() => handleUpgrade('premium_2000')}
              >
                Choisir ce plan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}