"""alert sends

Revision ID: 0003_alert_sends
Revises: 0002_alert_subscribers
Create Date: 2026-11-26 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

revision = "0003_alert_sends"
down_revision = "0002_alert_subscribers"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "alert_sends",
        sa.Column("valid_from", sa.Date(), primary_key=True),
        sa.Column("recipients", sa.Integer(), nullable=False),
        sa.Column("sent_at", sa.DateTime(timezone=True), server_default=sa.func.current_timestamp()),
    )


def downgrade() -> None:
    op.drop_table("alert_sends")
