/**
 * Skillshot Trainer - MOBA-style skillshot precision training
 * Mobile-optimized for HOK skillshot mechanics with joystick + ability buttons
 * @author Jay "The Ermite" Goncalves
 * @copyright Jay The Ermite
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { ExerciseBaseProps } from '../types'
import { resolveTheme, getThemeClasses, mergeThemeClasses } from '../themes'

type Difficulty = 'easy' | 'medium' | 'hard' | 'survival'
type SkillshotType = 'line' | 'circle' | 'cone'

interface Position {
  x: number
  y: number
}

interface Target {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  color: string
}

interface Skillshot {
  id: number
  type: SkillshotType
  x: number
  y: number
  angle: number
  distance: number
  progress: number
  speed: number
  width: number
  color: string
  exploded?: boolean // For circle bomb
  targetDistance?: number // Target distance for circle bomb (0-1)
}

interface GameStats {
  hits: number
  misses: number
  accuracy: number
  combo: number
  maxCombo: number
  timeAlive: number
}

export interface SkillshotTrainerProps extends ExerciseBaseProps {
  duration?: number
}

// MOBA-style landscape format (16:9 ratio for mobile landscape gaming)
const CANVAS_WIDTH = 1280
const CANVAS_HEIGHT = 720
const PLAYER_RADIUS = 20
const TARGET_RADIUS = 25
const PLAYABLE_ZONE_MARGIN = 0.1 // 10% margin on each side (tighter for MOBA feel)
const PLAYABLE_MIN_X = CANVAS_WIDTH * PLAYABLE_ZONE_MARGIN
const PLAYABLE_MAX_X = CANVAS_WIDTH * (1 - PLAYABLE_ZONE_MARGIN)
const PLAYABLE_MIN_Y = CANVAS_HEIGHT * PLAYABLE_ZONE_MARGIN
const PLAYABLE_MAX_Y = CANVAS_HEIGHT * (1 - PLAYABLE_ZONE_MARGIN)

// Skillshot configurations (scaled for larger canvas)
const SKILLSHOT_CONFIGS = {
  line: {
    speed: 12,
    width: 50,
    maxDistance: 700,
    color: '#ef4444',
    cooldown: 800,
  },
  circle: {
    speed: 9,
    width: 100,
    maxDistance: 400,
    color: '#8b5cf6',
    cooldown: 1500,
  },
  cone: {
    speed: 10,
    width: 150,
    maxDistance: 500,
    color: '#06b6d4',
    cooldown: 1000,
  },
}

export function SkillshotTrainer({
  duration = 60,
  className,
  theme,
  onComplete,
}: SkillshotTrainerProps) {
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'paused' | 'gameOver'>('idle')
  const [stats, setStats] = useState<GameStats>({
    hits: 0,
    misses: 0,
    accuracy: 0,
    combo: 0,
    maxCombo: 0,
    timeAlive: 0,
  })
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Refs for game state
  const joystickActiveRef = useRef(false)
  const joystickPosRef = useRef<Position>({ x: 0, y: 0 })
  const playerPosRef = useRef<Position>({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 })
  const targetsRef = useRef<Target[]>([])
  const skillshotsRef = useRef<Skillshot[]>([])
  const cooldownsRef = useRef<Record<SkillshotType, number>>({
    line: 0,
    circle: 0,
    cone: 0,
  })
  const aimAngleRef = useRef<number>(-Math.PI / 2) // Store last aim direction
  const aimingSkillRef = useRef<SkillshotType | null>(null) // Currently aiming skill
  const aimDistanceRef = useRef<number>(1) // Store aim distance (0-1) for circle bomb
  const buttonCenterRef = useRef<{ x: number; y: number } | null>(null) // Store button center when aiming starts

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number>()
  const gameStartTimeRef = useRef<number>(0)
  const pausedTimeRef = useRef<number>(0)
  const totalPausedTimeRef = useRef<number>(0)
  const lastTargetSpawnRef = useRef<number>(0)
  const targetIdRef = useRef(0)
  const skillshotIdRef = useRef(0)
  const gameStateRef = useRef(gameState)
  const difficultyRef = useRef(difficulty)
  const survivalLevelRef = useRef(1)
  const lastLevelUpRef = useRef<number>(0)

  const themeColors = resolveTheme(theme)
  const themeClasses = getThemeClasses(themeColors)

  // Sync state refs
  useEffect(() => {
    gameStateRef.current = gameState
  }, [gameState])

  useEffect(() => {
    difficultyRef.current = difficulty
  }, [difficulty])

  const getDifficultyConfig = useCallback(() => {
    const configs = {
      easy: {
        targetSpeed: 1.5,
        spawnInterval: 2500,
        maxTargets: 3,
      },
      medium: {
        targetSpeed: 2.5,
        spawnInterval: 1800,
        maxTargets: 5,
      },
      hard: {
        targetSpeed: 3.5,
        spawnInterval: 1200,
        maxTargets: 7,
      },
      survival: {
        targetSpeed: 2 + survivalLevelRef.current * 0.4,
        spawnInterval: Math.max(800, 2000 - survivalLevelRef.current * 100),
        maxTargets: Math.min(10, 3 + Math.floor(survivalLevelRef.current / 2)),
      },
    }
    return configs[difficultyRef.current]
  }, [])

  const spawnTarget = useCallback(() => {
    const config = getDifficultyConfig()
    if (targetsRef.current.length >= config.maxTargets) return

    const side = Math.floor(Math.random() * 4)
    let x, y, vx, vy

    switch (side) {
      case 0: // Top
        x = Math.random() * CANVAS_WIDTH
        y = -TARGET_RADIUS
        vx = (Math.random() - 0.5) * config.targetSpeed
        vy = config.targetSpeed
        break
      case 1: // Right
        x = CANVAS_WIDTH + TARGET_RADIUS
        y = Math.random() * CANVAS_HEIGHT
        vx = -config.targetSpeed
        vy = (Math.random() - 0.5) * config.targetSpeed
        break
      case 2: // Bottom
        x = Math.random() * CANVAS_WIDTH
        y = CANVAS_HEIGHT + TARGET_RADIUS
        vx = (Math.random() - 0.5) * config.targetSpeed
        vy = -config.targetSpeed
        break
      default: // Left
        x = -TARGET_RADIUS
        y = Math.random() * CANVAS_HEIGHT
        vx = config.targetSpeed
        vy = (Math.random() - 0.5) * config.targetSpeed
        break
    }

    targetsRef.current.push({
      id: targetIdRef.current++,
      x,
      y,
      vx,
      vy,
      radius: TARGET_RADIUS,
      color: '#f59e0b',
    })
  }, [getDifficultyConfig])

  const shootSkillshot = useCallback((type: SkillshotType) => {
    const now = Date.now()
    if (cooldownsRef.current[type] > now) return
    if (gameStateRef.current !== 'playing') return

    const config = SKILLSHOT_CONFIGS[type]
    const player = playerPosRef.current

    // Use stored aim angle and distance
    const angle = aimAngleRef.current
    const targetDistance = type === 'circle' ? aimDistanceRef.current : undefined

    skillshotsRef.current.push({
      id: skillshotIdRef.current++,
      type,
      x: player.x,
      y: player.y,
      angle,
      distance: 0,
      progress: 0,
      speed: config.speed,
      width: config.width,
      color: config.color,
      targetDistance,
    })

    cooldownsRef.current[type] = now + config.cooldown
    aimingSkillRef.current = null
  }, [])

  const updateCooldowns = useCallback(() => {
    const now = Date.now()
    Object.keys(cooldownsRef.current).forEach((key) => {
      const type = key as SkillshotType
      if (cooldownsRef.current[type] < now) {
        cooldownsRef.current[type] = 0
      }
    })
  }, [])

  const checkCollisions = useCallback(() => {
    let hitCount = 0
    const hitTargetIds = new Set<number>()

    skillshotsRef.current.forEach((skillshot) => {
      // For circle bombs, only check collision when exploded
      if (skillshot.type === 'circle' && !skillshot.exploded) return

      targetsRef.current.forEach((target) => {
        if (hitTargetIds.has(target.id)) return

        const currentX = skillshot.x + Math.cos(skillshot.angle) * skillshot.distance
        const currentY = skillshot.y + Math.sin(skillshot.angle) * skillshot.distance

        let hit = false

        if (skillshot.type === 'line') {
          // Line collision: distance to line segment
          const dx = target.x - currentX
          const dy = target.y - currentY
          const dist = Math.sqrt(dx * dx + dy * dy)
          hit = dist < target.radius + skillshot.width / 2
        } else if (skillshot.type === 'circle') {
          // Circle bomb: AoE explosion at final position
          const dx = target.x - currentX
          const dy = target.y - currentY
          const dist = Math.sqrt(dx * dx + dy * dy)
          hit = dist < skillshot.width
        } else if (skillshot.type === 'cone') {
          // Cone collision: angle and distance
          const dx = target.x - skillshot.x
          const dy = target.y - skillshot.y
          const targetAngle = Math.atan2(dy, dx)
          const angleDiff = Math.abs(targetAngle - skillshot.angle)
          const normalizedDiff = Math.min(angleDiff, 2 * Math.PI - angleDiff)
          const coneAngle = Math.PI / 3 // 60 degrees
          const dist = Math.sqrt(dx * dx + dy * dy)
          hit = normalizedDiff < coneAngle / 2 && dist < skillshot.distance + target.radius
        }

        if (hit) {
          hitTargetIds.add(target.id)
          hitCount++
        }
      })
    })

    if (hitTargetIds.size > 0) {
      targetsRef.current = targetsRef.current.filter((t) => !hitTargetIds.has(t.id))

      setStats((prev) => {
        const newHits = prev.hits + hitCount
        const newCombo = prev.combo + hitCount
        const newMaxCombo = Math.max(prev.maxCombo, newCombo)
        const totalShots = newHits + prev.misses
        const accuracy = totalShots > 0 ? (newHits / totalShots) * 100 : 0

        return {
          ...prev,
          hits: newHits,
          combo: newCombo,
          maxCombo: newMaxCombo,
          accuracy,
        }
      })
    }
  }, [])

  const gameLoop = useCallback(() => {
    if (gameStateRef.current !== 'playing') return

    const now = Date.now()
    const elapsed = (now - gameStartTimeRef.current - totalPausedTimeRef.current) / 1000

    // Check game over
    if (elapsed >= duration) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      gameStateRef.current = 'gameOver'
      setGameState('gameOver')
      return
    }

    // Update survival level
    if (difficultyRef.current === 'survival' && elapsed - lastLevelUpRef.current >= 10) {
      survivalLevelRef.current++
      lastLevelUpRef.current = elapsed
    }

    // Spawn targets
    const config = getDifficultyConfig()
    if (now - lastTargetSpawnRef.current > config.spawnInterval) {
      spawnTarget()
      lastTargetSpawnRef.current = now
    }

    // Update player position
    if (joystickActiveRef.current) {
      const moveSpeed = 5
      const newX = playerPosRef.current.x + joystickPosRef.current.x * moveSpeed
      const newY = playerPosRef.current.y + joystickPosRef.current.y * moveSpeed

      playerPosRef.current = {
        x: Math.max(PLAYABLE_MIN_X + PLAYER_RADIUS, Math.min(PLAYABLE_MAX_X - PLAYER_RADIUS, newX)),
        y: Math.max(PLAYABLE_MIN_Y + PLAYER_RADIUS, Math.min(PLAYABLE_MAX_Y - PLAYER_RADIUS, newY)),
      }
    }

    // Update targets
    targetsRef.current = targetsRef.current.filter((target) => {
      target.x += target.vx
      target.y += target.vy

      // Remove targets that go off screen
      return (
        target.x > -TARGET_RADIUS * 2 &&
        target.x < CANVAS_WIDTH + TARGET_RADIUS * 2 &&
        target.y > -TARGET_RADIUS * 2 &&
        target.y < CANVAS_HEIGHT + TARGET_RADIUS * 2
      )
    })

    // Update skillshots
    skillshotsRef.current = skillshotsRef.current.filter((skillshot) => {
      const config = SKILLSHOT_CONFIGS[skillshot.type]

      // Circle bomb: explode at destination
      if (skillshot.type === 'circle') {
        const targetDist = (skillshot.targetDistance || 1) * config.maxDistance

        if (!skillshot.exploded && skillshot.distance >= targetDist) {
          skillshot.exploded = true
          skillshot.progress = 0 // Reset progress for explosion animation
        } else if (skillshot.exploded) {
          skillshot.progress += 0.1 // Explosion animation
          if (skillshot.progress >= 1) {
            // Explosion finished, count as miss if no hits
            setStats((prev) => ({
              ...prev,
              misses: prev.misses + 1,
              combo: 0,
              accuracy: ((prev.hits / (prev.hits + prev.misses + 1)) * 100) || 0,
            }))
            return false
          }
        } else {
          skillshot.distance += skillshot.speed
          skillshot.progress = skillshot.distance / config.maxDistance
        }
      } else {
        // Line and cone: standard behavior
        skillshot.distance += skillshot.speed
        skillshot.progress = skillshot.distance / config.maxDistance

        if (skillshot.progress >= 1) {
          // Skillshot expired, count as miss
          setStats((prev) => ({
            ...prev,
            misses: prev.misses + 1,
            combo: 0,
            accuracy: ((prev.hits / (prev.hits + prev.misses + 1)) * 100) || 0,
          }))
          return false
        }
      }

      return true
    })

    // Check collisions
    checkCollisions()

    // Update cooldowns
    updateCooldowns()

    // Update time
    setStats((prev) => ({ ...prev, timeAlive: elapsed }))

    // Render
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // Draw playable zone
    ctx.strokeStyle = '#334155'
    ctx.lineWidth = 2
    ctx.strokeRect(PLAYABLE_MIN_X, PLAYABLE_MIN_Y, PLAYABLE_MAX_X - PLAYABLE_MIN_X, PLAYABLE_MAX_Y - PLAYABLE_MIN_Y)

    // Draw targets
    targetsRef.current.forEach((target) => {
      ctx.beginPath()
      ctx.arc(target.x, target.y, target.radius, 0, Math.PI * 2)
      ctx.fillStyle = target.color
      ctx.fill()
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2
      ctx.stroke()
    })

    // Draw skillshots
    skillshotsRef.current.forEach((skillshot) => {
      const currentX = skillshot.x + Math.cos(skillshot.angle) * skillshot.distance
      const currentY = skillshot.y + Math.sin(skillshot.angle) * skillshot.distance

      ctx.save()

      if (skillshot.type === 'line') {
        // Draw line projectile
        ctx.globalAlpha = Math.max(0.3, 1 - skillshot.progress)
        ctx.strokeStyle = skillshot.color
        ctx.lineWidth = skillshot.width
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(skillshot.x, skillshot.y)
        ctx.lineTo(currentX, currentY)
        ctx.stroke()
      } else if (skillshot.type === 'circle') {
        if (skillshot.exploded) {
          // Draw explosion
          const explosionRadius = skillshot.width * skillshot.progress
          ctx.globalAlpha = 1 - skillshot.progress
          ctx.beginPath()
          ctx.arc(currentX, currentY, explosionRadius, 0, Math.PI * 2)
          ctx.fillStyle = skillshot.color
          ctx.fill()
          ctx.strokeStyle = '#fff'
          ctx.lineWidth = 3
          ctx.stroke()
        } else {
          // Draw bomb projectile flying
          ctx.globalAlpha = 0.9
          ctx.beginPath()
          ctx.arc(currentX, currentY, 12, 0, Math.PI * 2)
          ctx.fillStyle = skillshot.color
          ctx.fill()
          ctx.strokeStyle = '#fff'
          ctx.lineWidth = 2
          ctx.stroke()
          // Draw trajectory line
          ctx.globalAlpha = 0.3
          ctx.strokeStyle = skillshot.color
          ctx.lineWidth = 2
          ctx.setLineDash([5, 5])
          ctx.beginPath()
          ctx.moveTo(skillshot.x, skillshot.y)
          ctx.lineTo(currentX, currentY)
          ctx.stroke()
          ctx.setLineDash([])
        }
      } else if (skillshot.type === 'cone') {
        // Draw cone
        ctx.globalAlpha = Math.max(0.3, 1 - skillshot.progress)
        ctx.fillStyle = skillshot.color
        ctx.beginPath()
        ctx.moveTo(skillshot.x, skillshot.y)
        const coneAngle = Math.PI / 3
        ctx.arc(
          skillshot.x,
          skillshot.y,
          skillshot.distance,
          skillshot.angle - coneAngle / 2,
          skillshot.angle + coneAngle / 2
        )
        ctx.closePath()
        ctx.fill()
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 2
        ctx.stroke()
      }

      ctx.restore()
    })

    // Draw skillshot preview when aiming
    if (aimingSkillRef.current) {
      const aimingType = aimingSkillRef.current
      const config = SKILLSHOT_CONFIGS[aimingType]
      const player = playerPosRef.current
      const angle = aimAngleRef.current

      // Use variable distance for circle bomb
      const distance = aimingType === 'circle'
        ? aimDistanceRef.current * config.maxDistance
        : config.maxDistance

      const previewX = player.x + Math.cos(angle) * distance
      const previewY = player.y + Math.sin(angle) * distance

      ctx.save()
      ctx.globalAlpha = 0.4

      if (aimingType === 'line') {
        // Line preview
        ctx.strokeStyle = config.color
        ctx.lineWidth = config.width
        ctx.lineCap = 'round'
        ctx.setLineDash([10, 10])
        ctx.beginPath()
        ctx.moveTo(player.x, player.y)
        ctx.lineTo(previewX, previewY)
        ctx.stroke()
        ctx.setLineDash([])
      } else if (aimingType === 'circle') {
        // Circle bomb preview: show trajectory + impact zone at variable distance
        ctx.strokeStyle = config.color
        ctx.lineWidth = 3
        ctx.setLineDash([8, 8])
        ctx.beginPath()
        ctx.moveTo(player.x, player.y)
        ctx.lineTo(previewX, previewY)
        ctx.stroke()
        ctx.setLineDash([])
        // Impact zone at variable distance
        ctx.globalAlpha = 0.3
        ctx.beginPath()
        ctx.arc(previewX, previewY, config.width, 0, Math.PI * 2)
        ctx.fillStyle = config.color
        ctx.fill()
        ctx.globalAlpha = 0.6
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 3
        ctx.stroke()
      } else if (aimingType === 'cone') {
        // Cone preview
        ctx.fillStyle = config.color
        ctx.beginPath()
        ctx.moveTo(player.x, player.y)
        const coneAngle = Math.PI / 3
        ctx.arc(
          player.x,
          player.y,
          config.maxDistance,
          angle - coneAngle / 2,
          angle + coneAngle / 2
        )
        ctx.closePath()
        ctx.fill()
        ctx.globalAlpha = 0.6
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 2
        ctx.stroke()
      }

      ctx.restore()
    }

    // Draw player
    const player = playerPosRef.current
    ctx.beginPath()
    ctx.arc(player.x, player.y, PLAYER_RADIUS, 0, Math.PI * 2)
    ctx.fillStyle = '#10b981'
    ctx.fill()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 3
    ctx.stroke()

    // Draw joystick direction indicator
    if (joystickActiveRef.current) {
      const joyPos = joystickPosRef.current
      if (joyPos.x !== 0 || joyPos.y !== 0) {
        ctx.strokeStyle = '#10b981'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(player.x, player.y)
        ctx.lineTo(player.x + joyPos.x * 40, player.y + joyPos.y * 40)
        ctx.stroke()
      }
    }

    animationFrameRef.current = requestAnimationFrame(gameLoop)
  }, [duration, getDifficultyConfig, spawnTarget, checkCollisions, updateCooldowns])

  const startGame = useCallback(async () => {
    // Enter fullscreen FIRST (required for orientation lock)
    const container = containerRef.current
    if (container && !document.fullscreenElement) {
      try {
        await container.requestFullscreen()
        setIsFullscreen(true)
      } catch (err) {
        console.warn('Fullscreen failed:', err)
      }
    }

    // Then force landscape mode (only works in fullscreen)
    if (screen.orientation && 'lock' in screen.orientation) {
      try {
        await (screen.orientation as any).lock('landscape')
      } catch (err) {
        console.warn('Landscape lock failed:', err)
      }
    }

    // Reset game state
    playerPosRef.current = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 }
    targetsRef.current = []
    skillshotsRef.current = []
    cooldownsRef.current = { line: 0, circle: 0, cone: 0 }
    targetIdRef.current = 0
    skillshotIdRef.current = 0
    survivalLevelRef.current = 1
    lastLevelUpRef.current = 0

    setStats({
      hits: 0,
      misses: 0,
      accuracy: 0,
      combo: 0,
      maxCombo: 0,
      timeAlive: 0,
    })

    gameStartTimeRef.current = Date.now()
    totalPausedTimeRef.current = 0
    lastTargetSpawnRef.current = Date.now()

    setGameState('playing')
  }, [])

  const pauseGame = useCallback(() => {
    setGameState('paused')
    pausedTimeRef.current = Date.now()
  }, [])

  const resumeGame = useCallback(() => {
    totalPausedTimeRef.current += Date.now() - pausedTimeRef.current
    setGameState('playing')
  }, [])

  const stopGame = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    gameStateRef.current = 'gameOver'
    setGameState('gameOver')
  }, [])

  const exitFullscreen = useCallback(async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen()
      if (screen.orientation && 'unlock' in screen.orientation) {
        (screen.orientation as any).unlock()
      }
      setIsFullscreen(false)
    }
  }, [])

  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      try {
        // Request fullscreen on the container
        const container = containerRef.current
        if (container) {
          await container.requestFullscreen()
          setIsFullscreen(true)
          // Try to lock orientation to landscape
          if (screen.orientation && 'lock' in screen.orientation) {
            try {
              await (screen.orientation as any).lock('landscape')
            } catch (err) {
              console.warn('Orientation lock not supported:', err)
            }
          }
        }
      } catch (err) {
        console.error('Fullscreen request failed:', err)
      }
    } else {
      await exitFullscreen()
    }
  }, [exitFullscreen])

  // Game loop effect
  useEffect(() => {
    if (gameState === 'playing') {
      animationFrameRef.current = requestAnimationFrame(gameLoop)
    } else if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [gameState, gameLoop])

  // Completion callback
  useEffect(() => {
    if (gameState === 'gameOver' && onComplete) {
      onComplete({
        exercise_type: 'skillshot_trainer' as any,
        score: Math.round(stats.accuracy),
        max_score: 100,
        duration: Math.round(stats.timeAlive),
        metadata: {
          hits: stats.hits,
          misses: stats.misses,
          accuracy: stats.accuracy,
          maxCombo: stats.maxCombo,
          difficulty,
        },
      } as any)
    }
  }, [gameState, stats, difficulty, onComplete])

  // Fullscreen change handler
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Joystick handlers
  const handleJoystickStart = useCallback(() => {
    joystickActiveRef.current = true
  }, [])

  const handleJoystickMove = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!joystickActiveRef.current) return

    const joystickElement = e.currentTarget as HTMLElement
    const rect = joystickElement.getBoundingClientRect()
    const centerX = rect.width / 2
    const centerY = rect.height / 2

    let clientX, clientY
    if ('touches' in e) {
      if (e.touches.length === 0) return
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }

    const x = clientX - rect.left - centerX
    const y = clientY - rect.top - centerY

    const distance = Math.sqrt(x * x + y * y)
    const maxDistance = rect.width / 2

    if (distance > maxDistance) {
      const angle = Math.atan2(y, x)
      joystickPosRef.current = {
        x: Math.cos(angle),
        y: Math.sin(angle),
      }
      aimAngleRef.current = angle // Update aim direction
    } else {
      joystickPosRef.current = {
        x: x / maxDistance,
        y: y / maxDistance,
      }
      if (distance > 10) { // Only update if moving significantly
        aimAngleRef.current = Math.atan2(y, x)
      }
    }
  }, [])

  const handleJoystickEnd = useCallback(() => {
    joystickActiveRef.current = false
    joystickPosRef.current = { x: 0, y: 0 }
  }, [])

  // Skill button drag handlers for aiming
  const handleSkillStart = useCallback((e: React.TouchEvent | React.MouseEvent, type: SkillshotType) => {
    aimingSkillRef.current = type

    // Store button center position for global tracking
    const button = e.currentTarget as HTMLElement
    const rect = button.getBoundingClientRect()
    buttonCenterRef.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    }
  }, [])

  // Global skill move handler - continues tracking even if pointer leaves button
  const handleSkillMove = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!aimingSkillRef.current || !buttonCenterRef.current) return

    let clientX, clientY
    if ('touches' in e) {
      if (e.touches.length === 0) return
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }

    const dx = clientX - buttonCenterRef.current.x
    const dy = clientY - buttonCenterRef.current.y
    const dragDistance = Math.sqrt(dx * dx + dy * dy)

    // Always update angle immediately for better sensitivity (no threshold)
    if (dragDistance > 1) { // Minimal threshold to avoid jitter when stationary
      aimAngleRef.current = Math.atan2(dy, dx)
    }

    // Update distance for circle bomb (30% to 100% based on drag distance)
    // Max drag distance of 150px = 100% range
    const maxDragDistance = 150
    const normalizedDistance = Math.min(dragDistance / maxDragDistance, 1)
    aimDistanceRef.current = Math.max(0.3, normalizedDistance) // Minimum 30%
  }, [])

  const handleSkillEnd = useCallback((type: SkillshotType) => {
    if (aimingSkillRef.current === type) {
      shootSkillshot(type)
    }
    aimingSkillRef.current = null
    buttonCenterRef.current = null
  }, [shootSkillshot])

  const getCooldownPercent = (type: SkillshotType) => {
    const now = Date.now()
    const cooldownEnd = cooldownsRef.current[type]
    if (cooldownEnd === 0) return 0

    const config = SKILLSHOT_CONFIGS[type]
    const remaining = Math.max(0, cooldownEnd - now)
    return (remaining / config.cooldown) * 100
  }

  return (
    <div ref={containerRef} className={mergeThemeClasses('relative w-full h-full', className)}>
      {/* Canvas - Full screen when playing, hidden when idle */}
      {gameState === 'playing' && (
        <div className="fixed inset-0 z-0">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="w-full h-full object-contain bg-slate-950"
            style={{ touchAction: 'none' }}
          />
        </div>
      )}

      {/* Idle State */}
      {gameState === 'idle' && (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="w-full h-auto max-h-screen bg-slate-950 rounded-lg shadow-2xl mb-6"
            style={{ touchAction: 'none' }}
          />
          <div className="text-center space-y-6 pb-8">
            <div>
              <h2 className={`text-2xl font-bold mb-2 ${themeClasses.textMain}`}>
                🎯 Skillshot Trainer
              </h2>
              <p className="text-gray-400">
                Entraînez votre précision de skillshots MOBA
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-300">
                Difficulté
              </label>
              <div className="flex gap-2 justify-center flex-wrap">
                {(['easy', 'medium', 'hard', 'survival'] as Difficulty[]).map((diff) => (
                  <button
                    key={diff}
                    onClick={() => setDifficulty(diff)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      difficulty === diff
                        ? `${themeClasses.bgPrimary} text-white`
                        : `${themeClasses.bgCard} text-gray-400 ${themeClasses.bgCardHover}`
                    }`}
                  >
                    {diff === 'easy' && '😊 Facile'}
                    {diff === 'medium' && '😐 Moyen'}
                    {diff === 'hard' && '😤 Difficile'}
                    {diff === 'survival' && '💀 Survie'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={toggleFullscreen}
                className={`w-full max-w-md mx-auto px-4 py-2 ${themeClasses.bgCard} ${themeClasses.bgCardHover} ${themeClasses.borderRadius} ${themeClasses.border} border text-sm transition-all`}
              >
                {isFullscreen ? '📱 Quitter le plein écran' : '📱 Mode plein écran (paysage recommandé)'}
              </button>

              <button
                onClick={startGame}
                className={`px-8 py-4 ${themeClasses.bgPrimary} ${themeClasses.bgPrimaryHover} ${themeClasses.borderRadius} font-bold text-lg transition-all`}
              >
                🎮 Commencer
              </button>
            </div>

            <div className={`${themeClasses.bgCard} p-4 rounded-lg text-left max-w-md mx-auto`}>
              <h3 className="font-semibold mb-2 text-emerald-400">📋 Instructions</h3>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Joystick (gauche): Déplacer le personnage</li>
                <li>• Boutons (droite): Lancer les skillshots</li>
                <li>• 🔴 Ligne: Projectile rapide en ligne droite</li>
                <li>• 🟣 Cercle: Zone d'effet AoE</li>
                <li>• 🔵 Cône: Skillshot en cône</li>
                <li>• Touchez les cibles orange avec vos sorts!</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Playing State - Controls */}
      {gameState === 'playing' && (
        <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 9999 }}>
            {/* Stats HUD */}
            <div className="absolute top-4 left-4 right-4 pointer-events-auto">
              <div className="flex justify-between items-center bg-black/60 backdrop-blur rounded-lg p-3 text-white">
                <div className="flex gap-4 text-sm">
                  <span className="font-semibold">⏱️ {Math.floor(stats.timeAlive)}s</span>
                  <span className="text-emerald-400">🎯 {stats.hits}</span>
                  <span className="text-red-400">❌ {stats.misses}</span>
                  <span className="text-amber-400">🔥 Combo: {stats.combo}</span>
                  <span className="text-blue-400">📊 {stats.accuracy.toFixed(1)}%</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={pauseGame}
                    className="px-3 py-1 bg-amber-600 hover:bg-amber-700 rounded font-semibold text-sm"
                  >
                    ⏸️ Pause
                  </button>
                  <button
                    onClick={stopGame}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded font-semibold text-sm"
                  >
                    ⏹️ Stop
                  </button>
                </div>
              </div>
            </div>

            {/* Joystick - Bottom Left (vraiment dans le coin comme HOK/Wild Rift) */}
            <div className="fixed left-4 bottom-4 pointer-events-auto">
              <div
                className="relative w-32 h-32 bg-gray-800/70 rounded-full border-4 border-gray-600 shadow-lg"
                onTouchStart={handleJoystickStart}
                onTouchMove={handleJoystickMove}
                onTouchEnd={handleJoystickEnd}
                onMouseDown={handleJoystickStart}
                onMouseMove={handleJoystickMove}
                onMouseUp={handleJoystickEnd}
                onMouseLeave={handleJoystickEnd}
                style={{ touchAction: 'none' }}
              >
                <div
                  className="absolute top-1/2 left-1/2 w-12 h-12 bg-emerald-500 rounded-full shadow-lg transition-transform"
                  style={{
                    transform: `translate(-50%, -50%) translate(${joystickPosRef.current.x * 30}px, ${joystickPosRef.current.y * 30}px)`,
                  }}
                />
              </div>
            </div>

            {/* Ability Buttons - Bottom Right in MOBA arc layout (like HOK/Wild Rift) */}
            <div className="fixed right-4 bottom-4 pointer-events-auto">
              <div className="relative" style={{ width: '220px', height: '100px' }}>
                {/* Sort 1 - Line (rightmost, lowest) */}
                <button
                  onTouchStart={(e) => handleSkillStart(e, 'line')}
                  onTouchMove={handleSkillMove}
                  onTouchEnd={() => handleSkillEnd('line')}
                  onMouseDown={(e) => handleSkillStart(e, 'line')}
                  onMouseMove={handleSkillMove}
                  onMouseUp={() => handleSkillEnd('line')}
                  disabled={getCooldownPercent('line') > 0}
                  className="absolute w-20 h-20 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:opacity-50 rounded-full shadow-lg font-bold text-2xl transition-all"
                  style={{
                    touchAction: 'none',
                    right: '0px',
                    bottom: '0px'
                  }}
                >
                  <span className="relative z-10">━</span>
                  {getCooldownPercent('line') > 0 && (
                    <div
                      className="absolute inset-0 bg-black/70 rounded-full"
                      style={{
                        clipPath: `polygon(50% 50%, 50% 0%, ${50 + 50 * Math.sin((getCooldownPercent('line') / 100) * 2 * Math.PI)}% ${50 - 50 * Math.cos((getCooldownPercent('line') / 100) * 2 * Math.PI)}%)`,
                      }}
                    />
                  )}
                </button>

                {/* Sort 2 - Circle (middle) */}
                <button
                  onTouchStart={(e) => handleSkillStart(e, 'circle')}
                  onTouchMove={handleSkillMove}
                  onTouchEnd={() => handleSkillEnd('circle')}
                  onMouseDown={(e) => handleSkillStart(e, 'circle')}
                  onMouseMove={handleSkillMove}
                  onMouseUp={() => handleSkillEnd('circle')}
                  disabled={getCooldownPercent('circle') > 0}
                  className="absolute w-20 h-20 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:opacity-50 rounded-full shadow-lg font-bold text-2xl transition-all"
                  style={{
                    touchAction: 'none',
                    right: '90px',
                    bottom: '10px'
                  }}
                >
                  <span className="relative z-10">●</span>
                  {getCooldownPercent('circle') > 0 && (
                    <div
                      className="absolute inset-0 bg-black/70 rounded-full"
                      style={{
                        clipPath: `polygon(50% 50%, 50% 0%, ${50 + 50 * Math.sin((getCooldownPercent('circle') / 100) * 2 * Math.PI)}% ${50 - 50 * Math.cos((getCooldownPercent('circle') / 100) * 2 * Math.PI)}%)`,
                      }}
                    />
                  )}
                </button>

                {/* Sort 3 - Cone (leftmost, slightly higher) */}
                <button
                  onTouchStart={(e) => handleSkillStart(e, 'cone')}
                  onTouchMove={handleSkillMove}
                  onTouchEnd={() => handleSkillEnd('cone')}
                  onMouseDown={(e) => handleSkillStart(e, 'cone')}
                  onMouseMove={handleSkillMove}
                  onMouseUp={() => handleSkillEnd('cone')}
                  disabled={getCooldownPercent('cone') > 0}
                  className="absolute w-20 h-20 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-700 disabled:opacity-50 rounded-full shadow-lg font-bold text-2xl transition-all"
                  style={{
                    touchAction: 'none',
                    right: '180px',
                    bottom: '20px'
                  }}
                >
                  <span className="relative z-10">▲</span>
                  {getCooldownPercent('cone') > 0 && (
                    <div
                      className="absolute inset-0 bg-black/70 rounded-full"
                      style={{
                        clipPath: `polygon(50% 50%, 50% 0%, ${50 + 50 * Math.sin((getCooldownPercent('cone') / 100) * 2 * Math.PI)}% ${50 - 50 * Math.cos((getCooldownPercent('cone') / 100) * 2 * Math.PI)}%)`,
                      }}
                    />
                  )}
                </button>
              </div>
            </div>
        </div>
      )}

      {/* Paused State */}
      {gameState === 'paused' && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center" style={{ zIndex: 10000 }}>
            <div className={`${themeClasses.bgCard} p-8 rounded-2xl max-w-md text-center space-y-4`}>
              <h2 className="text-3xl font-bold text-amber-400">⏸️ Pause</h2>
              <div className="space-y-2">
                <button
                  onClick={resumeGame}
                  className={`w-full px-6 py-3 ${themeClasses.bgPrimary} ${themeClasses.bgPrimaryHover} ${themeClasses.borderRadius} font-semibold transition-all`}
                >
                  ▶️ Reprendre
                </button>
                <button
                  onClick={stopGame}
                  className={`w-full px-6 py-3 ${themeClasses.bgCard} ${themeClasses.bgCardHover} ${themeClasses.borderRadius} font-semibold transition-all`}
                >
                  ⏹️ Arrêter
                </button>
              </div>
            </div>
        </div>
      )}

      {/* Game Over State */}
      {gameState === 'gameOver' && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4" style={{ zIndex: 10000 }}>
            <div className={`${themeClasses.bgCard} p-6 rounded-xl max-w-lg w-full text-center space-y-4 relative`}>
              {/* Close button */}
              <button
                onClick={() => {
                  setGameState('idle')
                  if (isFullscreen) {
                    exitFullscreen()
                  }
                }}
                className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-colors"
                aria-label="Fermer"
              >
                ✕
              </button>

              <div>
                <h2 className="text-2xl font-bold mb-1 text-emerald-400">🎯 Partie Terminée!</h2>
                <p className="text-gray-400 text-sm">Résultats de votre performance</p>
              </div>

              <div className={`${themeClasses.bgCard} p-4 rounded-lg space-y-2`}>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-left">
                    <p className="text-gray-400 text-xs">Cibles touchées</p>
                    <p className="text-xl font-bold text-emerald-400">{stats.hits}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-gray-400 text-xs">Tirs manqués</p>
                    <p className="text-xl font-bold text-red-400">{stats.misses}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-gray-400 text-xs">Précision</p>
                    <p className="text-xl font-bold text-blue-400">{stats.accuracy.toFixed(1)}%</p>
                  </div>
                  <div className="text-left">
                    <p className="text-gray-400 text-xs">Meilleur combo</p>
                    <p className="text-xl font-bold text-amber-400">{stats.maxCombo}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-300">
                  Changer la difficulté
                </label>
                <div className="flex gap-2 justify-center flex-wrap">
                  {(['easy', 'medium', 'hard', 'survival'] as Difficulty[]).map((diff) => (
                    <button
                      key={diff}
                      onClick={() => setDifficulty(diff)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                        difficulty === diff
                          ? `${themeClasses.bgPrimary} text-white`
                          : `${themeClasses.bgCard} text-gray-400 ${themeClasses.bgCardHover}`
                      }`}
                    >
                      {diff === 'easy' && '😊 Facile'}
                      {diff === 'medium' && '😐 Moyen'}
                      {diff === 'hard' && '😤 Difficile'}
                      {diff === 'survival' && '💀 Survie'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 justify-center">
                <button
                  onClick={startGame}
                  className={`px-6 py-2.5 ${themeClasses.bgPrimary} ${themeClasses.bgPrimaryHover} ${themeClasses.borderRadius} font-semibold transition-all`}
                >
                  🔄 Rejouer
                </button>

                {isFullscreen && (
                  <button
                    onClick={exitFullscreen}
                    className={`px-6 py-2.5 ${themeClasses.bgCard} ${themeClasses.bgCardHover} ${themeClasses.borderRadius} font-semibold transition-all`}
                  >
                    📱 Quitter
                  </button>
                )}
              </div>
            </div>
        </div>
      )}
    </div>
  )
}
