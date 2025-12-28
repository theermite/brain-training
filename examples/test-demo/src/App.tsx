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

const exercises = [
  { id: 'memory-cards', label: '🃏 Memory Cards', category: 'Mémoire' },
  { id: 'pattern-recall', label: '🎨 Pattern Recall', category: 'Mémoire' },
  { id: 'sequence-memory', label: '🔵 Sequence Memory', category: 'Mémoire' },
  { id: 'image-pairs', label: '🎮 Image Pairs', category: 'Mémoire' },
  { id: 'reaction-time', label: '⚡ Reaction Time', category: 'Performance' },
  { id: 'peripheral-vision', label: '👁️ Peripheral Vision', category: 'Performance' },
  { id: 'multi-task', label: '🧠 Multi-Task', category: 'Performance' },
  { id: 'breathing', label: '🌬️ Breathing', category: 'Bien-être' },
] as const

function App() {
  const [activeExercise, setActiveExercise] = useState<ExerciseType>('memory-cards')

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-emerald-400 to-amber-500 bg-clip-text text-transparent">
            🧠 Brain Training Complete Demo
          </h1>
          <p className="text-gray-400 text-lg">
            @theermite/brain-training v1.0.0 - 8 exercices cognitifs
          </p>
        </div>

        {/* Category Tabs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Mémoire */}
          <div className="bg-slate-900 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-emerald-400 mb-3">💾 Mémoire</h3>
            <div className="space-y-2">
              {exercises
                .filter((ex) => ex.category === 'Mémoire')
                .map((ex) => (
                  <button
                    key={ex.id}
                    onClick={() => setActiveExercise(ex.id as ExerciseType)}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-all ${
                      activeExercise === ex.id
                        ? 'bg-emerald-600 text-white font-semibold'
                        : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
                    }`}
                  >
                    {ex.label}
                  </button>
                ))}
            </div>
          </div>

          {/* Performance */}
          <div className="bg-slate-900 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-amber-400 mb-3">⚡ Performance</h3>
            <div className="space-y-2">
              {exercises
                .filter((ex) => ex.category === 'Performance')
                .map((ex) => (
                  <button
                    key={ex.id}
                    onClick={() => setActiveExercise(ex.id as ExerciseType)}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-all ${
                      activeExercise === ex.id
                        ? 'bg-amber-600 text-white font-semibold'
                        : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
                    }`}
                  >
                    {ex.label}
                  </button>
                ))}
            </div>
          </div>

          {/* Bien-être */}
          <div className="bg-slate-900 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-teal-400 mb-3">🌿 Bien-être</h3>
            <div className="space-y-2">
              {exercises
                .filter((ex) => ex.category === 'Bien-être')
                .map((ex) => (
                  <button
                    key={ex.id}
                    onClick={() => setActiveExercise(ex.id as ExerciseType)}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-all ${
                      activeExercise === ex.id
                        ? 'bg-teal-600 text-white font-semibold'
                        : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
                    }`}
                  >
                    {ex.label}
                  </button>
                ))}
            </div>
          </div>
        </div>

        {/* Exercise Container */}
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

          {activeExercise === 'breathing' && (
            <BreathingExercise
              theme="ermite"
              enableSound={true}
              onComplete={(session) => console.log('BreathingExercise completed:', session)}
              onProgress={(progress) => console.log('BreathingExercise progress:', progress)}
            />
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm space-y-1">
          <p className="font-semibold text-gray-400">
            Package: @theermite/brain-training v1.0.0
          </p>
          <p>8 exercices - 3 thèmes - Mobile-first - Type-safe</p>
          <p>© Jay "The Ermite" Goncalves</p>
        </div>
      </div>
    </div>
  )
}

export default App
