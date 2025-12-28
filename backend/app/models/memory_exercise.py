"""
Memory Exercise models - Visual memory exercise sessions and results
@author Jay "The Ermite" Goncalves
@copyright Jay The Ermite
"""

from enum import Enum as PyEnum
from sqlalchemy import Column, String, Integer, Float, Boolean, JSON, DateTime
from datetime import datetime
from .base import BaseModel


class MemoryExerciseType(str, PyEnum):
    """Types of visual memory exercises"""
    MEMORY_CARDS = "memory_cards"
    PATTERN_RECALL = "pattern_recall"
    SEQUENCE_MEMORY = "sequence_memory"
    IMAGE_PAIRS = "image_pairs"


class DifficultyLevel(str, PyEnum):
    """Difficulty levels"""
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"
    EXPERT = "expert"


class MemoryExerciseSession(BaseModel):
    """
    Memory exercise play session - tracks a single playthrough
    Stores sessions for any user (user_id is flexible, managed by parent application)
    """

    __tablename__ = "memory_exercise_sessions"

    # User reference (managed by parent application)
    user_id = Column(Integer, nullable=False, index=True)

    # Optional: exercise_id if parent app manages exercises
    exercise_id = Column(Integer, nullable=True, index=True)

    # Exercise configuration
    exercise_type = Column(String(50), nullable=False, index=True)
    difficulty = Column(String(20), nullable=False, index=True)
    config = Column(JSON, nullable=False)  # Full MemoryExerciseConfig as JSON

    # Session status
    is_completed = Column(Boolean, default=False, index=True)
    completed_at = Column(DateTime, nullable=True)

    # Performance metrics
    total_moves = Column(Integer, default=0)
    correct_moves = Column(Integer, default=0)
    incorrect_moves = Column(Integer, default=0)
    time_elapsed_ms = Column(Integer, default=0)

    # Sequence-specific (for sequence memory)
    max_sequence_reached = Column(Integer, nullable=True)

    # Final score and breakdown
    final_score = Column(Float, nullable=True, index=True)
    score_breakdown = Column(JSON, nullable=True)  # Detailed scoring info

    def __repr__(self) -> str:
        return f"<MemoryExerciseSession(id={self.id}, user_id={self.user_id}, type={self.exercise_type}, score={self.final_score})>"

    def get_accuracy(self) -> float:
        """Calculate accuracy percentage"""
        if self.total_moves == 0:
            return 0.0
        return (self.correct_moves / self.total_moves) * 100

    def calculate_score(self) -> float:
        """
        Calculate final score based on performance metrics and config weights

        Returns:
            float: Final score (0-100)
        """
        if not self.is_completed or self.total_moves == 0:
            return 0.0

        config = self.config
        time_weight = config.get("time_weight", 0.5)
        accuracy_weight = config.get("accuracy_weight", 0.5)

        # Calculate accuracy (0-100)
        accuracy_score = self.get_accuracy()

        # Calculate time score (faster = better)
        time_limit = config.get("time_limit_ms", 60000)  # Default 60s
        if self.time_elapsed_ms > 0 and time_limit > 0:
            # Inverse proportion: less time = higher score
            time_ratio = min(1.0, self.time_elapsed_ms / time_limit)
            time_score = (1.0 - time_ratio) * 100
        else:
            time_score = 0.0

        # Weighted base score
        base_score = (accuracy_score * accuracy_weight) + (time_score * time_weight)

        # Sequence bonus for Sequence Memory
        sequence_bonus = 0.0
        if self.exercise_type == MemoryExerciseType.SEQUENCE_MEMORY.value and self.max_sequence_reached:
            sequence_bonus = min(20, self.max_sequence_reached * 2)

        # Difficulty multiplier
        difficulty_multipliers = {
            DifficultyLevel.EASY.value: 1.0,
            DifficultyLevel.MEDIUM.value: 1.2,
            DifficultyLevel.HARD.value: 1.5,
            DifficultyLevel.EXPERT.value: 2.0,
        }
        multiplier = difficulty_multipliers.get(self.difficulty, 1.0)

        # Final score
        final = (base_score + sequence_bonus) * multiplier

        return min(100.0, final)  # Cap at 100

    def generate_score_breakdown(self) -> dict:
        """Generate detailed score breakdown"""
        accuracy = self.get_accuracy()

        # Calculate time score
        time_limit = self.config.get("time_limit_ms", 60000)
        time_ratio = min(1.0, self.time_elapsed_ms / time_limit) if time_limit > 0 else 0
        time_score = (1.0 - time_ratio) * 100

        # Difficulty multiplier
        difficulty_multipliers = {
            DifficultyLevel.EASY.value: 1.0,
            DifficultyLevel.MEDIUM.value: 1.2,
            DifficultyLevel.HARD.value: 1.5,
            DifficultyLevel.EXPERT.value: 2.0,
        }
        multiplier = difficulty_multipliers.get(self.difficulty, 1.0)

        return {
            "accuracy": accuracy,
            "accuracy_score": accuracy * self.config.get("accuracy_weight", 0.5),
            "time_score": time_score * self.config.get("time_weight", 0.5),
            "time_elapsed_ms": self.time_elapsed_ms,
            "total_moves": self.total_moves,
            "correct_moves": self.correct_moves,
            "incorrect_moves": self.incorrect_moves,
            "max_sequence": self.max_sequence_reached,
            "difficulty_multiplier": multiplier,
            "final_score": self.final_score or 0.0,
        }
