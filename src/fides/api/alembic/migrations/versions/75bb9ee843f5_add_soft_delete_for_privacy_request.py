"""Adds deleted_at and deleted_by to PrivacyRequest

Revision ID: 75bb9ee843f5
Revises: 68c590ff6e89
Create Date: 2024-09-19 14:35:30.510909

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "75bb9ee843f5"
down_revision = "68c590ff6e89"
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column(
        "privacyrequest",
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column("privacyrequest", sa.Column("deleted_by", sa.String(), nullable=True))
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column("privacyrequest", "deleted_by")
    op.drop_column("privacyrequest", "deleted_at")
    # ### end Alembic commands ###
