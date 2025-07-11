'use client'

import { useTranslation } from 'react-i18next'
import { Icon } from '@iconify/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Quiz {
  id: string
  title: string
  description: string
  timer_minutes: number | null
  quiz_questions: any[]
}

interface QuizPreviewProps {
  quiz: Quiz
  attempts: number
  onStartQuiz: () => void
}

export function QuizPreview({ quiz, attempts, onStartQuiz }: QuizPreviewProps) {
  const { t } = useTranslation()

  const estimatedTime = quiz.timer_minutes || Math.ceil(quiz.quiz_questions.length * 2)

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon icon="mdi:quiz" className="h-5 w-5" />
          {quiz.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Quiz Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Icon icon="mdi:clock" className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600">{estimatedTime}</div>
              <div className="text-sm text-blue-600">{t('common.minutes')}</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Icon icon="mdi:help-circle" className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">{quiz.quiz_questions.length}</div>
              <div className="text-sm text-green-600">{t('courses.questions')}</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Icon icon="mdi:repeat" className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-600">{attempts}</div>
              <div className="text-sm text-purple-600">{t('courses.attempts')}</div>
            </div>
          </div>

          {/* Description */}
          {quiz.description && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">{t('courses.quizDescription')}</h4>
              <p className="text-gray-700">{quiz.description}</p>
            </div>
          )}

          {/* Quiz Rules */}
          <div className="space-y-3">
            <h4 className="font-medium">{t('courses.quizRules')}</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Icon icon="mdi:check-circle" className="h-4 w-4 text-green-500" />
                <span>{t('courses.ruleReadCarefully')}</span>
              </div>
              {quiz.timer_minutes && (
                <div className="flex items-center gap-2">
                  <Icon icon="mdi:clock-alert" className="h-4 w-4 text-orange-500" />
                  <span>{t('courses.ruleTimeLimited', { minutes: quiz.timer_minutes })}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Icon icon="mdi:check-bold" className="h-4 w-4 text-blue-500" />
                <span>{t('courses.ruleCheckAnswers')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon icon="mdi:refresh" className="h-4 w-4 text-purple-500" />
                <span>{t('courses.ruleCanRetake')}</span>
              </div>
            </div>
          </div>

          {/* Previous Attempts */}
          {attempts > 0 && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Icon icon="mdi:information" className="h-4 w-4 text-yellow-600" />
                <span className="font-medium text-yellow-800">{t('courses.previousAttempts')}</span>
              </div>
              <p className="text-sm text-yellow-700">
                {t('courses.attemptHistory', { count: attempts })}
              </p>
            </div>
          )}

          {/* Start Button */}
          <div className="flex justify-center pt-4">
            <Button onClick={onStartQuiz} size="lg" className="min-w-48">
              <Icon icon="mdi:play" className="h-5 w-5 mr-2" />
              {attempts > 0 ? t('courses.retakeQuiz') : t('courses.startQuiz')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}