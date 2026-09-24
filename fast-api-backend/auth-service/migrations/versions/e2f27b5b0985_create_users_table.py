"""create users table

Revision ID: e2f27b5b0985
Revises: 
Create Date: 2026-09-12 21:31:54.391997

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'e2f27b5b0985'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('users',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('gmail', sa.String(), nullable=False),
    sa.Column('username', sa.String(), nullable=False),
    sa.Column('password_hash', sa.String(), nullable=False),
    sa.Column('role', sa.Enum('user', 'admin', name='role'), nullable=False),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('gmail'),
    sa.UniqueConstraint('username')
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('users')
