"""Локальный запуск всего бэкенда одной командой: моки, API и воркер.

    python dev.py

Ctrl+C останавливает все три процесса. В Docker они запускаются отдельными сервисами.
"""

import subprocess
import sys
import time

PROCESSES = {
    "mocks": [sys.executable, "-m", "uvicorn", "app.mocks.main:app", "--port", "8001"],
    "api": [sys.executable, "-m", "uvicorn", "app.main:app", "--port", "8000", "--reload"],
    "worker": [sys.executable, "-m", "app.worker"],
}


def main() -> None:
    procs = {name: subprocess.Popen(cmd) for name, cmd in PROCESSES.items()}
    print("API: http://localhost:8000/api/docs · моки: http://localhost:8001/docs · Ctrl+C — остановить")
    try:
        while all(p.poll() is None for p in procs.values()):
            time.sleep(0.5)
        stopped = [name for name, p in procs.items() if p.poll() is not None]
        print(f"Процесс завершился: {', '.join(stopped)} — останавливаю остальные")
    except KeyboardInterrupt:
        pass
    finally:
        for p in procs.values():
            p.terminate()
        for p in procs.values():
            p.wait(timeout=10)


if __name__ == "__main__":
    main()
