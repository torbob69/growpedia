from pgvector.sqlalchemy import Vector
from sqlalchemy import Computed, Index, String, Text
from sqlalchemy.dialects.postgresql import TSVECTOR
from sqlalchemy.orm import Mapped, mapped_column

from database.connection import Base

EMBEDDING_DIM = 768

class Chunk(Base):
    __tablename__ = "chunk"

    id: Mapped[int] = mapped_column(primary_key=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    source: Mapped[str] = mapped_column(String, nullable=False)
    embedding: Mapped[list[float]] = mapped_column(Vector(EMBEDDING_DIM), nullable=False)

    fts: Mapped[str] = mapped_column(
        TSVECTOR,
        Computed("to_tsvector('english'::regconfig, content)", persisted=True),
    )

    __table_args__ = (Index("chunk_fts_idx", "fts", postgresql_using="gin"),)
