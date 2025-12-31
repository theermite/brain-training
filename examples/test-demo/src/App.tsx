import { useState } from 'react'
import {
  MemoryCardGame,
  PatternRecall,
  SequenceMemory,
  ImagePairs,
  BreathingExercise,
  ReactionTime,
  PeripheralVision,
  MultiTask,
  DodgeMaster,
  SkillshotTrainer,
  LastHitTrainer,
  MemoryExerciseType,
  DifficultyLevel,
} from '@theermite/brain-training'

type ExerciseType =
  | 'memory-cards'
  | 'pattern-recall'
  | 'sequence-memory'
  | 'image-pairs'
  | 'breathing'
  | 'reaction-time'
  | 'peripheral-vision'
  | 'multi-task'
  | 'dodge-master'
  | 'skillshot-trainer'
  | 'last-hit-trainer'

type Category = 'Mémoire' | 'Performance' | 'MOBA Mobile' | 'Bien-être'

interface Exercise {
  id: ExerciseType
  label: string
  emoji: string
  description: string
  category: Category
}

const exercises: Exercise[] = [
  {
    id: 'memory-cards',
    label: 'Memory Cards',
    emoji: '🃏',
    description: 'Match pairs of cards to train your memory',
    category: 'Mémoire',
  },
  {
    id: 'pattern-recall',
    label: 'Pattern Recall',
    emoji: '🎨',
    description: 'Memorize and reproduce color patterns',
    category: 'Mémoire',
  },
  {
    id: 'sequence-memory',
    label: 'Sequence Memory',
    emoji: '🔵',
    description: 'Remember increasingly long sequences',
    category: 'Mémoire',
  },
  {
    id: 'image-pairs',
    label: 'Image Pairs',
    emoji: '🎮',
    description: 'Match contextual image pairs',
    category: 'Mémoire',
  },
  {
    id: 'reaction-time',
    label: 'Reaction Time',
    emoji: '⚡',
    description: 'Test and improve your reflexes',
    category: 'Performance',
  },
  {
    id: 'peripheral-vision',
    label: 'Peripheral Vision',
    emoji: '👁️',
    description: 'Train your peripheral awareness',
    category: 'Performance',
  },
  {
    id: 'multi-task',
    label: 'Multi-Task',
    emoji: '🧠',
    description: 'Handle multiple tasks simultaneously',
    category: 'Performance',
  },
  {
    id: 'dodge-master',
    label: 'Dodge Master',
    emoji: '🎯',
    description: 'MOBA-style dodge training with joystick',
    category: 'MOBA Mobile',
  },
  {
    id: 'skillshot-trainer',
    label: 'Skillshot Trainer',
    emoji: '🎪',
    description: 'Practice precision skillshots',
    category: 'MOBA Mobile',
  },
  {
    id: 'last-hit-trainer',
    label: 'Last Hit Trainer',
    emoji: '💰',
    description: 'Master farming and last hitting',
    category: 'MOBA Mobile',
  },
  {
    id: 'breathing',
    label: 'Breathing Exercise',
    emoji: '🌬️',
    description: 'Guided breathing for relaxation',
    category: 'Bien-être',
  },
]

const categoryColors: Record<Category, { bg: string; text: string; border: string }> = {
  'Mémoire': {
    bg: 'from-emerald-500 to-teal-600',
    text: 'text-emerald-400',
    border: 'border-emerald-500/50',
  },
  'Performance': {
    bg: 'from-amber-500 to-orange-600',
    text: 'text-amber-400',
    border: 'border-amber-500/50',
  },
  'MOBA Mobile': {
    bg: 'from-purple-500 to-pink-600',
    text: 'text-purple-400',
    border: 'border-purple-500/50',
  },
  'Bien-être': {
    bg: 'from-teal-500 to-cyan-600',
    text: 'text-teal-400',
    border: 'border-teal-500/50',
  },
}

