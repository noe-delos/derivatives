'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Icon } from '@iconify/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'

interface QuestionChoice {
  id: string
  choice_text: string
  is_correct: boolean
  order_index: number
}

interface Question {
  id: string
  question_text: string
  question_type: 'choice' | 'text'
  order_index: number
  question_choices: QuestionChoice[]
}

interface Quiz {
  id: string
  title: string
  description: string
  timer_minutes: number | null
  quiz_questions: Question[]
}

interface QuizRendererProps {
  quiz: Quiz
  onComplete: (score: number, needsCorrection: boolean) => void
  onCancel: () => void
}

export function QuizRenderer({ quiz, onComplete, onCancel }: QuizRendererProps) {
  const { t } = useTranslation()
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [timeLeft, setTimeLeft] = useState<number | null>(
    quiz.timer_minutes ? quiz.timer_minutes * 60 : null
  )
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const supabase = createClient()

  const sortedQuestions = quiz.quiz_questions.sort((a, b) => a.order_index - b.order_index)
  const currentQuestion = sortedQuestions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / sortedQuestions.length) * 100

  // Timer effect
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          handleSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft])

  function formatTime(seconds: number) {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  function handleAnswerChange(questionId: string, value: string) {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }))
  }

  function goToNextQuestion() {
    if (currentQuestionIndex < sortedQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  function goToPreviousQuestion() {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  async function handleSubmit() {
    setSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Create quiz attempt
      const { data: attemptData, error: attemptError } = await supabase
        .from('quiz_attempts')
        .insert({
          user_id: user.id,
          quiz_id: quiz.id,
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString()
        })
        .select()
        .single()

      if (attemptError || !attemptData) {
        console.error('Error creating quiz attempt:', attemptError)
        return
      }

      let score = 0
      let totalQuestions = 0
      let needsCorrection = false

      // Process answers
      for (const question of sortedQuestions) {
        const userAnswer = answers[question.id]
        if (!userAnswer) continue

        totalQuestions++
        let isCorrect: boolean | null = null

        if (question.question_type === 'choice') {
          // Find the selected choice
          const selectedChoice = question.question_choices.find(
            choice => choice.id === userAnswer
          )
          isCorrect = selectedChoice?.is_correct || false
          if (isCorrect) score++
        } else {
          // Text question - needs manual correction
          needsCorrection = true
          isCorrect = null
        }

        // Save the answer
        await supabase
          .from('quiz_answers')
          .insert({
            attempt_id: attemptData.id,
            question_id: question.id,
            answer_text: question.question_type === 'text' ? userAnswer : undefined,
            choice_id: question.question_type === 'choice' ? userAnswer : undefined,
            is_correct: isCorrect
          })
      }

      // Calculate final score (only for choice questions if there are text questions)
      const finalScore = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0

      // Update attempt with score and correction status
      await supabase
        .from('quiz_attempts')
        .update({
          score: needsCorrection ? null : finalScore,
          needs_correction: needsCorrection,
          is_corrected: !needsCorrection
        })
        .eq('id', attemptData.id)

      onComplete(finalScore, needsCorrection)
    } catch (error) {
      console.error('Error submitting quiz:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const allQuestionsAnswered = sortedQuestions.every(q => answers[q.id])
  const isLastQuestion = currentQuestionIndex === sortedQuestions.length - 1

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Icon icon="mdi:quiz" className="h-5 w-5" />
              {quiz.title}
            </CardTitle>
            <div className="flex items-center gap-4">
              {timeLeft !== null && (
                <Badge variant={timeLeft < 300 ? "destructive" : "secondary"}>
                  <Icon icon="mdi:clock" className="h-3 w-3 mr-1" />
                  {formatTime(timeLeft)}
                </Badge>
              )}
              <Button variant="outline" onClick={() => setShowConfirmDialog(true)}>
                {t('common.cancel')}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>
                {t('courses.question')} {currentQuestionIndex + 1} {t('common.of')} {sortedQuestions.length}
              </span>
              <span>{Math.round(progress)}% {t('common.completed')}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardHeader>
      </Card>

      {/* Question */}
      <Card>
        <CardContent className="p-8">
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-4">{currentQuestion.question_text}</h3>
              <Badge variant="outline">
                {currentQuestion.question_type === 'choice' 
                  ? t('courses.multipleChoice') 
                  : t('courses.textAnswer')
                }
              </Badge>
            </div>

            {currentQuestion.question_type === 'choice' ? (
              <RadioGroup
                value={answers[currentQuestion.id] || ''}
                onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
              >
                <div className="space-y-3">
                  {currentQuestion.question_choices
                    .sort((a, b) => a.order_index - b.order_index)
                    .map((choice) => (
                      <div key={choice.id} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                        <RadioGroupItem value={choice.id} id={choice.id} />
                        <Label htmlFor={choice.id} className="flex-1 cursor-pointer">
                          {choice.choice_text}
                        </Label>
                      </div>
                    ))}
                </div>
              </RadioGroup>
            ) : (
              <Textarea
                placeholder={t('courses.typeYourAnswer')}
                value={answers[currentQuestion.id] || ''}
                onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                rows={6}
                className="resize-none"
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={goToPreviousQuestion}
              disabled={currentQuestionIndex === 0}
            >
              <Icon icon="mdi:arrow-left" className="h-4 w-4 mr-2" />
              {t('common.previous')}
            </Button>

            <div className="flex items-center gap-2">
              {sortedQuestions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={cn(
                    'w-8 h-8 rounded-full text-sm font-medium transition-colors',
                    index === currentQuestionIndex
                      ? 'bg-blue-500 text-white'
                      : answers[sortedQuestions[index].id]
                        ? 'bg-green-100 text-green-700 border border-green-300'
                        : 'bg-gray-100 text-gray-500 border border-gray-300'
                  )}
                >
                  {index + 1}
                </button>
              ))}
            </div>

            {isLastQuestion ? (
              <Button
                onClick={() => setShowConfirmDialog(true)}
                disabled={!allQuestionsAnswered || submitting}
              >
                {submitting ? (
                  <Icon icon="mdi:loading" className="animate-spin h-4 w-4 mr-2" />
                ) : (
                  <Icon icon="mdi:check" className="h-4 w-4 mr-2" />
                )}
                {t('courses.submitQuiz')}
              </Button>
            ) : (
              <Button
                onClick={goToNextQuestion}
                disabled={!answers[currentQuestion.id]}
              >
                {t('common.next')}
                <Icon icon="mdi:arrow-right" className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {allQuestionsAnswered ? t('courses.submitQuizConfirm') : t('courses.cancelQuizConfirm')}
            </DialogTitle>
            <DialogDescription>
              {allQuestionsAnswered 
                ? t('courses.submitQuizDescription')
                : t('courses.cancelQuizDescription')
              }
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={allQuestionsAnswered ? handleSubmit : onCancel}
              variant={allQuestionsAnswered ? "default" : "destructive"}
            >
              {allQuestionsAnswered ? t('courses.submitQuiz') : t('courses.exitQuiz')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}