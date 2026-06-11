"""${message}
Revision ID: ${up_revision}
Revises: ${down_revision | comma,n}
Create Date: ${creation_date}
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = ${repr(up_revision)}
down_revision = ${repr(down_revision)}
branch_labels = ${repr(branch_labels)}
depends_on = ${repr(depends_on)}


${upgrades}


${downgrades}
