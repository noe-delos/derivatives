'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Icon } from '@iconify/react'
import Link from 'next/link'
import { login } from '@/app/(auth)/login/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function LoginForm() {
  const { t } = useTranslation()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setError(null)
    setLoading(true)
    const result = await login(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900">{t('auth.loginTitle')}</h2>
        <p className="mt-2 text-sm text-gray-600">
          {t('auth.dontHaveAccount')}{' '}
          <Link href="/signup" className="font-medium text-blue-600 hover:text-blue-500">
            {t('common.signUp')}
          </Link>
        </p>
      </div>

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

        <div>
          <Label htmlFor="password">{t('common.password')}</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="mt-1"
            placeholder={t('auth.passwordPlaceholder')}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Checkbox id="remember-me" name="remember-me" />
            <Label htmlFor="remember-me" className="ml-2 text-sm text-gray-600">
              {t('auth.rememberMe')}
            </Label>
          </div>

          <Link
            href="/forgot-password"
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            {t('common.forgotPassword')}
          </Link>
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
            t('common.signIn')
          )}
        </Button>
      </form>
    </div>
  )
}