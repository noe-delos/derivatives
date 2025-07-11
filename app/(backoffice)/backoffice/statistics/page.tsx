'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Icon } from '@iconify/react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface CourseStats {
  courseId: string
  courseName: string
  registrations: number
  completions: number
  averageProgress: number
  averageRating: number
}

interface QuizStats {
  quizId: string
  quizName: string
  attempts: number
  averageScore: number
  passRate: number
}

export default function StatisticsPage() {
  const { t } = useTranslation()
  const [courseStats, setCourseStats] = useState<CourseStats[]>([])
  const [quizStats, setQuizStats] = useState<QuizStats[]>([])
  const [userGrowth, setUserGrowth] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30')
  const supabase = createClient()

  useEffect(() => {
    loadStatistics()
  }, [timeRange])

  async function loadStatistics() {
    try {
      // Load course statistics
      const { data: courses } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          course_registrations(count),
          course_modules(
            id,
            module_progress(completed)
          ),
          course_reviews(rating)
        `)
        .eq('is_published', true)

      // Process course stats
      const processedCourseStats = courses?.map(course => {
        const registrations = course.course_registrations?.[0]?.count || 0
        const modules = course.course_modules || []
        const totalModules = modules.length
        const completedModules = modules.reduce((acc: number, module: any) => {
          return acc + (module.module_progress?.filter((p: any) => p.completed).length || 0)
        }, 0)
        const averageProgress = totalModules > 0 ? (completedModules / (totalModules * registrations)) * 100 : 0
        
        const ratings = course.course_reviews?.map((r: any) => r.rating) || []
        const averageRating = ratings.length > 0 
          ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length 
          : 0

        return {
          courseId: course.id,
          courseName: course.title,
          registrations,
          completions: Math.floor(completedModules / totalModules),
          averageProgress: Math.round(averageProgress),
          averageRating: Math.round(averageRating * 10) / 10,
        }
      }) || []

      setCourseStats(processedCourseStats)

      // Load quiz statistics
      const { data: quizzes } = await supabase
        .from('quizzes')
        .select(`
          id,
          title,
          quiz_attempts(score, is_corrected)
        `)

      const processedQuizStats = quizzes?.map(quiz => {
        const attempts = quiz.quiz_attempts || []
        const scoredAttempts = attempts.filter((a: any) => a.score !== null)
        const averageScore = scoredAttempts.length > 0
          ? scoredAttempts.reduce((acc: number, a: any) => acc + a.score, 0) / scoredAttempts.length
          : 0
        const passRate = scoredAttempts.length > 0
          ? (scoredAttempts.filter((a: any) => a.score >= 70).length / scoredAttempts.length) * 100
          : 0

        return {
          quizId: quiz.id,
          quizName: quiz.title,
          attempts: attempts.length,
          averageScore: Math.round(averageScore),
          passRate: Math.round(passRate),
        }
      }) || []

      setQuizStats(processedQuizStats)

      // Load user growth data
      const daysAgo = parseInt(timeRange)
      const dates = Array.from({ length: daysAgo }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - i)
        return date.toISOString().split('T')[0]
      }).reverse()

      const growthData = await Promise.all(
        dates.map(async (date) => {
          const { count } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .lte('created_at', `${date}T23:59:59`)

          return {
            date,
            users: count || 0,
          }
        })
      )

      setUserGrowth(growthData)
    } catch (error) {
      console.error('Error loading statistics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Icon icon="mdi:loading" className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  const maxUsers = Math.max(...userGrowth.map(d => d.users))

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('backoffice.statistics')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {t('backoffice.platformAnalytics')}
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* User Growth Chart */}
      <Card>
        <CardHeader>
          <CardTitle>User Growth</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end gap-1">
            {userGrowth.map((data, index) => {
              const height = maxUsers > 0 ? (data.users / maxUsers) * 100 : 0
              const showLabel = userGrowth.length <= 30 || index % Math.floor(userGrowth.length / 10) === 0

              return (
                <div key={data.date} className="flex-1 flex flex-col items-center">
                  <div className="w-full flex flex-col items-center">
                    <span className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                      {data.users}
                    </span>
                    <div 
                      className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                      style={{ height: `${height}%`, minHeight: '2px' }}
                    />
                  </div>
                  {showLabel && (
                    <span className="text-xs text-gray-500 mt-1 rotate-45 origin-left">
                      {new Date(data.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Course Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Course Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Course</th>
                  <th className="text-center py-3 px-4">Registrations</th>
                  <th className="text-center py-3 px-4">Completions</th>
                  <th className="text-center py-3 px-4">Avg Progress</th>
                  <th className="text-center py-3 px-4">Rating</th>
                </tr>
              </thead>
              <tbody>
                {courseStats.map((course) => (
                  <tr key={course.courseId} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="py-3 px-4 font-medium">{course.courseName}</td>
                    <td className="text-center py-3 px-4">{course.registrations}</td>
                    <td className="text-center py-3 px-4">{course.completions}</td>
                    <td className="text-center py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${course.averageProgress}%` }}
                          />
                        </div>
                        <span className="text-sm">{course.averageProgress}%</span>
                      </div>
                    </td>
                    <td className="text-center py-3 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <Icon icon="mdi:star" className="h-4 w-4 text-yellow-500" />
                        <span>{course.averageRating || '-'}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Quiz Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Quiz Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Quiz</th>
                  <th className="text-center py-3 px-4">Attempts</th>
                  <th className="text-center py-3 px-4">Avg Score</th>
                  <th className="text-center py-3 px-4">Pass Rate</th>
                </tr>
              </thead>
              <tbody>
                {quizStats.map((quiz) => (
                  <tr key={quiz.quizId} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="py-3 px-4 font-medium">{quiz.quizName}</td>
                    <td className="text-center py-3 px-4">{quiz.attempts}</td>
                    <td className="text-center py-3 px-4">{quiz.averageScore}%</td>
                    <td className="text-center py-3 px-4">
                      <span className={quiz.passRate >= 70 ? 'text-green-600' : 'text-orange-600'}>
                        {quiz.passRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}