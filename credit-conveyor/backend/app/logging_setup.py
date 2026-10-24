"""JSON-логи в stdout: их удобно собирать (ELK, Loki) и фильтровать по application_id."""

import json
import logging
import sys
from datetime import UTC, datetime

# Поля, которые можно передать через extra={...} и которые попадут в лог отдельными ключами
EXTRA_FIELDS = ("application_id", "job_id", "step", "source", "attempt", "request_id", "path", "status", "duration_ms")


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        data = {
            "ts": datetime.fromtimestamp(record.created, UTC).isoformat(timespec="milliseconds"),
            "level": record.levelname,
            "logger": record.name,
            "msg": record.getMessage(),
        }
        for field in EXTRA_FIELDS:
            if hasattr(record, field):
                data[field] = getattr(record, field)
        if record.exc_info:
            data["exc"] = self.formatException(record.exc_info)
        return json.dumps(data, ensure_ascii=False)


def setup_logging(level: str = "INFO") -> None:
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JsonFormatter())
    root = logging.getLogger()
    root.handlers[:] = [handler]
    root.setLevel(level)
