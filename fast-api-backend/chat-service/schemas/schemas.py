from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ChatRequest(BaseModel):
    query: str = Field(min_length=1, max_length=1000)
    session_id: int | None = None


class ChatResponse(BaseModel):
    session_id: int
    answer: str
    sources: list[str]
    search_query: str


class SessionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime


class InteractionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    query: str
    answer: str
    sources: list[str]
    created_at: datetime
