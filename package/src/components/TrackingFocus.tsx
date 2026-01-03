import { useState, useRef, useCallback, useEffect } from 'react'
import { ExerciseBaseProps } from '../types'
import { resolveTheme, getThemeClasses, mergeThemeClasses } from '../themes'

type Difficulty = 'easy' | 'medium' | 'hard'
type GamePhase = 'idle' | 'memorize' | 'tracking' | 'selection' | 'result'

interface Position {
  x: number
  y: number
}

interface Velocity {
  vx: number
  vy: number
}

interface Circle {
  id: number
  position: Position
  velocity: Velocity
  radius: number
  isTarget: boolean
  isSelected: boolean
}

interface Stats {
  round: number
  correctSelections: number
  incorrectSelections: number
  missedTargets: number
  accuracy: number
  totalRounds: number
}

export interface TrackingFocusProps extends ExerciseBaseProps {
  difficulty?: Difficulty
  rounds?: number
}

const CANVAS_WIDTH = 600
const CANVAS_HEIGHT = 400
const CIRCLE_RADIUS = 20

const DIFFICULTY_CONFIG = {
  easy: {
    totalCircles: 6,
    targetCircles: 2,
    trackingDuration: 8000,
    memorizeDuration: 3000,
    speed: 2,
  },
  medium: {
    totalCircles: 9,
    targetCircles: 3,
    trackingDuration: 12000,
    memorizeDuration: 2500,
    speed: 3,
  },
  hard: {
    totalCircles: 12,
    targetCircles: 4,
    trackingDuration: 15000,
    memorizeDuration: 2000,
    speed: 4,
  },
}

