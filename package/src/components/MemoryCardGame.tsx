/**
 * Memory Card Game - Match pairs of cards
 * Mobile-first design with touch optimization and theme support
 * @author Jay "The Ermite" Goncalves
 * @copyright Jay The Ermite
 */

import { useState, useEffect, useRef } from 'react'
import { Card as CardType, MemoryExerciseProps } from '../types'
import { resolveTheme, getThemeClasses, mergeThemeClasses } from '../themes'

interface GameStats {
  total_moves: number
  correct_moves: number
  incorrect_moves: number
  time_elapsed_ms: number
  completed: boolean
}

// Emoji sets for cards
const EMOJI_SETS = {
  gaming: ['🎮', '🕹️', '👾', '🎯', '🏆', '⚔️', '🛡️', '💎', '🔥', '⚡', '🌟', '💫', '🎪', '🎨', '🎭', '🎬', '🎤', '🎧', '🎸', '🥁'],
  animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆'],
  food: ['🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🥑', '🍆', '🥔', '🥕', '🌽'],
}

export function MemoryCardGame({
  config,
  className,
  theme,
  onComplete,
  onProgress,
}: MemoryExerciseProps) {
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [cards, setCards] = useState<CardType[]>([])
  const [flippedCards, setFlippedCards] = useState<number[]>([])
  const [matchedPairs, setMatchedPairs] = useState<number>(0)
  const [moves, setMoves] = useState<number>(0)
  const [correctMoves, setCorrectMoves] = useState<number>(0)
  const [incorrectMoves, setIncorrectMoves] = useState<number>(0)
  const [startTime, setStartTime] = useState<number>(0)
  const [timeElapsed, setTimeElapsed] = useState<number>(0)
  const [gameStarted, setGameStarted] = useState<boolean>(false)
  const [gameCompleted, setGameCompleted] = useState<boolean>(false)
  const [canFlip, setCanFlip] = useState<boolean>(true)

  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const getDifficultyGrid = (): { rows: number; cols: number } => {
    switch (difficulty) {
      case 'easy':
        return { rows: 2, cols: 3 }
      case 'medium':
        return { rows: 4, cols: 4 }
      case 'hard':
        return { rows: 4, cols: 5 }
    }
  }

  const { rows, cols } = getDifficultyGrid()
  const totalPairs = (rows * cols) / 2

  // Resolve theme
  const currentTheme = resolveTheme(theme)
  const themeClasses = getThemeClasses(currentTheme)

  // Initialize game
  useEffect(() => {
    initializeGame()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [difficulty])

  // Timer
  useEffect(() => {
    if (gameStarted && !gameCompleted) {
      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime
        setTimeElapsed(elapsed)

        // Auto-report progress every 5 seconds
        if (onProgress && elapsed % 5000 < 100) {
          onProgress(getStats(elapsed, false))
        }
      }, 100)

      return () => {
        if (timerRef.current) clearInterval(timerRef.current)
      }
    }
  }, [gameStarted, gameCompleted, startTime])

  // Check for game completion
  useEffect(() => {
    if (matchedPairs === totalPairs && totalPairs > 0 && gameStarted) {
      completeGame()
    }
  }, [matchedPairs, totalPairs])

  const initializeGame = () => {
    // Generate card values
    const emojiSet = EMOJI_SETS.gaming
    const numPairs = totalPairs
    const selectedEmojis = emojiSet.slice(0, numPairs)
    const cardValues = [...selectedEmojis, ...selectedEmojis]

    // Shuffle cards
    const shuffled = cardValues
      .map((value, index) => ({
        id: index,
        value,
        isFlipped: false,
        isMatched: false,
        position: {
          row: Math.floor(index / cols),
          col: index % cols,
        },
      }))
      .sort(() => Math.random() - 0.5)
      .map((card, index) => ({
        ...card,
        id: index,
        position: {
          row: Math.floor(index / cols),
          col: index % cols,
        },
      }))

    setCards(shuffled)
    setFlippedCards([])
    setMatchedPairs(0)
    setMoves(0)
    setCorrectMoves(0)
    setIncorrectMoves(0)
    setTimeElapsed(0)
    setGameStarted(false)
    setGameCompleted(false)
    setCanFlip(true)
  }

  const handleCardClick = (cardId: number) => {
    if (!canFlip) return
    if (gameCompleted) return
    if (flippedCards.includes(cardId)) return
    if (cards[cardId].isMatched) return

    // Start timer on first click
    if (!gameStarted) {
      setGameStarted(true)
      setStartTime(Date.now())
    }

    const newFlipped = [...flippedCards, cardId]
    setFlippedCards(newFlipped)

    // Flip card visually
    setCards((prev) =>
      prev.map((card) =>
        card.id === cardId ? { ...card, isFlipped: true } : card
      )
    )

    // Check for match when 2 cards are flipped
    if (newFlipped.length === 2) {
      setCanFlip(false)
      setMoves((prev) => prev + 1)

      const [firstId, secondId] = newFlipped
      const firstCard = cards[firstId]
      const secondCard = cards[secondId]

      if (firstCard.value === secondCard.value) {
        // Match found!
        setCorrectMoves((prev) => prev + 1)
        setCards((prev) =>
          prev.map((card) =>
            card.id === firstId || card.id === secondId
              ? { ...card, isMatched: true }
              : card
          )
        )
        setMatchedPairs((prev) => prev + 1)
        setFlippedCards([])
        setCanFlip(true)
      } else {
        // No match
        setIncorrectMoves((prev) => prev + 1)
        setTimeout(() => {
          setCards((prev) =>
            prev.map((card) =>
              card.id === firstId || card.id === secondId
                ? { ...card, isFlipped: false }
                : card
            )
          )
          setFlippedCards([])
          setCanFlip(true)
        }, 1000)
      }
    }
  }

  const getStats = (elapsed: number, completed: boolean): GameStats => ({
    total_moves: moves,
    correct_moves: correctMoves,
    incorrect_moves: incorrectMoves,
    time_elapsed_ms: elapsed,
    completed,
  })

  const completeGame = () => {
    if (gameCompleted) return

    const elapsed = Date.now() - startTime
    setGameCompleted(true)
    setTimeElapsed(elapsed)

    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    if (onComplete) {
      onComplete({
        exercise_type: config.exercise_type,
        difficulty: config.difficulty,
        config,
        is_completed: true,
        total_moves: moves,
        correct_moves: correctMoves,
        incorrect_moves: incorrectMoves,
        time_elapsed_ms: elapsed,
        accuracy: moves > 0 ? (correctMoves / moves) * 100 : 0,
      })
    }
  }

  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const accuracy = moves > 0 ? ((correctMoves / moves) * 100).toFixed(0) : '0'

  return (
    <div className={mergeThemeClasses(`h-full flex flex-col ${themeClasses.bgMain} ${themeClasses.textMain}`, className)}>
      {/* Difficulty Selector */}
      {!gameStarted && (
        <div className={`${themeClasses.bgSecondary} ${themeClasses.borderRadius} p-4 mb-4`}>
          <p className={`text-center mb-3 font-semibold ${themeClasses.textMain}`}>
            Choisis ton niveau de difficulté :
          </p>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setDifficulty('easy')}
              className={`
                px-4 py-3 ${themeClasses.borderRadius} font-semibold transition-all
                ${
                  difficulty === 'easy'
                    ? `${themeClasses.bgSuccess} text-white scale-105`
                    : `${themeClasses.bgCard} ${themeClasses.bgCardHover} ${themeClasses.border} border`
                }
              `}
            >
              😊 Facile
              <div className="text-xs opacity-70 mt-1">3 paires</div>
            </button>
            <button
              onClick={() => setDifficulty('medium')}
              className={`
                px-4 py-3 ${themeClasses.borderRadius} font-semibold transition-all
                ${
                  difficulty === 'medium'
                    ? `${themeClasses.bgPrimary} text-white scale-105`
                    : `${themeClasses.bgCard} ${themeClasses.bgCardHover} ${themeClasses.border} border`
                }
              `}
            >
              😎 Moyen
              <div className="text-xs opacity-70 mt-1">8 paires</div>
            </button>
            <button
              onClick={() => setDifficulty('hard')}
              className={`
                px-4 py-3 ${themeClasses.borderRadius} font-semibold transition-all
                ${
                  difficulty === 'hard'
                    ? `${themeClasses.bgError} text-white scale-105`
                    : `${themeClasses.bgCard} ${themeClasses.bgCardHover} ${themeClasses.border} border`
                }
              `}
            >
              🔥 Difficile
              <div className="text-xs opacity-70 mt-1">10 paires</div>
            </button>
          </div>
        </div>
      )}

      {/* Header Stats - Mobile optimized */}
      <div className={`bg-gradient-to-r ${themeClasses.bgPrimary} ${themeClasses.borderRadius} p-3 sm:p-4 mb-4 ${themeClasses.shadow}`}>
        <div className="grid grid-cols-4 gap-2 text-center">
          <div>
            <div className="text-xs sm:text-sm opacity-80">Temps</div>
            <div className="text-base sm:text-xl font-bold">
              {formatTime(timeElapsed)}
            </div>
          </div>
          <div>
            <div className="text-xs sm:text-sm opacity-80">Paires</div>
            <div className="text-base sm:text-xl font-bold">
              {matchedPairs}/{totalPairs}
            </div>
          </div>
          <div>
            <div className="text-xs sm:text-sm opacity-80">Coups</div>
            <div className="text-base sm:text-xl font-bold">{moves}</div>
          </div>
          <div>
            <div className="text-xs sm:text-sm opacity-80">Précision</div>
            <div className="text-base sm:text-xl font-bold">{accuracy}%</div>
          </div>
        </div>
      </div>

      {/* Game Grid - Responsive and touch-friendly */}
      <div className="flex-1 flex items-center justify-center p-2 sm:p-4">
        <div
          className="grid gap-2 sm:gap-3"
          style={{
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gridTemplateRows: `repeat(${rows}, 1fr)`,
            maxWidth: '100%',
            aspectRatio: `${cols} / ${rows}`,
          }}
        >
          {cards.map((card) => (
            <button
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              disabled={!canFlip || card.isMatched || card.isFlipped}
              className={`
                relative aspect-square ${themeClasses.borderRadius} ${themeClasses.shadow}
                transition-all duration-300 transform
                active:scale-95
                ${
                  card.isFlipped || card.isMatched
                    ? 'bg-white dark:bg-gray-100'
                    : `bg-gradient-to-br ${themeClasses.bgAccent} ${themeClasses.bgAccentHover}`
                }
                ${card.isMatched ? 'opacity-60 cursor-not-allowed' : ''}
                ${
                  !canFlip && !card.isMatched && !card.isFlipped
                    ? 'cursor-not-allowed'
                    : 'cursor-pointer'
                }
                hover:scale-105
                touch-manipulation
                select-none
              `}
              style={{
                minWidth: '50px',
                minHeight: '50px',
              }}
            >
              {/* Card back pattern */}
              {!card.isFlipped && !card.isMatched && (
                <div className="absolute inset-0 flex items-center justify-center text-white text-2xl sm:text-4xl">
                  ?
                </div>
              )}

              {/* Card front (emoji) */}
              {(card.isFlipped || card.isMatched) && (
                <div
                  className={`
                  absolute inset-0 flex items-center justify-center
                  text-3xl sm:text-5xl md:text-6xl
                  ${card.isMatched ? 'animate-pulse' : ''}
                `}
                >
                  {card.value}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Completion overlay */}
      {gameCompleted && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className={`${themeClasses.bgSecondary} ${themeClasses.borderRadius} p-6 max-w-md w-full text-center shadow-2xl animate-slide-up relative`}>
            {/* Close button */}
            <button
              onClick={() => setGameCompleted(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-colors"
              aria-label="Fermer"
            >
              ✕
            </button>

            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-2xl font-bold mb-4">Bravo !</h3>
            <div className={`space-y-2 ${themeClasses.textSecondary} mb-6`}>
              <p><strong>Temps :</strong> {formatTime(timeElapsed)}</p>
              <p><strong>Coups :</strong> {moves}</p>
              <p><strong>Précision :</strong> {accuracy}%</p>
            </div>
            <button
              onClick={initializeGame}
              className={`w-full px-6 py-3 ${themeClasses.bgPrimary} ${themeClasses.bgPrimaryHover} ${themeClasses.borderRadius} font-semibold transition-all`}
            >
              🔄 Recommencer
            </button>
          </div>
        </div>
      )}

      {/* Restart button */}
      <div className="mt-4">
        <button
          onClick={initializeGame}
          className={`w-full px-6 py-3 ${themeClasses.bgCard} ${themeClasses.bgCardHover} ${themeClasses.borderRadius} ${themeClasses.border} border transition-all`}
        >
          🔄 Recommencer
        </button>
      </div>
    </div>
  )
}
