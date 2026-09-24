import os
from contextlib import asynccontextmanager

import torch
from fastapi import Depends, FastAPI
from sentence_transformers import CrossEncoder, SentenceTransformer
from sqlalchemy.ext.asyncio import AsyncSession

from database.connection import get_session
from models.models import EMBEDDING_DIM
from schemas.schemas import SearchHit, SearchRequest
from security import require_admin, require_user
from service import search, seeding

EMBEDDING_MODEL = "BAAI/bge-base-en-v1.5"

RERANK_MODEL = "cross-encoder/ms-marco-MiniLM-L-6-v2"

RERANK_DEVICE = os.getenv("VECTOR_DEVICE") or ("cuda" if torch.cuda.is_available() else "cpu")

_model: dict[str, object] = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    m = SentenceTransformer(EMBEDDING_MODEL, device="cpu")
    dim = m.get_sentence_embedding_dimension()
    if dim != EMBEDDING_DIM:
        raise RuntimeError(
            f"{EMBEDDING_MODEL} emits {dim}-d vectors but chunk.embedding is {EMBEDDING_DIM}-d"
        )
    _model["embedder"] = m
    ce = CrossEncoder(RERANK_MODEL, device=RERANK_DEVICE)
    ce.predict([("warmup", "warmup")])
    _model["reranker"] = ce
    print(f"reranker on {RERANK_DEVICE}", flush=True)
    yield
    _model.clear()


app = FastAPI(lifespan=lifespan)


@app.get('/health')
def health():
    return {"status": "vector service is ok", "rerank_device": RERANK_DEVICE}


@app.post('/seed', status_code=201, dependencies=[Depends(require_admin)])
async def seed(db: AsyncSession = Depends(get_session)):
    await seeding(db)


@app.post('/search', response_model=list[SearchHit], dependencies=[Depends(require_user)])
async def search_chunks(req: SearchRequest, db: AsyncSession = Depends(get_session)):
    return await search(db, req.query, req.top_k, _model["embedder"], _model["reranker"])
