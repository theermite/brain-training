/**
 * Multi-Task Test - Handle multiple simultaneous tasks
 * Tests ability to manage concurrent tasks like in MOBA games
 * @author Jay "The Ermite" Goncalves
 * @copyright Jay The Ermite
 */

import { useState, useEffect, useRef } from 'react'
import { resolveTheme, getThemeClasses, mergeThemeClasses } from '../themes'
import { ExerciseBaseProps } from '../types'

type TaskType = 'color' | 'math' | 'direction' | 'sequence'

interface Task {
  id: number
  type: TaskType
  question: string
  correctAnswer: string
  options: string[]
  timeLeft: number
  maxTime: number
  spawnTime: number
}

interface GameStats {
  tasksCompleted: number
  tasksFailed: number
  score: number
  avgResponseTime: number
  responseTimes: number[]
  completed: boolean
}

export interface MultiTaskProps extends ExerciseBaseProps {
  duration?: number // seconds
  difficulty?: 'easy' | 'medium' | 'hard'
}

export function MultiTask({
  duration = 90,
  difficulty = 'medium',
  className,
  theme,
  onComplete,
  onProgress,
}: MultiTaskProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [timeLeft, setTimeLeft] = useState(duration)
  const [activeTasks, setActiveTasks] = useState<Task[]>([])
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>(difficulty)
  const [gameStats, setGameStats] = useState<GameStats>({
    tasksCompleted: 0,
    tasksFailed: 0,
    score: 0,
    avgResponseTime: 0,
    responseTimes: [],
    completed: false,
  })

  const taskIdCounter = useRef(0)

  const currentTheme = resolveTheme(theme)
  const themeClasses = getThemeClasses(currentTheme)

  const maxConcurrentTasks = selectedDifficulty === 'easy' ? 1 : selectedDifficulty === 'medium' ? 2 : 3
  const taskInterval = selectedDifficulty === 'easy' ? 4000 : selectedDifficulty === 'medium' ? 3000 : 2000
  const taskDuration = selectedDifficulty === 'easy' ? 8000 : selectedDifficulty === 'medium' ? 6000 : 4000

  // Game timer
  useEffect(() => {
    if (!isPlaying) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          endGame()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isPlaying])

  // Task spawner
  useEffect(() => {
    if (!isPlaying) return

    const spawner = setInterval(() => {
      if (activeTasks.length < maxConcurrentTasks) {
        spawnTask()
      }
    }, taskInterval)

    return () => clearInterval(spawner)
  }, [isPlaying, activeTasks.length, maxConcurrentTasks, taskInterval])

  // Task timer
  useEffect(() => {
    if (!isPlaying) return

    const taskTimer = setInterval(() => {
      setActiveTasks((prev) => {
        return prev
          .map((task) => ({
            ...task,
            timeLeft: task.timeLeft - 100,
          }))
          .filter((task) => {
            if (task.timeLeft <= 0) {
              // Task expired
              setGameStats((stats) => {
                const newStats = {
                  ...stats,
                  tasksFailed: stats.tasksFailed + 1,
                  score: Math.max(0, stats.score - 15),
                }
                if (onProgress) onProgress(newStats as any)
                return newStats
              })
              return false
            }
            return true
          })
      })
    }, 100)

    return () => clearInterval(taskTimer)
  }, [isPlaying])

  const generateColorTask = (): Task => {
    const colors = ['Rouge', 'Bleu', 'Vert', 'Jaune', 'Orange', 'Violet']
    const cssColors = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#f97316', '#a855f7']

    const textColor = colors[Math.floor(Math.random() * colors.length)]
    const displayColorIndex = Math.floor(Math.random() * cssColors.length)
    const correctAnswer = colors[displayColorIndex]

    return {
      id: taskIdCounter.current++,
      type: 'color',
      question: textColor,
      correctAnswer,
      options: colors,
      timeLeft: taskDuration,
      maxTime: taskDuration,
      spawnTime: Date.now(),
    }
  }

  const generateMathTask = (): Task => {
    const operations = ['+', '-', '*']
    const op = operations[Math.floor(Math.random() * operations.length)]

    let a = Math.floor(Math.random() * 20) + 1
    let b = Math.floor(Math.random() * 10) + 1
    let answer = 0

    if (op === '+') {
      answer = a + b
    } else if (op === '-') {
      answer = a - b
    } else {
      a = Math.floor(Math.random() * 10) + 1
      b = Math.floor(Math.random() * 10) + 1
      answer = a * b
    }

    const wrongAnswers = [
      answer + Math.floor(Math.random() * 5) + 1,
      answer - Math.floor(Math.random() * 5) - 1,
      answer + Math.floor(Math.random() * 10) + 5,
    ]

    const options = [answer.toString(), ...wrongAnswers.map(String)]
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort(() => Math.random() - 0.5)

    return {
      id: taskIdCounter.current++,
      type: 'math',
      question: `${a} ${op} ${b} = ?`,
      correctAnswer: answer.toString(),
      options,
      timeLeft: taskDuration,
      maxTime: taskDuration,
      spawnTime: Date.now(),
    }
  }

  const generateDirectionTask = (): Task => {
    const directions = ['Haut', 'Bas', 'Gauche', 'Droite']
    const arrows = ['↑', '↓', '←', '→']

    const index = Math.floor(Math.random() * directions.length)

    return {
      id: taskIdCounter.current++,
      type: 'direction',
      question: arrows[index],
      correctAnswer: directions[index],
      options: directions,
      timeLeft: taskDuration,
      maxTime: taskDuration,
      spawnTime: Date.now(),
    }
  }

  const generateSequenceTask = (): Task => {
    const length = selectedDifficulty === 'easy' ? 3 : selectedDifficulty === 'medium' ? 4 : 5
    const numbers = Array.from({ length }, () => Math.floor(Math.random() * 9) + 1)
    const sequence = numbers.join(' → ')
    const correctAnswer = numbers[numbers.length - 1].toString()

    const options = [
      correctAnswer,
      (Math.floor(Math.random() * 9) + 1).toString(),
      (Math.floor(Math.random() * 9) + 1).toString(),
      (Math.floor(Math.random() * 9) + 1).toString(),
    ]
      .filter((v, i, a) => a.indexOf(v) === i)
      .slice(0, 4)
      .sort(() => Math.random() - 0.5)

    return {
      id: taskIdCounter.current++,
      type: 'sequence',
      question: sequence,
      correctAnswer,
      options,
      timeLeft: taskDuration,
      maxTime: taskDuration,
      spawnTime: Date.now(),
    }
  }

  const spawnTask = () => {
    const taskGenerators = [generateColorTask, generateMathTask, generateDirectionTask, generateSequenceTask]
    const generator = taskGenerators[Math.floor(Math.random() * taskGenerators.length)]
    const newTask = generator()

    setActiveTasks((prev) => [...prev, newTask])
  }

  const handleAnswer = (taskId: number, answer: string) => {
    const task = activeTasks.find((t) => t.id === taskId)
    if (!task) return

    const responseTime = Date.now() - task.spawnTime
    const isCorrect = answer === task.correctAnswer

    setGameStats((stats) => {
      const newResponseTimes = isCorrect ? [...stats.responseTimes, responseTime] : stats.responseTimes
      const newStats = {
        ...stats,
        tasksCompleted: isCorrect ? stats.tasksCompleted + 1 : stats.tasksCompleted,
        tasksFailed: isCorrect ? stats.tasksFailed : stats.tasksFailed + 1,
        score: isCorrect ? stats.score + 25 : Math.max(0, stats.score - 10),
        responseTimes: newResponseTimes,
        avgResponseTime:
          newResponseTimes.length > 0 ? newResponseTimes.reduce((a, b) => a + b, 0) / newResponseTimes.length : 0,
      }
      if (onProgress) onProgress(newStats as any)
      return newStats
    })

    setActiveTasks((prev) => prev.filter((t) => t.id !== taskId))
  }

  const startGame = () => {
    setIsPlaying(true)
    setTimeLeft(duration)
    setActiveTasks([])
    setGameStats({
      tasksCompleted: 0,
      tasksFailed: 0,
      score: 0,
      avgResponseTime: 0,
      responseTimes: [],
      completed: false,
    })
    taskIdCounter.current = 0
  }

  const endGame = () => {
    setIsPlaying(false)
    setActiveTasks([])
    const finalStats = { ...gameStats, completed: true }
    setGameStats(finalStats)
    if (onComplete) onComplete(finalStats as any)
  }

  const getTaskBorderColor = (task: Task) => {
    const percentage = (task.timeLeft / task.maxTime) * 100
    if (percentage > 60) return 'border-green-500'
    if (percentage > 30) return 'border-yellow-500'
    return 'border-red-500'
  }

  const accuracy =
    gameStats.tasksCompleted + gameStats.tasksFailed > 0
      ? ((gameStats.tasksCompleted / (gameStats.tasksCompleted + gameStats.tasksFailed)) * 100).toFixed(1)
      : '0.0'

  const getTaskTypeLabel = (type: TaskType) => {
    switch (type) {
      case 'color':
        return '🎨 Couleur du texte (pas le mot)'
      case 'math':
        return '🔢 Calcule'
      case 'direction':
        return '➡️ Direction de la flèche'
      case 'sequence':
        return '🔢 Dernier nombre'
    }
  }

  return (
    <div className={mergeThemeClasses(`h-full flex flex-col ${themeClasses.bgMain} ${themeClasses.textMain}`, className)}>
      {/* Header */}
      <div className={`${themeClasses.bgPrimary} ${themeClasses.borderRadius} p-4 mb-4`}>
        <div className="text-center mb-3">
          <h2 className="text-2xl font-bold">🧠 Test Multi-Tâches</h2>
          <p className={`text-sm ${themeClasses.textSecondary} mt-1`}>
            Gère plusieurs tâches simultanément comme dans un MOBA
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-center">
          <div>
            <div className="text-xs opacity-80">Temps</div>
            <div className="text-xl font-bold text-orange-400">{timeLeft}s</div>
          </div>
          <div>
            <div className="text-xs opacity-80">Score</div>
            <div className="text-xl font-bold">{gameStats.score}</div>
          </div>
          <div>
            <div className="text-xs opacity-80">Réussies</div>
            <div className="text-xl font-bold text-green-400">{gameStats.tasksCompleted}</div>
          </div>
          <div>
            <div className="text-xs opacity-80">Précision</div>
            <div className="text-xl font-bold text-blue-400">{accuracy}%</div>
          </div>
          <div>
            <div className="text-xs opacity-80">Temps réponse</div>
            <div className="text-xl font-bold text-purple-400">
              {gameStats.avgResponseTime > 0 ? `${(gameStats.avgResponseTime / 1000).toFixed(1)}s` : '-'}
            </div>
          </div>
        </div>
      </div>

      {/* Game Area */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {!isPlaying && activeTasks.length === 0 && (
          <div className={`${themeClasses.bgSecondary} ${themeClasses.borderRadius} p-8 text-center`}>
            <div className="text-6xl mb-4">🧠</div>
            <h3 className="text-xl font-bold mb-2">Multi-Tâches</h3>
            <p className={`${themeClasses.textSecondary} mb-4`}>
              Des tâches variées apparaissent (couleurs, maths, directions, séquences).
              <br />
              Réponds correctement avant que le temps s'écoule !
            </p>

            {/* Difficulty Selector */}
            <div className={`${themeClasses.bgCard} ${themeClasses.borderRadius} p-4 mb-4`}>
              <p className={`text-center mb-3 font-semibold ${themeClasses.textMain}`}>
                Choisis ton niveau de difficulté :
              </p>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setSelectedDifficulty('easy')}
                  className={`
                    px-4 py-3 ${themeClasses.borderRadius} font-semibold transition-all
                    ${
                      selectedDifficulty === 'easy'
                        ? `${themeClasses.bgSuccess} text-white scale-105`
                        : `${themeClasses.bgCard} ${themeClasses.bgCardHover} ${themeClasses.border} border`
                    }
                  `}
                >
                  😊 Facile
                  <div className="text-xs opacity-70 mt-1">1 tâche</div>
                </button>
                <button
                  onClick={() => setSelectedDifficulty('medium')}
                  className={`
                    px-4 py-3 ${themeClasses.borderRadius} font-semibold transition-all
                    ${
                      selectedDifficulty === 'medium'
                        ? `${themeClasses.bgPrimary} text-white scale-105`
                        : `${themeClasses.bgCard} ${themeClasses.bgCardHover} ${themeClasses.border} border`
                    }
                  `}
                >
                  😎 Moyen
                  <div className="text-xs opacity-70 mt-1">2 tâches</div>
                </button>
                <button
                  onClick={() => setSelectedDifficulty('hard')}
                  className={`
                    px-4 py-3 ${themeClasses.borderRadius} font-semibold transition-all
                    ${
                      selectedDifficulty === 'hard'
                        ? `${themeClasses.bgError} text-white scale-105`
                        : `${themeClasses.bgCard} ${themeClasses.bgCardHover} ${themeClasses.border} border`
                    }
                  `}
                >
                  🔥 Difficile
                  <div className="text-xs opacity-70 mt-1">3 tâches</div>
                </button>
              </div>
            </div>

            <div className={`${themeClasses.bgCard} ${themeClasses.borderRadius} p-4 text-sm ${themeClasses.textSecondary}`}>
              <p>+25 pts correct | -10 pts erreur | -15 pts timeout</p>
            </div>
          </div>
        )}

        {/* Active Tasks */}
        {activeTasks.map((task) => {
          const percentage = (task.timeLeft / task.maxTime) * 100

          return (
            <div key={task.id} className={`${themeClasses.bgSecondary} ${themeClasses.borderRadius} overflow-hidden`}>
              {/* Progress Bar */}
              <div className="w-full h-2 bg-gray-700">
                <div
                  className={`h-2 transition-all ${
                    percentage > 60 ? 'bg-green-500' : percentage > 30 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>

              <div className={`border-l-4 ${getTaskBorderColor(task)} p-4`}>
                {/* Task Type */}
                <div className={`text-xs ${themeClasses.textSecondary} mb-2`}>{getTaskTypeLabel(task.type)}</div>

                {/* Question */}
                <div
                  className="text-lg font-semibold mb-4"
                  style={
                    task.type === 'color'
                      ? {
                          color:
                            task.question === 'Rouge'
                              ? '#ef4444'
                              : task.question === 'Bleu'
                              ? '#3b82f6'
                              : task.question === 'Vert'
                              ? '#22c55e'
                              : task.question === 'Jaune'
                              ? '#eab308'
                              : task.question === 'Orange'
                              ? '#f97316'
                              : '#a855f7',
                        }
                      : task.type === 'direction'
                      ? { fontSize: '3rem', textAlign: 'center' }
                      : {}
                  }
                >
                  {task.question}
                </div>

                {/* Options */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 touch-manipulation">
                  {task.options.map((option) => (
                    <button
                      key={option}
                      onClick={() => handleAnswer(task.id, option)}
                      className={`px-4 py-3 ${themeClasses.bgCard} ${themeClasses.bgCardHover} ${themeClasses.borderRadius} ${themeClasses.border} border transition-all min-h-[44px] touch-none select-none font-semibold`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )
        })}

        {isPlaying && activeTasks.length === 0 && (
          <div className={`${themeClasses.bgSecondary} ${themeClasses.borderRadius} p-8 text-center`}>
            <p className={themeClasses.textSecondary}>Nouvelle tâche en préparation...</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        {!isPlaying ? (
          <button
            onClick={startGame}
            className={`flex-1 px-6 py-3 ${themeClasses.bgPrimary} ${themeClasses.bgPrimaryHover} ${themeClasses.borderRadius} font-semibold transition-all`}
          >
            ▶ Démarrer
          </button>
        ) : (
          <button
            onClick={endGame}
            className={`flex-1 px-6 py-3 ${themeClasses.bgError} hover:opacity-90 ${themeClasses.borderRadius} font-semibold transition-all`}
          >
            ⏹ Arrêter
          </button>
        )}
      </div>

      {/* Final Results */}
      {gameStats.completed && (
        <div className={`${themeClasses.bgSecondary} ${themeClasses.borderRadius} p-4 mt-4`}>
          <h3 className="text-xl font-bold mb-3 text-center">Résultats</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>Score final: {gameStats.score}</div>
            <div>Précision: {accuracy}%</div>
            <div>Tâches réussies: {gameStats.tasksCompleted}</div>
            <div>Temps moyen: {gameStats.avgResponseTime > 0 ? `${(gameStats.avgResponseTime / 1000).toFixed(1)}s` : '-'}</div>
          </div>
          <button
            onClick={startGame}
            className={`w-full mt-4 px-6 py-3 ${themeClasses.bgPrimary} ${themeClasses.bgPrimaryHover} ${themeClasses.borderRadius} transition-all`}
          >
            🔄 Recommencer
          </button>
        </div>
      )}
    </div>
  )
}
