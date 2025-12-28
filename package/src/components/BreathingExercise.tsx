/**
 * Breathing Exercise - Guided breathing with animation and sound
 * Includes multiple breathing patterns with audio frequency support
 * @author Jay "The Ermite" Goncalves
 * @copyright Jay The Ermite
 */

import { useState, useEffect, useRef } from 'react'
import { Volume2, VolumeX, Play, Pause } from 'lucide-react'
import { BreathingExerciseProps, BreathPhase, BreathingPattern } from '../types'
import { resolveTheme, getThemeClasses, mergeThemeClasses } from '../themes'

const DEFAULT_PATTERNS: BreathingPattern[] = [
  {
    name: 'Cohérence Cardiaque',
    description: '5s inspiration / 5s expiration',
    inhale: 5,
    hold: 0,
    exhale: 5,
    rest: 0,
    frequency: 432,
  },
  {
    name: 'Relaxation 4-7-8',
    description: 'Calme profond et sommeil',
    inhale: 4,
    hold: 7,
    exhale: 8,
    rest: 0,
    frequency: 396,
  },
  {
    name: 'Énergisant',
    description: 'Boost d\'énergie',
    inhale: 4,
    hold: 4,
    exhale: 4,
    rest: 4,
    frequency: 528,
  },
]

export function BreathingExercise({
  patterns = DEFAULT_PATTERNS,
  defaultPatternIndex = 0,
  enableSound = true,
  className,
  theme,
  onComplete,
  onProgress,
}: BreathingExerciseProps) {
  const [isActive, setIsActive] = useState(false)
  const [currentPatternIndex, setCurrentPatternIndex] = useState(defaultPatternIndex)
  const [phase, setPhase] = useState<BreathPhase>('inhale')
  const [timeLeft, setTimeLeft] = useState(patterns[defaultPatternIndex].inhale)
  const [soundEnabled, setSoundEnabled] = useState(enableSound)
  const [cycleCount, setCycleCount] = useState(0)
  const [startTime, setStartTime] = useState<number>(0)

  const audioContextRef = useRef<AudioContext | null>(null)
  const oscillatorRef = useRef<OscillatorNode | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)

  const pattern = patterns[currentPatternIndex]
  const currentTheme = resolveTheme(theme)
  const themeClasses = getThemeClasses(currentTheme)

  // Initialize audio context
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      gainNodeRef.current = audioContextRef.current.createGain()
      gainNodeRef.current.connect(audioContextRef.current.destination)
      gainNodeRef.current.gain.value = 0
    }

    return () => {
      if (oscillatorRef.current) {
        oscillatorRef.current.stop()
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  // Play sound
  useEffect(() => {
    if (!audioContextRef.current || !gainNodeRef.current) return

    if (isActive && soundEnabled) {
      if (!oscillatorRef.current) {
        oscillatorRef.current = audioContextRef.current.createOscillator()
        oscillatorRef.current.type = 'sine'
        oscillatorRef.current.frequency.value = pattern.frequency
        oscillatorRef.current.connect(gainNodeRef.current)
        oscillatorRef.current.start()
      }

      const targetVolume = phase === 'exhale' ? 0.1 : 0.05
      gainNodeRef.current.gain.setTargetAtTime(
        targetVolume,
        audioContextRef.current.currentTime,
        0.3
      )
    } else if (oscillatorRef.current && gainNodeRef.current) {
      gainNodeRef.current.gain.setTargetAtTime(
        0,
        audioContextRef.current.currentTime,
        0.3
      )
    }
  }, [isActive, soundEnabled, phase, pattern.frequency])

  // Breathing cycle logic
  useEffect(() => {
    if (!isActive) return

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          let nextPhase: BreathPhase = 'inhale'
          let nextTime = pattern.inhale

          if (phase === 'inhale') {
            if (pattern.hold > 0) {
              nextPhase = 'hold'
              nextTime = pattern.hold
            } else {
              nextPhase = 'exhale'
              nextTime = pattern.exhale
            }
          } else if (phase === 'hold') {
            nextPhase = 'exhale'
            nextTime = pattern.exhale
          } else if (phase === 'exhale') {
            if (pattern.rest > 0) {
              nextPhase = 'rest'
              nextTime = pattern.rest
            } else {
              nextPhase = 'inhale'
              nextTime = pattern.inhale
              setCycleCount((c) => c + 1)
            }
          } else {
            nextPhase = 'inhale'
            nextTime = pattern.inhale
            setCycleCount((c) => c + 1)
          }

          setPhase(nextPhase)

          if (onProgress) {
            onProgress({
              pattern_name: pattern.name,
              cycles_completed: cycleCount,
              duration_ms: Date.now() - startTime,
            })
          }

          return nextTime
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isActive, phase, pattern, cycleCount])

  const handleToggle = () => {
    if (!isActive) {
      setPhase('inhale')
      setTimeLeft(pattern.inhale)
      setCycleCount(0)
      setStartTime(Date.now())
    } else {
      if (onComplete) {
        onComplete({
          pattern_name: pattern.name,
          cycles_completed: cycleCount,
          duration_ms: Date.now() - startTime,
        })
      }
    }
    setIsActive(!isActive)
  }

  const handlePatternChange = (index: number) => {
    setCurrentPatternIndex(index)
    setIsActive(false)
    setPhase('inhale')
    setTimeLeft(patterns[index].inhale)
    setCycleCount(0)

    if (oscillatorRef.current) {
      oscillatorRef.current.frequency.value = patterns[index].frequency
    }
  }

  const getPhaseText = () => {
    switch (phase) {
      case 'inhale':
        return 'Inspire'
      case 'hold':
        return 'Retiens'
      case 'exhale':
        return 'Expire'
      case 'rest':
        return 'Pause'
    }
  }

  const getPhaseColor = () => {
    switch (phase) {
      case 'inhale':
        return 'from-blue-400 to-blue-600'
      case 'hold':
        return 'from-purple-400 to-purple-600'
      case 'exhale':
        return 'from-green-400 to-green-600'
      case 'rest':
        return 'from-gray-400 to-gray-600'
    }
  }

  const getCircleScale = () => {
    const totalTime =
      phase === 'inhale'
        ? pattern.inhale
        : phase === 'hold'
        ? pattern.hold
        : phase === 'exhale'
        ? pattern.exhale
        : pattern.rest

    const progress = 1 - timeLeft / totalTime

    if (phase === 'inhale') {
      return 0.3 + progress * 0.7
    } else if (phase === 'exhale') {
      return 1 - progress * 0.7
    }
    return 1
  }

  return (
    <div className={mergeThemeClasses(`${themeClasses.bgMain} ${themeClasses.borderRadius} p-6 space-y-6`, className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className={`text-2xl font-bold ${themeClasses.textMain}`}>
          🌬️ Respiration Guidée
        </h3>
      </div>

      {/* Pattern selector */}
      <div className="flex gap-2">
        {patterns.map((p, index) => (
          <button
            key={index}
            onClick={() => handlePatternChange(index)}
            className={`flex-1 px-3 py-2 ${themeClasses.borderRadius} text-xs font-semibold transition-all ${
              currentPatternIndex === index
                ? `${themeClasses.bgAccent} ${themeClasses.textMain}`
                : `${themeClasses.bgCard} ${themeClasses.textSecondary} ${themeClasses.bgCardHover}`
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* Description */}
      <p className={`text-sm ${themeClasses.textSecondary} text-center`}>{pattern.description}</p>

      {/* Animation circle */}
      <div className="relative flex items-center justify-center h-64">
        <div
          className={`absolute w-48 h-48 rounded-full bg-gradient-to-br ${getPhaseColor()} transition-transform duration-1000 ease-in-out flex items-center justify-center shadow-2xl`}
          style={{
            transform: `scale(${getCircleScale()})`,
            boxShadow: isActive
              ? `0 0 60px rgba(96, 165, 250, ${getCircleScale() * 0.5})`
              : '0 0 20px rgba(96, 165, 250, 0.3)',
          }}
        >
          <div className="text-center">
            <div className="text-4xl font-bold text-white mb-2">{timeLeft}</div>
            <div className="text-lg text-white/90">{getPhaseText()}</div>
          </div>
        </div>
      </div>

      {/* Cycle count */}
      <div className={`text-center ${themeClasses.textSecondary} text-sm`}>
        Cycles complétés : {cycleCount}
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        <button
          onClick={handleToggle}
          className={`flex-1 px-6 py-4 ${themeClasses.borderRadius} font-semibold transition-all flex items-center justify-center gap-2 ${
            isActive
              ? `${themeClasses.bgWarning} hover:opacity-90`
              : `${themeClasses.bgAccent} ${themeClasses.bgAccentHover}`
          } ${themeClasses.textMain}`}
        >
          {isActive ? (
            <>
              <Pause size={20} />
              Pause
            </>
          ) : (
            <>
              <Play size={20} />
              Démarrer
            </>
          )}
        </button>

        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`px-6 py-4 ${themeClasses.borderRadius} transition-all flex items-center gap-2 ${
            soundEnabled
              ? `${themeClasses.bgCard} ${themeClasses.bgCardHover}`
              : `${themeClasses.bgSecondary} opacity-60`
          } ${themeClasses.textMain}`}
          title={soundEnabled ? 'Désactiver le son' : 'Activer le son'}
        >
          {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>
      </div>

      {/* Frequency info */}
      <div className={`${themeClasses.bgSecondary} ${themeClasses.borderRadius} p-3 text-sm ${themeClasses.textSecondary}`}>
        <p className="font-semibold mb-1">🎵 Fréquence : {pattern.frequency} Hz</p>
        <p className="text-xs opacity-80">
          {pattern.frequency === 432 && 'Harmonie naturelle et relaxation'}
          {pattern.frequency === 396 && 'Libération du stress et des peurs'}
          {pattern.frequency === 528 && 'Transformation et réparation'}
        </p>
      </div>
    </div>
  )
}
