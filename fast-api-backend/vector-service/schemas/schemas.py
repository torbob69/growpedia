from pydantic import BaseModel, ConfigDict, Field

class ChunkBase(BaseModel):
    content: str
    source: str
    embedding: list[float]

class ChunkCreate(ChunkBase):
    pass

class ChunkRead(ChunkBase):
    model_config = ConfigDict(from_attributes=True)

    id: int

class SearchRequest(BaseModel):
    query: str = Field(min_length=1, max_length=1000)
    top_k: int = Field(default=5, ge=1, le=50)

class SearchHit(BaseModel):
    content: str
    source: str
    score: float
    dense_rank: int | None
    sparse_rank: int | None
    rerank_score: float
