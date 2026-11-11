"""
DSP KnowledgeHub AI – Employee Self-Service Portal - Application Configuration

Centralizes all configuration from environment variables.
Uses pydantic-settings for type-safe config with validation.
"""

from functools import lru_cache
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # --- Application ---
    app_name: str = "DSP KnowledgeHub AI – Employee Self-Service Portal"
    app_env: str = "development"
    app_debug: bool = True
    app_port: int = 8000
    app_host: str = "0.0.0.0"
    frontend_url: str = "http://localhost:5173"
    app_secret_key: str = "dev-secret-change-in-production"

    # --- Database ---
    database_url: str = "postgresql+asyncpg://dsp_user:dsp_password@localhost:5432/dsp_knowledgehub"
    database_sync_url: str = "postgresql://dsp_user:dsp_password@localhost:5432/dsp_knowledgehub"

    # --- Redis ---
    redis_url: str = "redis://localhost:6379/0"
    redis_password: Optional[str] = None

    # --- Market Data ---
    market_data_provider: str = "real"  # "demo", "real", "yfinance", "finance_api"
    market_data_api_key: Optional[str] = None
    market_data_api_secret: Optional[str] = None
    market_data_base_url: Optional[str] = None

    # --- Finance API ---
    finance_api_key: Optional[str] = None
    finance_api_base_url: Optional[str] = None
    finance_api_environment: Optional[str] = "production"

    # --- LLM ---
    llm_provider: str = "openai"
    llm_api_key: Optional[str] = None
    llm_model: str = "gpt-4o"
    llm_temperature: float = 0.1
    llm_max_tokens: int = 4096

    # --- Embedding ---
    embedding_provider: str = "openai"
    embedding_api_key: Optional[str] = None
    embedding_model: str = "text-embedding-3-small"

    # --- Qdrant ---
    qdrant_url: str = "http://localhost:6333"
    qdrant_api_key: Optional[str] = None
    qdrant_collection: str = "dsp_documents"

    # --- MLflow ---
    mlflow_tracking_uri: str = "http://localhost:5000"
    mlflow_experiment_name: str = "dsp_investment_models"

    # --- AWS / S3 ---
    aws_region: str = "ap-south-1"
    aws_access_key_id: Optional[str] = None
    aws_secret_access_key: Optional[str] = None
    aws_s3_bucket: str = "dsp-investment-platform"
    s3_endpoint_url: Optional[str] = None

    # --- Authentication ---
    jwt_secret_key: str = "dev-jwt-secret-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 30
    jwt_refresh_token_expire_days: int = 7

    # --- CORS ---
    cors_origins: str = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000"

    # --- Rate Limiting ---
    rate_limit_per_minute: int = 60
    rate_limit_per_hour: int = 1000

    # --- Logging ---
    log_level: str = "INFO"
    log_format: str = "json"

    # --- Demo Mode ---
    demo_mode: bool = True

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]

    @property
    def is_production(self) -> bool:
        return self.app_env.lower() in ("production", "prod")

    @property
    def is_remote_db(self) -> bool:
        """Returns True if database_url points to a configured remote host (not localhost/127.0.0.1)."""
        if not self.database_url:
            return False
        clean_url = self.database_url.lower()
        return "localhost" not in clean_url and "127.0.0.1" not in clean_url

    @property
    def is_demo(self) -> bool:
        return bool(self.demo_mode)


@lru_cache
def get_settings() -> Settings:
    """Cached settings singleton."""
    return Settings()
