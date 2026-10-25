"""Проверка контрольных сумм ИНН и ОГРН — по алгоритмам ФНС."""


def _check_digit(digits: str, weights: list[int]) -> int:
    return sum(int(d) * w for d, w in zip(digits, weights)) % 11 % 10


def is_valid_inn(inn: str) -> bool:
    if not inn.isdigit():
        return False
    if len(inn) == 10:  # юрлицо
        return _check_digit(inn, [2, 4, 10, 3, 5, 9, 4, 6, 8]) == int(inn[9])
    if len(inn) == 12:  # ИП и физлицо
        first = _check_digit(inn, [7, 2, 4, 10, 3, 5, 9, 4, 6, 8])
        second = _check_digit(inn, [3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8])
        return first == int(inn[10]) and second == int(inn[11])
    return False


def is_valid_ogrn(ogrn: str) -> bool:
    if not ogrn.isdigit():
        return False
    if len(ogrn) == 13:  # ОГРН юрлица
        return int(ogrn[:12]) % 11 % 10 == int(ogrn[12])
    if len(ogrn) == 15:  # ОГРНИП
        return int(ogrn[:14]) % 13 % 10 == int(ogrn[14])
    return False
