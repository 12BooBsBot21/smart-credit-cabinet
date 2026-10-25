"""Ошибки предметной области. В HTTP-ответы их переводит обработчик в app/main.py."""


class AppError(Exception):
    status_code = 400

    def __init__(self, message: str):
        super().__init__(message)
        self.message = message


class NotFound(AppError):
    status_code = 404


class Forbidden(AppError):
    status_code = 403


class Conflict(AppError):
    """Действие недоступно в текущем состоянии заявки."""

    status_code = 409


class InvalidInput(AppError):
    status_code = 422
