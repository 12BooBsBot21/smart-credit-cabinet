"""Воркер конвейера: забирает задания из таблицы jobs и выполняет шаги (app/services/pipeline.py).

Запуск: python -m app.worker. Воркеров можно запустить несколько — задания не задвоятся
благодаря SELECT … FOR UPDATE SKIP LOCKED.
"""

import logging
import tempfile
import time
from datetime import timedelta
from pathlib import Path

from sqlalchemy import and_, or_, select

from app.config import settings
from app.db import SessionLocal
from app.logging_setup import setup_logging
from app.models import Application, Job, utcnow
from app.services import pipeline

log = logging.getLogger("worker")

MAX_ATTEMPTS = 3
# Задание в RUNNING дольше этого времени считаем брошенным (воркер упал) и берём заново
STALE_RUNNING_AFTER = timedelta(minutes=5)
# Файл обновляется на каждом цикле — по нему docker healthcheck понимает, что воркер жив
HEARTBEAT_FILE = Path(tempfile.gettempdir()) / "credit-conveyor-worker.heartbeat"


def claim_next_job() -> int | None:
    """Забрать одно готовое к выполнению задание. Другие воркеры его уже не увидят."""
    with SessionLocal.begin() as session:
        query = (
            select(Job)
            .where(
                or_(
                    and_(Job.status == "PENDING", Job.run_after <= utcnow()),
                    and_(Job.status == "RUNNING", Job.updated_at < utcnow() - STALE_RUNNING_AFTER),
                )
            )
            .order_by(Job.id)
            .limit(1)
            .with_for_update(skip_locked=True)
        )
        job = session.scalars(query).first()
        if job is None:
            return None
        job.status = "RUNNING"
        job.attempts += 1
        return job.id


def process_job(job_id: int) -> None:
    try:
        with SessionLocal() as session:
            job = session.get(Job, job_id)
            log.info("Шаг %s", job.step, extra={"job_id": job.id, "step": job.step, "application_id": job.application_id})
            pipeline.run_step(session, job)
            job.status = "DONE"
            session.commit()
    except Exception as exc:
        log.exception("Шаг не выполнен", extra={"job_id": job_id})
        handle_failure(job_id, repr(exc))


def handle_failure(job_id: int, error: str) -> None:
    """Повторить позже с нарастающей паузой; после MAX_ATTEMPTS — отдать заявку человеку."""
    with SessionLocal.begin() as session:
        job = session.get(Job, job_id)
        job.last_error = error[:2000]
        if job.attempts < MAX_ATTEMPTS:
            job.status = "PENDING"
            job.run_after = utcnow() + timedelta(seconds=2**job.attempts)
        else:
            job.status = "FAILED"
            pipeline.send_to_manual_review(session, session.get(Application, job.application_id), error)


def run_pending_jobs(limit: int = 1000) -> int:
    """Выполнить все готовые задания и вернуть их число. Используется в тестах."""
    processed = 0
    while processed < limit and (job_id := claim_next_job()) is not None:
        process_job(job_id)
        processed += 1
    return processed


def main() -> None:
    setup_logging(settings.log_level)
    log.info("Воркер запущен")
    while True:
        HEARTBEAT_FILE.touch()
        job_id = claim_next_job()
        if job_id is None:
            time.sleep(settings.worker_poll_interval_sec)
        else:
            process_job(job_id)


if __name__ == "__main__":
    main()
