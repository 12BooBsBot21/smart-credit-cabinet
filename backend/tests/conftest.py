"""Тесты работают с отдельной БД (по умолчанию credit_conveyor_test) — основная не затрагивается.

Создать её один раз: createdb credit_conveyor_test
Другой адрес: TEST_DATABASE_URL=postgresql+psycopg://… pytest
"""

import os

# Настройки читаются при импорте app, поэтому окружение задаём до него
os.environ["DATABASE_URL"] = os.environ.get(
    "TEST_DATABASE_URL", "postgresql+psycopg://localhost:5432/credit_conveyor_test"
)
os.environ["PIPELINE_STEP_DELAY_SEC"] = "0"
os.environ["MOCKS_BACKOFF_SEC"] = "0"
os.environ["MOCK_LATENCY_SEC"] = "0"
os.environ["MOCK_FAILURE_RATE"] = "0"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.db import Base, SessionLocal, engine  # noqa: E402
from app.main import app  # noqa: E402
from app.mocks.main import app as mocks_app  # noqa: E402
from app.seed import seed  # noqa: E402
from app.services import integrations  # noqa: E402
from app.worker import run_pending_jobs  # noqa: E402


@pytest.fixture(scope="session", autouse=True)
def database():
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    with SessionLocal() as session:
        seed(session)
    # Конвейер ходит в моки через тестовый клиент — без сети и отдельного процесса
    integrations.set_http_client(TestClient(mocks_app))
    yield
    integrations.set_http_client(None)


@pytest.fixture
def api() -> TestClient:
    return TestClient(app)


@pytest.fixture
def run_pipeline():
    """Выполнить все задания конвейера синхронно — вместо фонового воркера."""
    return run_pending_jobs
