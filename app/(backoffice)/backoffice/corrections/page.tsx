'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Icon } from '@iconify/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface QuizAttempt {
  id: string
  user: {
    first_name: string
    last_name: string
    email: string
  }
  quiz: {
    title: string
  }
  started_at: string
  completed_at: string
  quiz_answers: Array<{
    id: string
    question: {
      question_text: string
      question_type: string
    }
    answer_text: string
    is_correct: boolean | null
    moderator_feedback: string | null
  }>
}

export default function CorrectionsPage() {
  const { t } = useTranslation()
  const [attempts, setAttempts] = useState<QuizAttempt[]>([])
  const [selectedAttempt, setSelectedAttempt] = useState<QuizAttempt | null>(null)
  const [showCorrectionDialog, setShowCorrectionDialog] = useState(false)
  const [currentAnswerIndex, setCurrentAnswerIndex] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [isCorrect, setIsCorrect] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [correcting, setCorrecting] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadPendingCorrections()
  }, [])

  async function loadPendingCorrections() {
    try {
      const { data } = await supabase
        .from('quiz_attempts')
        .select(`
          *,
          user:users(first_name, last_name, email),
          quiz:quizzes(title),
          quiz_answers(
            *,
            question:quiz_questions(question_text, question_type)
          )
        `)
        .eq('needs_correction', true)
        .eq('is_corrected', false)
        .order('completed_at', { ascending: true })

      if (data) {
        setAttempts(data as QuizAttempt[])
      }
    } catch (error) {
      console.error('Error loading corrections:', error)
    } finally {
      setLoading(false)
    }
  }

  function openCorrectionDialog(attempt: QuizAttempt) {
    setSelectedAttempt(attempt)
    setCurrentAnswerIndex(0)
    setShowCorrectionDialog(true)
    const firstTextAnswer = attempt.quiz_answers.find(a => a.question.question_type === 'text')
    if (firstTextAnswer) {
      setFeedback(firstTextAnswer.moderator_feedback || '')
      setIsCorrect(firstTextAnswer.is_correct === null ? '' : firstTextAnswer.is_correct ? 'true' : 'false')
    }
  }

  async function saveAnswerCorrection() {
    if (!selectedAttempt) return

    const textAnswers = selectedAttempt.quiz_answers.filter(a => a.question.question_type === 'text')
    const currentAnswer = textAnswers[currentAnswerIndex]

    try {
      await supabase
        .from('quiz_answers')
        .update({
          is_correct: isCorrect === 'true',
          moderator_feedback: feedback.trim() || null
        })
        .eq('id', currentAnswer.id)

      // Update local state
      setSelectedAttempt(prev => {
        if (!prev) return prev
        return {
          ...prev,
          quiz_answers: prev.quiz_answers.map(answer =>
            answer.id === currentAnswer.id
              ? { ...answer, is_correct: isCorrect === 'true', moderator_feedback: feedback.trim() || null }
              : answer
          )
        }
      })

      // Move to next answer or complete correction
      if (currentAnswerIndex < textAnswers.length - 1) {
        setCurrentAnswerIndex(prev => prev + 1)
        const nextAnswer = textAnswers[currentAnswerIndex + 1]
        setFeedback(nextAnswer.moderator_feedback || '')
        setIsCorrect(nextAnswer.is_correct === null ? '' : nextAnswer.is_correct ? 'true' : 'false')
      } else {
        await completeCorrection()
      }
    } catch (error) {
      console.error('Error saving correction:', error)
    }
  }

  async function completeCorrection() {
    if (!selectedAttempt) return

    setCorrecting(true)
    try {
      // Calculate final score
      const totalAnswers = selectedAttempt.quiz_answers.length
      const correctAnswers = selectedAttempt.quiz_answers.filter(a => a.is_correct === true).length
      const finalScore = (correctAnswers / totalAnswers) * 100

      // Update attempt
      const { data: { user } } = await supabase.auth.getUser()
      await supabase
        .from('quiz_attempts')
        .update({
          score: finalScore,
          is_corrected: true,
          corrected_by: user?.id,
          corrected_at: new Date().toISOString()
        })
        .eq('id', selectedAttempt.id)

      // Create notification for user
      await supabase
        .from('notifications')
        .insert({
          user_id: selectedAttempt.user.id,
          title: 'Quiz corrigé',
          message: `Votre quiz "${selectedAttempt.quiz.title}" a été corrigé. Score: ${Math.round(finalScore)}%`,
          type: 'quiz_corrected'
        })

      // Remove from pending list
      setAttempts(prev => prev.filter(a => a.id !== selectedAttempt.id))
      setShowCorrectionDialog(false)
      setSelectedAttempt(null)
    } catch (error) {
      console.error('Error completing correction:', error)
    } finally {
      setCorrecting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Icon icon="mdi:loading" className="animate-spin h-8 w-8" />
      </div>
    )
  }

  const textAnswers = selectedAttempt?.quiz_answers.filter(a => a.question.question_type === 'text') || []
  const currentTextAnswer = textAnswers[currentAnswerIndex]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('backoffice.corrections')}</h1>
        <p className="text-gray-600 mt-2">{t('backoffice.pendingCorrections')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Icon icon="mdi:clock" className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{attempts.length}</p>
                <p className="text-sm text-gray-600">{t('backoffice.pendingCorrections')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Icon icon="mdi:account" className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{new Set(attempts.map(a => a.user.email)).size}</p>
                <p className="text-sm text-gray-600">{t('backoffice.studentsWaiting')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Icon icon="mdi:quiz" className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{new Set(attempts.map(a => a.quiz.title)).size}</p>
                <p className="text-sm text-gray-600">{t('backoffice.uniqueQuizzes')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Corrections List */}
      <Card>
        <CardHeader>
          <CardTitle>{t('backoffice.pendingCorrections')}</CardTitle>
        </CardHeader>
        <CardContent>
          {attempts.length === 0 ? (
            <div className="text-center py-8">
              <Icon icon="mdi:check-all" className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">{t('backoffice.noCorrections')}</h3>
              <p className="text-gray-500">{t('backoffice.allCorrected')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {attempts.map((attempt) => (
                <div key={attempt.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium">{attempt.quiz.title}</h3>
                      <p className="text-sm text-gray-600">
                        {attempt.user.first_name} {attempt.user.last_name} ({attempt.user.email})
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs text-gray-500">
                          {t('backoffice.completedAt')}: {format(new Date(attempt.completed_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                        </span>
                        <Badge variant="secondary">
                          {attempt.quiz_answers.filter(a => a.question.question_type === 'text').length} {t('backoffice.textAnswers')}
                        </Badge>
                      </div>
                    </div>
                    <Button onClick={() => openCorrectionDialog(attempt)}>
                      <Icon icon="mdi:pencil" className="h-4 w-4 mr-2" />
                      {t('backoffice.correct')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Correction Dialog */}
      <Dialog open={showCorrectionDialog} onOpenChange={setShowCorrectionDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {t('backoffice.correctQuiz')}: {selectedAttempt?.quiz.title}
            </DialogTitle>
            <DialogDescription>
              {t('backoffice.student')}: {selectedAttempt?.user.first_name} {selectedAttempt?.user.last_name}
            </DialogDescription>
          </DialogHeader>

          {selectedAttempt && currentTextAnswer && (
            <div className="space-y-6">
              {/* Progress */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {t('common.question')} {currentAnswerIndex + 1} {t('common.of')} {textAnswers.length}
                </span>
                <Badge variant="outline">
                  {t('courses.textAnswer')}
                </Badge>
              </div>

              {/* Question */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">{t('common.question')}</h4>
                <p>{currentTextAnswer.question.question_text}</p>
              </div>

              {/* Student Answer */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">{t('backoffice.studentAnswer')}</h4>
                <p className="whitespace-pre-wrap">{currentTextAnswer.answer_text}</p>
              </div>

              {/* Correction Form */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="isCorrect">{t('backoffice.evaluation')}</Label>
                  <Select value={isCorrect} onValueChange={setIsCorrect}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('backoffice.selectEvaluation')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">✅ {t('backoffice.correct')}</SelectItem>
                      <SelectItem value="false">❌ {t('backoffice.incorrect')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="feedback">{t('backoffice.moderatorFeedback')}</Label>
                  <Textarea
                    id="feedback"
                    placeholder={t('backoffice.feedbackPlaceholder')}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setShowCorrectionDialog(false)}>
                  {t('common.cancel')}
                </Button>
                <div className="flex gap-2">
                  {currentAnswerIndex > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setCurrentAnswerIndex(prev => prev - 1)
                        const prevAnswer = textAnswers[currentAnswerIndex - 1]
                        setFeedback(prevAnswer.moderator_feedback || '')
                        setIsCorrect(prevAnswer.is_correct === null ? '' : prevAnswer.is_correct ? 'true' : 'false')
                      }}
                    >
                      {t('common.previous')}
                    </Button>
                  )}
                  <Button
                    onClick={saveAnswerCorrection}
                    disabled={!isCorrect || correcting}
                  >
                    {correcting ? (
                      <Icon icon="mdi:loading" className="animate-spin h-4 w-4 mr-2" />
                    ) : null}
                    {currentAnswerIndex < textAnswers.length - 1 
                      ? t('common.next') 
                      : t('backoffice.finishCorrection')
                    }
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}