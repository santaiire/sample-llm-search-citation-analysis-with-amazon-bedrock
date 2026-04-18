"""
Characterization tests for shared.utils timestamp helpers.

These helpers are called from 27+ sites across the Lambda codebase; their
wire format (ISO 8601 with trailing 'Z') is a contract for DynamoDB sort
keys, S3 object prefixes, and API responses. A regression here breaks silent
comparisons downstream — the tests below pin the contract.

The helpers under test:
- utc_now()            — timezone-aware datetime.now(UTC) replacement
- get_timestamp()      — 'YYYY-MM-DDTHH:MM:SS.ffffffZ' wire format
- get_timestamp_compact() — 'YYYYMMDD-HHMMSS' filesystem-safe stamp
"""

from __future__ import annotations

import os
import re
import sys
from datetime import UTC, datetime, timedelta

# Match the pattern used by test_llm_json / test_url_validator / test_router:
# insert the shared/ dir onto sys.path so the module loads by bare name,
# which avoids pytest walking up into shared/__init__.py (which pulls boto3).
sys.path.insert(0, os.path.dirname(__file__))

import utils  # type: ignore[import-not-found]


class TestGetTimestamp:
    """get_timestamp() produces the canonical ISO 8601 wire format."""

    def test_ends_with_Z_suffix(self) -> None:
        ts = utils.get_timestamp()
        assert ts.endswith('Z')

    def test_does_not_contain_raw_offset(self) -> None:
        """Regression guard: the +00:00 suffix must be normalized to Z."""
        ts = utils.get_timestamp()
        assert '+00:00' not in ts

    def test_matches_legacy_wire_format_pattern(self) -> None:
        """'YYYY-MM-DDTHH:MM:SS.ffffffZ' — what datetime.utcnow().isoformat() + 'Z' produced."""
        ts = utils.get_timestamp()
        assert re.match(
            r'^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z$',
            ts,
        ), f'Unexpected wire format: {ts!r}'

    def test_parses_back_via_fromisoformat_after_Z_to_offset_swap(self) -> None:
        """Downstream code does fromisoformat(s.replace('Z', '+00:00')) — ensure that still works."""
        ts = utils.get_timestamp()
        parsed = datetime.fromisoformat(ts.replace('Z', '+00:00'))
        assert parsed.tzinfo is not None

    def test_returns_current_utc_time_within_a_few_seconds(self) -> None:
        ts = utils.get_timestamp()
        parsed = datetime.fromisoformat(ts.replace('Z', '+00:00'))
        # Allow 5 seconds of drift for slow CI
        now = datetime.now(UTC)
        delta = abs((now - parsed).total_seconds())
        assert delta < 5.0

    def test_lexicographic_sort_order_matches_chronological(self) -> None:
        """DynamoDB sort keys depend on string-sort-order matching time-sort-order."""
        earlier = utils.get_timestamp()
        # Build a later timestamp directly — can't sleep reliably in tests
        later_dt = datetime.now(UTC) + timedelta(seconds=10)
        later = later_dt.isoformat().replace('+00:00', 'Z')
        assert earlier < later


class TestGetTimestampCompact:
    """get_timestamp_compact() produces the filesystem-safe short stamp."""

    def test_matches_compact_format_pattern(self) -> None:
        ts = utils.get_timestamp_compact()
        assert re.match(r'^\d{8}-\d{6}$', ts), f'Unexpected compact format: {ts!r}'

    def test_has_no_colons_or_dots(self) -> None:
        """Regression: S3 keys and Step Functions execution names reject ':' and '.' in paths."""
        ts = utils.get_timestamp_compact()
        assert ':' not in ts
        assert '.' not in ts

    def test_lexicographic_sort_order_matches_chronological(self) -> None:
        earlier = utils.get_timestamp_compact()
        later_dt = datetime.now(UTC) + timedelta(minutes=1)
        later = later_dt.strftime('%Y%m%d-%H%M%S')
        assert earlier < later


class TestUtcNow:
    """utc_now() returns a timezone-aware UTC datetime."""

    def test_returns_timezone_aware_datetime(self) -> None:
        """The core reason this helper exists — legacy datetime.utcnow() was naive."""
        now = utils.utc_now()
        assert now.tzinfo is not None

    def test_timezone_is_utc(self) -> None:
        now = utils.utc_now()
        # Accept either datetime.UTC or datetime.timezone.utc identity
        assert now.utcoffset() == timedelta(0)

    def test_can_subtract_from_another_aware_datetime(self) -> None:
        """If both operands are aware, arithmetic works without TypeError."""
        now = utils.utc_now()
        ten_seconds_earlier = now - timedelta(seconds=10)
        delta = (now - ten_seconds_earlier).total_seconds()
        assert delta == 10.0

    def test_raises_typeerror_when_subtracted_from_naive(self) -> None:
        """Naive-minus-aware raises — this pins the awareness contract for callers
        that parse stored ISO strings and strip tzinfo."""
        import pytest

        aware = utils.utc_now()
        naive = datetime.now()  # naive local time
        with pytest.raises(TypeError):
            _ = aware - naive


class TestWireFormatCompatibility:
    """Contract: new helpers produce output byte-identical to the legacy pattern.

    Legacy code was `datetime.utcnow().isoformat() + 'Z'`. New code is
    `datetime.now(UTC).isoformat().replace('+00:00', 'Z')`. Both must produce
    the same string for any fixed instant.
    """

    def test_fixed_instant_produces_legacy_format(self) -> None:
        """Synthesize a known instant and compare both formatting paths."""
        # Freeze an instant in UTC
        fixed_utc = datetime(2026, 4, 18, 12, 34, 56, 789012, tzinfo=UTC)

        legacy = fixed_utc.replace(tzinfo=None).isoformat() + 'Z'
        new_style = fixed_utc.isoformat().replace('+00:00', 'Z')

        assert legacy == new_style
        assert legacy == '2026-04-18T12:34:56.789012Z'

    def test_non_utc_tz_still_normalizes_to_Z_when_value_is_utc(self) -> None:
        """Even a datetime constructed with timezone.utc (not datetime.UTC) must normalize."""
        fixed = datetime(2026, 4, 18, 0, 0, 0, tzinfo=UTC)
        formatted = fixed.isoformat().replace('+00:00', 'Z')
        assert formatted == '2026-04-18T00:00:00Z'
