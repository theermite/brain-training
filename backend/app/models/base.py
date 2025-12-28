"""
Base model with common fields
@author Jay "The Ermite" Goncalves
@copyright Jay The Ermite
"""

from datetime import datetime
from sqlalchemy import Column, Integer, DateTime
from sqlalchemy.ext.declarative import declared_attr
from app.core.database import Base


class BaseModel(Base):
    """
    Base model with common fields for all tables
    """

    __abstract__ = True

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    @declared_attr
    def __tablename__(cls):
        """
        Generate table name from class name
        Example: MemoryExerciseSession -> memory_exercise_sessions
        """
        import re
        name = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', cls.__name__)
        return re.sub('([a-z0-9])([A-Z])', r'\1_\2', name).lower() + 's'

    def __repr__(self) -> str:
        return f"<{self.__class__.__name__}(id={self.id})>"
