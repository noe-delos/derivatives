'use client'

import { useTranslation } from 'react-i18next'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Icon } from '@iconify/react'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'

export function BackofficeSidebar() {
  const { t } = useTranslation()
  const pathname = usePathname()

  const navItems = [
    {
      title: t('backoffice.overview'),
      href: '/backoffice',
      icon: 'mdi:view-dashboard',
    },
    {
      title: t('backoffice.courses'),
      href: '/backoffice/courses',
      icon: 'mdi:book-open-page-variant',
    },
    {
      title: t('backoffice.quizzes'),
      href: '/backoffice/quizzes',
      icon: 'mdi:help-box-multiple',
    },
    {
      title: t('backoffice.corrections'),
      href: '/backoffice/corrections',
      icon: 'mdi:check-circle',
    },
    {
      title: t('backoffice.users'),
      href: '/backoffice/users',
      icon: 'mdi:account-group',
    },
    {
      title: t('backoffice.subscriptions'),
      href: '/backoffice/subscriptions',
      icon: 'mdi:credit-card',
    },
    {
      title: t('backoffice.statistics'),
      href: '/backoffice/statistics',
      icon: 'mdi:chart-line',
    },
  ]

  return (
    <div className="flex h-full w-full flex-col bg-slate-900 text-white border-r border-slate-800">
      <div className="flex h-16 items-center px-4 border-b border-slate-800">
        <Link href="/backoffice" className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-2 rounded-lg">
            <Icon icon="mdi:shield-crown" className="h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-din-semibold">{t('backoffice.title')}</span>
            <span className="text-xs text-slate-400">{t('backoffice.administration')}</span>
          </div>
        </Link>
      </div>

      <ScrollArea className="flex-1 px-3">
        <nav className="space-y-1 py-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                )}
              >
                <Icon icon={item.icon} className="h-5 w-5 flex-shrink-0" />
                <span className="font-din">{item.title}</span>
              </Link>
            )
          })}
        </nav>
      </ScrollArea>

      <div className="border-t border-slate-800 p-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition-all hover:bg-slate-800 hover:text-white"
        >
          <Icon icon="mdi:arrow-left" className="h-5 w-5 flex-shrink-0" />
          <span className="font-din">{t('common.backToApp')}</span>
        </Link>
      </div>
    </div>
  )
}