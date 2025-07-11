'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Icon } from '@iconify/react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Review {
  id: string
  rating: number
  review_text: string
  created_at: string
  user: {
    first_name: string
    last_name: string
    profile_picture_url?: string
  }
}

interface CourseReviewsProps {
  courseId: string
  isRegistered: boolean
}

export function CourseReviews({ courseId, isRegistered }: CourseReviewsProps) {
  const { t } = useTranslation()
  const [reviews, setReviews] = useState<Review[]>([])
  const [userReview, setUserReview] = useState<Review | null>(null)
  const [newReview, setNewReview] = useState('')
  const [newRating, setNewRating] = useState(5)
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadReviews()
  }, [courseId])

  async function loadReviews() {
    const { data } = await supabase
      .from('course_reviews')
      .select(`
        *,
        user:users(first_name, last_name, profile_picture_url)
      `)
      .eq('course_id', courseId)
      .order('created_at', { ascending: false })

    if (data) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const currentUserReview = data.find(r => r.user_id === user.id)
        if (currentUserReview) {
          setUserReview(currentUserReview)
          setReviews(data.filter(r => r.user_id !== user.id))
        } else {
          setReviews(data)
        }
      } else {
        setReviews(data)
      }
    }
  }

  async function submitReview() {
    if (!isRegistered || !newReview.trim()) return

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      if (userReview) {
        // Update existing review
        const { data, error } = await supabase
          .from('course_reviews')
          .update({
            rating: newRating,
            review_text: newReview.trim(),
            updated_at: new Date().toISOString()
          })
          .eq('id', userReview.id)
          .select(`
            *,
            user:users(first_name, last_name, profile_picture_url)
          `)
          .single()

        if (data && !error) {
          setUserReview(data)
        }
      } else {
        // Create new review
        const { data, error } = await supabase
          .from('course_reviews')
          .insert({
            course_id: courseId,
            user_id: user.id,
            rating: newRating,
            review_text: newReview.trim()
          })
          .select(`
            *,
            user:users(first_name, last_name, profile_picture_url)
          `)
          .single()

        if (data && !error) {
          setUserReview(data)
        }
      }

      setNewReview('')
      setNewRating(5)
      setDialogOpen(false)
    } catch (error) {
      console.error('Review submission error:', error)
    } finally {
      setLoading(false)
    }
  }

  function renderStars(rating: number, interactive = false, onRate?: (rating: number) => void) {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Icon
            key={star}
            icon={star <= rating ? 'mdi:star' : 'mdi:star-outline'}
            className={cn(
              'h-4 w-4',
              star <= rating ? 'text-yellow-400' : 'text-gray-300',
              interactive && 'cursor-pointer hover:text-yellow-400'
            )}
            onClick={() => interactive && onRate?.(star)}
          />
        ))}
      </div>
    )
  }

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold">{averageRating.toFixed(1)}</div>
              {renderStars(Math.round(averageRating))}
              <div className="text-sm text-gray-600 mt-1">
                {reviews.length + (userReview ? 1 : 0)} {t('common.reviews')}
              </div>
            </div>
            <div className="flex-1">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = reviews.filter(r => r.rating === rating).length
                const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0
                return (
                  <div key={rating} className="flex items-center gap-2 mb-1">
                    <span className="text-sm w-2">{rating}</span>
                    <Icon icon="mdi:star" className="h-3 w-3 text-yellow-400" />
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-yellow-400 h-2 rounded-full" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-8">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Review Button */}
      {isRegistered && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="w-full" 
              onClick={() => {
                if (userReview) {
                  setNewReview(userReview.review_text)
                  setNewRating(userReview.rating)
                }
                setDialogOpen(true)
              }}
            >
              <Icon icon="mdi:star" className="h-4 w-4 mr-2" />
              {userReview ? t('courses.editReview') : t('courses.addReview')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {userReview ? t('courses.editReview') : t('courses.addReview')}
              </DialogTitle>
              <DialogDescription>
                {t('courses.shareExperience')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">{t('courses.rating')}</label>
                <div className="mt-1">
                  {renderStars(newRating, true, setNewRating)}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">{t('courses.yourReview')}</label>
                <Textarea
                  className="mt-1"
                  rows={4}
                  value={newReview}
                  onChange={(e) => setNewReview(e.target.value)}
                  placeholder={t('courses.reviewPlaceholder')}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  {t('common.cancel')}
                </Button>
                <Button onClick={submitReview} disabled={loading || !newReview.trim()}>
                  {loading ? (
                    <Icon icon="mdi:loading" className="animate-spin h-4 w-4 mr-2" />
                  ) : null}
                  {t('common.save')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* User's Review */}
      {userReview && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={userReview.user.profile_picture_url} />
                <AvatarFallback className="bg-blue-600 text-white font-semibold">
                  {userReview.user.first_name?.[0] || 'U'}{userReview.user.last_name?.[0] || ''}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">
                    {userReview.user.first_name} {userReview.user.last_name}
                  </span>
                  <Badge variant="default">{t('courses.yourReview')}</Badge>
                  {renderStars(userReview.rating)}
                </div>
                <p className="text-sm text-gray-700">{userReview.review_text}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {format(new Date(userReview.created_at), 'dd MMMM yyyy', { locale: fr })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <Card key={review.id}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={review.user.profile_picture_url} />
                  <AvatarFallback className="bg-blue-600 text-white font-semibold">
                    {review.user.first_name?.[0] || 'U'}{review.user.last_name?.[0] || ''}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">
                      {review.user.first_name} {review.user.last_name}
                    </span>
                    {renderStars(review.rating)}
                  </div>
                  <p className="text-sm text-gray-700">{review.review_text}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {format(new Date(review.created_at), 'dd MMMM yyyy', { locale: fr })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {reviews.length === 0 && !userReview && (
        <div className="text-center py-8">
          <Icon icon="mdi:star-outline" className="h-12 w-12 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500">{t('courses.noReviews')}</p>
          {isRegistered && (
            <p className="text-sm text-gray-400 mt-1">{t('courses.beFirstToReview')}</p>
          )}
        </div>
      )}
    </div>
  )
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}