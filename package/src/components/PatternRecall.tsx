/**
 * Pattern Recall - Memorize and reproduce color patterns
 * Mobile-first design with touch optimization and theme support
 * @author Jay "The Ermite" Goncalves
 * @copyright Jay The Ermite
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { PatternCell, MemoryExerciseProps } from '../types'
import { resolveTheme, getThemeClasses, mergeThemeClasses } from '../themes'

enum GamePhase {
  READY = 'ready',
  MEMORIZE = 'memorize',
  RECALL = 'recall',
  FEEDBACK = 'feedback',
  COMPLETED = 'completed',
}

export function PatternRecall({
  config,
  className,
  theme,
  onComplete,
  onProgress: _onProgress,
}: MemoryExerciseProps) {
  const rows = config.grid_rows || 4
  const cols = config.grid_cols || 4
  const colors = config.colors || [
    '#3B82F6',
    '#EF4444',
    '#10B981',
    '#F59E0B',
    '#8B5CF6',
    '#EC4899',
  ]
  const previewDuration = config.preview_duration_ms || 3000
  const timeLimit = config.time_limit_ms || 60000

  const [phase, setPhase] = useState<GamePhase>(GamePhase.READY)
  const [pattern, setPattern] = useState<PatternCell[]>([])
  const [userPattern, setUserPattern] = useState<PatternCell[]>([])
  const [countdown, setCountdown] = useState<number>(3)
  const [timeRemaining, setTimeRemaining] = useState<number>(timeLimit)
  const [startTime, setStartTime] = useState<number>(0)
  const [totalMoves, setTotalMoves] = useState<number>(0)
  const [correctMoves, setCorrectMoves] = useState<number>(0)
  const [_incorrectMoves, _setIncorrectMoves] = useState<number>(0)
  const [selectedCell, setSelectedCell] = useState<{row: number, col: number} | null>(null)

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const phaseTimerRef = useRef<NodeJS.Timeout | null>(null)

  const currentTheme = resolveTheme(theme)
  const themeClasses = getThemeClasses(currentTheme)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current)
    }
  }, [])

  const generatePattern = useCallback(() => {
    const cells: PatternCell[] = []
    const totalCells = rows * cols
    const numColoredCells = Math.floor(totalCells * 0.4) // 40% of cells

    // Create all cells
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        cells.push({
          row,
          col,
          color: '',
          isActive: false,
          isRevealed: false,
        })
      }
    }

    // Randomly select cells to color
    const indices = Array.from({ length: totalCells }, (_, i) => i)
    const shuffled = indices.sort(() => Math.random() - 0.5)
    const selectedIndices = shuffled.slice(0, numColoredCells)

    selectedIndices.forEach((index) => {
      const randomColor = colors[Math.floor(Math.random() * colors.length)]
      cells[index].color = randomColor
      cells[index].isActive = true
    })

    return cells
  }, [rows, cols, colors])

  const startGame = () => {
    const newPattern = generatePattern()
    setPattern(newPattern)
    setUserPattern(
      newPattern.map((cell) => ({
        ...cell,
        isActive: false,
        isRevealed: false,
      }))
    )
    setPhase(GamePhase.READY)
    setCountdown(3)

    // Countdown
    let count = 3
    const countdownInterval = setInterval(() => {
      count--
      setCountdown(count)
      if (count === 0) {
        clearInterval(countdownInterval)
        setPhase(GamePhase.MEMORIZE)
        startMemorizePhase()
      }
    }, 1000)
  }

  const startMemorizePhase = () => {
    setStartTime(Date.now())

    // Show pattern for preview duration
    setPattern((prev) =>
      prev.map((cell) => ({ ...cell, isRevealed: true }))
    )

    phaseTimerRef.current = setTimeout(() => {
      setPhase(GamePhase.RECALL)
      startRecallPhase()
    }, previewDuration)
  }

  const startRecallPhase = () => {
    // Hide pattern
    setPattern((prev) =>
      prev.map((cell) => ({ ...cell, isRevealed: false }))
    )

    setTimeRemaining(timeLimit)

    // Start countdown timer
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = prev - 100
        if (newTime <= 0) {
          submitPattern()
          return 0
        }
        return newTime
      })
    }, 100)
  }

  const handleCellSelect = (row: number, col: number) => {
    if (phase !== GamePhase.RECALL) return
    setSelectedCell({ row, col })
  }

  const handleColorSelect = (color: string) => {
    if (phase !== GamePhase.RECALL || !selectedCell) return

    setUserPattern((prev) =>
      prev.map((cell) =>
        cell.row === selectedCell.row && cell.col === selectedCell.col
          ? {
              ...cell,
              color,
              isActive: true,
              isRevealed: true,
            }
          : cell
      )
    )

    // Clear selection after assigning color
    setSelectedCell(null)
  }

  const handleCellClear = (row: number, col: number) => {
    if (phase !== GamePhase.RECALL) return

    setUserPattern((prev) =>
      prev.map((cell) =>
        cell.row === row && cell.col === col
          ? { ...cell, color: '', isActive: false, isRevealed: false }
          : cell
      )
    )
    if (selectedCell && selectedCell.row === row && selectedCell.col === col) {
      setSelectedCell(null)
    }
  }

  const submitPattern = () => {
    if (timerRef.current) clearInterval(timerRef.current)

    // Compare patterns
    let correct = 0
    let incorrect = 0

    pattern.forEach((patternCell, index) => {
      const userCell = userPattern[index]
      if (patternCell.isActive === userCell.isActive) {
        if (!patternCell.isActive || patternCell.color === userCell.color) {
          correct++
        } else {
          incorrect++
        }
      } else {
        incorrect++
      }
    })

    setCorrectMoves(correct)
    _setIncorrectMoves(incorrect)
    setTotalMoves(rows * cols)

    // Show feedback
    setPhase(GamePhase.FEEDBACK)
    setPattern((prev) => prev.map((cell) => ({ ...cell, isRevealed: true })))

    setTimeout(() => {
      const elapsed = Date.now() - startTime
      setPhase(GamePhase.COMPLETED)

      if (onComplete) {
        onComplete({
          exercise_type: config.exercise_type,
          difficulty: config.difficulty,
          config,
          is_completed: true,
          total_moves: rows * cols,
          correct_moves: correct,
          incorrect_moves: incorrect,
          time_elapsed_ms: elapsed,
          accuracy: (correct / (rows * cols)) * 100,
        })
      }
    }, 3000)
  }

  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const accuracy =
    totalMoves > 0 ? ((correctMoves / totalMoves) * 100).toFixed(0) : '0'

  return (
    <div className={mergeThemeClasses(`h-full flex flex-col ${themeClasses.bgMain} ${themeClasses.textMain}`, className)}>
      {/* Header */}
      <div className={`bg-gradient-to-r ${themeClasses.bgPrimary} ${themeClasses.borderRadius} p-3 sm:p-4 mb-4 ${themeClasses.shadow}`}>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-xs sm:text-sm opacity-80">Phase</div>
            <div className="text-sm sm:text-base font-bold capitalize">
              {phase === GamePhase.READY
                ? 'Prêt...'
                : phase === GamePhase.MEMORIZE
                ? 'Mémorise !'
                : phase === GamePhase.RECALL
                ? 'Reproduis !'
                : phase === GamePhase.FEEDBACK
                ? 'Résultat'
                : 'Terminé'}
            </div>
          </div>
          <div>
            <div className="text-xs sm:text-sm opacity-80">
              {phase === GamePhase.RECALL ? 'Temps restant' : 'Précision'}
            </div>
            <div className="text-base sm:text-xl font-bold">
              {phase === GamePhase.RECALL
                ? formatTime(timeRemaining)
                : `${accuracy}%`}
            </div>
          </div>
          <div>
            <div className="text-xs sm:text-sm opacity-80">Cellules</div>
            <div className="text-base sm:text-xl font-bold">
              {correctMoves}/{rows * cols}
            </div>
          </div>
        </div>
      </div>

      {/* Game Grid */}
      <div className="flex-1 flex items-center justify-center p-2 sm:p-4">
        {phase === GamePhase.READY && (
          <div className="text-center">
            <div className={`text-8xl sm:text-9xl font-bold ${themeClasses.bgAccent.replace('bg-', 'text-')} mb-4`}>
              {countdown}
            </div>
            <p className={`text-lg sm:text-xl ${themeClasses.textSecondary}`}>
              Prépare-toi à mémoriser le motif...
            </p>
          </div>
        )}

        {phase !== GamePhase.READY && (
          <div
            className="grid gap-2 sm:gap-3"
            style={{
              gridTemplateColumns: `repeat(${cols}, 1fr)`,
              gridTemplateRows: `repeat(${rows}, 1fr)`,
              maxWidth: '100%',
              aspectRatio: `${cols} / ${rows}`,
            }}
          >
            {(phase === GamePhase.MEMORIZE || phase === GamePhase.FEEDBACK
              ? pattern
              : userPattern
            ).map((cell, index) => (
              <div
                key={index}
                className={`
                  relative aspect-square ${themeClasses.borderRadius} ${themeClasses.shadow}
                  transition-all duration-300
                  ${
                    phase === GamePhase.RECALL
                      ? 'cursor-pointer hover:scale-105 active:scale-95'
                      : ''
                  }
                  touch-manipulation select-none
                `}
                style={{
                  backgroundColor:
                    cell.isRevealed && cell.isActive
                      ? cell.color
                      : '#e5e7eb',
                  minWidth: '40px',
                  minHeight: '40px',
                  border:
                    phase === GamePhase.FEEDBACK
                      ? pattern[index].isActive ===
                          userPattern[index].isActive &&
                        (!pattern[index].isActive ||
                          pattern[index].color === userPattern[index].color)
                        ? '3px solid #10B981'
                        : '3px solid #EF4444'
                      : phase === GamePhase.RECALL &&
                        selectedCell &&
                        selectedCell.row === cell.row &&
                        selectedCell.col === cell.col
                      ? '4px solid #3B82F6'
                      : 'none',
                }}
                onClick={() => {
                  if (phase === GamePhase.RECALL) {
                    handleCellSelect(cell.row, cell.col)
                  }
                }}
              >
                {phase === GamePhase.RECALL && cell.isActive && (
                  <button
                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCellClear(cell.row, cell.col)
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Color palette for recall phase */}
      {phase === GamePhase.RECALL && (
        <div className={`mt-4 p-4 ${themeClasses.bgSecondary} ${themeClasses.borderRadius} ${themeClasses.shadow}`}>
          <p className={`text-sm text-center mb-2 ${themeClasses.textSecondary}`}>
            {selectedCell
              ? 'Choisis la couleur pour la cellule sélectionnée :'
              : 'Touche une cellule puis choisis sa couleur :'}
          </p>
          <div className="flex justify-center gap-2 flex-wrap">
            {colors.map((color) => (
              <button
                key={color}
                className={`w-12 h-12 sm:w-14 sm:h-14 ${themeClasses.borderRadius} ${themeClasses.shadow} hover:scale-110 active:scale-95 transition-transform touch-manipulation ${!selectedCell ? 'opacity-50 cursor-not-allowed' : ''}`}
                style={{ backgroundColor: color }}
                disabled={!selectedCell}
                onClick={() => handleColorSelect(color)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex gap-2">
        {phase === GamePhase.RECALL && (
          <button
            onClick={submitPattern}
            className={`flex-1 px-6 py-3 ${themeClasses.bgPrimary} ${themeClasses.bgPrimaryHover} ${themeClasses.borderRadius} font-semibold transition-all`}
          >
            ✓ Valider
          </button>
        )}
        {phase === GamePhase.COMPLETED && (
          <button
            onClick={startGame}
            className={`flex-1 px-6 py-3 ${themeClasses.bgCard} ${themeClasses.bgCardHover} ${themeClasses.borderRadius} ${themeClasses.border} border transition-all`}
          >
            🔄 Recommencer
          </button>
        )}
        {phase === GamePhase.READY && (
          <button
            onClick={startGame}
            className={`flex-1 px-6 py-3 ${themeClasses.bgPrimary} ${themeClasses.bgPrimaryHover} ${themeClasses.borderRadius} font-semibold transition-all`}
          >
            ▶ Démarrer
          </button>
        )}
      </div>
    </div>
  )
}
