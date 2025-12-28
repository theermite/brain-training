/**
 * TypeScript types for Brain Training exercises
 * @author Jay "The Ermite" Goncalves
 * @copyright Jay The Ermite
 */

// ============================================================================
// MEMORY EXERCISES TYPES
// ============================================================================

export enum MemoryExerciseType {
  MEMORY_CARDS = 'memory_cards',
  PATTERN_RECALL = 'pattern_recall',
  SEQUENCE_MEMORY = 'sequence_memory',
  IMAGE_PAIRS = 'image_pairs',
}

export enum DifficultyLevel {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
  EXPERT = 'expert',
}

export interface MemoryExerciseConfig {
  exercise_type: MemoryExerciseType
  difficulty: DifficultyLevel
  grid_rows?: number
  grid_cols?: number
  initial_sequence_length?: number
  max_sequence_length?: number
  preview_duration_ms?: number
  time_limit_ms?: number
  colors?: string[]
  images?: string[]
  time_weight: number
  accuracy_weight: number
}

export interface MemoryExerciseSession {
  id?: number
  exercise_id?: number
  exercise_type: MemoryExerciseType
  difficulty: DifficultyLevel
  config: MemoryExerciseConfig
  is_completed: boolean
  total_moves: number
  correct_moves: number
  incorrect_moves: number
  time_elapsed_ms: number
  max_sequence_reached?: number
  final_score?: number
  score_breakdown?: ScoreBreakdown
  accuracy: number
  created_at?: string
  updated_at?: string
  completed_at?: string
}

export interface ScoreBreakdown {
  accuracy: number
  accuracy_score: number
  time_score: number
  time_elapsed_ms: number
  total_moves: number
  correct_moves: number
  incorrect_moves: number
  max_sequence?: number
  difficulty_multiplier: number
  final_score: number
}

export interface MemoryExerciseSessionCreate {
  exercise_id: number
  config: MemoryExerciseConfig
}

export interface MemoryExerciseSessionUpdate {
  completed_at?: string
  total_moves?: number
  correct_moves?: number
  incorrect_moves?: number
  time_elapsed_ms?: number
  max_sequence_reached?: number
  final_score?: number
  score_breakdown?: ScoreBreakdown
}

export interface MemoryExerciseStats {
  exercise_id: number
  exercise_name: string
  exercise_type: MemoryExerciseType
  total_attempts: number
  completed_attempts: number
  best_score?: number
  best_accuracy?: number
  fastest_time_ms?: number
  longest_sequence?: number
  avg_score?: number
  avg_accuracy?: number
  avg_time_ms?: number
  improvement_rate?: number
  streak_days: number
  recent_scores: number[]
  recent_accuracies: number[]
}

export interface MemoryExerciseLeaderboard {
  rank: number
  user_id: number
  username: string
  final_score: number
  accuracy: number
  time_elapsed_ms: number
  difficulty: DifficultyLevel
  completed_at: string
  is_current_user: boolean
}

export interface ConfigPreset {
  name: string
  difficulty: DifficultyLevel
  config: MemoryExerciseConfig
}

// Card data for memory card game
export interface Card {
  id: number
  value: string // emoji, image URL, or color
  isFlipped: boolean
  isMatched: boolean
  position: { row: number; col: number }
}

// Cell data for pattern recall
export interface PatternCell {
  row: number
  col: number
  color: string
  isActive: boolean
  isRevealed: boolean
}

// Sequence step for sequence memory
export interface SequenceStep {
  position: { row: number; col: number }
  order: number
}

// ============================================================================
// BREATHING EXERCISES TYPES
// ============================================================================

export type BreathPhase = 'inhale' | 'hold' | 'exhale' | 'rest'

export interface BreathingPattern {
  name: string
  description: string
  inhale: number // seconds
  hold: number // seconds
  exhale: number // seconds
  rest: number // seconds
  frequency: number // Hz for sound
}

export interface BreathingSession {
  id?: number
  pattern_name: string
  cycles_completed: number
  duration_ms: number
  started_at?: string
  completed_at?: string
}

// ============================================================================
// THEME SYSTEM TYPES
// ============================================================================

export type ThemeVariant = 'default' | 'ermite' | 'shinkofa' | 'esport'

export interface ThemeColors {
  primary: string
  primaryHover: string
  accent: string
  accentHover: string
  background: string
  backgroundSecondary: string
  card: string
  cardHover: string
  text: string
  textSecondary: string
  border: string
  success: string
  warning: string
  error: string
}

export interface Theme {
  variant: ThemeVariant
  colors: ThemeColors
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  fontFamily?: string
  shadows: 'none' | 'sm' | 'md' | 'lg' | 'xl'
}

// ============================================================================
// API CLIENT TYPES
// ============================================================================

export interface APIConfig {
  baseUrl: string
  authToken?: string
  onError?: (error: Error) => void
}

export interface APIResponse<T> {
  data: T
  success: boolean
  error?: string
}

// ============================================================================
// COMMON EXERCISE PROPS
// ============================================================================

export interface ExerciseBaseProps {
  className?: string
  theme?: ThemeVariant | Theme
  onComplete?: (session: MemoryExerciseSession | BreathingSession) => void
  onProgress?: (progress: Partial<MemoryExerciseSession | BreathingSession>) => void
  apiConfig?: APIConfig
}

export interface MemoryExerciseProps extends ExerciseBaseProps {
  config: MemoryExerciseConfig
  exerciseId?: number
  autoSave?: boolean
  autoSaveInterval?: number // milliseconds
}

export interface BreathingExerciseProps extends ExerciseBaseProps {
  patterns?: BreathingPattern[]
  defaultPatternIndex?: number
  enableSound?: boolean
}
