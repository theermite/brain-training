-- Migration 001: Create memory_exercise_sessions table
-- Author: Jay "The Ermite" Goncalves
-- Copyright: Jay The Ermite

CREATE TABLE IF NOT EXISTS memory_exercise_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    exercise_id INTEGER,
    exercise_type VARCHAR(50) NOT NULL,
    difficulty VARCHAR(20) NOT NULL,
    config JSONB NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP,
    total_moves INTEGER DEFAULT 0,
    correct_moves INTEGER DEFAULT 0,
    incorrect_moves INTEGER DEFAULT 0,
    time_elapsed_ms INTEGER DEFAULT 0,
    max_sequence_reached INTEGER,
    final_score REAL,
    score_breakdown JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_memory_sessions_user_id ON memory_exercise_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_memory_sessions_exercise_id ON memory_exercise_sessions(exercise_id);
CREATE INDEX IF NOT EXISTS idx_memory_sessions_exercise_type ON memory_exercise_sessions(exercise_type);
CREATE INDEX IF NOT EXISTS idx_memory_sessions_difficulty ON memory_exercise_sessions(difficulty);
CREATE INDEX IF NOT EXISTS idx_memory_sessions_completed ON memory_exercise_sessions(is_completed);
CREATE INDEX IF NOT EXISTS idx_memory_sessions_score ON memory_exercise_sessions(final_score);
CREATE INDEX IF NOT EXISTS idx_memory_sessions_created_at ON memory_exercise_sessions(created_at);

-- Add comment
COMMENT ON TABLE memory_exercise_sessions IS 'Memory exercise play sessions for brain training';
