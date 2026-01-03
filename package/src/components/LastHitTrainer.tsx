import { useState, useRef, useCallback, useEffect } from 'react'
import { ExerciseBaseProps } from '../types'
import { resolveTheme, getThemeClasses, mergeThemeClasses } from '../themes'

type Difficulty = 'easy' | 'medium' | 'hard' | 'survival'
type ChampionType = 'melee' | 'ranged'
type GameState = 'idle' | 'playing' | 'paused' | 'gameOver'
type CreepType = 'melee' | 'ranged' | 'cannon'

interface Position {
  x: number
  y: number
}

interface Creep {
  id: number
  type: CreepType
  position: Position
  maxHealth: number
  currentHealth: number
  goldValue: number
  moving: boolean
  targetX: number
}

interface Enemy {
  position: Position
  targetCreepId: number | null
  attackCooldown: number
  lastAttackTime: number
}

interface Stats {
  gold: number
  cs: number // Creep Score
  missedCs: number
  accuracy: number
  perfectHits: number
  combo: number
  maxCombo: number
  timeElapsed: number
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
  type: 'gold' | 'hit' | 'combo' | 'death'
}

interface FloatingText {
  x: number
  y: number
  text: string
  color: string
  life: number
  maxLife: number
  vy: number
}

interface AttackAnimation {
  id: number
  fromX: number
  fromY: number
  toX: number
  toY: number
  currentX: number
  currentY: number
  life: number
  maxLife: number
  type: 'melee' | 'ranged'
}

export interface LastHitTrainerProps extends ExerciseBaseProps {
  duration?: number
}

// MOBA-style landscape format (16:9 ratio)
const CANVAS_WIDTH = 1280
const CANVAS_HEIGHT = 720

// Lane setup (angled lane at ~37.5 degrees, bottom-left to top-right)
const LANE_ANGLE = -37.5 * Math.PI / 180 // Negative angle for bottom-left to top-right
const LANE_Y_BOTTOM = CANVAS_HEIGHT / 2 + 120 // Bottom-left of lane
const LANE_START_X = 100
const PLAYER_START_X = 200
const TOWER_ALLY_X = 120 // Allied tower position
const ENEMY_START_X = CANVAS_WIDTH - 200

// Helper function to get Y position on lane based on X
const getLaneY = (x: number): number => {
  return LANE_Y_BOTTOM + (x - LANE_START_X) * Math.tan(LANE_ANGLE)
}

// Champion stats
const CHAMPION_STATS = {
  melee: {
    attackRange: 80,
    attackDamage: 60,
    attackSpeed: 1.2, // attacks per second
    movementSpeed: 4,
  },
  ranged: {
    attackRange: 250,
    attackDamage: 45,
    attackSpeed: 1.5,
    movementSpeed: 3.5,
  },
}

// Creep stats
const CREEP_STATS = {
  melee: {
    maxHealth: 100,
    goldValue: 20,
    spawnChance: 0.5,
  },
  ranged: {
    maxHealth: 80,
    goldValue: 18,
    spawnChance: 0.3,
  },
  cannon: {
    maxHealth: 200,
    goldValue: 60,
    spawnChance: 0.2,
  },
}

