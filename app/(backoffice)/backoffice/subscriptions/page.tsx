'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Icon } from '@iconify/react'
import { createClient } from '@/lib/supabase/client'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Subscription {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  subscription_type: 'premium_800' | 'premium_2000'
  subscription_date: string
  day_streak: number
}

export default function SubscriptionsPage() {
  const { t } = useTranslation()
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [filteredSubscriptions, setFilteredSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [monthFilter, setMonthFilter] = useState<string>('all')
  const supabase = createClient()

  useEffect(() => {
    loadSubscriptions()
  }, [])

  useEffect(() => {
    filterSubscriptions()
  }, [subscriptions, searchTerm, typeFilter, monthFilter])

  async function loadSubscriptions() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .in('subscription_type', ['premium_800', 'premium_2000'])
        .order('subscription_date', { ascending: false })

      if (error) throw error
      setSubscriptions(data || [])
    } catch (error) {
      console.error('Error loading subscriptions:', error)
    } finally {
      setLoading(false)
    }
  }

  function filterSubscriptions() {
    let filtered = [...subscriptions]

    if (searchTerm) {
      filtered = filtered.filter(sub => 
        sub.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(sub => sub.subscription_type === typeFilter)
    }

    if (monthFilter !== 'all') {
      const month = parseInt(monthFilter)
      filtered = filtered.filter(sub => {
        const subDate = new Date(sub.subscription_date)
        return subDate.getMonth() === month
      })
    }

    setFilteredSubscriptions(filtered)
  }

  const calculateRevenue = (subs: Subscription[]) => {
    return subs.reduce((total, sub) => {
      return total + (sub.subscription_type === 'premium_800' ? 800 : 2000)
    }, 0)
  }

  const getMonthlyRevenue = () => {
    const monthlyData: { [key: number]: number } = {}
    
    subscriptions.forEach(sub => {
      const date = new Date(sub.subscription_date)
      const month = date.getMonth()
      const revenue = sub.subscription_type === 'premium_800' ? 800 : 2000
      
      monthlyData[month] = (monthlyData[month] || 0) + revenue
    })

    return monthlyData
  }

  const monthlyRevenue = getMonthlyRevenue()
  const totalRevenue = calculateRevenue(subscriptions)
  const currentMonthRevenue = monthlyRevenue[new Date().getMonth()] || 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Icon icon="mdi:loading" className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {t('backoffice.subscriptions')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          {t('backoffice.manageSubscriptions')}
        </p>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${currentMonthRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Premium 800
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {subscriptions.filter(s => s.subscription_type === 'premium_800').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Premium 2000
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {subscriptions.filter(s => s.subscription_type === 'premium_2000').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-12 gap-2 items-end h-48">
            {Array.from({ length: 12 }, (_, i) => {
              const revenue = monthlyRevenue[i] || 0
              const maxRevenue = Math.max(...Object.values(monthlyRevenue))
              const height = maxRevenue > 0 ? (revenue / maxRevenue) * 100 : 0
              
              return (
                <div key={i} className="flex flex-col items-center">
                  <div 
                    className="w-full bg-blue-500 rounded-t transition-all"
                    style={{ height: `${height}%` }}
                  />
                  <span className="text-xs text-gray-500 mt-1">
                    {new Date(0, i).toLocaleString('default', { month: 'short' })}
                  </span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder={t('common.search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
                icon={<Icon icon="mdi:magnify" className="h-4 w-4" />}
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="premium_800">Premium $800</SelectItem>
                <SelectItem value="premium_2000">Premium $2000</SelectItem>
              </SelectContent>
            </Select>
            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                {Array.from({ length: 12 }, (_, i) => (
                  <SelectItem key={i} value={i.toString()}>
                    {new Date(0, i).toLocaleString('default', { month: 'long' })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('common.name')}</TableHead>
                  <TableHead>{t('common.email')}</TableHead>
                  <TableHead>{t('common.subscription')}</TableHead>
                  <TableHead>{t('common.amount')}</TableHead>
                  <TableHead>{t('common.date')}</TableHead>
                  <TableHead>{t('common.streak')}</TableHead>
                  <TableHead className="text-right">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubscriptions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell className="font-medium">
                      {sub.first_name && sub.last_name
                        ? `${sub.first_name} ${sub.last_name}`
                        : sub.first_name || sub.last_name || '-'}
                    </TableCell>
                    <TableCell>{sub.email}</TableCell>
                    <TableCell>
                      <Badge className={
                        sub.subscription_type === 'premium_2000'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
                          : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      }>
                        {sub.subscription_type === 'premium_800' ? 'Premium $800' : 'Premium $2000'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold">
                      ${sub.subscription_type === 'premium_800' ? '800' : '2,000'}
                    </TableCell>
                    <TableCell>
                      {new Date(sub.subscription_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Icon icon="mdi:fire" className="h-4 w-4 text-orange-500" />
                        {sub.day_streak}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        <Icon icon="mdi:eye" className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}