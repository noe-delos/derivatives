'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Icon } from '@iconify/react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface UserProfile {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  phone_number: string | null
  profile_picture_url: string | null
  role: 'user' | 'moderator' | 'admin'
  subscription_type: 'free' | 'premium_800' | 'premium_2000'
  day_streak: number
  created_at: string
  last_login_date: string | null
}

export default function ProfilePage() {
  const { t } = useTranslation()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
  })
  const supabase = createClient()

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()

        if (error) {
          console.error('Error loading profile:', error)
        } else {
          setProfile(data)
          setEditForm({
            first_name: data.first_name || '',
            last_name: data.last_name || '',
            phone_number: data.phone_number || '',
          })
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  async function updateProfile() {
    if (!profile) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('users')
        .update({
          first_name: editForm.first_name || null,
          last_name: editForm.last_name || null,
          phone_number: editForm.phone_number || null,
        })
        .eq('id', profile.id)

      if (error) {
        console.error('Error updating profile:', error)
      } else {
        setProfile({
          ...profile,
          ...editForm,
        })
        setIsEditDialogOpen(false)
      }
    } catch (error) {
      console.error('Error updating profile:', error)
    } finally {
      setSaving(false)
    }
  }

  const getRoleBadge = () => {
    switch (profile?.role) {
      case 'admin':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">{t('profile.admin')}</Badge>
      case 'moderator':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">{t('profile.moderator')}</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">{t('profile.user')}</Badge>
    }
  }

  const getSubscriptionBadge = () => {
    switch (profile?.subscription_type) {
      case 'premium_2000':
        return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">{t('profile.premium2000')}</Badge>
      case 'premium_800':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">{t('profile.premium800')}</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">{t('profile.free')}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Icon icon="mdi:loading" className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">{t('profile.unableToLoad')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-din-semibold text-gray-900 dark:text-white">
          {t('common.profile')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          {t('profile.managePersonalInfo')}
        </p>
      </div>

      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={profile.profile_picture_url || ''} alt="Profile" />
              <AvatarFallback className="text-lg bg-blue-600 text-white font-semibold">
                {profile.first_name?.[0] || profile.email?.[0]?.toUpperCase() || 'U'}{profile.last_name?.[0] || (profile.email?.split('@')[0]?.[1]?.toUpperCase() || '')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {profile.first_name && profile.last_name 
                  ? `${profile.first_name} ${profile.last_name}`
                  : profile.email}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-3">{profile.email}</p>
              <div className="flex items-center gap-3">
                {getRoleBadge()}
                {getSubscriptionBadge()}
                <Badge variant="outline" className="flex items-center gap-1">
                  <Icon icon="mdi:fire" className="h-4 w-4 text-orange-500" />
                  {profile.day_streak} {t('profile.days')}
                </Badge>
              </div>
            </div>
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Icon icon="mdi:pencil" className="mr-2 h-4 w-4" />
                  {t('common.edit')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('profile.editProfile')}</DialogTitle>
                  <DialogDescription>
                    {t('profile.updatePersonalInfo')}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="first_name">{t('common.firstName')}</Label>
                    <Input
                      id="first_name"
                      value={editForm.first_name}
                      onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="last_name">{t('common.lastName')}</Label>
                    <Input
                      id="last_name"
                      value={editForm.last_name}
                      onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone_number">{t('common.phoneNumber')}</Label>
                    <Input
                      id="phone_number"
                      value={editForm.phone_number}
                      onChange={(e) => setEditForm({ ...editForm, phone_number: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    {t('common.cancel')}
                  </Button>
                  <Button onClick={updateProfile} disabled={saving}>
                    {saving ? (
                      <Icon icon="mdi:loading" className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Icon icon="mdi:check" className="mr-2 h-4 w-4" />
                    )}
                    {t('common.save')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Profile Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon icon="mdi:account-details" className="h-5 w-5" />
              {t('profile.personalInfo')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-500">{t('common.firstName')}</Label>
              <p className="text-gray-900 dark:text-white">{profile.first_name || t('profile.notProvided')}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">{t('common.lastName')}</Label>
              <p className="text-gray-900 dark:text-white">{profile.last_name || t('profile.notProvided')}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">{t('common.email')}</Label>
              <p className="text-gray-900 dark:text-white">{profile.email}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">{t('common.phoneNumber')}</Label>
              <p className="text-gray-900 dark:text-white">{profile.phone_number || t('profile.notProvided')}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon icon="mdi:chart-line" className="h-5 w-5" />
              {t('profile.statistics')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-500">{t('profile.currentStreak')}</Label>
              <div className="flex items-center gap-2">
                <Icon icon="mdi:fire" className="h-5 w-5 text-orange-500" />
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {profile.day_streak}
                </span>
                <span className="text-gray-500">{t('profile.days')}</span>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">{t('profile.memberSince')}</Label>
              <p className="text-gray-900 dark:text-white">
                {new Date(profile.created_at).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">{t('profile.lastLogin')}</Label>
              <p className="text-gray-900 dark:text-white">
                {profile.last_login_date 
                  ? new Date(profile.last_login_date).toLocaleDateString('fr-FR')
                  : t('profile.never')
                }
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">{t('profile.accountType')}</Label>
              <div className="mt-1">{getSubscriptionBadge()}</div>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  )
}