"""
Application configuration using Pydantic Settings
@author Jay "The Ermite" Goncalves
@copyright Jay The Ermite
"""

from typing import List
from pydantic_settings import BaseSettings
from pydantic import field_validator


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    # Database
    DATABASE_URL: str = "postgresql://brain_training:changeme@localhost:5432/brain_training"
    DATABASE_HOST: str = "localhost"
    DATABASE_PORT: int = 5432
    DATABASE_NAME: str = "brain_training"
    DATABASE_USER: str = "brain_training"
    DATABASE_PASSWORD: str = "changeme"

    # API
    API_TITLE: str = "Brain Training API"
    API_VERSION: str = "1.0.0"
    API_PREFIX: str = "/api/v1"
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173"

    # Security
    SECRET_KEY: str = "changeme_generate_secure_secret_key_here"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Application
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"

    @field_validator("CORS_ORIGINS")
    @classmethod
    def parse_cors_origins(cls, v: str) -> List[str]:
        """Parse CORS origins from comma-separated string"""
        return [origin.strip() for origin in v.split(",")]

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