export function LastHitTrainer({
  duration = 120,
  className,
  theme = 'ermite',
  onComplete,
}: LastHitTrainerProps) {
  const currentTheme = resolveTheme(theme)
  const themeClasses = getThemeClasses(currentTheme)

  // Game state
  const [gameState, setGameState] = useState<GameState>('idle')
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [championType, setChampionType] = useState<ChampionType>('melee')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [stats, setStats] = useState<Stats>({
    gold: 0,
    cs: 0,
    missedCs: 0,
    accuracy: 100,
    perfectHits: 0,
    combo: 0,
    maxCombo: 0,
    timeElapsed: 0,
  })

  // Refs
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number>()
  const gameStateRef = useRef<GameState>('idle')
  const difficultyRef = useRef<Difficulty>('medium')

  // Player refs
  const playerPosRef = useRef<Position>({ x: PLAYER_START_X, y: getLaneY(PLAYER_START_X) })
  const joystickActiveRef = useRef(false)
  const joystickPosRef = useRef<Position>({ x: 0, y: 0 })
  const lastAttackTimeRef = useRef(0)
  const targetedCreepIdRef = useRef<number | null>(null) // Sbire ciblé manuellement

  // Game objects refs
  const creepsRef = useRef<Creep[]>([])
  const enemyRef = useRef<Enemy>({
    position: { x: ENEMY_START_X, y: getLaneY(ENEMY_START_X) },
    targetCreepId: null,
    attackCooldown: 0,
    lastAttackTime: 0,
  })
  const creepIdRef = useRef(0)

  // Game timing refs
  const gameStartTimeRef = useRef(0)
  const lastWaveSpawnRef = useRef(0)
  const totalPausedTimeRef = useRef(0)
  const pausedTimeRef = useRef(0)
  const waveCountRef = useRef(0) // Track wave count for cannon minions

  // Animation refs
  const particlesRef = useRef<Particle[]>([])
  const floatingTextsRef = useRef<FloatingText[]>([])
  const healthBarFlashRef = useRef<Map<number, number>>(new Map())
  const attackAnimationsRef = useRef<AttackAnimation[]>([])
  const attackIdRef = useRef(0)

  useEffect(() => {
    gameStateRef.current = gameState
  }, [gameState])

  useEffect(() => {
    difficultyRef.current = difficulty
  }, [difficulty])

  // Animation helpers
  const spawnParticles = useCallback((x: number, y: number, type: Particle['type'], count: number = 10) => {
    const newParticles: Particle[] = []
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5
      const speed = 2 + Math.random() * 3
      newParticles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        life: 1,
        maxLife: 1,
        color: type === 'gold' ? '#fbbf24' : type === 'combo' ? '#f97316' : type === 'death' ? '#ef4444' : '#ffffff',
        size: type === 'gold' ? 6 : 4,
        type,
      })
    }
    particlesRef.current.push(...newParticles)
  }, [])

  const spawnFloatingText = useCallback((x: number, y: number, text: string, color: string) => {
    floatingTextsRef.current.push({
      x,
      y,
      text,
      color,
      life: 1,
      maxLife: 1,
      vy: -1.5,
    })
  }, [])

  const updateParticles = useCallback((deltaTime: number) => {
    particlesRef.current = particlesRef.current.filter((particle) => {
      particle.life -= deltaTime
      particle.x += particle.vx
      particle.y += particle.vy
      particle.vy += 0.2 // Gravity
      return particle.life > 0
    })
  }, [])

  const updateFloatingTexts = useCallback((deltaTime: number) => {
    floatingTextsRef.current = floatingTextsRef.current.filter((text) => {
      text.life -= deltaTime
      text.y += text.vy
      return text.life > 0
    })
  }, [])

  const spawnAttackAnimation = useCallback((fromX: number, fromY: number, toX: number, toY: number, type: 'melee' | 'ranged') => {
    attackAnimationsRef.current.push({
      id: attackIdRef.current++,
      fromX,
      fromY,
      toX,
      toY,
      currentX: fromX,
      currentY: fromY,
      life: 1,
      maxLife: 1,
      type,
    })
  }, [])

  const updateAttackAnimations = useCallback((deltaTime: number) => {
    attackAnimationsRef.current = attackAnimationsRef.current.filter((attack) => {
      attack.life -= deltaTime * (attack.type === 'melee' ? 5 : 2) // Melee faster

      if (attack.type === 'ranged') {
        // Move projectile towards target
        const progress = 1 - attack.life / attack.maxLife
        attack.currentX = attack.fromX + (attack.toX - attack.fromX) * progress
        attack.currentY = attack.fromY + (attack.toY - attack.fromY) * progress
      }

      return attack.life > 0
    })
  }, [])

  const getDifficultyConfig = useCallback(() => {
    const currentDifficulty = difficultyRef.current

    // MOBA mobiles réels: vagues toutes les 30 secondes
    switch (currentDifficulty) {
      case 'easy':
        return {
          enemyAttackSpeed: 0.4, // attacks per second
          waveInterval: 30000, // 30s comme les MOBA mobiles réels
          creepHealthDecayRate: 0.25, // health loss per second
        }
      case 'medium':
        return {
          enemyAttackSpeed: 0.6,
          waveInterval: 30000,
          creepHealthDecayRate: 0.4,
        }
      case 'hard':
        return {
          enemyAttackSpeed: 0.9,
          waveInterval: 30000,
          creepHealthDecayRate: 0.6,
        }
      case 'survival':
        return {
          enemyAttackSpeed: 1.2,
          waveInterval: 30000,
          creepHealthDecayRate: 0.8,
        }
      default:
        return {
          enemyAttackSpeed: 0.6,
          waveInterval: 30000,
          creepHealthDecayRate: 0.4,
        }
    }
  }, [])

  const spawnWave = useCallback(() => {
    const newCreeps: Creep[] = []

    // Composition MOBA réaliste: 3 mêlée + 3 à distance + 1 canon (toutes les 3 vagues)
    waveCountRef.current++
    const hasCannonMinion = waveCountRef.current % 3 === 0

    const waveComposition: CreepType[] = [
      'melee', 'melee', 'melee', // 3 mêlée
      'ranged', 'ranged', 'ranged', // 3 à distance
    ]

    if (hasCannonMinion) {
      waveComposition.push('cannon') // Canon toutes les 3 vagues
    }

    const spacing = 90 // Espacement augmenté pour plus de visibilité
    const startX = CANVAS_WIDTH - LANE_START_X + 100 // Spawn à DROITE

    waveComposition.forEach((type, i) => {
      const stats = CREEP_STATS[type]
      const spawnX = startX + i * spacing
      const spawnY = getLaneY(spawnX)

      newCreeps.push({
        id: creepIdRef.current++,
        type,
        position: { x: spawnX, y: spawnY },
        maxHealth: stats.maxHealth,
        currentHealth: stats.maxHealth,
        goldValue: stats.goldValue,
        moving: true,
        targetX: PLAYER_START_X + 100 + Math.random() * 100, // Se déplace vers la GAUCHE
      })
    })

    creepsRef.current = [...creepsRef.current, ...newCreeps]
  }, [])

  const updateCreeps = useCallback(
    (deltaTime: number) => {
      const config = getDifficultyConfig()

      creepsRef.current = creepsRef.current.filter((creep) => {
        // Move creep towards target (DROITE vers GAUCHE)
        if (creep.moving && creep.position.x > creep.targetX) {
          creep.position.x -= 0.5 * deltaTime * 60 // Vitesse réduite pour meilleure visibilité
          // Update Y position to follow the angled lane
          creep.position.y = getLaneY(creep.position.x)

          if (creep.position.x <= creep.targetX) {
            creep.moving = false
          }
        }

        // Health decay (tower/minion damage simulation)
        creep.currentHealth -= config.creepHealthDecayRate * deltaTime

        // Remove dead creeps
        if (creep.currentHealth <= 0) {
          // Spawn death particles
          spawnParticles(creep.position.x, creep.position.y, 'death', 8)
          spawnFloatingText(creep.position.x, creep.position.y - 30, 'MISSED!', '#ef4444')

          // Missed CS
          setStats((prev) => ({
            ...prev,
            missedCs: prev.missedCs + 1,
            combo: 0,
            accuracy: ((prev.cs / (prev.cs + prev.missedCs + 1)) * 100) || 100,
          }))
          return false
        }

        return true
      })
    },
    [getDifficultyConfig, spawnParticles, spawnFloatingText]
  )

  const updateEnemy = useCallback(() => {
    const config = getDifficultyConfig()
    const enemy = enemyRef.current
    const now = Date.now()

    // Find closest creep to attack
    if (!enemy.targetCreepId || !creepsRef.current.find((c) => c.id === enemy.targetCreepId)) {
      const closestCreep = creepsRef.current
        .filter((c) => !c.moving)
        .sort(
          (a, b) =>
            Math.abs(a.position.x - enemy.position.x) - Math.abs(b.position.x - enemy.position.x)
        )[0]

      if (closestCreep) {
        enemy.targetCreepId = closestCreep.id
      }
    }

    // Attack target creep
    if (enemy.targetCreepId) {
      const targetCreep = creepsRef.current.find((c) => c.id === enemy.targetCreepId)
      if (targetCreep) {
        const timeSinceLastAttack = (now - enemy.lastAttackTime) / 1000

        if (timeSinceLastAttack >= 1 / config.enemyAttackSpeed) {
          // Enemy attacks
          targetCreep.currentHealth -= 40 // Enemy damage
          enemy.lastAttackTime = now
        }
      }
    }
  }, [getDifficultyConfig])

  const playerAttack = useCallback(() => {
    const championStats = CHAMPION_STATS[championType]
    const now = Date.now()
    const timeSinceLastAttack = (now - lastAttackTimeRef.current) / 1000

    const playerPos = playerPosRef.current

    // Find creeps in range
    const creepsInRange = creepsRef.current.filter((creep) => {
      const distance = Math.sqrt(
        Math.pow(creep.position.x - playerPos.x, 2) + Math.pow(creep.position.y - playerPos.y, 2)
      )
      return distance <= championStats.attackRange
    })

    // Prioritize targeted creep if in range, otherwise get closest
    let targetCreep: Creep | null = null

    if (targetedCreepIdRef.current !== null) {
      // Check if targeted creep is in range
      targetCreep = creepsInRange.find((c) => c.id === targetedCreepIdRef.current) || null

      // If targeted creep is not in range or dead, clear target
      if (!targetCreep) {
        targetedCreepIdRef.current = null
      }
    }

    // If no valid target, get closest creep
    const closest = targetCreep || (creepsInRange.length > 0
      ? creepsInRange.sort(
          (a, b) =>
            Math.abs(a.position.x - playerPos.x) - Math.abs(b.position.x - playerPos.x)
        )[0]
      : null)

    // Always spawn attack animation when clicking (visual feedback)
    if (closest) {
      // Spawn attack animation towards target
      spawnAttackAnimation(playerPos.x, playerPos.y, closest.position.x, closest.position.y, championType)
    } else {
      // No target: show animation in default direction (to the right)
      const defaultTargetX = playerPos.x + championStats.attackRange
      const defaultTargetY = playerPos.y
      spawnAttackAnimation(playerPos.x, playerPos.y, defaultTargetX, defaultTargetY, championType)
    }

    // Check cooldown AFTER spawning animation (so animation always shows)
    if (timeSinceLastAttack < 1 / championStats.attackSpeed) {
      return // On cooldown - animation shown but no damage dealt
    }

    if (closest) {
      // Deal damage to closest creep
      closest.currentHealth -= championStats.attackDamage

      // Check for last hit
      if (closest.currentHealth <= 0) {
        const isPerfect = closest.currentHealth > -20 // Perfect timing window

        // Spawn visual effects
        spawnParticles(closest.position.x, closest.position.y, 'gold', isPerfect ? 20 : 12)
        spawnFloatingText(
          closest.position.x,
          closest.position.y - 35,
          `+${closest.goldValue}g`,
          '#fbbf24'
        )

        if (isPerfect) {
          spawnFloatingText(closest.position.x, closest.position.y - 50, 'PERFECT!', '#10b981')
        }

        setStats((prev) => ({
          ...prev,
          gold: prev.gold + closest.goldValue,
          cs: prev.cs + 1,
          combo: prev.combo + 1,
          maxCombo: Math.max(prev.maxCombo, prev.combo + 1),
          perfectHits: prev.perfectHits + (isPerfect ? 1 : 0),
          accuracy: ((prev.cs + 1) / (prev.cs + 1 + prev.missedCs)) * 100,
        }))

        // Spawn combo particles
        if (stats.combo >= 2) {
          spawnParticles(playerPos.x, playerPos.y - 30, 'combo', 5)
        }
      }

      // Flash effect on attack
      healthBarFlashRef.current.set(closest.id, Date.now())

      lastAttackTimeRef.current = now
    }
  }, [championType, spawnParticles, spawnFloatingText, spawnAttackAnimation, stats.combo])

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx || !canvas || gameStateRef.current !== 'playing') return

    const now = Date.now()
    const elapsed = (now - gameStartTimeRef.current - totalPausedTimeRef.current) / 1000
    const deltaTime = 1 / 60

    // Check duration
    if (elapsed >= duration) {
      setGameState('gameOver')
      return
    }

    // Update time
    setStats((prev) => ({ ...prev, timeElapsed: elapsed }))

    // Spawn waves
    if (now - lastWaveSpawnRef.current > getDifficultyConfig().waveInterval) {
      spawnWave()
      lastWaveSpawnRef.current = now
    }

    // Update game objects
    updateCreeps(deltaTime)
    updateEnemy()

    // Update animations
    updateParticles(deltaTime)
    updateFloatingTexts(deltaTime)
    updateAttackAnimations(deltaTime)

    // Update player position - free movement
    if (joystickActiveRef.current) {
      const championStats = CHAMPION_STATS[championType]
      const moveSpeed = championStats.movementSpeed

      // Free movement in both X and Y
      playerPosRef.current.x += joystickPosRef.current.x * moveSpeed
      playerPosRef.current.y += joystickPosRef.current.y * moveSpeed

      // Keep in canvas bounds
      playerPosRef.current.x = Math.max(50, Math.min(CANVAS_WIDTH - 50, playerPosRef.current.x))
      playerPosRef.current.y = Math.max(50, Math.min(CANVAS_HEIGHT - 50, playerPosRef.current.y))
    }

    // Clear canvas
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // Draw angled lane (top-left to bottom-right at ~37.5 degrees)
    const laneWidth = 160
    const laneStartY = getLaneY(0)
    const laneEndY = getLaneY(CANVAS_WIDTH)

    ctx.save()

    // Draw lane background (darker area)
    ctx.fillStyle = '#1a1f2e'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // Draw the lane itself
    ctx.fillStyle = '#2d3748'
    ctx.beginPath()
    ctx.moveTo(0, laneStartY - laneWidth / 2)
    ctx.lineTo(CANVAS_WIDTH, laneEndY - laneWidth / 2)
    ctx.lineTo(CANVAS_WIDTH, laneEndY + laneWidth / 2)
    ctx.lineTo(0, laneStartY + laneWidth / 2)
    ctx.closePath()
    ctx.fill()

    // Draw lane center line (dashed)
    ctx.strokeStyle = '#4a5568'
    ctx.lineWidth = 2
    ctx.setLineDash([20, 15])
    ctx.beginPath()
    ctx.moveTo(0, laneStartY)
    ctx.lineTo(CANVAS_WIDTH, laneEndY)
    ctx.stroke()
    ctx.setLineDash([])

    // Draw lane borders (bright for visibility)
    ctx.strokeStyle = '#64748b'
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.moveTo(0, laneStartY - laneWidth / 2)
    ctx.lineTo(CANVAS_WIDTH, laneEndY - laneWidth / 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(0, laneStartY + laneWidth / 2)
    ctx.lineTo(CANVAS_WIDTH, laneEndY + laneWidth / 2)
    ctx.stroke()

    // Draw distance markers along the lane
    for (let i = 1; i < 10; i++) {
      const markerX = (CANVAS_WIDTH * i) / 10
      const markerY = getLaneY(markerX)
      ctx.fillStyle = '#374151'
      ctx.fillRect(markerX - 1, markerY - laneWidth / 2, 2, laneWidth)
    }

    ctx.restore()

    // Draw allied tower (left side)
    const towerY = getLaneY(TOWER_ALLY_X)
    ctx.fillStyle = '#3b82f6' // Blue for allied tower
    ctx.font = 'bold 40px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('🏰', TOWER_ALLY_X, towerY)

    // Tower health indicator
    ctx.fillStyle = '#10b981'
    ctx.fillRect(TOWER_ALLY_X - 20, towerY - 35, 40, 5)
    ctx.strokeStyle = '#059669'
    ctx.strokeRect(TOWER_ALLY_X - 20, towerY - 35, 40, 5)

    // Draw creeps
    creepsRef.current.forEach((creep) => {
      const healthPercent = creep.currentHealth / creep.maxHealth

      // Creep body with emojis
      ctx.font = 'bold 32px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      let creepEmoji = '⚔️'
      if (creep.type === 'melee') {
        creepEmoji = '⚔️' // Épée pour mêlée
      } else if (creep.type === 'ranged') {
        creepEmoji = '🏹' // Arc pour à distance
      } else if (creep.type === 'cannon') {
        creepEmoji = '🛡️' // Bouclier pour canon (plus tanky)
      }

      ctx.fillText(creepEmoji, creep.position.x, creep.position.y)

      // Target indicator (circle around targeted creep)
      if (targetedCreepIdRef.current === creep.id) {
        ctx.strokeStyle = '#fbbf24' // Gold color for target
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.arc(creep.position.x, creep.position.y, 25, 0, Math.PI * 2)
        ctx.stroke()

        // Pulsing effect
        const pulseSize = 28 + Math.sin(now / 150) * 3
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(creep.position.x, creep.position.y, pulseSize, 0, Math.PI * 2)
        ctx.stroke()
      }

      // Health bar (positioned above emoji)
      const barWidth = 40
      const barHeight = 5
      const barX = creep.position.x - barWidth / 2
      const barY = creep.position.y - 25 // Adjusted for emoji height

      ctx.fillStyle = '#334155'
      ctx.fillRect(barX, barY, barWidth, barHeight)

      // Last hit indicator (red when low health with flash/pulse effect)
      const lastHitThreshold = CHAMPION_STATS[championType].attackDamage
      const isInLastHitZone = creep.currentHealth <= lastHitThreshold

      // Flash effect on recent attack
      const flashTime = healthBarFlashRef.current.get(creep.id)
      const timeSinceFlash = flashTime ? now - flashTime : 999999
      const isFlashing = timeSinceFlash < 200

      if (isInLastHitZone) {
        // Pulse effect in last hit zone
        const pulseIntensity = 0.7 + Math.sin(now / 200) * 0.3
        ctx.fillStyle = isFlashing ? '#fbbf24' : `rgba(239, 68, 68, ${pulseIntensity})`
      } else {
        ctx.fillStyle = isFlashing ? '#fbbf24' : '#10b981'
      }
      ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight)

      // Perfect hit zone indicator (thin line)
      if (isInLastHitZone && creep.currentHealth > 0) {
        const perfectZonePercent = (creep.currentHealth - 20) / creep.maxHealth
        if (perfectZonePercent > 0) {
          ctx.fillStyle = '#10b981'
          ctx.fillRect(barX, barY - 1, barWidth * perfectZonePercent, 1)
        }
      }

      // Gold value (positioned below emoji)
      ctx.fillStyle = '#fbbf24'
      ctx.font = 'bold 12px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(`${creep.goldValue}g`, creep.position.x, creep.position.y + 25)
    })

    // Draw enemy turret (right side, invincible)
    const enemy = enemyRef.current
    ctx.font = 'bold 40px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#dc2626' // Red for enemy
    ctx.fillText('🔴', enemy.position.x, enemy.position.y)

    // Draw player with emoji based on champion type
    const player = playerPosRef.current
    ctx.font = 'bold 36px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    const championEmoji = championType === 'melee' ? '🗡️' : '🏹'
    ctx.fillText(championEmoji, player.x, player.y)

    // Attack range indicator
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.3)'
    ctx.lineWidth = 2
    ctx.setLineDash([5, 5])
    ctx.beginPath()
    ctx.arc(player.x, player.y, CHAMPION_STATS[championType].attackRange, 0, Math.PI * 2)
    ctx.stroke()
    ctx.setLineDash([])

    // Draw combo flame effect around player
    if (stats.combo >= 3) {
      const flameIntensity = Math.min(stats.combo / 10, 1)
      const flameSize = 30 + stats.combo * 3
      const pulseSize = Math.sin(now / 100) * 5

      ctx.save()
      ctx.globalAlpha = 0.3 + flameIntensity * 0.3
      const gradient = ctx.createRadialGradient(player.x, player.y, 0, player.x, player.y, flameSize + pulseSize)
      gradient.addColorStop(0, stats.combo >= 5 ? '#f97316' : '#fbbf24')
      gradient.addColorStop(0.5, stats.combo >= 5 ? '#ea580c' : '#f59e0b')
      gradient.addColorStop(1, 'transparent')
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(player.x, player.y, flameSize + pulseSize, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }

    // Draw attack animations
    attackAnimationsRef.current.forEach((attack) => {
      ctx.save()
      ctx.globalAlpha = attack.life / attack.maxLife

      if (attack.type === 'melee') {
        // Melee: Draw slash effect arc
        const progress = 1 - attack.life / attack.maxLife
        const angle = Math.PI * progress
        const radius = 40

        ctx.strokeStyle = championType === 'melee' ? '#8b5cf6' : '#06b6d4'
        ctx.lineWidth = 6
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.arc(
          attack.toX,
          attack.toY,
          radius,
          -Math.PI / 4 + angle - Math.PI / 2,
          -Math.PI / 4 + angle + Math.PI / 2
        )
        ctx.stroke()

        // Add glow effect
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 2
        ctx.stroke()
      } else {
        // Ranged: Draw projectile
        const gradient = ctx.createRadialGradient(
          attack.currentX,
          attack.currentY,
          0,
          attack.currentX,
          attack.currentY,
          8
        )
        gradient.addColorStop(0, '#06b6d4')
        gradient.addColorStop(0.5, '#0891b2')
        gradient.addColorStop(1, 'transparent')

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(attack.currentX, attack.currentY, 8, 0, Math.PI * 2)
        ctx.fill()

        // Add trail
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.5)'
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(attack.fromX, attack.fromY)
        ctx.lineTo(attack.currentX, attack.currentY)
        ctx.stroke()
      }

      ctx.restore()
    })

    // Draw particles
    particlesRef.current.forEach((particle) => {
      ctx.save()
      ctx.globalAlpha = particle.life / particle.maxLife
      ctx.fillStyle = particle.color
      ctx.beginPath()
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    })

    // Draw floating texts
    floatingTextsRef.current.forEach((text) => {
      ctx.save()
      ctx.globalAlpha = text.life / text.maxLife
      ctx.fillStyle = text.color
      ctx.font = 'bold 16px Arial'
      ctx.textAlign = 'center'
      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 3
      ctx.strokeText(text.text, text.x, text.y)
      ctx.fillText(text.text, text.x, text.y)
      ctx.restore()
    })

    animationFrameRef.current = requestAnimationFrame(gameLoop)
  }, [duration, championType, getDifficultyConfig, spawnWave, updateCreeps, updateEnemy, updateParticles, updateFloatingTexts, updateAttackAnimations, spawnParticles, spawnFloatingText, stats.combo])

  const startGame = useCallback(async () => {
    // Enter fullscreen and lock landscape
    if (!document.fullscreenElement) {
      const container = containerRef.current
      if (container) {
        try {
          await container.requestFullscreen()
          setIsFullscreen(true)
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
    playerPosRef.current = { x: PLAYER_START_X, y: getLaneY(PLAYER_START_X) }
    creepsRef.current = []
    joystickPosRef.current = { x: 0, y: 0 }
    joystickActiveRef.current = false
    creepIdRef.current = 0
    waveCountRef.current = 0
    targetedCreepIdRef.current = null // Reset targeted creep
    enemyRef.current = {
      position: { x: ENEMY_START_X, y: getLaneY(ENEMY_START_X) },
      targetCreepId: null,
      attackCooldown: 0,
      lastAttackTime: 0,
    }
    setStats({
      gold: 0,
      cs: 0,
      missedCs: 0,
      accuracy: 100,
      perfectHits: 0,
      combo: 0,
      maxCombo: 0,
      timeElapsed: 0,
    })
    gameStartTimeRef.current = Date.now()
    totalPausedTimeRef.current = 0
    lastWaveSpawnRef.current = Date.now()
    lastAttackTimeRef.current = 0

    // Reset animations
    particlesRef.current = []
    floatingTextsRef.current = []
    healthBarFlashRef.current.clear()
    attackAnimationsRef.current = []

    // Spawn first wave immediately
    setTimeout(() => {
      spawnWave()
    }, 500)
  }, [spawnWave])

  const pauseGame = useCallback(() => {
    setGameState('paused')
    pausedTimeRef.current = Date.now()
  }, [])

  const resumeGame = useCallback(() => {
    totalPausedTimeRef.current += Date.now() - pausedTimeRef.current
    setGameState('playing')
  }, [])

  const stopGame = useCallback(() => {
    setGameState('gameOver')
    gameStateRef.current = 'gameOver'
  }, [])

  const exitFullscreen = useCallback(async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen()
      if (screen.orientation && 'unlock' in screen.orientation) {
        ;(screen.orientation as any).unlock()
      }
      setIsFullscreen(false)
    }
  }, [])

  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      try {
        const container = containerRef.current
        if (container) {
          await container.requestFullscreen()
          setIsFullscreen(true)
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
        exercise_type: 'last_hit_trainer' as any,
        score: stats.gold,
        max_score: 10000,
        duration: Math.round(stats.timeElapsed),
        metadata: {
          gold: stats.gold,
          cs: stats.cs,
          missedCs: stats.missedCs,
          accuracy: stats.accuracy,
          perfectHits: stats.perfectHits,
          maxCombo: stats.maxCombo,
          championType,
          difficulty,
        },
      } as any)
    }
  }, [gameState, stats, championType, difficulty, onComplete])

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

    const deltaX = clientX - centerX
    const deltaY = clientY - centerY
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    const maxDistance = rect.width / 2

    if (distance > 0) {
      const normalizedX = deltaX / distance
      const normalizedY = deltaY / distance
      const clampedDistance = Math.min(distance, maxDistance)
      const intensity = clampedDistance / maxDistance

      joystickPosRef.current = {
        x: normalizedX * intensity,
        y: normalizedY * intensity,
      }
    }
  }, [])

  const handleJoystickEnd = useCallback(() => {
    joystickActiveRef.current = false
    joystickPosRef.current = { x: 0, y: 0 }
  }, [])

  // Canvas click handler for targeting creeps
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (gameStateRef.current !== 'playing') return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = CANVAS_WIDTH / rect.width
    const scaleY = CANVAS_HEIGHT / rect.height

    let clientX, clientY
    if ('touches' in e) {
      if (e.touches.length === 0) return
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }

    const canvasX = (clientX - rect.left) * scaleX
    const canvasY = (clientY - rect.top) * scaleY

    // Check if clicked on a creep (using emoji size ~32px = ~16px radius)
    const clickRadius = 20
    const clickedCreep = creepsRef.current.find((creep) => {
      const distance = Math.sqrt(
        Math.pow(creep.position.x - canvasX, 2) + Math.pow(creep.position.y - canvasY, 2)
      )
      return distance <= clickRadius
    })

    if (clickedCreep) {
      targetedCreepIdRef.current = clickedCreep.id
    }
  }, [])

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
            onClick={handleCanvasClick}
            onTouchStart={handleCanvasClick}
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
                🎯 Last Hit Trainer
              </h2>
              <p className="text-gray-400">Entraînez votre farming MOBA</p>
            </div>

            {/* Champion Type Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-300">Type de Champion</label>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setChampionType('melee')}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                    championType === 'melee'
                      ? 'bg-purple-600 text-white scale-105'
                      : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
                  }`}
                >
                  ⚔️ Corps-à-corps
                  <div className="text-xs opacity-70 mt-1">Courte portée, dégâts élevés</div>
                </button>
                <button
                  onClick={() => setChampionType('ranged')}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                    championType === 'ranged'
                      ? 'bg-cyan-600 text-white scale-105'
                      : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
                  }`}
                >
                  🏹 Distance
                  <div className="text-xs opacity-70 mt-1">Longue portée, dégâts moyens</div>
                </button>
              </div>
            </div>

            {/* Difficulty Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-300">Difficulté</label>
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
                <li>• Joystick (gauche): Déplacer le champion</li>
                <li>• Bouton (droite): Attaque basique</li>
                <li>• Last hit les creeps pour gagner de l'or</li>
                <li>• L'ennemi (rouge) attaque aussi les creeps</li>
                <li>• Barre rouge = zone de last hit parfait</li>
                <li>• Maximisez votre CS et combo!</li>
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
                <span className="font-semibold">⏱️ {Math.floor(stats.timeElapsed)}s</span>
                <span className="text-amber-400">💰 {stats.gold}g</span>
                <span className="text-emerald-400">⚔️ CS: {stats.cs}</span>
                <span className="text-gray-400">❌ {stats.missedCs}</span>
                <span className="text-blue-400">🎯 {stats.accuracy.toFixed(1)}%</span>
                <span className="text-purple-400">🔥 Combo: {stats.combo}</span>
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

          {/* Joystick - Bottom Left */}
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

          {/* Attack Button - Bottom Right */}
          <div className="fixed right-4 bottom-4 pointer-events-auto">
            <button
              onTouchStart={playerAttack}
              onClick={playerAttack}
              className="w-24 h-24 bg-red-600 hover:bg-red-700 rounded-full shadow-lg font-bold text-3xl transition-all active:scale-95"
              style={{ touchAction: 'none' }}
            >
              ⚔️
            </button>
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

            <h2 className="text-3xl font-bold text-emerald-400">🎯 Farming Terminé!</h2>

            <div className="grid grid-cols-2 gap-4 text-left">
              <div className={`${themeClasses.bgSecondary} p-3 rounded-lg`}>
                <div className="text-gray-400 text-sm">Or Total</div>
                <div className="text-2xl font-bold text-amber-400">{stats.gold}g</div>
              </div>
              <div className={`${themeClasses.bgSecondary} p-3 rounded-lg`}>
                <div className="text-gray-400 text-sm">CS Total</div>
                <div className="text-2xl font-bold text-emerald-400">{stats.cs}</div>
              </div>
              <div className={`${themeClasses.bgSecondary} p-3 rounded-lg`}>
                <div className="text-gray-400 text-sm">Précision</div>
                <div className="text-2xl font-bold text-blue-400">{stats.accuracy.toFixed(1)}%</div>
              </div>
              <div className={`${themeClasses.bgSecondary} p-3 rounded-lg`}>
                <div className="text-gray-400 text-sm">Max Combo</div>
                <div className="text-2xl font-bold text-purple-400">{stats.maxCombo}</div>
              </div>
              <div className={`${themeClasses.bgSecondary} p-3 rounded-lg`}>
                <div className="text-gray-400 text-sm">Last Hits Parfaits</div>
                <div className="text-2xl font-bold text-pink-400">{stats.perfectHits}</div>
              </div>
              <div className={`${themeClasses.bgSecondary} p-3 rounded-lg`}>
                <div className="text-gray-400 text-sm">CS Ratés</div>
                <div className="text-2xl font-bold text-red-400">{stats.missedCs}</div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setGameState('idle')
                  if (isFullscreen) {
                    exitFullscreen()
                  }
                }}
                className={`flex-1 px-6 py-2.5 ${themeClasses.bgPrimary} ${themeClasses.bgPrimaryHover} ${themeClasses.borderRadius} font-semibold transition-all`}
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
