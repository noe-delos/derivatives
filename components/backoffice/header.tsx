'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useRouter } from 'next/navigation'
import { Icon } from '@iconify/react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'

interface BackofficeHeaderProps {
  showMenuButton?: boolean
  onMenuClick?: () => void
}

export function BackofficeHeader({ showMenuButton, onMenuClick }: BackofficeHeaderProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()
        setUser(userData)
      }
    }
    getUser()
  }, [supabase])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="flex h-16 items-center px-4 gap-4">
        {showMenuButton && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="md:hidden"
          >
            <Icon icon="mdi:menu" className="h-5 w-5" />
          </Button>
        )}
        
        <h1 className="text-xl font-semibold text-gray-900">
          {t('backoffice.title')}
        </h1>
        
        <div className="flex-1" />

        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            {user?.role === 'admin' ? t('common.admin') : t('common.moderator')}
          </span>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.profile_picture_url} alt={user?.first_name} />
                  <AvatarFallback className="bg-blue-600 text-white font-semibold">
                    {user?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}{user?.last_name?.[0] || (user?.email?.split('@')[0]?.[1]?.toUpperCase() || '')}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                <Icon icon="mdi:view-dashboard" className="mr-2 h-4 w-4" />
                <span>{t('common.dashboard')}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/profile')}>
                <Icon icon="mdi:account" className="mr-2 h-4 w-4" />
                <span>{t('common.profile')}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <Icon icon="mdi:logout" className="mr-2 h-4 w-4" />
                <span>{t('common.signOut')}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}