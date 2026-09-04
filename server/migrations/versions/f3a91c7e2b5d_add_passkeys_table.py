"""Add passkeys table

Revision ID: f3a91c7e2b5d
Revises: d82f1a9c4b3e
Create Date: 2026-09-03 09:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'f3a91c7e2b5d'
down_revision = 'd82f1a9c4b3e'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'passkeys',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('credential_id', sa.String(), nullable=False),
        sa.Column('public_key', sa.String(), nullable=False),
        sa.Column('sign_count', sa.Integer(), nullable=False),
        sa.Column('device_name', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('credential_id'),
    )


def downgrade():
    op.drop_table('passkeys')
    