"""Настройки из переменных окружения (локально — ещё и из файла backend/.env)."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Локально — Postgres на этой машине; в docker-compose переопределяется
    database_url: str = "postgresql+psycopg://localhost:5432/credit_conveyor"

    jwt_secret: str = "dev-only-secret-change-me-in-production-env"
    jwt_ttl_minutes: int = 12 * 60

    # Сервис моков внешних источников (ЕГРЮЛ, БКИ, ФНС)
    mocks_url: str = "http://localhost:8001"
    mocks_timeout_sec: float = 3.0
    mocks_retries: int = 3
    mocks_backoff_sec: float = 0.5

    # Пауза на каждом шаге конвейера, чтобы в интерфейсе было видно смену статусов
    pipeline_step_delay_sec: float = 1.0
    worker_poll_interval_sec: float = 0.5

    # Поведение самих моков: задержка ответа и доля случайных сбоев (0..1)
    mock_latency_sec: float = 0.3
    mock_failure_rate: float = 0.0

    # Показывать тестовые учётки на странице входа
    demo_mode: bool = True

    log_level: str = "INFO"


settings = Settings()
