"""
Memory Exercise API routes
@author Jay "The Ermite" Goncalves
@copyright Jay The Ermite
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.memory_exercise import (
    MemoryExerciseSessionCreate,
    MemoryExerciseSessionUpdate,
    MemoryExerciseSessionResponse,
    MemoryExerciseStats,
    MemoryExerciseLeaderboard,
    ConfigPreset,
    MemoryExerciseConfig,
    MemoryExerciseType,
    DifficultyLevel,
)
from app.services.memory_exercise_service import MemoryExerciseService

router = APIRouter(prefix="/memory-exercises", tags=["memory-exercises"])


@router.post("/sessions", status_code=status.HTTP_201_CREATED, response_model=MemoryExerciseSessionResponse)
async def create_session(
    session_data: MemoryExerciseSessionCreate,
    db: Session = Depends(get_db)
):
    """Create a new memory exercise session"""
    session = MemoryExerciseService.create_session(db, session_data.user_id, session_data)
    return MemoryExerciseSessionResponse(
        id=session.id,
        user_id=session.user_id,
        exercise_id=session.exercise_id,
        exercise_type=session.exercise_type,
        difficulty=session.difficulty,
        config=session.config,
        is_completed=session.is_completed,
        total_moves=session.total_moves,
        correct_moves=session.correct_moves,
        incorrect_moves=session.incorrect_moves,
        time_elapsed_ms=session.time_elapsed_ms,
        max_sequence_reached=session.max_sequence_reached,
        final_score=session.final_score,
        score_breakdown=session.score_breakdown,
        accuracy=session.get_accuracy(),
        created_at=session.created_at,
        updated_at=session.updated_at,
        completed_at=session.completed_at,
    )


@router.put("/sessions/{session_id}", response_model=MemoryExerciseSessionResponse)
async def update_session(
    session_id: int,
    update_data: MemoryExerciseSessionUpdate,
    user_id: int = Query(..., description="User ID for authorization"),
    db: Session = Depends(get_db)
):
    """Update a memory exercise session with performance data"""
    try:
        session = MemoryExerciseService.update_session(db, session_id, user_id, update_data)
        return MemoryExerciseSessionResponse(
            id=session.id,
            user_id=session.user_id,
            exercise_id=session.exercise_id,
            exercise_type=session.exercise_type,
            difficulty=session.difficulty,
            config=session.config,
            is_completed=session.is_completed,
            total_moves=session.total_moves,
            correct_moves=session.correct_moves,
            incorrect_moves=session.incorrect_moves,
            time_elapsed_ms=session.time_elapsed_ms,
            max_sequence_reached=session.max_sequence_reached,
            final_score=session.final_score,
            score_breakdown=session.score_breakdown,
            accuracy=session.get_accuracy(),
            created_at=session.created_at,
            updated_at=session.updated_at,
            completed_at=session.completed_at,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/sessions/{session_id}", response_model=MemoryExerciseSessionResponse)
async def get_session(
    session_id: int,
    user_id: int = Query(..., description="User ID for authorization"),
    db: Session = Depends(get_db)
):
    """Get a session by ID"""
    session = MemoryExerciseService.get_session(db, session_id, user_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return MemoryExerciseSessionResponse(
        id=session.id,
        user_id=session.user_id,
        exercise_id=session.exercise_id,
        exercise_type=session.exercise_type,
        difficulty=session.difficulty,
        config=session.config,
        is_completed=session.is_completed,
        total_moves=session.total_moves,
        correct_moves=session.correct_moves,
        incorrect_moves=session.incorrect_moves,
        time_elapsed_ms=session.time_elapsed_ms,
        max_sequence_reached=session.max_sequence_reached,
        final_score=session.final_score,
        score_breakdown=session.score_breakdown,
        accuracy=session.get_accuracy(),
        created_at=session.created_at,
        updated_at=session.updated_at,
        completed_at=session.completed_at,
    )


@router.get("/sessions", response_model=List[MemoryExerciseSessionResponse])
async def get_user_sessions(
    user_id: int = Query(..., description="User ID"),
    exercise_type: Optional[str] = None,
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """Get user's session history"""
    sessions = MemoryExerciseService.get_user_sessions(db, user_id, exercise_type, limit, offset)
    return [
        MemoryExerciseSessionResponse(
            id=s.id,
            user_id=s.user_id,
            exercise_id=s.exercise_id,
            exercise_type=s.exercise_type,
            difficulty=s.difficulty,
            config=s.config,
            is_completed=s.is_completed,
            total_moves=s.total_moves,
            correct_moves=s.correct_moves,
            incorrect_moves=s.incorrect_moves,
            time_elapsed_ms=s.time_elapsed_ms,
            max_sequence_reached=s.max_sequence_reached,
            final_score=s.final_score,
            score_breakdown=s.score_breakdown,
            accuracy=s.get_accuracy(),
            created_at=s.created_at,
            updated_at=s.updated_at,
            completed_at=s.completed_at,
        )
        for s in sessions
    ]