export function TrackingFocus({
  difficulty = 'medium',
  rounds = 5,
  className,
  theme = 'ermite',
  onComplete,
  onProgress,
}: TrackingFocusProps) {
  const currentTheme = resolveTheme(theme)
  const themeClasses = getThemeClasses(currentTheme)

  const [gamePhase, setGamePhase] = useState<GamePhase>('idle')
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>(difficulty)
  const [stats, setStats] = useState<Stats>({
    round: 0,
    correctSelections: 0,
    incorrectSelections: 0,
    missedTargets: 0,
    accuracy: 100,
    totalRounds: rounds,
  })

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number>()
  const circlesRef = useRef<Circle[]>([])
  const phaseStartTimeRef = useRef(0)
  const gamePhaseRef = useRef<GamePhase>('idle')

  useEffect(() => {
    gamePhaseRef.current = gamePhase
  }, [gamePhase])

  const initializeCircles = useCallback(() => {
    const config = DIFFICULTY_CONFIG[selectedDifficulty]
    const circles: Circle[] = []

    // Create circles with random non-overlapping positions
    for (let i = 0; i < config.totalCircles; i++) {
      let position: Position
      let attempts = 0
      const maxAttempts = 100

      do {
        position = {
          x: CIRCLE_RADIUS + Math.random() * (CANVAS_WIDTH - 2 * CIRCLE_RADIUS),
          y: CIRCLE_RADIUS + Math.random() * (CANVAS_HEIGHT - 2 * CIRCLE_RADIUS),
        }
        attempts++
      } while (
        attempts < maxAttempts &&
        circles.some((c) => {
          const dx = c.position.x - position.x
          const dy = c.position.y - position.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          return distance < CIRCLE_RADIUS * 2.5
        })
      )

      const angle = Math.random() * Math.PI * 2
      const speed = config.speed

      circles.push({
        id: i,
        position,
        velocity: {
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
        },
        radius: CIRCLE_RADIUS,
        isTarget: false,
        isSelected: false,
      })
    }

    // Randomly select target circles
    const shuffled = [...circles].sort(() => Math.random() - 0.5)
    for (let i = 0; i < config.targetCircles; i++) {
      shuffled[i].isTarget = true
    }

    circlesRef.current = circles
  }, [selectedDifficulty])

  const updateCircles = useCallback(() => {
    circlesRef.current.forEach((circle) => {
      // Update position (no deltaTime needed since we're running at 60fps)
      circle.position.x += circle.velocity.vx
      circle.position.y += circle.velocity.vy

      // Bounce off walls
      if (circle.position.x - circle.radius < 0 || circle.position.x + circle.radius > CANVAS_WIDTH) {
        circle.velocity.vx *= -1
        circle.position.x = Math.max(
          circle.radius,
          Math.min(CANVAS_WIDTH - circle.radius, circle.position.x)
        )
      }

      if (circle.position.y - circle.radius < 0 || circle.position.y + circle.radius > CANVAS_HEIGHT) {
        circle.velocity.vy *= -1
        circle.position.y = Math.max(
          circle.radius,
          Math.min(CANVAS_HEIGHT - circle.radius, circle.position.y)
        )
      }
    })
  }, [])

  const drawCircles = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx) return

    const phase = gamePhaseRef.current

    circlesRef.current.forEach((circle) => {
      ctx.beginPath()
      ctx.arc(circle.position.x, circle.position.y, circle.radius, 0, Math.PI * 2)

      // Color based on phase
      if (phase === 'memorize' && circle.isTarget) {
        // Highlight targets during memorization
        ctx.fillStyle = '#f59e0b' // Amber for targets
        ctx.strokeStyle = '#fbbf24'
        ctx.lineWidth = 4
      } else if (phase === 'selection') {
        if (circle.isSelected) {
          ctx.fillStyle = '#3b82f6' // Blue for selected
          ctx.strokeStyle = '#60a5fa'
          ctx.lineWidth = 3
        } else {
          ctx.fillStyle = '#64748b' // Gray
          ctx.strokeStyle = '#94a3b8'
          ctx.lineWidth = 2
        }
      } else {
        // All circles look the same during tracking
        ctx.fillStyle = '#64748b'
        ctx.strokeStyle = '#94a3b8'
        ctx.lineWidth = 2
      }

      ctx.fill()
      ctx.stroke()

      // Draw circle ID for debugging (optional)
      if (phase === 'memorize' || phase === 'idle') {
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 14px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(circle.isTarget ? '★' : '', circle.position.x, circle.position.y)
      }
    })
  }, [])

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx) return

    const phase = gamePhaseRef.current
    const now = Date.now()
    const elapsed = now - phaseStartTimeRef.current

    // Clear canvas
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // Update circles only during tracking phase
    if (phase === 'tracking' || phase === 'memorize') {
      updateCircles()
    }

    // Draw circles
    drawCircles()

    // Phase transitions
    const config = DIFFICULTY_CONFIG[selectedDifficulty]

    if (phase === 'memorize' && elapsed >= config.memorizeDuration) {
      setGamePhase('tracking')
      phaseStartTimeRef.current = now
    } else if (phase === 'tracking' && elapsed >= config.trackingDuration) {
      setGamePhase('selection')
      phaseStartTimeRef.current = now
    }

    // Draw timer during memorize and tracking
    if (phase === 'memorize' || phase === 'tracking') {
      const duration = phase === 'memorize' ? config.memorizeDuration : config.trackingDuration
      const remaining = Math.max(0, Math.ceil((duration - elapsed) / 1000))

      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 24px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(phase === 'memorize' ? 'Mémorisez!' : 'Suivez!', CANVAS_WIDTH / 2, 30)
      ctx.fillText(`${remaining}s`, CANVAS_WIDTH / 2, 60)
    }

    if (phase === 'selection') {
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 24px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('Cliquez sur les cercles marqués!', CANVAS_WIDTH / 2, 30)
    }

    animationFrameRef.current = requestAnimationFrame(gameLoop)
  }, [selectedDifficulty, updateCircles, drawCircles])

  useEffect(() => {
    if (gamePhase === 'memorize' || gamePhase === 'tracking' || gamePhase === 'selection') {
      animationFrameRef.current = requestAnimationFrame(gameLoop)
    } else if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [gamePhase, gameLoop])

  const startRound = useCallback(() => {
    initializeCircles()
    setGamePhase('memorize')
    phaseStartTimeRef.current = Date.now()
  }, [initializeCircles])

  const startGame = useCallback(() => {
    setStats({
      round: 1,
      correctSelections: 0,
      incorrectSelections: 0,
      missedTargets: 0,
      accuracy: 100,
      totalRounds: rounds,
    })
    startRound()
  }, [rounds, startRound])

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      if (gamePhase !== 'selection') return

      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const scaleX = CANVAS_WIDTH / rect.width
      const scaleY = CANVAS_HEIGHT / rect.height

      let clientX: number, clientY: number

      if ('touches' in e) {
        // Touch event
        if (e.touches.length === 0) return
        clientX = e.touches[0].clientX
        clientY = e.touches[0].clientY
      } else {
        // Mouse event
        clientX = e.clientX
        clientY = e.clientY
      }

      const x = (clientX - rect.left) * scaleX
      const y = (clientY - rect.top) * scaleY

      // Find clicked circle
      const clickedCircle = circlesRef.current.find((circle) => {
        const dx = circle.position.x - x
        const dy = circle.position.y - y
        const distance = Math.sqrt(dx * dx + dy * dy)
        return distance <= circle.radius
      })

      if (clickedCircle && !clickedCircle.isSelected) {
        clickedCircle.isSelected = true
      }
    },
    [gamePhase]
  )

  const submitSelection = useCallback(() => {
    const targets = circlesRef.current.filter((c) => c.isTarget)
    const selected = circlesRef.current.filter((c) => c.isSelected)
    const correctSelections = selected.filter((c) => c.isTarget).length
    const incorrectSelections = selected.filter((c) => !c.isTarget).length
    const missedTargets = targets.length - correctSelections

    const newStats = {
      ...stats,
      round: stats.round + 1,
      correctSelections: stats.correctSelections + correctSelections,
      incorrectSelections: stats.incorrectSelections + incorrectSelections,
      missedTargets: stats.missedTargets + missedTargets,
    }

    const totalPossible = newStats.correctSelections + newStats.missedTargets
    newStats.accuracy = totalPossible > 0 ? (newStats.correctSelections / totalPossible) * 100 : 100

    setStats(newStats)

    // Note: onProgress is not called for tracking-focus as it doesn't match the expected type

    if (stats.round >= rounds) {
      setGamePhase('result')
      if (onComplete) {
        onComplete({
          exercise_type: 'tracking_focus' as any,
          score: Math.round(newStats.accuracy),
          max_score: 100,
          duration: 0,
          metadata: {
            correctSelections: newStats.correctSelections,
            incorrectSelections: newStats.incorrectSelections,
            missedTargets: newStats.missedTargets,
            accuracy: newStats.accuracy,
            difficulty: selectedDifficulty,
            rounds,
          },
        } as any)
      }
    } else {
      setTimeout(() => {
        startRound()
      }, 1000)
    }
  }, [stats, rounds, selectedDifficulty, startRound, onComplete, onProgress])

  return (
    <div className={mergeThemeClasses('flex flex-col items-center justify-center min-h-screen p-4', className)}>
      {gamePhase === 'idle' && (
        <div className="text-center space-y-6">
          <h2 className={`text-3xl font-bold ${themeClasses.textMain}`}>
            👁️ Tracking Focus
          </h2>
          <p className="text-gray-400 max-w-md">
            Suivez les cercles marqués pendant qu'ils bougent, puis identifiez-les!
          </p>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-300">Difficulté</label>
            <div className="flex gap-2 justify-center">
              {(['easy', 'medium', 'hard'] as Difficulty[]).map((diff) => (
                <button
                  key={diff}
                  onClick={() => setSelectedDifficulty(diff)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    selectedDifficulty === diff
                      ? `${themeClasses.bgPrimary} text-white`
                      : `${themeClasses.bgCard} text-gray-400 ${themeClasses.bgCardHover}`
                  }`}
                >
                  {diff === 'easy' && 'Facile'}
                  {diff === 'medium' && 'Moyen'}
                  {diff === 'hard' && 'Difficile'}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={startGame}
            className={`px-8 py-4 ${themeClasses.bgPrimary} ${themeClasses.bgPrimaryHover} ${themeClasses.borderRadius} font-bold text-lg transition-all`}
          >
            Commencer
          </button>

          <div className={`${themeClasses.bgCard} p-4 rounded-lg text-left max-w-md`}>
            <h3 className="font-semibold mb-2 text-emerald-400">Instructions</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>1. Mémorisez les cercles marqués (★)</li>
              <li>2. Suivez-les pendant qu'ils bougent</li>
              <li>3. Cliquez sur ceux que vous pensez être les marqués</li>
              <li>4. Validez votre sélection</li>
            </ul>
          </div>
        </div>
      )}

      {(gamePhase === 'memorize' || gamePhase === 'tracking' || gamePhase === 'selection') && (
        <div className="space-y-4">
          <div className="flex justify-between items-center text-white">
            <span>Round {stats.round} / {rounds}</span>
            <span>Précision: {stats.accuracy.toFixed(1)}%</span>
          </div>

          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            onClick={handleCanvasClick}
            onTouchStart={handleCanvasClick}
            className="border-2 border-gray-700 rounded-lg cursor-pointer bg-slate-950 max-w-full h-auto"
            style={{ width: '100%', maxWidth: `${CANVAS_WIDTH}px` }}
          />

          {gamePhase === 'selection' && (
            <button
              onClick={submitSelection}
              className={`w-full px-6 py-3 ${themeClasses.bgPrimary} ${themeClasses.bgPrimaryHover} rounded-lg font-semibold`}
            >
              Valider ma sélection
            </button>
          )}
        </div>
      )}

      {gamePhase === 'result' && (
        <div className={`${themeClasses.bgCard} p-8 rounded-2xl max-w-md text-center space-y-4`}>
          <h2 className="text-3xl font-bold text-emerald-400">Résultats</h2>

          <div className="grid grid-cols-2 gap-4 text-left">
            <div className={`${themeClasses.bgSecondary} p-3 rounded-lg`}>
              <div className="text-gray-400 text-sm">Précision</div>
              <div className="text-2xl font-bold text-emerald-400">{stats.accuracy.toFixed(1)}%</div>
            </div>
            <div className={`${themeClasses.bgSecondary} p-3 rounded-lg`}>
              <div className="text-gray-400 text-sm">Correct</div>
              <div className="text-2xl font-bold text-green-400">{stats.correctSelections}</div>
            </div>
            <div className={`${themeClasses.bgSecondary} p-3 rounded-lg`}>
              <div className="text-gray-400 text-sm">Incorrect</div>
              <div className="text-2xl font-bold text-red-400">{stats.incorrectSelections}</div>
            </div>
            <div className={`${themeClasses.bgSecondary} p-3 rounded-lg`}>
              <div className="text-gray-400 text-sm">Manqués</div>
              <div className="text-2xl font-bold text-orange-400">{stats.missedTargets}</div>
            </div>
          </div>

          <button
            onClick={() => setGamePhase('idle')}
            className={`w-full px-6 py-3 ${themeClasses.bgPrimary} ${themeClasses.bgPrimaryHover} rounded-lg font-semibold`}
          >
            Rejouer
          </button>
        </div>
      )}
    </div>
  )
}
