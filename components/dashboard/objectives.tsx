'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Icon } from '@iconify/react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'

interface Goal {
  id: string
  goal_text: string
  is_completed: boolean
}

export function Objectives() {
  const { t } = useTranslation()
  const [goals, setGoals] = useState<Goal[]>([])
  const [newGoal, setNewGoal] = useState('')
  const [mainGoal, setMainGoal] = useState('')
  const [generatedTasks, setGeneratedTasks] = useState<string[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [firstTimeUser, setFirstTimeUser] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadGoals()
    checkFirstTimeUser()
  }, [])

  async function loadGoals() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase
        .from('user_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (data) {
        setGoals(data)
      }
    }
  }

  async function checkFirstTimeUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase
        .from('user_goals')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)

      if (!data || data.length === 0) {
        setFirstTimeUser(true)
        setDialogOpen(true)
      }
    }
  }

  async function addGoal(goalText: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (user && goalText.trim()) {
      const { data, error } = await supabase
        .from('user_goals')
        .insert({
          user_id: user.id,
          goal_text: goalText.trim(),
          ask_again_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .single()

      if (data && !error) {
        setGoals([data, ...goals])
        setNewGoal('')
      }
    }
  }

  async function toggleGoal(goalId: string, isCompleted: boolean) {
    const { error } = await supabase
      .from('user_goals')
      .update({
        is_completed: isCompleted,
        completed_at: isCompleted ? new Date().toISOString() : null,
      })
      .eq('id', goalId)

    if (!error) {
      setGoals(goals.map(goal =>
        goal.id === goalId ? { ...goal, is_completed: isCompleted } : goal
      ))
    }
  }

  async function deleteGoal(goalId: string) {
    const { error } = await supabase
      .from('user_goals')
      .delete()
      .eq('id', goalId)

    if (!error) {
      setGoals(goals.filter(goal => goal.id !== goalId))
    }
  }

  function generateTasks() {
    // This is a simplified version. In production, you might use an AI service
    const taskTemplates = [
      `Compléter le module d'introduction pour ${mainGoal}`,
      `Passer le quiz de validation des connaissances`,
      `Étudier les concepts avancés liés à ${mainGoal}`,
      `Appliquer les connaissances dans un cas pratique`,
      `Partager vos apprentissages avec la communauté`,
    ]
    setGeneratedTasks(taskTemplates.slice(0, Math.min(5, Math.floor(Math.random() * 3) + 3)))
  }

  async function saveGeneratedGoals() {
    for (const task of generatedTasks) {
      await addGoal(task)
    }
    setDialogOpen(false)
    setMainGoal('')
    setGeneratedTasks([])
  }

  return (
    <>
      <div className="h-full">
        <div className="pb-4">
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Tes objectifs !</h3>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="w-fit">
                  <Icon icon="mdi:plus" className="h-4 w-4 mr-2" />
                  {t('dashboard.addTask')}
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{t('dashboard.defineGoal')}</DialogTitle>
                <DialogDescription>
                  {t('dashboard.whatToAchieve')}
                </DialogDescription>
              </DialogHeader>
              {firstTimeUser && generatedTasks.length === 0 ? (
                <div className="space-y-4">
                  <Input
                    placeholder={t('dashboard.whatToAchieve')}
                    value={mainGoal}
                    onChange={(e) => setMainGoal(e.target.value)}
                  />
                  <Button onClick={generateTasks} disabled={!mainGoal.trim()}>
                    {t('dashboard.generateTasks')}
                  </Button>
                </div>
              ) : generatedTasks.length > 0 ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    {generatedTasks.map((task, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={task}
                          onChange={(e) => {
                            const newTasks = [...generatedTasks]
                            newTasks[index] = e.target.value
                            setGeneratedTasks(newTasks)
                          }}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setGeneratedTasks(generatedTasks.filter((_, i) => i !== index))}
                        >
                          <Icon icon="mdi:close" className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setGeneratedTasks([...generatedTasks, ''])}
                    >
                      <Icon icon="mdi:plus" className="h-4 w-4 mr-2" />
                      {t('dashboard.addTask')}
                    </Button>
                    <Button onClick={saveGeneratedGoals}>
                      {t('common.save')}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Input
                    placeholder={t('dashboard.addTask')}
                    value={newGoal}
                    onChange={(e) => setNewGoal(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addGoal(newGoal)
                        setDialogOpen(false)
                      }
                    }}
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                      {t('common.cancel')}
                    </Button>
                    <Button onClick={() => {
                      addGoal(newGoal)
                      setDialogOpen(false)
                    }}>
                      {t('common.save')}
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
            </Dialog>
          </div>
        </div>
        <div>
          {goals.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              {t('dashboard.noObjectives')}
            </p>
          ) : (
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {goals.map((goal, index) => (
                  <motion.div
                    key={goal.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      >
                        <Checkbox
                          checked={goal.is_completed}
                          onCheckedChange={(checked) => toggleGoal(goal.id, checked as boolean)}
                        />
                      </motion.div>
                      <motion.span 
                        className={cn(
                          "flex-1 text-sm",
                          goal.is_completed && "line-through text-gray-400"
                        )}
                        layout
                      >
                        • {goal.goal_text}
                      </motion.span>
                    </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => deleteGoal(goal.id)}
                  >
                    <Icon icon="mdi:delete" className="h-4 w-4" />
                  </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}