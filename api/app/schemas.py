from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import List

from pydantic import BaseModel


class FuelPriceOut(BaseModel):
    id: int
    town: str
    super_petrol: float
    diesel: float
    kerosene: float
    valid_from: date
    valid_to: date

    class Config:
        from_attributes = True
        json_encoders = {Decimal: float}


class IngestResponse(BaseModel):
    status: str
    records_processed: int
    timestamp: str


class TownList(BaseModel):
    towns: List[str]
