"""add theme to users

Revision ID: b76b15f9852c
Revises: e2f27b5b0985
Create Date: 2026-09-12 23:04:24.052376

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'b76b15f9852c'
down_revision: Union[str, Sequence[str], None] = 'e2f27b5b0985'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    sa.Enum('light', 'dark', name='theme').create(op.get_bind(), checkfirst=True)
    op.add_column('users', sa.Column('theme', sa.Enum('light', 'dark', name='theme'), server_default='light', nullable=False))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('users', 'theme')
    sa.Enum(name='theme').drop(op.get_bind(), checkfirst=True)
