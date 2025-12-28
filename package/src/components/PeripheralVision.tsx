/**
 * Peripheral Vision Trainer - Train peripheral vision
 * Click on targets that appear randomly on screen
 * @author Jay "The Ermite" Goncalves
 * @copyright Jay The Ermite
 */

import { useState, useEffect, useRef } from 'react'
import { resolveTheme, getThemeClasses, mergeThemeClasses } from '../themes'
import { ExerciseBaseProps } from '../types'

interface Target {
  id: number
  x: number
  y: number
  spawnTime: number
}

interface GameStats {
  hits: number
  misses: number
  score: number
  avgReactionTime: number
  reactionTimes: number[]
  completed: boolean
}

export interface PeripheralVisionProps extends ExerciseBaseProps {
  duration?: number // seconds
  targetSize?: number
  targetDuration?: number // ms
  spawnInterval?: number // ms
}

export function PeripheralVision({
  duration = 60,
  targetSize = 40,
  targetDuration = 1500,
  spawnInterval = 1000,
  className,
  theme,
  onComplete,
  onProgress,
}: PeripheralVisionProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [timeLeft, setTimeLeft] = useState(duration)
  const [targets, setTargets] = useState<Target[]>([])
  const [gameStats, setGameStats] = useState<GameStats>({
    hits: 0,
    misses: 0,
    score: 0,
    avgReactionTime: 0,
    reactionTimes: [],
    completed: false,
  })

  const gameAreaRef = useRef<HTMLDivElement>(null)
  const targetIdRef = useRef(0)

  const currentTheme = resolveTheme(theme)
  const themeClasses = getThemeClasses(currentTheme)

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

  // Spawn targets
  useEffect(() => {
    if (!isPlaying || !gameAreaRef.current) return

    const spawner = setInterval(() => {
      spawnTarget()
    }, spawnInterval)

    return () => clearInterval(spawner)
  }, [isPlaying, spawnInterval])

  // Remove expired targets
  useEffect(() => {
    if (!isPlaying) return

    const cleaner = setInterval(() => {
      const now = Date.now()
      setTargets((prev) => {
        return prev.filter((target) => {
          if (now - target.spawnTime > targetDuration) {
            // Missed target
            setGameStats((stats) => {
              const newStats = {
                ...stats,
                misses: stats.misses + 1,
                score: Math.max(0, stats.score - 10),
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

    return () => clearInterval(cleaner)
  }, [isPlaying, targetDuration])

  const spawnTarget = () => {
    if (!gameAreaRef.current) return

    const rect = gameAreaRef.current.getBoundingClientRect()
    const margin = targetSize + 10

    const x = Math.random() * (rect.width - margin * 2) + margin
    const y = Math.random() * (rect.height - margin * 2) + margin

    const newTarget: Target = {
      id: targetIdRef.current++,
      x,
      y,
      spawnTime: Date.now(),
    }

    setTargets((prev) => [...prev, newTarget])
  }

  const handleTargetClick = (target: Target) => {
    const reactionTime = Date.now() - target.spawnTime
    const newReactionTimes = [...gameStats.reactionTimes, reactionTime]
    const avgReactionTime = newReactionTimes.reduce((a, b) => a + b, 0) / newReactionTimes.length

    setGameStats((stats) => {
      const newStats = {
        ...stats,
        hits: stats.hits + 1,
        score: stats.score + 10,
        reactionTimes: newReactionTimes,
        avgReactionTime,
      }
      if (onProgress) onProgress(newStats as any)
      return newStats
    })

    setTargets((prev) => prev.filter((t) => t.id !== target.id))
  }

  const startGame = () => {
    setIsPlaying(true)
    setTimeLeft(duration)
    setTargets([])
    setGameStats({
      hits: 0,
      misses: 0,
      score: 0,
      avgReactionTime: 0,
      reactionTimes: [],
      completed: false,
    })
  }

  const endGame = () => {
    setIsPlaying(false)
    setTargets([])
    const finalStats = { ...gameStats, completed: true }
    setGameStats(finalStats)
    if (onComplete) onComplete(finalStats as any)
  }

  return (
    <div className={mergeThemeClasses(`h-full flex flex-col ${themeClasses.bgMain} ${themeClasses.textMain}`, className)}>
      {/* Header */}
      <div className={`${themeClasses.bgPrimary} ${themeClasses.borderRadius} p-4 mb-4`}>
        <div className="grid grid-cols-4 gap-2 text-center">
          <div>
            <div className="text-xs opacity-80">Temps</div>
            <div className="text-xl font-bold">{timeLeft}s</div>
          </div>
          <div>
            <div className="text-xs opacity-80">Touchés</div>
            <div className="text-xl font-bold text-green-400">{gameStats.hits}</div>
          </div>
          <div>
            <div className="text-xs opacity-80">Ratés</div>
            <div className="text-xl font-bold text-red-400">{gameStats.misses}</div>
          </div>
          <div>
            <div className="text-xs opacity-80">Score</div>
            <div className="text-xl font-bold">{gameStats.score}</div>
          </div>
        </div>
      </div>

      {/* Game Area */}
      <div
        ref={gameAreaRef}
        className={`flex-1 relative ${themeClasses.bgSecondary} ${themeClasses.borderRadius} overflow-hidden`}
        style={{ minHeight: '400px' }}
      >
        {!isPlaying && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-6xl mb-4">👁️</div>
            <h3 className="text-2xl font-bold mb-2">Vision Périphérique</h3>
            <p className={`${themeClasses.textSecondary} mb-6 text-center max-w-md`}>
              Fixez le centre et cliquez sur les cibles qui apparaissent avec votre vision périphérique
            </p>
            <button
              onClick={startGame}
              className={`px-8 py-4 ${themeClasses.bgPrimary} ${themeClasses.bgPrimaryHover} ${themeClasses.borderRadius} font-semibold transition-all text-lg`}
            >
              ▶ Démarrer
            </button>
          </div>
        )}

        {isPlaying && (
          <>
            {/* Center fixation point */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full z-10" />

            {/* Targets */}
            {targets.map((target) => {
              const age = Date.now() - target.spawnTime
              const progress = age / targetDuration
              const opacity = 1 - progress

              return (
                <button
                  key={target.id}
                  onClick={() => handleTargetClick(target)}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 rounded-full transition-all hover:scale-110 active:scale-95 touch-manipulation"
                  style={{
                    left: target.x,
                    top: target.y,
                    width: targetSize,
                    height: targetSize,
                    background: `radial-gradient(circle, rgba(234, 179, 8, ${opacity}), rgba(249, 115, 22, ${opacity * 0.5}))`,
                    boxShadow: `0 0 ${20 * opacity}px rgba(234, 179, 8, ${opacity})`,
                  }}
                />
              )
            })}
          </>
        )}
      </div>

      {/* Final Results */}
      {gameStats.completed && (
        <div className={`${themeClasses.bgSecondary} ${themeClasses.borderRadius} p-4 mt-4`}>
          <h3 className="text-xl font-bold mb-2 text-center">Résultats</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Précision: {gameStats.hits > 0 ? Math.round((gameStats.hits / (gameStats.hits + gameStats.misses)) * 100) : 0}%</div>
            <div>Temps moyen: {Math.round(gameStats.avgReactionTime)}ms</div>
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
