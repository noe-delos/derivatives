'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Icon } from '@iconify/react'
import Link from 'next/link'
import { signup } from '@/app/(auth)/login/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function SignupForm() {
  const { t } = useTranslation()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setError(null)
    setLoading(true)
    const result = await signup(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900">{t('auth.signupTitle')}</h2>
        <p className="mt-2 text-sm text-gray-600">
          {t('auth.alreadyHaveAccount')}{' '}
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
            {t('common.signIn')}
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName">{t('common.firstName')}</Label>
            <Input
              id="firstName"
              name="firstName"
              type="text"
              autoComplete="given-name"
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="lastName">{t('common.lastName')}</Label>
            <Input
              id="lastName"
              name="lastName"
              type="text"
              autoComplete="family-name"
              required
              className="mt-1"
            />
          </div>
        </div>

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
          <Label htmlFor="phoneNumber">{t('common.phoneNumber')}</Label>
          <Input
            id="phoneNumber"
            name="phoneNumber"
            type="tel"
            autoComplete="tel"
            className="mt-1"
            placeholder={t('auth.phonePlaceholder')}
          />
        </div>

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

        <div className="flex items-center">
          <Checkbox id="terms" name="terms" required />
          <Label htmlFor="terms" className="ml-2 text-sm text-gray-600">
            {t('auth.termsAndConditions')}
          </Label>
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
            t('common.signUp')
          )}
        </Button>
      </form>
    </div>
  )
}