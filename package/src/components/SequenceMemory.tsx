/**
 * Sequence Memory - Remember and repeat sequences (Simon-style)
 * Mobile-first design with touch optimization and theme support
 * @author Jay "The Ermite" Goncalves
 * @copyright Jay The Ermite
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { MemoryExerciseProps } from '../types'
import { resolveTheme, getThemeClasses, mergeThemeClasses } from '../themes'

enum GamePhase {
  READY = 'ready',
  SHOWING = 'showing',
  WAITING = 'waiting',
  FAILED = 'failed',
  COMPLETED = 'completed',
}

interface Cell {
  row: number
  col: number
  id: number
  isActive: boolean
}

export function SequenceMemory({
  config,
  className,
  theme,
  onComplete,
  onProgress,
}: MemoryExerciseProps) {
  const rows = config.grid_rows || 3
  const cols = config.grid_cols || 3
  const initialLength = config.initial_sequence_length || 3
  const maxLength = config.max_sequence_length || 20
  const stepDuration = config.preview_duration_ms || 1000

  const [phase, setPhase] = useState<GamePhase>(GamePhase.READY)
  const [cells, setCells] = useState<Cell[]>([])
  const [sequence, setSequence] = useState<number[]>([])
  const [userSequence, setUserSequence] = useState<number[]>([])
  const [currentLevel, setCurrentLevel] = useState<number>(initialLength)
  const [maxReached, setMaxReached] = useState<number>(initialLength)
  const [activeCell, setActiveCell] = useState<number | null>(null)
  const [startTime, setStartTime] = useState<number>(0)
  const [totalAttempts, setTotalAttempts] = useState<number>(0)
  const [correctAttempts, setCorrectAttempts] = useState<number>(0)
  const [lives, setLives] = useState<number>(3)

  const showTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const currentTheme = resolveTheme(theme)
  const themeClasses = getThemeClasses(currentTheme)

  useEffect(() => {
    initializeCells()
    return () => {
      if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current)
    }
  }, [rows, cols])

  const initializeCells = () => {
    const newCells: Cell[] = []
    let id = 0
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        newCells.push({ row, col, id: id++, isActive: false })
      }
    }
    setCells(newCells)
  }

  const startGame = () => {
    setPhase(GamePhase.READY)
    setSequence([])
    setUserSequence([])
    setCurrentLevel(initialLength)
    setMaxReached(initialLength)
    setTotalAttempts(0)
    setCorrectAttempts(0)
    setLives(3)
    setStartTime(Date.now())

    setTimeout(() => {
      generateSequence(initialLength)
    }, 1000)
  }

  const generateSequence = useCallback(
    (length: number) => {
      const totalCells = rows * cols
      const newSequence: number[] = []

      for (let i = 0; i < length; i++) {
        newSequence.push(Math.floor(Math.random() * totalCells))
      }

      setSequence(newSequence)
      setUserSequence([])
      setPhase(GamePhase.SHOWING)
      showSequence(newSequence)
    },
    [rows, cols]
  )

  const showSequence = (seq: number[]) => {
    let index = 0

    const showNext = () => {
      if (index >= seq.length) {
        setActiveCell(null)
        setPhase(GamePhase.WAITING)
        return
      }

      setActiveCell(seq[index])

      showTimeoutRef.current = setTimeout(() => {
        setActiveCell(null)
        setTimeout(() => {
          index++
          showNext()
        }, 200)
      }, stepDuration)
    }

    showNext()
  }

  const handleCellClick = (cellId: number) => {
    if (phase !== GamePhase.WAITING) return

    const newUserSequence = [...userSequence, cellId]
    setUserSequence(newUserSequence)
    setTotalAttempts((prev) => prev + 1)

    // Flash the cell
    setActiveCell(cellId)
    setTimeout(() => setActiveCell(null), 200)

    // Check if correct
    const currentIndex = newUserSequence.length - 1
    if (sequence[currentIndex] !== cellId) {
      // Wrong!
      handleWrong()
      return
    }

    // Correct so far
    setCorrectAttempts((prev) => prev + 1)

    // Check if sequence complete
    if (newUserSequence.length === sequence.length) {
      handleCorrect()
    }
  }

  const handleCorrect = () => {
    const nextLevel = currentLevel + 1

    if (nextLevel > maxLength) {
      // Game completed!
      completeGame(true)
      return
    }

    setCurrentLevel(nextLevel)
    setMaxReached((prev) => Math.max(prev, nextLevel))

    // Report progress
    if (onProgress) {
      onProgress({
        exercise_type: config.exercise_type,
        difficulty: config.difficulty,
        config,
        is_completed: false,
        total_moves: totalAttempts,
        correct_moves: correctAttempts,
        incorrect_moves: totalAttempts - correctAttempts,
        time_elapsed_ms: Date.now() - startTime,
        max_sequence_reached: nextLevel,
        accuracy: totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 100,
      })
    }

    setTimeout(() => {
      generateSequence(nextLevel)
    }, 1000)
  }

  const handleWrong = () => {
    const newLives = lives - 1
    setLives(newLives)

    if (newLives <= 0) {
      // Game over
      completeGame(false)
    } else {
      // Retry same sequence
      setTimeout(() => {
        setUserSequence([])
        setPhase(GamePhase.SHOWING)
        showSequence(sequence)
      }, 1500)
    }
  }

  const completeGame = (success: boolean) => {
    setPhase(success ? GamePhase.COMPLETED : GamePhase.FAILED)

    const elapsed = Date.now() - startTime

    if (onComplete) {
      onComplete({
        exercise_type: config.exercise_type,
        difficulty: config.difficulty,
        config,
        is_completed: true,
        total_moves: totalAttempts,
        correct_moves: correctAttempts,
        incorrect_moves: totalAttempts - correctAttempts,
        time_elapsed_ms: elapsed,
        max_sequence_reached: maxReached,
        accuracy: totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 100,
      })
    }
  }

  const getProgressPercentage = () => {
    return ((maxReached - initialLength) / (maxLength - initialLength)) * 100
  }

  return (
    <div className={mergeThemeClasses(`h-full flex flex-col ${themeClasses.bgMain} ${themeClasses.textMain}`, className)}>
      {/* Header Stats */}
      <div className={`bg-gradient-to-r ${themeClasses.bgPrimary} ${themeClasses.borderRadius} p-3 sm:p-4 mb-4 ${themeClasses.shadow}`}>
        <div className="grid grid-cols-4 gap-2 text-center">
          <div>
            <div className="text-xs sm:text-sm opacity-80">Niveau</div>
            <div className="text-base sm:text-xl font-bold">{currentLevel}</div>
          </div>
          <div>
            <div className="text-xs sm:text-sm opacity-80">Record</div>
            <div className="text-base sm:text-xl font-bold">{maxReached}</div>
          </div>
          <div>
            <div className="text-xs sm:text-sm opacity-80">Vies</div>
            <div className="text-base sm:text-xl font-bold flex justify-center gap-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <span key={i}>{i < lives ? '❤️' : '🖤'}</span>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs sm:text-sm opacity-80">Précision</div>
            <div className="text-base sm:text-xl font-bold">
              {totalAttempts > 0
                ? Math.round((correctAttempts / totalAttempts) * 100)
                : 100}
              %
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-2 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white transition-all duration-500"
            style={{ width: `${getProgressPercentage()}%` }}
          />
        </div>
      </div>

      {/* Phase indicator */}
      <div className="text-center mb-4">
        <div className={`text-lg sm:text-xl font-semibold ${themeClasses.textMain}`}>
          {phase === GamePhase.READY && 'Prêt à commencer...'}
          {phase === GamePhase.SHOWING && '👀 Mémorise la séquence'}
          {phase === GamePhase.WAITING && '🎯 À ton tour !'}
          {phase === GamePhase.FAILED && '❌ Partie terminée'}
          {phase === GamePhase.COMPLETED && '🏆 Bravo, niveau max !'}
        </div>
        {phase === GamePhase.WAITING && (
          <div className={`text-sm ${themeClasses.textSecondary} mt-1`}>
            {userSequence.length} / {sequence.length}
          </div>
        )}
      </div>

      {/* Game Grid */}
      <div className="flex-1 flex items-center justify-center p-2 sm:p-4">
        <div
          className="grid gap-3 sm:gap-4"
          style={{
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gridTemplateRows: `repeat(${rows}, 1fr)`,
            maxWidth: '100%',
            aspectRatio: `${cols} / ${rows}`,
          }}
        >
          {cells.map((cell) => (
            <button
              key={cell.id}
              onClick={() => handleCellClick(cell.id)}
              disabled={phase !== GamePhase.WAITING}
              className={`
                relative aspect-square ${themeClasses.borderRadius}
                transition-all duration-200
                ${
                  activeCell === cell.id
                    ? 'bg-white scale-110 shadow-[0_0_30px_rgba(255,255,255,0.8)] animate-pulse ring-4 ring-white'
                    : `bg-gradient-to-br ${themeClasses.bgAccent} ${themeClasses.shadow}`
                }
                ${
                  phase === GamePhase.WAITING
                    ? 'cursor-pointer hover:scale-105 active:scale-95'
                    : 'cursor-not-allowed'
                }
                touch-manipulation select-none
              `}
              style={{
                minWidth: '60px',
                minHeight: '60px',
              }}
            >
              {/* Cell number (for debug) */}
              <div className="absolute inset-0 flex items-center justify-center text-white/20 text-xs font-mono">
                {cell.id + 1}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Sequence display (for showing phase) */}
      {phase === GamePhase.SHOWING && (
        <div className="text-center py-2">
          <div className="flex justify-center gap-1">
            {sequence.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all ${
                  index <= sequence.indexOf(activeCell || -1)
                    ? themeClasses.bgAccent.replace('bg-', 'bg-opacity-100 bg-')
                    : `${themeClasses.bgCard} opacity-50`
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-4">
        {phase === GamePhase.READY && (
          <button
            onClick={startGame}
            className={`w-full px-6 py-3 ${themeClasses.bgPrimary} ${themeClasses.bgPrimaryHover} ${themeClasses.borderRadius} font-semibold transition-all`}
          >
            ▶ Démarrer
          </button>
        )}
        {(phase === GamePhase.FAILED || phase === GamePhase.COMPLETED) && (
          <div className="space-y-2">
            <div className={`text-center p-4 ${themeClasses.bgSecondary} ${themeClasses.borderRadius}`}>
              <div className="text-2xl mb-2">
                {phase === GamePhase.COMPLETED ? '🎉' : '😔'}
              </div>
              <p className="text-lg font-semibold mb-2">
                Record atteint : {maxReached}
              </p>
              <p className={`text-sm ${themeClasses.textSecondary}`}>
                Précision :{' '}
                {totalAttempts > 0
                  ? Math.round((correctAttempts / totalAttempts) * 100)
                  : 100}
                %
              </p>
            </div>
            <button
              onClick={startGame}
              className={`w-full px-6 py-3 ${themeClasses.bgCard} ${themeClasses.bgCardHover} ${themeClasses.borderRadius} ${themeClasses.border} border transition-all`}
            >
              🔄 Recommencer
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
