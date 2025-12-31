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

export interface LastHitTrainerProps extends ExerciseBaseProps {
  duration?: number
}

// MOBA-style landscape format (16:9 ratio)
const CANVAS_WIDTH = 1280
const CANVAS_HEIGHT = 720
const PLAYER_RADIUS = 25
const CREEP_RADIUS = 20
const ENEMY_RADIUS = 25

// Lane setup (horizontal lane)
const LANE_Y = CANVAS_HEIGHT / 2
const LANE_START_X = 100
const PLAYER_START_X = 200
const ENEMY_START_X = CANVAS_WIDTH - 200

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
  const playerPosRef = useRef<Position>({ x: PLAYER_START_X, y: LANE_Y })
  const joystickActiveRef = useRef(false)
  const joystickPosRef = useRef<Position>({ x: 0, y: 0 })
  const lastAttackTimeRef = useRef(0)

  // Game objects refs
  const creepsRef = useRef<Creep[]>([])
  const enemyRef = useRef<Enemy>({
    position: { x: ENEMY_START_X, y: LANE_Y },
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

  useEffect(() => {
    gameStateRef.current = gameState
  }, [gameState])

  useEffect(() => {
    difficultyRef.current = difficulty
  }, [difficulty])

  const getDifficultyConfig = useCallback(() => {
    const currentDifficulty = difficultyRef.current

    switch (currentDifficulty) {
      case 'easy':
        return {
          enemyAttackSpeed: 0.5, // attacks per second
          waveInterval: 8000, // ms between waves
          creepsPerWave: 3,
          creepHealthDecayRate: 0.3, // health loss per second
        }
      case 'medium':
        return {
          enemyAttackSpeed: 0.8,
          waveInterval: 6000,
          creepsPerWave: 4,
          creepHealthDecayRate: 0.5,
        }
      case 'hard':
        return {
          enemyAttackSpeed: 1.2,
          waveInterval: 5000,
          creepsPerWave: 5,
          creepHealthDecayRate: 0.8,
        }
      case 'survival':
        return {
          enemyAttackSpeed: 1.5,
          waveInterval: 4000,
          creepsPerWave: 6,
          creepHealthDecayRate: 1.0,
        }
      default:
        return {
          enemyAttackSpeed: 0.8,
          waveInterval: 6000,
          creepsPerWave: 4,
          creepHealthDecayRate: 0.5,
        }
    }
  }, [])

  const spawnWave = useCallback(() => {
    const config = getDifficultyConfig()
    const newCreeps: Creep[] = []

    for (let i = 0; i < config.creepsPerWave; i++) {
      const rand = Math.random()
      let type: CreepType
      if (rand < CREEP_STATS.melee.spawnChance) type = 'melee'
      else if (rand < CREEP_STATS.melee.spawnChance + CREEP_STATS.ranged.spawnChance)
        type = 'ranged'
      else type = 'cannon'

      const stats = CREEP_STATS[type]
      const spacing = 60
      const startX = LANE_START_X - 100

      newCreeps.push({
        id: creepIdRef.current++,
        type,
        position: { x: startX - i * spacing, y: LANE_Y },
        maxHealth: stats.maxHealth,
        currentHealth: stats.maxHealth,
        goldValue: stats.goldValue,
        moving: true,
        targetX: LANE_START_X + 200 + Math.random() * 200,
      })
    }

    creepsRef.current = [...creepsRef.current, ...newCreeps]
  }, [getDifficultyConfig])

  const updateCreeps = useCallback(
    (deltaTime: number) => {
      const config = getDifficultyConfig()

      creepsRef.current = creepsRef.current.filter((creep) => {
        // Move creep towards target
        if (creep.moving && creep.position.x < creep.targetX) {
          creep.position.x += 1 * deltaTime * 60
          if (creep.position.x >= creep.targetX) {
            creep.moving = false
          }
        }

        // Health decay (tower/minion damage simulation)
        creep.currentHealth -= config.creepHealthDecayRate * deltaTime

        // Remove dead creeps
        if (creep.currentHealth <= 0) {
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
    [getDifficultyConfig]
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

    if (timeSinceLastAttack < 1 / championStats.attackSpeed) {
      return // On cooldown
    }

    const playerPos = playerPosRef.current

    // Find creeps in range
    const creepsInRange = creepsRef.current.filter((creep) => {
      const distance = Math.sqrt(
        Math.pow(creep.position.x - playerPos.x, 2) + Math.pow(creep.position.y - playerPos.y, 2)
      )
      return distance <= championStats.attackRange
    })

    if (creepsInRange.length > 0) {
      // Attack closest creep
      const closest = creepsInRange.sort(
        (a, b) =>
          Math.abs(a.position.x - playerPos.x) - Math.abs(b.position.x - playerPos.x)
      )[0]

      closest.currentHealth -= championStats.attackDamage

      // Check for last hit
      if (closest.currentHealth <= 0) {
        const isPerfect = closest.currentHealth > -20 // Perfect timing window
        setStats((prev) => ({
          ...prev,
          gold: prev.gold + closest.goldValue,
          cs: prev.cs + 1,
          combo: prev.combo + 1,
          maxCombo: Math.max(prev.maxCombo, prev.combo + 1),
          perfectHits: prev.perfectHits + (isPerfect ? 1 : 0),
          accuracy: ((prev.cs + 1) / (prev.cs + 1 + prev.missedCs)) * 100,
        }))
      }

      lastAttackTimeRef.current = now
    }
  }, [championType])

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

    // Update player position
    if (joystickActiveRef.current) {
      const championStats = CHAMPION_STATS[championType]
      const moveSpeed = championStats.movementSpeed
      playerPosRef.current.x += joystickPosRef.current.x * moveSpeed
      playerPosRef.current.y += joystickPosRef.current.y * moveSpeed

      // Keep in bounds
      playerPosRef.current.x = Math.max(50, Math.min(CANVAS_WIDTH - 50, playerPosRef.current.x))
      playerPosRef.current.y = Math.max(50, Math.min(CANVAS_HEIGHT - 50, playerPosRef.current.y))
    }

    // Clear canvas
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // Draw lane
    ctx.fillStyle = '#1e293b'
    ctx.fillRect(0, LANE_Y - 80, CANVAS_WIDTH, 160)
    ctx.strokeStyle = '#475569'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(0, LANE_Y - 80)
    ctx.lineTo(CANVAS_WIDTH, LANE_Y - 80)
    ctx.moveTo(0, LANE_Y + 80)
    ctx.lineTo(CANVAS_WIDTH, LANE_Y + 80)
    ctx.stroke()

    // Draw creeps
    creepsRef.current.forEach((creep) => {
      const healthPercent = creep.currentHealth / creep.maxHealth

      // Creep body
      ctx.fillStyle =
        creep.type === 'cannon' ? '#a855f7' : creep.type === 'ranged' ? '#3b82f6' : '#10b981'
      ctx.beginPath()
      ctx.arc(creep.position.x, creep.position.y, CREEP_RADIUS, 0, Math.PI * 2)
      ctx.fill()

      // Health bar
      const barWidth = 40
      const barHeight = 5
      const barX = creep.position.x - barWidth / 2
      const barY = creep.position.y - CREEP_RADIUS - 10

      ctx.fillStyle = '#334155'
      ctx.fillRect(barX, barY, barWidth, barHeight)

      // Last hit indicator (red when low health)
      const lastHitThreshold = CHAMPION_STATS[championType].attackDamage
      if (creep.currentHealth <= lastHitThreshold) {
        ctx.fillStyle = '#ef4444'
      } else {
        ctx.fillStyle = '#10b981'
      }
      ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight)

      // Gold value
      ctx.fillStyle = '#fbbf24'
      ctx.font = 'bold 12px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(`${creep.goldValue}g`, creep.position.x, creep.position.y + CREEP_RADIUS + 15)
    })

    // Draw enemy (invincible)
    const enemy = enemyRef.current
    ctx.fillStyle = '#dc2626'
    ctx.beginPath()
    ctx.arc(enemy.position.x, enemy.position.y, ENEMY_RADIUS, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#fca5a5'
    ctx.lineWidth = 3
    ctx.stroke()

    // Draw player
    const player = playerPosRef.current
    ctx.fillStyle = championType === 'melee' ? '#8b5cf6' : '#06b6d4'
    ctx.beginPath()
    ctx.arc(player.x, player.y, PLAYER_RADIUS, 0, Math.PI * 2)
    ctx.fill()

    // Attack range indicator
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.3)'
    ctx.lineWidth = 2
    ctx.setLineDash([5, 5])
    ctx.beginPath()
    ctx.arc(player.x, player.y, CHAMPION_STATS[championType].attackRange, 0, Math.PI * 2)
    ctx.stroke()
    ctx.setLineDash([])

    animationFrameRef.current = requestAnimationFrame(gameLoop)
  }, [duration, championType, getDifficultyConfig, spawnWave, updateCreeps, updateEnemy])

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
    playerPosRef.current = { x: PLAYER_START_X, y: LANE_Y }
    creepsRef.current = []
    joystickPosRef.current = { x: 0, y: 0 }
    joystickActiveRef.current = false
    creepIdRef.current = 0
    enemyRef.current = {
      position: { x: ENEMY_START_X, y: LANE_Y },
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
