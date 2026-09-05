"""
Cross-dialect helper column types.

MySQL has no native ARRAY column type (unlike PostgreSQL), so any model
field that previously used `ARRAY(UUID(as_uuid=True))` is backed by a JSON
column instead. This TypeDecorator keeps the Python-side contract
identical (`list[uuid.UUID]` in and out) so existing route/service code
that reads or writes these fields needs zero changes.
"""
import uuid

from sqlalchemy import JSON
from sqlalchemy.types import TypeDecorator


class UUIDListJSON(TypeDecorator):
    """Stores a list[uuid.UUID] as a JSON array of strings; returns list[uuid.UUID]."""

    impl = JSON
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        return [str(v) for v in value]

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        return [uuid.UUID(v) if not isinstance(v, uuid.UUID) else v for v in value]
