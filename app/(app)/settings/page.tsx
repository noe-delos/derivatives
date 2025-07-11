'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRouter } from 'next/navigation'
import { Icon } from '@iconify/react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function SettingsPage() {
  const { t, i18n } = useTranslation()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const supabase = createClient()

  async function updatePassword() {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert(t('settings.passwordsDoNotMatch'))
      return
    }

    if (passwordForm.newPassword.length < 6) {
      alert(t('settings.passwordMinLength'))
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      })

      if (error) {
        console.error('Error updating password:', error)
        alert(t('settings.passwordUpdateError'))
      } else {
        alert(t('settings.passwordUpdateSuccess'))
        setIsPasswordDialogOpen(false)
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        })
      }
    } catch (error) {
      console.error('Error updating password:', error)
      alert('Erreur lors de la mise à jour du mot de passe')
    } finally {
      setLoading(false)
    }
  }

  function changeLanguage(locale: string) {
    i18n.changeLanguage(locale)
    localStorage.setItem('language', locale)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-din-semibold text-gray-900 dark:text-white">
          {t('common.settings')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          {t('settings.managePreferences')}
        </p>
      </div>

      {/* Language Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon icon="mdi:translate" className="h-5 w-5" />
            {t('settings.language')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div>
              <Label>{t('settings.interfaceLanguage')}</Label>
              <Select value={i18n.language} onValueChange={changeLanguage}>
                <SelectTrigger className="w-full md:w-48 mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr">{t('settings.french')}</SelectItem>
                  <SelectItem value="en">{t('settings.english')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon icon="mdi:shield-account" className="h-5 w-5" />
            {t('settings.security')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">{t('common.password')}</Label>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                {t('settings.changePasswordDescription')}
              </p>
              <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="mt-2">
                    <Icon icon="mdi:key" className="mr-2 h-4 w-4" />
                    {t('settings.changePassword')}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t('settings.changePassword')}</DialogTitle>
                    <DialogDescription>
                      {t('settings.newPasswordDescription')}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="new-password">{t('settings.newPassword')}</Label>
                      <Input
                        id="new-password"
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="confirm-password">{t('settings.confirmPassword')}</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>
                      {t('common.cancel')}
                    </Button>
                    <Button onClick={updatePassword} disabled={loading}>
                      {loading ? (
                        <Icon icon="mdi:loading" className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Icon icon="mdi:check" className="mr-2 h-4 w-4" />
                      )}
                      {t('settings.update')}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon icon="mdi:cog" className="h-5 w-5" />
            {t('settings.preferences')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">{t('settings.notifications')}</Label>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                {t('settings.notificationPreferences')}
              </p>
              <Button variant="outline" disabled className="mt-2">
                <Icon icon="mdi:bell" className="mr-2 h-4 w-4" />
                {t('settings.configureNotifications')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200 dark:border-red-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <Icon icon="mdi:alert" className="h-5 w-5" />
            {t('settings.dangerZone')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-red-600 dark:text-red-400">
                {t('settings.signOut')}
              </Label>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                {t('settings.signOutDescription')}
              </p>
              <Button variant="destructive" onClick={handleSignOut} className="mt-2">
                <Icon icon="mdi:logout" className="mr-2 h-4 w-4" />
                {t('settings.signOut')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}