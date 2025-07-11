'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Icon } from '@iconify/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'

interface Stats {
  totalUsers: number
  activeUsers: number
  totalCourses: number
  publishedCourses: number
  totalQuizzes: number
  pendingCorrections: number
  totalSubscriptions: number
  revenueThisMonth: number
}

export default function BackofficeDashboard() {
  const { t } = useTranslation()
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    activeUsers: 0,
    totalCourses: 0,
    publishedCourses: 0,
    totalQuizzes: 0,
    pendingCorrections: 0,
    totalSubscriptions: 0,
    revenueThisMonth: 0,
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    try {
      // Get total users
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })

      // Get active users (logged in last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const { count: activeUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('last_login_date', thirtyDaysAgo.toISOString().split('T')[0])

      // Get courses stats
      const { count: totalCourses } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true })

      const { count: publishedCourses } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true })
        .eq('is_published', true)

      // Get quizzes stats
      const { count: totalQuizzes } = await supabase
        .from('quizzes')
        .select('*', { count: 'exact', head: true })

      // Get pending corrections
      const { count: pendingCorrections } = await supabase
        .from('quiz_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('needs_correction', true)
        .eq('is_corrected', false)

      // Get subscription stats
      const { count: premiumSubscriptions } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .in('subscription_type', ['premium_800', 'premium_2000'])

      // Calculate revenue this month
      const thisMonth = new Date()
      thisMonth.setDate(1) // First day of current month
      
      const { data: recentSubscriptions } = await supabase
        .from('users')
        .select('subscription_type, subscription_date')
        .gte('subscription_date', thisMonth.toISOString())
        .in('subscription_type', ['premium_800', 'premium_2000'])

      let revenue = 0
      recentSubscriptions?.forEach(sub => {
        if (sub.subscription_type === 'premium_800') revenue += 800
        if (sub.subscription_type === 'premium_2000') revenue += 2000
      })

      setStats({
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        totalCourses: totalCourses || 0,
        publishedCourses: publishedCourses || 0,
        totalQuizzes: totalQuizzes || 0,
        pendingCorrections: pendingCorrections || 0,
        totalSubscriptions: premiumSubscriptions || 0,
        revenueThisMonth: revenue,
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: t('backoffice.totalUsers'),
      value: stats.totalUsers,
      icon: 'mdi:account-group',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: stats.activeUsers,
      changeLabel: t('backoffice.activeThisMonth'),
    },
    {
      title: t('backoffice.courses'),
      value: stats.publishedCourses,
      icon: 'mdi:book-open',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      change: stats.totalCourses - stats.publishedCourses,
      changeLabel: t('backoffice.drafts'),
    },
    {
      title: t('backoffice.quizzes'),
      value: stats.totalQuizzes,
      icon: 'mdi:quiz',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      change: stats.pendingCorrections,
      changeLabel: t('backoffice.pendingCorrections'),
    },
    {
      title: t('backoffice.revenue'),
      value: `${stats.revenueThisMonth}€`,
      icon: 'mdi:currency-eur',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      change: stats.totalSubscriptions,
      changeLabel: t('backoffice.totalSubscriptions'),
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Icon icon="mdi:loading" className="animate-spin h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('backoffice.dashboard')}</h1>
        <p className="text-gray-600 mt-2">{t('backoffice.overview')}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <span className="text-sm text-gray-500">{stat.change}</span>
                    <span className="text-xs text-gray-400">{stat.changeLabel}</span>
                  </div>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <Icon icon={stat.icon} className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon icon="mdi:plus-circle" className="h-5 w-5 text-blue-600" />
              {t('backoffice.createCourse')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">{t('backoffice.createCourseDescription')}</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon icon="mdi:quiz" className="h-5 w-5 text-green-600" />
              {t('backoffice.createQuiz')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">{t('backoffice.createQuizDescription')}</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon icon="mdi:check-circle" className="h-5 w-5 text-purple-600" />
              {t('backoffice.corrections')}
              {stats.pendingCorrections > 0 && (
                <Badge variant="destructive">{stats.pendingCorrections}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">{t('backoffice.correctionsDescription')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>{t('backoffice.recentActivity')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Icon icon="mdi:account-plus" className="h-5 w-5 text-blue-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">Nouvel utilisateur inscrit</p>
                <p className="text-xs text-gray-500">Il y a 2 heures</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Icon icon="mdi:book" className="h-5 w-5 text-green-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">Cours "Introduction aux dérivés" complété</p>
                <p className="text-xs text-gray-500">Il y a 4 heures</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Icon icon="mdi:quiz" className="h-5 w-5 text-purple-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">Quiz en attente de correction</p>
                <p className="text-xs text-gray-500">Il y a 6 heures</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}