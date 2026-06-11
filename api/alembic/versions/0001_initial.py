"""initial migration

Revision ID: 0001_initial
Revises: None
Create Date: 2026-06-11 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "fuel_prices",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("town", sa.String(length=100), nullable=False),
        sa.Column("super_petrol", sa.Numeric(6, 2), nullable=False),
        sa.Column("diesel", sa.Numeric(6, 2), nullable=False),
        sa.Column("kerosene", sa.Numeric(6, 2), nullable=False),
        sa.Column("valid_from", sa.Date(), nullable=False),
        sa.Column("valid_to", sa.Date(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.UniqueConstraint("town", "valid_from", name="uq_town_valid_from"),
    )
    op.execute("CREATE INDEX idx_fuel_prices_town ON fuel_prices (LOWER(town));")
    op.create_index(
        "idx_fuel_prices_valid_from",
        "fuel_prices",
        ["valid_from"],
    )
    op.create_index(
        "idx_fuel_prices_date_range",
        "fuel_prices",
        ["valid_from", "valid_to"],
    )


def downgrade() -> None:
    op.drop_index("idx_fuel_prices_date_range", table_name="fuel_prices")
    op.drop_index("idx_fuel_prices_valid_from", table_name="fuel_prices")
    op.execute("DROP INDEX IF EXISTS idx_fuel_prices_town;")
    op.drop_table("fuel_prices")
