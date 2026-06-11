from __future__ import annotations

from typing import List

from app.schemas import FuelPriceOut

_cache: dict = {
    "valid_from": None,
    "rows": [],
}


def get_latest_cache() -> dict:
    return _cache


def set_latest_cache(valid_from, rows: List[FuelPriceOut]) -> None:
    _cache["valid_from"] = valid_from
    _cache["rows"] = rows


def clear_latest_cache() -> None:
    _cache["valid_from"] = None
    _cache["rows"] = []