@router.get("/leaderboard", response_model=List[MemoryExerciseLeaderboard])
async def get_leaderboard(
    exercise_id: Optional[int] = None,
    exercise_type: Optional[str] = None,
    difficulty: Optional[str] = None,
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get leaderboard for an exercise"""
    return MemoryExerciseService.get_leaderboard(db, exercise_id, exercise_type, difficulty, limit)


@router.get("/stats", response_model=List[MemoryExerciseStats])
async def get_user_stats(
    user_id: int = Query(..., description="User ID"),
    db: Session = Depends(get_db)
):
    """Get user statistics"""
    return MemoryExerciseService.get_user_stats(db, user_id)


@router.get("/presets/{exercise_type}", response_model=List[ConfigPreset])
async def get_config_presets(exercise_type: MemoryExerciseType):
    """Get configuration presets for an exercise type"""
    # Define presets for each exercise type
    presets_map = {
        MemoryExerciseType.MEMORY_CARDS: [
            ConfigPreset(name="Facile", difficulty=DifficultyLevel.EASY, config=MemoryExerciseConfig(
                exercise_type=MemoryExerciseType.MEMORY_CARDS,
                difficulty=DifficultyLevel.EASY,
                grid_rows=4, grid_cols=4,
                time_limit_ms=300000,
                time_weight=0.3, accuracy_weight=0.7
            )),
            ConfigPreset(name="Moyen", difficulty=DifficultyLevel.MEDIUM, config=MemoryExerciseConfig(
                exercise_type=MemoryExerciseType.MEMORY_CARDS,
                difficulty=DifficultyLevel.MEDIUM,
                grid_rows=6, grid_cols=6,
                time_limit_ms=420000,
                time_weight=0.4, accuracy_weight=0.6
            )),
            ConfigPreset(name="Difficile", difficulty=DifficultyLevel.HARD, config=MemoryExerciseConfig(
                exercise_type=MemoryExerciseType.MEMORY_CARDS,
                difficulty=DifficultyLevel.HARD,
                grid_rows=8, grid_cols=8,
                time_limit_ms=600000,
                time_weight=0.5, accuracy_weight=0.5
            )),
        ],
        MemoryExerciseType.PATTERN_RECALL: [
            ConfigPreset(name="Facile", difficulty=DifficultyLevel.EASY, config=MemoryExerciseConfig(
                exercise_type=MemoryExerciseType.PATTERN_RECALL,
                difficulty=DifficultyLevel.EASY,
                grid_rows=3, grid_cols=3,
                colors=["#3B82F6", "#EF4444", "#10B981", "#F59E0B"],
                preview_duration_ms=3000,
                time_limit_ms=60000,
                time_weight=0.3, accuracy_weight=0.7
            )),
        ],
        MemoryExerciseType.SEQUENCE_MEMORY: [
            ConfigPreset(name="Facile", difficulty=DifficultyLevel.EASY, config=MemoryExerciseConfig(
                exercise_type=MemoryExerciseType.SEQUENCE_MEMORY,
                difficulty=DifficultyLevel.EASY,
                grid_rows=3, grid_cols=3,
                initial_sequence_length=3,
                max_sequence_length=20,
                preview_duration_ms=1000,
                time_weight=0.2, accuracy_weight=0.8
            )),
        ],
        MemoryExerciseType.IMAGE_PAIRS: [
            ConfigPreset(name="Facile", difficulty=DifficultyLevel.EASY, config=MemoryExerciseConfig(
                exercise_type=MemoryExerciseType.IMAGE_PAIRS,
                difficulty=DifficultyLevel.EASY,
                grid_rows=4, grid_cols=4,
                time_limit_ms=300000,
                time_weight=0.3, accuracy_weight=0.7
            )),
        ],
    }

    return presets_map.get(exercise_type, [])
