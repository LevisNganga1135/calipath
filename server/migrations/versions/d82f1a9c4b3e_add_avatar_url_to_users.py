"""Add avatar_url to users

Revision ID: d82f1a9c4b3e
Revises: bea339deb9eb
Create Date: 2026-09-02 23:10:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'd82f1a9c4b3e'
down_revision = 'bea339deb9eb'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('users', sa.Column('avatar_url', sa.String(), nullable=True))


def downgrade():
    op.drop_column('users', 'avatar_url')
