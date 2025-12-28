/**
 * @theermite/brain-training
 * Cognitive exercises library with memory games and breathing exercises
 * Reusable components for The Ermite platforms
 *
 * @author Jay "The Ermite" Goncalves
 * @copyright Jay The Ermite
 * @version 1.0.0
 */

// Components
export { MemoryCardGame } from './components/MemoryCardGame'
export { PatternRecall } from './components/PatternRecall'
export { SequenceMemory } from './components/SequenceMemory'
export { ImagePairs } from './components/ImagePairs'
export { BreathingExercise } from './components/BreathingExercise'

// Types
export type {
  // Memory Exercises
  MemoryExerciseType,
  DifficultyLevel,
  MemoryExerciseConfig,
  MemoryExerciseSession,
  ScoreBreakdown,
  MemoryExerciseSessionCreate,
  MemoryExerciseSessionUpdate,
  MemoryExerciseStats,
  MemoryExerciseLeaderboard,
  ConfigPreset,
  Card,
  PatternCell,
  SequenceStep,

  // Breathing Exercises
  BreathPhase,
  BreathingPattern,
  BreathingSession,

  // Theme System
  ThemeVariant,
  ThemeColors,
  Theme,

  // API Client
  APIConfig,
  APIResponse,

  // Component Props
  ExerciseBaseProps,
  MemoryExerciseProps,
  BreathingExerciseProps,
} from './types'

// Enums (re-export as values)
export { MemoryExerciseType, DifficultyLevel } from './types'

// Themes
export {
  defaultTheme,
  ermiteTheme,
  shinkofaTheme,
  esportTheme,
  themes,
  getTheme,
  resolveTheme,
  getThemeClasses,
  mergeThemeClasses,
} from './themes'

export type { Theme, ThemeVariant } from './types'

// API Client
export {
  BrainTrainingAPIClient,
  createAPIClient,
  configureDefaultClient,
  getDefaultClient,
} from './api/client'
