'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Icon } from '@iconify/react'
import Link from 'next/link'
import { forgotPassword } from '@/app/(auth)/login/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function ForgotPasswordForm() {
  const { t } = useTranslation()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setError(null)
    setLoading(true)
    const result = await forgotPassword(formData)
    
    if (result?.error) {
      setError(result.error)
    } else if (result?.success) {
      setSuccess(true)
    }
    setLoading(false)
  }

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900">{t('auth.forgotPasswordTitle')}</h2>
        <p className="mt-2 text-sm text-gray-600">
          {t('auth.forgotPasswordDescription')}
        </p>
      </div>

      {success ? (
        <Alert className="mb-4">
          <Icon icon="mdi:check-circle" className="h-4 w-4" />
          <AlertDescription>
            {t('auth.confirmEmail')}
          </AlertDescription>
        </Alert>
      ) : (
        <form action={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <Icon icon="mdi:alert-circle" className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div>
            <Label htmlFor="email">{t('common.email')}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="mt-1"
              placeholder={t('auth.emailPlaceholder')}
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

          <div className="text-center">
            <Link
              href="/login"
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              {t('common.back')} {t('common.signIn')}
            </Link>
          </div>
        </form>
      )}
    </div>
  )
}