"""
Memory Exercise Service - Business logic for memory exercises
@author Jay "The Ermite" Goncalves
@copyright Jay The Ermite
"""

from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime

from app.models.memory_exercise import MemoryExerciseSession
from app.schemas.memory_exercise import (
    MemoryExerciseSessionCreate,
    MemoryExerciseSessionUpdate,
    MemoryExerciseStats,
    MemoryExerciseLeaderboard,
)


class MemoryExerciseService:
    """Service for memory exercise operations"""

    @staticmethod
    def create_session(
        db: Session,
        user_id: int,
        data: MemoryExerciseSessionCreate
    ) -> MemoryExerciseSession:
        """Create a new memory exercise session"""
        session = MemoryExerciseSession(
            user_id=user_id,
            exercise_id=data.exercise_id,
            exercise_type=data.config.exercise_type.value,
            difficulty=data.config.difficulty.value,
            config=data.config.model_dump(),
            is_completed=False,
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        return session

    @staticmethod
    def update_session(
        db: Session,
        session_id: int,
        user_id: int,
        data: MemoryExerciseSessionUpdate
    ) -> MemoryExerciseSession:
        """Update a memory exercise session with performance data"""
        session = db.query(MemoryExerciseSession).filter(
            MemoryExerciseSession.id == session_id,
            MemoryExerciseSession.user_id == user_id
        ).first()

        if not session:
            raise ValueError("Session not found")

        # Update fields
        if data.total_moves is not None:
            session.total_moves = data.total_moves
        if data.correct_moves is not None:
            session.correct_moves = data.correct_moves
        if data.incorrect_moves is not None:
            session.incorrect_moves = data.incorrect_moves
        if data.time_elapsed_ms is not None:
            session.time_elapsed_ms = data.time_elapsed_ms
        if data.max_sequence_reached is not None:
            session.max_sequence_reached = data.max_sequence_reached

        # If completed
        if data.completed_at:
            session.is_completed = True
            session.completed_at = data.completed_at

            # Calculate score
            session.final_score = session.calculate_score()
            session.score_breakdown = session.generate_score_breakdown()

        db.commit()
        db.refresh(session)
        return session

    @staticmethod
    def get_session(
        db: Session,
        session_id: int,
        user_id: int
    ) -> Optional[MemoryExerciseSession]:
        """Get a session by ID"""
        return db.query(MemoryExerciseSession).filter(
            MemoryExerciseSession.id == session_id,
            MemoryExerciseSession.user_id == user_id
        ).first()

    @staticmethod
    def get_user_sessions(
        db: Session,
        user_id: int,
        exercise_type: Optional[str] = None,
        limit: int = 10,
        offset: int = 0
    ) -> List[MemoryExerciseSession]:
        """Get user's session history"""
        query = db.query(MemoryExerciseSession).filter(
            MemoryExerciseSession.user_id == user_id
        )

        if exercise_type:
            query = query.filter(MemoryExerciseSession.exercise_type == exercise_type)

        return query.order_by(desc(MemoryExerciseSession.created_at)).limit(limit).offset(offset).all()

    @staticmethod
    def get_leaderboard(
        db: Session,
        exercise_id: Optional[int] = None,
        exercise_type: Optional[str] = None,
        difficulty: Optional[str] = None,
        limit: int = 10
    ) -> List[MemoryExerciseLeaderboard]:
        """Get leaderboard for an exercise"""
        query = db.query(MemoryExerciseSession).filter(
            MemoryExerciseSession.is_completed == True,
            MemoryExerciseSession.final_score.isnot(None)
        )

        if exercise_id:
            query = query.filter(MemoryExerciseSession.exercise_id == exercise_id)
        if exercise_type:
            query = query.filter(MemoryExerciseSession.exercise_type == exercise_type)
        if difficulty:
            query = query.filter(MemoryExerciseSession.difficulty == difficulty)

        sessions = query.order_by(desc(MemoryExerciseSession.final_score)).limit(limit).all()

        return [
            MemoryExerciseLeaderboard(
                rank=idx + 1,
                user_id=session.user_id,
                final_score=session.final_score,
                accuracy=session.get_accuracy(),
                time_elapsed_ms=session.time_elapsed_ms,
                difficulty=session.difficulty,
                completed_at=session.completed_at,
                is_current_user=False  # Set by caller if needed
            )
            for idx, session in enumerate(sessions)
        ]

    @staticmethod
    def get_user_stats(
        db: Session,
        user_id: int
    ) -> List[MemoryExerciseStats]:
        """Get user statistics for all exercise types"""
        from app.models.memory_exercise import MemoryExerciseType

        stats_list = []

        for exercise_type in MemoryExerciseType:
            sessions = db.query(MemoryExerciseSession).filter(
                MemoryExerciseSession.user_id == user_id,
                MemoryExerciseSession.exercise_type == exercise_type.value
            ).all()

            completed_sessions = [s for s in sessions if s.is_completed]

            if not sessions:
                continue

            recent_sessions = sorted(completed_sessions, key=lambda x: x.created_at, reverse=True)[:10]

            stats = MemoryExerciseStats(
                exercise_type=exercise_type,
                total_attempts=len(sessions),
                completed_attempts=len(completed_sessions),
                best_score=max([s.final_score for s in completed_sessions if s.final_score], default=None),
                best_accuracy=max([s.get_accuracy() for s in completed_sessions], default=None),
                fastest_time_ms=min([s.time_elapsed_ms for s in completed_sessions if s.time_elapsed_ms > 0], default=None),
                longest_sequence=max([s.max_sequence_reached for s in completed_sessions if s.max_sequence_reached], default=None),
                avg_score=sum([s.final_score for s in completed_sessions if s.final_score]) / len(completed_sessions) if completed_sessions else None,
                avg_accuracy=sum([s.get_accuracy() for s in completed_sessions]) / len(completed_sessions) if completed_sessions else None,
                avg_time_ms=sum([s.time_elapsed_ms for s in completed_sessions]) / len(completed_sessions) if completed_sessions else None,
                improvement_rate=None,  # TODO: Calculate trend
                recent_scores=[s.final_score for s in recent_sessions if s.final_score],
                recent_accuracies=[s.get_accuracy() for s in recent_sessions],
            )

            stats_list.append(stats)

        return stats_list
