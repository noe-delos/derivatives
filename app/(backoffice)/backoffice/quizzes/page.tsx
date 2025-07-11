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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'

interface Quiz {
  id: string
  title: string
  description: string | null
  timer_minutes: number | null
  needs_correction: boolean
  created_by: string
  created_at: string
  _count?: {
    quiz_questions: number
    quiz_attempts: number
  }
}

interface QuizFormData {
  title: string
  description: string
  timer_minutes: number | null
  needs_correction: boolean
}

export default function QuizzesPage() {
  const { t } = useTranslation()
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [filteredQuizzes, setFilteredQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [formData, setFormData] = useState<QuizFormData>({
    title: '',
    description: '',
    timer_minutes: null,
    needs_correction: false,
  })
  const supabase = createClient()

  useEffect(() => {
    loadQuizzes()
  }, [])

  useEffect(() => {
    filterQuizzes()
  }, [quizzes, searchTerm])

  async function loadQuizzes() {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select(`
          *,
          quiz_questions(count),
          quiz_attempts(count)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      // Process the data to get counts
      const processedData = data?.map(quiz => ({
        ...quiz,
        _count: {
          quiz_questions: quiz.quiz_questions?.[0]?.count || 0,
          quiz_attempts: quiz.quiz_attempts?.[0]?.count || 0,
        }
      })) || []

      setQuizzes(processedData)
    } catch (error) {
      console.error('Error loading quizzes:', error)
    } finally {
      setLoading(false)
    }
  }

  function filterQuizzes() {
    let filtered = [...quizzes]

    if (searchTerm) {
      filtered = filtered.filter(quiz => 
        quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quiz.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredQuizzes(filtered)
  }

  async function createQuiz() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('quizzes')
        .insert({
          title: formData.title,
          description: formData.description || null,
          timer_minutes: formData.timer_minutes,
          needs_correction: formData.needs_correction,
          created_by: user.id,
        })

      if (error) throw error

      setIsCreateDialogOpen(false)
      setFormData({
        title: '',
        description: '',
        timer_minutes: null,
        needs_correction: false,
      })
      await loadQuizzes()
    } catch (error) {
      console.error('Error creating quiz:', error)
    }
  }

  async function deleteQuiz(quizId: string) {
    if (!confirm(t('common.confirmDelete'))) return

    try {
      const { error } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', quizId)

      if (error) throw error
      await loadQuizzes()
    } catch (error) {
      console.error('Error deleting quiz:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Icon icon="mdi:loading" className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('backoffice.quizzes')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {t('backoffice.manageQuizzes')}
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Icon icon="mdi:plus" className="mr-2 h-4 w-4" />
              {t('backoffice.createQuiz')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t('backoffice.createNewQuiz')}</DialogTitle>
              <DialogDescription>
                {t('backoffice.createQuizDescription')}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">{t('common.title')}</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder={t('common.enterTitle')}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">{t('common.description')}</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={t('common.enterDescription')}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="timer">{t('backoffice.timerMinutes')}</Label>
                <Input
                  id="timer"
                  type="number"
                  value={formData.timer_minutes || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    timer_minutes: e.target.value ? parseInt(e.target.value) : null 
                  })}
                  placeholder={t('backoffice.enterTimer')}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="needs-correction"
                  checked={formData.needs_correction}
                  onCheckedChange={(checked) => setFormData({ ...formData, needs_correction: checked })}
                />
                <Label htmlFor="needs-correction">{t('backoffice.needsCorrection')}</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button 
                onClick={createQuiz}
                disabled={!formData.title.trim()}
              >
                {t('common.create')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Quizzes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quizzes.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Manual Correction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {quizzes.filter(q => q.needs_correction).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Auto Graded
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {quizzes.filter(q => !q.needs_correction).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Attempts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {quizzes.reduce((sum, q) => sum + (q._count?.quiz_attempts || 0), 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <Input
            placeholder={t('backoffice.searchQuizzes')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
            icon={<Icon icon="mdi:magnify" className="h-4 w-4" />}
          />
        </CardContent>
      </Card>

      {/* Quizzes Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('common.title')}</TableHead>
                  <TableHead>{t('common.description')}</TableHead>
                  <TableHead>{t('backoffice.questions')}</TableHead>
                  <TableHead>{t('backoffice.attempts')}</TableHead>
                  <TableHead>{t('backoffice.timer')}</TableHead>
                  <TableHead>{t('backoffice.correction')}</TableHead>
                  <TableHead>{t('common.created')}</TableHead>
                  <TableHead className="text-right">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuizzes.map((quiz) => (
                  <TableRow key={quiz.id}>
                    <TableCell className="font-medium">{quiz.title}</TableCell>
                    <TableCell className="max-w-xs">
                      <p className="truncate">{quiz.description || '-'}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {quiz._count?.quiz_questions || 0} questions
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {quiz._count?.quiz_attempts || 0} attempts
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {quiz.timer_minutes ? (
                        <div className="flex items-center gap-1">
                          <Icon icon="mdi:timer" className="h-4 w-4 text-orange-500" />
                          {quiz.timer_minutes}min
                        </div>
                      ) : (
                        <span className="text-gray-500">No limit</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={
                        quiz.needs_correction
                          ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
                          : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      }>
                        {quiz.needs_correction ? 'Manual' : 'Auto'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(quiz.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Icon icon="mdi:dots-vertical" className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>{t('common.actions')}</DropdownMenuLabel>
                          <DropdownMenuItem>
                            <Icon icon="mdi:eye" className="mr-2 h-4 w-4" />
                            {t('common.view')}
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Icon icon="mdi:pencil" className="mr-2 h-4 w-4" />
                            {t('common.edit')}
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Icon icon="mdi:content-copy" className="mr-2 h-4 w-4" />
                            {t('common.duplicate')}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => deleteQuiz(quiz.id)}
                          >
                            <Icon icon="mdi:delete" className="mr-2 h-4 w-4" />
                            {t('common.delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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