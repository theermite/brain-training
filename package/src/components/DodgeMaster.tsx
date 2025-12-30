/**
 * Dodge Master - MOBA-style dodge training with virtual joystick
 * Mobile-optimized for HOK mechanics training
 * @author Jay "The Ermite" Goncalves
 * @copyright Jay The Ermite
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { ExerciseBaseProps } from '../types'
import { resolveTheme, getThemeClasses, mergeThemeClasses } from '../themes'

type Difficulty = 'easy' | 'medium' | 'hard' | 'survival'
type ProjectilePattern = 'targeted' | 'wave' | 'circle' | 'cross' | 'random'

interface Position {
  x: number
  y: number
}

interface Projectile {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  color: string
}

interface GameStats {
  dodges: number
  timeAlive: number
  projectilesSpawned: number
  accuracy: number
  survivalLevel?: number
}

export interface DodgeMasterProps extends ExerciseBaseProps {
  duration?: number
}

// MOBA-style landscape format (16:9 ratio for mobile landscape gaming)
const CANVAS_WIDTH = 1280
const CANVAS_HEIGHT = 720
const PLAYER_RADIUS = 25
const JOYSTICK_RADIUS = 80
const JOYSTICK_HANDLE_RADIUS = 35

// Playable zone (70% of canvas in center - like MOBA)
const PLAYABLE_ZONE_MARGIN = 0.1 // 10% margin on each side
const PLAYABLE_MIN_X = CANVAS_WIDTH * PLAYABLE_ZONE_MARGIN
const PLAYABLE_MAX_X = CANVAS_WIDTH * (1 - PLAYABLE_ZONE_MARGIN)
const PLAYABLE_MIN_Y = CANVAS_HEIGHT * PLAYABLE_ZONE_MARGIN
const PLAYABLE_MAX_Y = CANVAS_HEIGHT * (1 - PLAYABLE_ZONE_MARGIN)

export function DodgeMaster({
  duration = 60,
  className,
  theme,
  onComplete,
}: DodgeMasterProps) {
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'paused' | 'gameOver'>('idle')
  const [stats, setStats] = useState<GameStats>({
    dodges: 0,
    timeAlive: 0,
    projectilesSpawned: 0,
    accuracy: 0,
    survivalLevel: 1,
  })
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Refs for game state (avoid re-renders in game loop)
  const playerPosRef = useRef<Position>({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 })
  const projectilesRef = useRef<Projectile[]>([])
  const joystickActiveRef = useRef(false)
  const joystickPosRef = useRef<Position>({ x: 0, y: 0 })

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const joystickRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number>()
  const gameStartTimeRef = useRef<number>(0)
  const pausedTimeRef = useRef<number>(0)
  const totalPausedTimeRef = useRef<number>(0)
  const lastProjectileSpawnRef = useRef<number>(0)
  const projectileIdRef = useRef(0)
  const gameStateRef = useRef(gameState)
  const survivalLevelRef = useRef(1)
  const difficultyRef = useRef(difficulty)

  const currentTheme = resolveTheme(theme)
  const themeClasses = getThemeClasses(currentTheme)

  // Keep refs in sync
  useEffect(() => {
    gameStateRef.current = gameState
  }, [gameState])

  useEffect(() => {
    difficultyRef.current = difficulty
  }, [difficulty])

  const getDifficultyConfig = useCallback(() => {
    const currentDifficulty = difficultyRef.current
    const level = survivalLevelRef.current

    if (currentDifficulty === 'survival') {
      // Progressive difficulty in survival mode
      const baseSpeed = 2 + (level * 0.3)
      const baseInterval = Math.max(800, 2000 - (level * 100))
      const baseMax = Math.min(15, 3 + Math.floor(level / 2))

      return {
        projectileSpeed: baseSpeed + (Math.random() * 2 - 1), // Random variation
        spawnInterval: baseInterval,
        maxProjectiles: baseMax,
        projectileRadius: Math.max(8, 15 - level),
      }
    }

    switch (currentDifficulty) {
      case 'easy':
        return {
          projectileSpeed: 3,
          spawnInterval: 2000,
          maxProjectiles: 3,
          projectileRadius: 18,
        }
      case 'medium':
        return {
          projectileSpeed: 5,
          spawnInterval: 1500,
          maxProjectiles: 5,
          projectileRadius: 15,
        }
      case 'hard':
        return {
          projectileSpeed: 7,
          spawnInterval: 1000,
          maxProjectiles: 8,
          projectileRadius: 12,
        }
      default:
        return {
          projectileSpeed: 3.5,
          spawnInterval: 1500,
          maxProjectiles: 5,
          projectileRadius: 12,
        }
    }
  }, [])

  const getRandomPattern = (): ProjectilePattern => {
    const patterns: ProjectilePattern[] = ['targeted', 'wave', 'circle', 'cross', 'random']
    return patterns[Math.floor(Math.random() * patterns.length)]
  }

  const spawnProjectile = useCallback((pattern?: ProjectilePattern) => {
    const config = getDifficultyConfig()
    const selectedPattern = pattern || (difficultyRef.current === 'survival' ? getRandomPattern() : 'targeted')

    let projectiles: Array<{ x: number; y: number; vx: number; vy: number }> = []

    const targetX = playerPosRef.current.x
    const targetY = playerPosRef.current.y

    switch (selectedPattern) {
      case 'targeted': {
        // Single projectile aimed at player
        const side = Math.floor(Math.random() * 4)
        let x, y

        switch (side) {
          case 0: x = Math.random() * CANVAS_WIDTH; y = -20; break
          case 1: x = CANVAS_WIDTH + 20; y = Math.random() * CANVAS_HEIGHT; break
          case 2: x = Math.random() * CANVAS_WIDTH; y = CANVAS_HEIGHT + 20; break
          case 3: x = -20; y = Math.random() * CANVAS_HEIGHT; break
          default: x = 0; y = 0
        }

        const dx = targetX - x + (Math.random() - 0.5) * 50
        const dy = targetY - y + (Math.random() - 0.5) * 50
        const dist = Math.sqrt(dx * dx + dy * dy)
        const vx = (dx / dist) * config.projectileSpeed
        const vy = (dy / dist) * config.projectileSpeed

        projectiles.push({ x, y, vx, vy })
        break
      }

      case 'wave': {
        // Horizontal wave from one side
        const fromLeft = Math.random() > 0.5
        const numProjectiles = 3 + Math.floor(Math.random() * 3)

        for (let i = 0; i < numProjectiles; i++) {
          const x = fromLeft ? -20 : CANVAS_WIDTH + 20
          const y = (CANVAS_HEIGHT / (numProjectiles + 1)) * (i + 1)
          const vx = (fromLeft ? 1 : -1) * config.projectileSpeed
          const vy = (Math.random() - 0.5) * config.projectileSpeed * 0.5

          projectiles.push({ x, y, vx, vy })
        }
        break
      }

      case 'circle': {
        // Circle pattern from center outward
        const numProjectiles = 6 + Math.floor(Math.random() * 4)
        const centerX = CANVAS_WIDTH / 2
        const centerY = CANVAS_HEIGHT / 2

        for (let i = 0; i < numProjectiles; i++) {
          const angle = (Math.PI * 2 * i) / numProjectiles
          const vx = Math.cos(angle) * config.projectileSpeed
          const vy = Math.sin(angle) * config.projectileSpeed

          projectiles.push({ x: centerX, y: centerY, vx, vy })
        }
        break
      }

      case 'cross': {
        // Cross pattern from edges
        const speed = config.projectileSpeed
        projectiles.push(
          { x: CANVAS_WIDTH / 2, y: -20, vx: 0, vy: speed },
          { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT + 20, vx: 0, vy: -speed },
          { x: -20, y: CANVAS_HEIGHT / 2, vx: speed, vy: 0 },
          { x: CANVAS_WIDTH + 20, y: CANVAS_HEIGHT / 2, vx: -speed, vy: 0 }
        )
        break
      }

      case 'random': {
        // Random direction from random position
        const x = Math.random() * CANVAS_WIDTH
        const y = Math.random() * CANVAS_HEIGHT
        const angle = Math.random() * Math.PI * 2
        const vx = Math.cos(angle) * config.projectileSpeed
        const vy = Math.sin(angle) * config.projectileSpeed

        projectiles.push({ x, y, vx, vy })
        break
      }
    }

    // Create projectile objects
    const newProjectiles = projectiles.map(proj => ({
      id: projectileIdRef.current++,
      x: proj.x,
      y: proj.y,
      vx: proj.vx,
      vy: proj.vy,
      radius: config.projectileRadius,
      color: selectedPattern === 'targeted' ? '#ef4444' :
             selectedPattern === 'wave' ? '#f59e0b' :
             selectedPattern === 'circle' ? '#8b5cf6' :
             selectedPattern === 'cross' ? '#06b6d4' : '#ec4899',
    }))

    projectilesRef.current = [...projectilesRef.current, ...newProjectiles]
    setStats(prev => ({ ...prev, projectilesSpawned: prev.projectilesSpawned + newProjectiles.length }))
  }, [getDifficultyConfig])

  const checkCollision = useCallback((proj: Projectile) => {
    const dx = proj.x - playerPosRef.current.x
    const dy = proj.y - playerPosRef.current.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    return distance < (proj.radius + PLAYER_RADIUS)
  }, [])

  const gameLoop = useCallback(() => {
    if (gameStateRef.current !== 'playing') {
      return
    }

    const now = Date.now()
    const config = getDifficultyConfig()

    // Update player position based on joystick
    if (joystickActiveRef.current) {
      const moveSpeed = 5
      const newX = playerPosRef.current.x + joystickPosRef.current.x * moveSpeed
      const newY = playerPosRef.current.y + joystickPosRef.current.y * moveSpeed

      // Clamp to playable zone
      playerPosRef.current = {
        x: Math.max(PLAYABLE_MIN_X + PLAYER_RADIUS, Math.min(PLAYABLE_MAX_X - PLAYER_RADIUS, newX)),
        y: Math.max(PLAYABLE_MIN_Y + PLAYER_RADIUS, Math.min(PLAYABLE_MAX_Y - PLAYER_RADIUS, newY)),
      }
    }

    // Spawn projectiles
    if (now - lastProjectileSpawnRef.current > config.spawnInterval) {
      if (projectilesRef.current.length < config.maxProjectiles) {
        spawnProjectile()
      }
      lastProjectileSpawnRef.current = now
    }

    // Update projectiles
    let dodgeCount = 0
    projectilesRef.current = projectilesRef.current
      .map(proj => ({
        ...proj,
        x: proj.x + proj.vx,
        y: proj.y + proj.vy,
      }))
      .filter(proj => {
        // Remove out-of-bounds projectiles (successful dodge)
        if (proj.x < -50 || proj.x > CANVAS_WIDTH + 50 ||
            proj.y < -50 || proj.y > CANVAS_HEIGHT + 50) {
          dodgeCount++
          return false
        }

        // Check collision
        if (checkCollision(proj)) {
          gameStateRef.current = 'gameOver'
          setGameState('gameOver')
          return false
        }

        return true
      })

    if (dodgeCount > 0) {
      setStats(prev => ({ ...prev, dodges: prev.dodges + dodgeCount }))
    }

    // Update time alive
    const timeAlive = now - gameStartTimeRef.current - totalPausedTimeRef.current

    // Update survival level every 10 seconds
    if (difficultyRef.current === 'survival') {
      const newLevel = Math.floor(timeAlive / 10000) + 1
      if (newLevel !== survivalLevelRef.current) {
        survivalLevelRef.current = newLevel
      }
    }

    setStats(prev => ({
      ...prev,
      timeAlive,
      survivalLevel: survivalLevelRef.current,
      accuracy: prev.projectilesSpawned > 0
        ? (prev.dodges / prev.projectilesSpawned) * 100
        : 0
    }))

    // Check duration (not applicable in survival mode)
    if (difficultyRef.current !== 'survival' && timeAlive >= duration * 1000) {
      gameStateRef.current = 'gameOver'
      setGameState('gameOver')
      return
    }

    // Render
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // Draw playable zone boundary
    ctx.strokeStyle = '#334155'
    ctx.lineWidth = 2
    ctx.strokeRect(PLAYABLE_MIN_X, PLAYABLE_MIN_Y,
      PLAYABLE_MAX_X - PLAYABLE_MIN_X, PLAYABLE_MAX_Y - PLAYABLE_MIN_Y)

    // Fill playable zone with subtle color
    ctx.fillStyle = '#1e293b'
    ctx.fillRect(PLAYABLE_MIN_X, PLAYABLE_MIN_Y,
      PLAYABLE_MAX_X - PLAYABLE_MIN_X, PLAYABLE_MAX_Y - PLAYABLE_MIN_Y)

    // Draw grid (subtle)
    ctx.strokeStyle = '#1e293b'
    ctx.lineWidth = 1
    for (let i = 0; i < CANVAS_WIDTH; i += 50) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i, CANVAS_HEIGHT)
      ctx.stroke()
    }
    for (let i = 0; i < CANVAS_HEIGHT; i += 50) {
      ctx.beginPath()
      ctx.moveTo(0, i)
      ctx.lineTo(CANVAS_WIDTH, i)
      ctx.stroke()
    }

    // Draw projectiles
    projectilesRef.current.forEach(proj => {
      ctx.fillStyle = proj.color
      ctx.beginPath()
      ctx.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2)
      ctx.fill()

      // Glow effect
      ctx.shadowBlur = 15
      ctx.shadowColor = proj.color
      ctx.fill()
      ctx.shadowBlur = 0
    })

    // Draw player
    ctx.fillStyle = '#3b82f6'
    ctx.beginPath()
    ctx.arc(playerPosRef.current.x, playerPosRef.current.y, PLAYER_RADIUS, 0, Math.PI * 2)
    ctx.fill()

    // Player glow
    ctx.shadowBlur = 20
    ctx.shadowColor = '#3b82f6'
    ctx.fill()
    ctx.shadowBlur = 0

    // Player direction indicator (small arrow)
    if (joystickActiveRef.current) {
      ctx.strokeStyle = '#60a5fa'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(playerPosRef.current.x, playerPosRef.current.y)
      const angle = Math.atan2(joystickPosRef.current.y, joystickPosRef.current.x)
      const indicatorLength = 30
      ctx.lineTo(
        playerPosRef.current.x + Math.cos(angle) * indicatorLength,
        playerPosRef.current.y + Math.sin(angle) * indicatorLength
      )
      ctx.stroke()
    }

    // Continue game loop
    animationFrameRef.current = requestAnimationFrame(gameLoop)
  }, [getDifficultyConfig, spawnProjectile, checkCollision, duration])

  // Start/stop game loop
  useEffect(() => {
    if (gameState === 'playing') {
      if (!animationFrameRef.current) {
        animationFrameRef.current = requestAnimationFrame(gameLoop)
      }
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = undefined
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [gameState, gameLoop])

  const handleJoystickStart = () => {
    joystickActiveRef.current = true
  }

  const handleJoystickMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!joystickActiveRef.current || !joystickRef.current) return

    const rect = joystickRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    let clientX, clientY
    if ('touches' in e) {
      if (e.touches.length === 0) return
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }

    let dx = clientX - centerX
    let dy = clientY - centerY
    const distance = Math.sqrt(dx * dx + dy * dy)

    // Limit to joystick radius
    if (distance > JOYSTICK_RADIUS) {
      dx = (dx / distance) * JOYSTICK_RADIUS
      dy = (dy / distance) * JOYSTICK_RADIUS
    }

    // Normalize to -1 to 1
    joystickPosRef.current = {
      x: dx / JOYSTICK_RADIUS,
      y: dy / JOYSTICK_RADIUS,
    }
  }

  const handleJoystickEnd = () => {
    joystickActiveRef.current = false
    joystickPosRef.current = { x: 0, y: 0 }
  }

  const startGame = async () => {
    // Enter fullscreen and lock landscape automatically
    if (!document.fullscreenElement) {
      const container = document.querySelector('.dodge-master-container')
      if (container) {
        try {
          await container.requestFullscreen()
          setIsFullscreen(true)
          // Lock to landscape after fullscreen
          if (screen.orientation && 'lock' in screen.orientation) {
            try {
              await (screen.orientation as any).lock('landscape')
            } catch (err) {
              console.warn('Landscape lock failed:', err)
            }
          }
        } catch (err) {
          console.warn('Fullscreen failed:', err)
        }
      }
    }

    setGameState('playing')
    playerPosRef.current = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 }
    projectilesRef.current = []
    joystickPosRef.current = { x: 0, y: 0 }
    joystickActiveRef.current = false
    survivalLevelRef.current = 1
    setStats({ dodges: 0, timeAlive: 0, projectilesSpawned: 0, accuracy: 0, survivalLevel: 1 })
    projectileIdRef.current = 0
    gameStartTimeRef.current = Date.now()
    totalPausedTimeRef.current = 0
    lastProjectileSpawnRef.current = Date.now()
  }

  const pauseGame = () => {
    setGameState('paused')
    pausedTimeRef.current = Date.now()
  }

  const resumeGame = () => {
    totalPausedTimeRef.current += Date.now() - pausedTimeRef.current
    setGameState('playing')
  }

  const stopGame = () => {
    setGameState('idle')
    playerPosRef.current = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 }
    projectilesRef.current = []
    survivalLevelRef.current = 1
    setStats({ dodges: 0, timeAlive: 0, projectilesSpawned: 0, accuracy: 0, survivalLevel: 1 })
  }

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      try {
        // Request fullscreen on the container
        const container = document.querySelector('.dodge-master-container')
        if (container) {
          await container.requestFullscreen()
          // Try to lock orientation to landscape
          if (screen.orientation && 'lock' in screen.orientation) {
            try {
              await (screen.orientation as any).lock('landscape')
            } catch (err) {
              console.warn('Orientation lock not supported:', err)
            }
          }
          setIsFullscreen(true)
        }
      } catch (err) {
        console.error('Fullscreen request failed:', err)
      }
    } else {
      await exitFullscreen()
    }
  }

  const exitFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
        // Try to unlock orientation (return to portrait)
        if (screen.orientation && 'unlock' in screen.orientation) {
          try {
            (screen.orientation as any).unlock()
          } catch (err) {
            console.warn('Orientation unlock not supported:', err)
          }
        }
        setIsFullscreen(false)
      }
    } catch (err) {
      console.error('Exit fullscreen failed:', err)
    }
  }

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  useEffect(() => {
    if (gameState === 'gameOver' && onComplete) {
      onComplete({
        exercise_type: 'dodge_master',
        difficulty,
        is_completed: difficulty === 'survival' ? true : stats.timeAlive >= duration * 1000,
        dodges_successful: stats.dodges,
        time_alive_ms: stats.timeAlive,
        projectiles_spawned: stats.projectilesSpawned,
        accuracy: stats.accuracy,
        survival_level: stats.survivalLevel,
      } as any)
    }
  }, [gameState, stats, difficulty, duration, onComplete])

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    return `${seconds}s`
  }

  const getDifficultyLabel = (diff: Difficulty) => {
    switch (diff) {
      case 'easy': return '😊 Facile'
      case 'medium': return '😎 Moyen'
      case 'hard': return '🔥 Difficile'
      case 'survival': return '💀 Survie'
    }
  }

  const getDifficultyDesc = (diff: Difficulty) => {
    switch (diff) {
      case 'easy': return '3 projectiles max'
      case 'medium': return '5 projectiles max'
      case 'hard': return '8 projectiles max'
      case 'survival': return 'Difficulté progressive infinie'
    }
  }

  return (
    <div className={mergeThemeClasses(
      `dodge-master-container h-full flex flex-col ${themeClasses.bgMain} ${themeClasses.textMain}`,
      className
    )}>
      {/* Difficulty Selector */}
      {gameState === 'idle' && (
        <div className={`${themeClasses.bgSecondary} ${themeClasses.borderRadius} p-4 mb-4`}>
          <p className={`text-center mb-3 font-semibold ${themeClasses.textMain}`}>
            Choisis ta difficulté :
          </p>
          <div className="grid grid-cols-2 gap-3">
            {(['easy', 'medium', 'hard', 'survival'] as Difficulty[]).map((diff) => (
              <button
                key={diff}
                onClick={() => setDifficulty(diff)}
                className={`
                  px-4 py-3 ${themeClasses.borderRadius} font-semibold transition-all
                  ${difficulty === diff
                    ? diff === 'survival'
                      ? 'bg-purple-600 text-white scale-105'
                      : diff === 'hard'
                      ? `${themeClasses.bgError} text-white scale-105`
                      : diff === 'medium'
                      ? `${themeClasses.bgPrimary} text-white scale-105`
                      : `${themeClasses.bgSuccess} text-white scale-105`
                    : `${themeClasses.bgCard} ${themeClasses.bgCardHover} ${themeClasses.border} border`
                  }
                `}
              >
                {getDifficultyLabel(diff)}
                <div className="text-xs opacity-70 mt-1">{getDifficultyDesc(diff)}</div>
              </button>
            ))}
          </div>

          <div className="mt-4">
            <button
              onClick={toggleFullscreen}
              className={`w-full px-4 py-2 ${themeClasses.bgCard} ${themeClasses.bgCardHover} ${themeClasses.borderRadius} ${themeClasses.border} border text-sm transition-all`}
            >
              {isFullscreen ? '📱 Quitter le plein écran' : '📱 Mode plein écran (paysage recommandé)'}
            </button>
          </div>
        </div>
      )}

      {/* Stats Header */}
      {gameState !== 'idle' && (
        <div className={`bg-gradient-to-r ${themeClasses.bgPrimary} ${themeClasses.borderRadius} p-3 mb-4 ${themeClasses.shadow}`}>
          <div className={`grid ${difficulty === 'survival' ? 'grid-cols-5' : 'grid-cols-4'} gap-2 text-center text-sm`}>
            <div>
              <div className="opacity-80">Temps</div>
              <div className="font-bold">{formatTime(stats.timeAlive)}</div>
            </div>
            {difficulty === 'survival' && (
              <div>
                <div className="opacity-80">Niveau</div>
                <div className="font-bold text-purple-300">{stats.survivalLevel}</div>
              </div>
            )}
            <div>
              <div className="opacity-80">Esquives</div>
              <div className="font-bold">{stats.dodges}</div>
            </div>
            <div>
              <div className="opacity-80">Précision</div>
              <div className="font-bold">{stats.accuracy.toFixed(0)}%</div>
            </div>
            <div>
              <div className="opacity-80">Projectiles</div>
              <div className="font-bold">{projectilesRef.current.length}</div>
            </div>
          </div>
        </div>
      )}

      {/* Game Canvas */}
      <div className="flex-1 flex items-center justify-center bg-gray-900 rounded-lg overflow-hidden mb-4 relative">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="w-full h-auto max-h-screen"
          style={{ touchAction: 'none', aspectRatio: '16/9' }}
        />

        {/* Pause overlay */}
        {gameState === 'paused' && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
            <div className={`${themeClasses.bgSecondary} ${themeClasses.borderRadius} p-6 text-center`}>
              <div className="text-4xl mb-4">⏸️</div>
              <div className="text-xl font-bold mb-4">Pause</div>
              <div className="flex gap-3">
                <button
                  onClick={resumeGame}
                  className={`px-6 py-3 ${themeClasses.bgPrimary} ${themeClasses.bgPrimaryHover} ${themeClasses.borderRadius} font-semibold transition-all`}
                >
                  ▶ Reprendre
                </button>
                <button
                  onClick={stopGame}
                  className={`px-6 py-3 ${themeClasses.bgError} hover:opacity-90 ${themeClasses.borderRadius} font-semibold transition-all`}
                >
                  ⏹ Arrêter
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Virtual Joystick - Fixed position bottom-left like MOBA */}
      {gameState === 'playing' && (
        <div className="fixed left-8 bottom-8 z-50">
          <div
            ref={joystickRef}
            className="relative"
            style={{ width: JOYSTICK_RADIUS * 2, height: JOYSTICK_RADIUS * 2 }}
            onTouchStart={handleJoystickStart}
            onTouchMove={handleJoystickMove}
            onTouchEnd={handleJoystickEnd}
            onMouseDown={handleJoystickStart}
            onMouseMove={handleJoystickMove}
            onMouseUp={handleJoystickEnd}
            onMouseLeave={handleJoystickEnd}
          >
            {/* Joystick base */}
            <div className="absolute inset-0 bg-gray-700/70 rounded-full border-4 border-gray-600 shadow-lg" />

            {/* Joystick handle */}
            <div
              className="absolute bg-blue-500 rounded-full shadow-xl transition-transform"
              style={{
                width: JOYSTICK_HANDLE_RADIUS * 2,
                height: JOYSTICK_HANDLE_RADIUS * 2,
                left: `calc(50% - ${JOYSTICK_HANDLE_RADIUS}px + ${joystickPosRef.current.x * JOYSTICK_RADIUS}px)`,
                top: `calc(50% - ${JOYSTICK_HANDLE_RADIUS}px + ${joystickPosRef.current.y * JOYSTICK_RADIUS}px)`,
              }}
            />
          </div>
        </div>
      )}

      {/* Control Buttons */}
      {gameState === 'playing' && (
        <div className="fixed right-8 bottom-8 z-50 flex gap-2">
          <button
            onClick={pauseGame}
            className={`px-6 py-3 ${themeClasses.bgCard} ${themeClasses.bgCardHover} ${themeClasses.borderRadius} font-semibold transition-all shadow-lg`}
          >
            ⏸ Pause
          </button>
          <button
            onClick={stopGame}
            className={`px-6 py-3 ${themeClasses.bgError} hover:opacity-90 ${themeClasses.borderRadius} font-semibold transition-all shadow-lg`}
          >
            ⏹ Stop
          </button>
        </div>
      )}

      {/* Start/Reset Button */}
      <div className="mt-4">
        {gameState === 'idle' && (
          <button
            onClick={startGame}
            className={`w-full px-6 py-4 ${themeClasses.bgPrimary} ${themeClasses.bgPrimaryHover} ${themeClasses.borderRadius} font-semibold text-lg transition-all`}
          >
            ▶ Démarrer
          </button>
        )}
        {gameState === 'gameOver' && (
          <div className="space-y-3">
            <div className={`${themeClasses.bgSecondary} ${themeClasses.borderRadius} p-4 text-center`}>
              <div className="text-2xl mb-2">
                {difficulty === 'survival'
                  ? `💀 Niveau ${stats.survivalLevel} atteint !`
                  : stats.timeAlive >= duration * 1000 ? '🏆 Victoire !' : '💥 Game Over'}
              </div>
              <div className="text-sm opacity-80">
                {stats.dodges} esquives • {stats.accuracy.toFixed(0)}% précision
                {difficulty === 'survival' && ` • Niveau ${stats.survivalLevel}`}
              </div>
            </div>

            {/* Difficulty selector after game */}
            <div className={`${themeClasses.bgSecondary} ${themeClasses.borderRadius} p-4`}>
              <p className="text-center text-sm mb-2 opacity-80">Changer de difficulté:</p>
              <div className="grid grid-cols-2 gap-2">
                {(['easy', 'medium', 'hard', 'survival'] as Difficulty[]).map((diff) => (
                  <button
                    key={diff}
                    onClick={() => setDifficulty(diff)}
                    className={`
                      px-3 py-2 ${themeClasses.borderRadius} text-sm font-semibold transition-all
                      ${difficulty === diff
                        ? diff === 'survival'
                          ? 'bg-purple-600 text-white'
                          : diff === 'hard'
                          ? 'bg-red-600 text-white'
                          : diff === 'medium'
                          ? 'bg-blue-600 text-white'
                          : 'bg-green-600 text-white'
                        : `${themeClasses.bgCard} ${themeClasses.bgCardHover} opacity-70`
                      }
                    `}
                  >
                    {getDifficultyLabel(diff).split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={startGame}
              className={`w-full px-6 py-3 ${themeClasses.bgPrimary} ${themeClasses.bgPrimaryHover} ${themeClasses.borderRadius} font-semibold transition-all`}
            >
              🔄 Recommencer
            </button>

            {isFullscreen && (
              <button
                onClick={exitFullscreen}
                className={`w-full px-6 py-3 ${themeClasses.bgCard} ${themeClasses.bgCardHover} ${themeClasses.borderRadius} font-semibold transition-all`}
              >
                📱 Quitter le plein écran
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
