/**
 * Reaction Time Test - Measure reaction speed
 * Click when the button turns green
 * @author Jay "The Ermite" Goncalves
 * @copyright Jay The Ermite
 */

import { useState, useEffect, useRef } from 'react'
import { resolveTheme, getThemeClasses, mergeThemeClasses } from '../themes'
import { ExerciseBaseProps } from '../types'

type GamePhase = 'idle' | 'waiting' | 'ready' | 'tooEarly' | 'result'

interface ReactionResult {
  reactionTime: number
  timestamp: number
}

interface GameStats {
  attempts: ReactionResult[]
  averageTime: number
  fastestTime: number
  slowestTime: number
  consistency: number
}

export interface ReactionTimeProps extends ExerciseBaseProps {
  totalAttempts?: number
  minDelay?: number
  maxDelay?: number
}

export function ReactionTime({
  totalAttempts = 5,
  minDelay = 1500,
  maxDelay = 4000,
  className,
  theme,
  onComplete,
  onProgress,
}: ReactionTimeProps) {
  const [gamePhase, setGamePhase] = useState<GamePhase>('idle')
  const [currentAttempt, setCurrentAttempt] = useState(0)
  const [gameStats, setGameStats] = useState<GameStats>({
    attempts: [],
    averageTime: 0,
    fastestTime: 0,
    slowestTime: 0,
    consistency: 0,
  })

  const startTimeRef = useRef<number>(0)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const currentTheme = resolveTheme(theme)
  const themeClasses = getThemeClasses(currentTheme)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const calculateStats = (attempts: ReactionResult[]): GameStats => {
    if (attempts.length === 0) {
      return {
        attempts: [],
        averageTime: 0,
        fastestTime: 0,
        slowestTime: 0,
        consistency: 0,
      }
    }

    const times = attempts.map((a) => a.reactionTime)
    const averageTime = times.reduce((a, b) => a + b, 0) / times.length
    const fastestTime = Math.min(...times)
    const slowestTime = Math.max(...times)

    const variance = times.reduce((sum, time) => sum + Math.pow(time - averageTime, 2), 0) / times.length
    const standardDeviation = Math.sqrt(variance)

    return {
      attempts,
      averageTime,
      fastestTime,
      slowestTime,
      consistency: standardDeviation,
    }
  }

  const startTest = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    setGamePhase('waiting')
    const delay = Math.random() * (maxDelay - minDelay) + minDelay

    timeoutRef.current = setTimeout(() => {
      setGamePhase('ready')
      startTimeRef.current = Date.now()
    }, delay)
  }

  const handleClick = () => {
    if (gamePhase === 'waiting') {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      setGamePhase('tooEarly')
      return
    }

    if (gamePhase === 'ready') {
      const reactionTime = Date.now() - startTimeRef.current
      const newAttempt: ReactionResult = {
        reactionTime,
        timestamp: Date.now(),
      }

      const newAttempts = [...gameStats.attempts, newAttempt]
      const newStats = calculateStats(newAttempts)
      setGameStats(newStats)
      setCurrentAttempt(currentAttempt + 1)
      setGamePhase('result')

      if (onProgress) {
        onProgress({ ...newStats, is_completed: false } as any)
      }

      if (currentAttempt + 1 >= totalAttempts) {
        if (onComplete) {
          onComplete({ ...newStats, is_completed: true } as any)
        }
      } else {
        setTimeout(() => {
          startTest()
        }, 1500)
      }
    }
  }

  const resetGame = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setGamePhase('idle')
    setCurrentAttempt(0)
    setGameStats({
      attempts: [],
      averageTime: 0,
      fastestTime: 0,
      slowestTime: 0,
      consistency: 0,
    })
  }

  const getPhaseColor = () => {
    switch (gamePhase) {
      case 'waiting':
        return themeClasses.bgError
      case 'ready':
        return themeClasses.bgSuccess
      case 'tooEarly':
        return themeClasses.bgWarning
      default:
        return themeClasses.bgPrimary
    }
  }

  const getPhaseText = () => {
    switch (gamePhase) {
      case 'idle':
        return 'Cliquez pour commencer'
      case 'waiting':
        return 'Attendez...'
      case 'ready':
        return 'CLIQUEZ MAINTENANT !'
      case 'tooEarly':
        return 'Trop tôt ! Attendez le vert'
      case 'result':
        return `${gameStats.attempts[gameStats.attempts.length - 1]?.reactionTime}ms`
    }
  }

  return (
    <div className={mergeThemeClasses(`h-full flex flex-col ${themeClasses.bgMain} ${themeClasses.textMain} p-6`, className)}>
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">⚡ Test de Temps de Réaction</h2>
        <p className={themeClasses.textSecondary}>
          Tentative {currentAttempt + 1} / {totalAttempts}
        </p>
      </div>

      {/* Reaction Area */}
      <div className="flex-1 flex items-center justify-center mb-6">
        <button
          onClick={handleClick}
          disabled={gamePhase === 'result'}
          className={`
            w-full max-w-2xl aspect-square ${themeClasses.borderRadius}
            ${getPhaseColor()}
            transition-all duration-200 transform
            ${gamePhase !== 'result' ? 'hover:scale-105 active:scale-95' : ''}
            touch-manipulation select-none
            flex items-center justify-center
            text-2xl sm:text-4xl font-bold
          `}
        >
          {getPhaseText()}
        </button>
      </div>

      {/* Stats */}
      {gameStats.attempts.length > 0 && (
        <div className={`${themeClasses.bgSecondary} ${themeClasses.borderRadius} p-4 mb-4`}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <div className={`text-xs ${themeClasses.textSecondary}`}>Moyenne</div>
              <div className="text-lg font-bold">{Math.round(gameStats.averageTime)}ms</div>
            </div>
            <div>
              <div className={`text-xs ${themeClasses.textSecondary}`}>Plus rapide</div>
              <div className="text-lg font-bold text-green-500">{Math.round(gameStats.fastestTime)}ms</div>
            </div>
            <div>
              <div className={`text-xs ${themeClasses.textSecondary}`}>Plus lent</div>
              <div className="text-lg font-bold text-orange-500">{Math.round(gameStats.slowestTime)}ms</div>
            </div>
            <div>
              <div className={`text-xs ${themeClasses.textSecondary}`}>Régularité</div>
              <div className="text-lg font-bold">±{Math.round(gameStats.consistency)}ms</div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {gamePhase === 'idle' && (
          <button
            onClick={startTest}
            className={`flex-1 px-6 py-3 ${themeClasses.bgPrimary} ${themeClasses.bgPrimaryHover} ${themeClasses.borderRadius} font-semibold transition-all`}
          >
            ▶ Démarrer le Test
          </button>
        )}
        {currentAttempt >= totalAttempts && (
          <button
            onClick={resetGame}
            className={`flex-1 px-6 py-3 ${themeClasses.bgCard} ${themeClasses.bgCardHover} ${themeClasses.borderRadius} ${themeClasses.border} border transition-all`}
          >
            🔄 Recommencer
          </button>
        )}
        {gamePhase === 'tooEarly' && (
          <button
            onClick={() => setGamePhase('idle')}
            className={`flex-1 px-6 py-3 ${themeClasses.bgWarning} hover:opacity-90 ${themeClasses.borderRadius} transition-all`}
          >
            Réessayer
          </button>
        )}
      </div>
    </div>
  )
}
