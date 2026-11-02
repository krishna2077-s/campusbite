from __future__ import annotations

from pydantic import BaseModel


class AIInsightRequest(BaseModel):
    query: str


class AIInsightResponse(BaseModel):
    response: str
