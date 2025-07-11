'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Icon } from '@iconify/react'
import { resetPassword } from '@/app/(auth)/login/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function ResetPasswordForm() {
  const { t } = useTranslation()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setError(null)
    setLoading(true)
    const result = await resetPassword(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900">{t('auth.resetPasswordTitle')}</h2>
      </div>

      <form action={handleSubmit} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <Icon icon="mdi:alert-circle" className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div>
          <Label htmlFor="password">{t('common.password')}</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            className="mt-1"
            placeholder={t('auth.passwordPlaceholder')}
            minLength={6}
          />
        </div>

        <div>
          <Label htmlFor="confirmPassword">{t('common.confirm')} {t('common.password')}</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            className="mt-1"
            placeholder={t('auth.passwordPlaceholder')}
            minLength={6}
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Icon icon="mdi:loading" className="animate-spin h-4 w-4 mr-2" />
              {t('common.loading')}
            </>
          ) : (
            t('common.resetPassword')
          )}
        </Button>
      </form>
    </div>
  )
}