function App() {
  const [activeExercise, setActiveExercise] = useState<ExerciseType | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)

  const categories: Category[] = ['Mémoire', 'Performance', 'MOBA Mobile', 'Bien-être']

  // If an exercise is active, render only the exercise with a back button
  if (activeExercise) {
    const exercise = exercises.find((ex) => ex.id === activeExercise)
    if (!exercise) return null

    return (
      <div className="min-h-screen bg-slate-950 text-white">
        {/* Header with back button */}
        <div className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
            <button
              onClick={() => {
                setActiveExercise(null)
                setSelectedCategory(null)
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg font-semibold transition-all flex items-center gap-2"
            >
              ← Back to Library
            </button>
            <div className="flex items-center gap-3">
              <span className="text-4xl">{exercise.emoji}</span>
              <div>
                <h1 className="text-xl font-bold">{exercise.label}</h1>
                <p className="text-sm text-gray-400">{exercise.description}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Exercise content */}
        <div className="max-w-7xl mx-auto p-6">
          <div className="bg-slate-900 rounded-2xl p-6" style={{ minHeight: '600px' }}>
            {activeExercise === 'memory-cards' && (
              <MemoryCardGame
                config={{
                  exercise_type: MemoryExerciseType.MEMORY_CARDS,
                  difficulty: DifficultyLevel.MEDIUM,
                  grid_rows: 4,
                  grid_cols: 4,
                  time_weight: 0.3,
                  accuracy_weight: 0.7,
                }}
                theme="ermite"
                onComplete={(session) => console.log('MemoryCardGame completed:', session)}
                onProgress={(progress) => console.log('MemoryCardGame progress:', progress)}
              />
            )}

            {activeExercise === 'pattern-recall' && (
              <PatternRecall
                config={{
                  exercise_type: MemoryExerciseType.PATTERN_RECALL,
                  difficulty: DifficultyLevel.MEDIUM,
                  grid_rows: 4,
                  grid_cols: 4,
                  preview_duration_ms: 4000,
                  time_limit_ms: 60000,
                  time_weight: 0.3,
                  accuracy_weight: 0.7,
                }}
                theme="ermite"
                onComplete={(session) => console.log('PatternRecall completed:', session)}
                onProgress={(progress) => console.log('PatternRecall progress:', progress)}
              />
            )}

            {activeExercise === 'sequence-memory' && (
              <SequenceMemory
                config={{
                  exercise_type: MemoryExerciseType.SEQUENCE_MEMORY,
                  difficulty: DifficultyLevel.MEDIUM,
                  grid_rows: 4,
                  grid_cols: 4,
                  initial_sequence_length: 4,
                  max_sequence_length: 30,
                  time_weight: 0.3,
                  accuracy_weight: 0.7,
                }}
                theme="ermite"
                onComplete={(session) => console.log('SequenceMemory completed:', session)}
                onProgress={(progress) => console.log('SequenceMemory progress:', progress)}
              />
            )}

            {activeExercise === 'image-pairs' && (
              <ImagePairs
                config={{
                  exercise_type: MemoryExerciseType.IMAGE_PAIRS,
                  difficulty: DifficultyLevel.MEDIUM,
                  grid_rows: 4,
                  grid_cols: 4,
                  time_weight: 0.3,
                  accuracy_weight: 0.7,
                }}
                theme="ermite"
                onComplete={(session) => console.log('ImagePairs completed:', session)}
                onProgress={(progress) => console.log('ImagePairs progress:', progress)}
              />
            )}

            {activeExercise === 'reaction-time' && (
              <ReactionTime
                totalAttempts={5}
                theme="ermite"
                onComplete={(session) => console.log('ReactionTime completed:', session)}
                onProgress={(progress) => console.log('ReactionTime progress:', progress)}
              />
            )}

            {activeExercise === 'peripheral-vision' && (
              <PeripheralVision
                duration={60}
                targetSize={40}
                targetDuration={1500}
                spawnInterval={1000}
                theme="ermite"
                onComplete={(session) => console.log('PeripheralVision completed:', session)}
                onProgress={(progress) => console.log('PeripheralVision progress:', progress)}
              />
            )}

            {activeExercise === 'multi-task' && (
              <MultiTask
                duration={90}
                difficulty="medium"
                theme="ermite"
                onComplete={(session) => console.log('MultiTask completed:', session)}
                onProgress={(progress) => console.log('MultiTask progress:', progress)}
              />
            )}

            {activeExercise === 'dodge-master' && (
              <DodgeMaster
                duration={60}
                theme="ermite"
                onComplete={(session) => console.log('DodgeMaster completed:', session)}
              />
            )}

            {activeExercise === 'skillshot-trainer' && (
              <SkillshotTrainer
                duration={60}
                theme="ermite"
                onComplete={(session) => console.log('SkillshotTrainer completed:', session)}
              />
            )}

            {activeExercise === 'last-hit-trainer' && (
              <LastHitTrainer
                duration={120}
                theme="ermite"
                onComplete={(session) => console.log('LastHitTrainer completed:', session)}
              />
            )}

            {activeExercise === 'breathing' && (
              <BreathingExercise
                theme="ermite"
                enableSound={true}
                onComplete={(session) => console.log('BreathingExercise completed:', session)}
                onProgress={(progress) => console.log('BreathingExercise progress:', progress)}
              />
            )}
          </div>
        </div>
      </div>
    )
  }

  // Selection view - show categories or exercises
  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
            🧠 Tools Library
          </h1>
          <p className="text-xl text-gray-400 mb-2">The Ermite's Collection Tools</p>
          <p className="text-sm text-gray-500">
            @theermite/brain-training v1.0.0 • 11 cognitive exercises • 4 categories
          </p>
        </div>

        {/* Category selection or back button */}
        {selectedCategory && (
          <button
            onClick={() => setSelectedCategory(null)}
            className="mb-6 px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-semibold transition-all inline-flex items-center gap-2"
          >
            ← Back to Categories
          </button>
        )}

        {/* Categories Grid */}
        {!selectedCategory && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category) => {
              const count = exercises.filter((ex) => ex.category === category).length
              const colors = categoryColors[category]

              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`
                    group relative overflow-hidden rounded-2xl p-8
                    bg-slate-900 border-2 ${colors.border}
                    hover:scale-105 hover:shadow-2xl hover:shadow-${colors.text}/20
                    transition-all duration-300
                  `}
                >
                  {/* Gradient overlay */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${colors.bg} opacity-0 group-hover:opacity-10 transition-opacity`}
                  />

                  {/* Content */}
                  <div className="relative z-10">
                    <h2 className={`text-3xl font-bold mb-3 ${colors.text}`}>{category}</h2>
                    <p className="text-gray-400 text-sm mb-4">
                      {count} exercise{count > 1 ? 's' : ''} available
                    </p>
                    <div className="flex gap-2 flex-wrap justify-center">
                      {exercises
                        .filter((ex) => ex.category === category)
                        .map((ex) => (
                          <span key={ex.id} className="text-3xl" title={ex.label}>
                            {ex.emoji}
                          </span>
                        ))}
                    </div>
                  </div>

                  {/* Arrow indicator */}
                  <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className={`text-2xl ${colors.text}`}>→</span>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* Exercises Grid for selected category */}
        {selectedCategory && (
          <div>
            <h2
              className={`text-4xl font-bold mb-8 ${categoryColors[selectedCategory].text} flex items-center gap-3`}
            >
              {selectedCategory}
              <span className="text-sm text-gray-500 font-normal">
                ({exercises.filter((ex) => ex.category === selectedCategory).length} exercises)
              </span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {exercises
                .filter((ex) => ex.category === selectedCategory)
                .map((exercise) => {
                  const colors = categoryColors[exercise.category]

                  return (
                    <button
                      key={exercise.id}
                      onClick={() => setActiveExercise(exercise.id)}
                      className={`
                        group relative overflow-hidden rounded-2xl p-8
                        bg-slate-900 border-2 ${colors.border}
                        hover:scale-105 hover:shadow-2xl hover:shadow-${colors.text}/20
                        transition-all duration-300 text-left
                      `}
                    >
                      {/* Gradient overlay */}
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${colors.bg} opacity-0 group-hover:opacity-10 transition-opacity`}
                      />

                      {/* Content */}
                      <div className="relative z-10">
                        <div className="text-6xl mb-4">{exercise.emoji}</div>
                        <h3 className="text-2xl font-bold mb-2 text-white group-hover:text-white">
                          {exercise.label}
                        </h3>
                        <p className="text-gray-400 text-sm mb-4">{exercise.description}</p>
                      </div>

                      {/* Play button */}
                      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div
                          className={`w-12 h-12 rounded-full bg-gradient-to-br ${colors.bg} flex items-center justify-center`}
                        >
                          <span className="text-white text-xl">▶</span>
                        </div>
                      </div>
                    </button>
                  )
                })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-16 text-gray-500 text-sm space-y-1">
          <p className="font-semibold text-gray-400">Package: @theermite/brain-training v1.0.0</p>
          <p>11 exercises • 4 categories • Mobile-first • Type-safe</p>
          <p>© Jay "The Ermite" Goncalves</p>
        </div>
      </div>
    </div>
  )
}

export default App
