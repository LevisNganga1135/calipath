"""Add follows table

Revision ID: a7c8e5f1d4b2
Revises: f3a91c7e2b5d
Create Date: 2026-09-04 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = 'a7c8e5f1d4b2'
down_revision = 'f3a91c7e2b5d'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'follows',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('follower_id', sa.Integer(), nullable=False),
        sa.Column('followed_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['follower_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['followed_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('follower_id', 'followed_id', name='unique_follower_followed'),
    )


def downgrade():
    op.drop_table('follows')
    