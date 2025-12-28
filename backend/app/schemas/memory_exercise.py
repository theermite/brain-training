"""
Memory Exercise Pydantic schemas for request/response validation
@author Jay "The Ermite" Goncalves
@copyright Jay The Ermite
"""

from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, Field
from enum import Enum


class MemoryExerciseType(str, Enum):
    """Types of visual memory exercises"""
    MEMORY_CARDS = "memory_cards"
    PATTERN_RECALL = "pattern_recall"
    SEQUENCE_MEMORY = "sequence_memory"
    IMAGE_PAIRS = "image_pairs"


class DifficultyLevel(str, Enum):
    """Difficulty levels"""
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"
    EXPERT = "expert"


class MemoryExerciseConfig(BaseModel):
    """Exercise configuration"""
    exercise_type: MemoryExerciseType
    difficulty: DifficultyLevel
    grid_rows: Optional[int] = None
    grid_cols: Optional[int] = None
    initial_sequence_length: Optional[int] = None
    max_sequence_length: Optional[int] = None
    preview_duration_ms: Optional[int] = None
    time_limit_ms: Optional[int] = None
    colors: Optional[List[str]] = None
    images: Optional[List[str]] = None
    time_weight: float = 0.5
    accuracy_weight: float = 0.5


class MemoryExerciseSessionCreate(BaseModel):
    """Create a new memory exercise session"""
    user_id: int
    exercise_id: Optional[int] = None
    config: MemoryExerciseConfig


class MemoryExerciseSessionUpdate(BaseModel):
    """Update a memory exercise session with performance data"""
    completed_at: Optional[datetime] = None
    total_moves: Optional[int] = None
    correct_moves: Optional[int] = None
    incorrect_moves: Optional[int] = None
    time_elapsed_ms: Optional[int] = None
    max_sequence_reached: Optional[int] = None
    final_score: Optional[float] = None
    score_breakdown: Optional[Dict[str, Any]] = None


class ScoreBreakdown(BaseModel):
    """Detailed score breakdown"""
    accuracy: float
    accuracy_score: float
    time_score: float
    time_elapsed_ms: int
    total_moves: int
    correct_moves: int
    incorrect_moves: int
    max_sequence: Optional[int] = None
    difficulty_multiplier: float
    final_score: float


class MemoryExerciseSessionResponse(BaseModel):
    """Memory exercise session response"""
    id: int
    user_id: int
    exercise_id: Optional[int]
    exercise_type: str
    difficulty: str
    config: Dict[str, Any]
    is_completed: bool
    total_moves: int
    correct_moves: int
    incorrect_moves: int
    time_elapsed_ms: int
    max_sequence_reached: Optional[int]
    final_score: Optional[float]
    score_breakdown: Optional[Dict[str, Any]]
    accuracy: float
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True


class MemoryExerciseStats(BaseModel):
    """User statistics for a specific exercise type"""
    exercise_type: MemoryExerciseType
    total_attempts: int
    completed_attempts: int
    best_score: Optional[float]
    best_accuracy: Optional[float]
    fastest_time_ms: Optional[int]
    longest_sequence: Optional[int]
    avg_score: Optional[float]
    avg_accuracy: Optional[float]
    avg_time_ms: Optional[int]
    improvement_rate: Optional[float]
    recent_scores: List[float]
    recent_accuracies: List[float]


class MemoryExerciseLeaderboard(BaseModel):
    """Leaderboard entry"""
    rank: int
    user_id: int
    final_score: float
    accuracy: float
    time_elapsed_ms: int
    difficulty: str
    completed_at: datetime
    is_current_user: bool


class ConfigPreset(BaseModel):
    """Configuration preset for an exercise type"""
    name: str
    difficulty: DifficultyLevel
    config: MemoryExerciseConfig
