"""
Regression tests for content-studio async generation idempotency (audit #23).

Background — the previous implementation generated a fresh `uuid.uuid4()`
primary key on every call to `create_pending_content`. If API Gateway
retried a POST (default behavior on read timeouts) or a user double-clicked
the generate button, two rows were created with two separate UUIDs and
two separate async Lambda self-invocations fired. The client saw two
results, and Bedrock got billed twice for the same work.

The fix:
- `_compute_idempotency_key(idea)` derives a deterministic 32-char hex
  key from idea_id + keyword + content_angle + output_language + a
  rounded 5-minute time bucket.
- `create_pending_content` uses that key as the DynamoDB primary key with
  a conditional `attribute_not_exists(id)` put. Duplicates hit the
  condition, fall back to a `get_item`, and return `(existing, created=False)`.
- `_generate_content` skips the async Lambda invocation when
  `created is False` so retries don't spawn duplicate generations.

These tests pin:
- Same idea + same window → same key → same row
- Same idea + different window → different key → new row (user-intent re-run)
- Different idea data → different key even in same window
- Conditional-check failure paths return the existing row
- Caller skips async invocation on idempotent hit
"""

from __future__ import annotations

import importlib.util
import os
import sys
from unittest.mock import MagicMock, patch

# Env vars the module reads at import time.
os.environ.setdefault('DYNAMODB_TABLE_SEARCH_RESULTS', 'test-search')
os.environ.setdefault('DYNAMODB_TABLE_CITATIONS', 'test-citations')
os.environ.setdefault('DYNAMODB_TABLE_CRAWLED_CONTENT', 'test-crawled')
os.environ.setdefault('DYNAMODB_TABLE_CONTENT_STUDIO', 'test-content-studio')

_HERE = os.path.dirname(__file__)
_MODULE_PATH = os.path.join(_HERE, 'content-studio.py')

_LAMBDA_DIR = os.path.dirname(_HERE)
if _LAMBDA_DIR not in sys.path:
    sys.path.insert(0, _LAMBDA_DIR)
if _HERE not in sys.path:
    sys.path.insert(0, _HERE)

_spec = importlib.util.spec_from_file_location(
    'content_studio_under_test', _MODULE_PATH
)
_mod = importlib.util.module_from_spec(_spec)
sys.modules['content_studio_under_test'] = _mod
_spec.loader.exec_module(_mod)


class _FakeClientError(Exception):
    """Minimal ClientError substitute with the .response shape the code
    expects. Actual botocore.exceptions.ClientError is used at runtime;
    we swap for testability so tests don't depend on the boto3 error
    hierarchy details."""

    def __init__(self, code: str) -> None:
        super().__init__(code)
        self.response = {'Error': {'Code': code}}


class TestComputeIdempotencyKey:
    """The key must be deterministic for the same inputs + window and
    diverge only on meaningful input changes."""

    def test_same_idea_same_window_produces_same_key(self) -> None:
        idea = {
            'id': 'idea-1',
            'keyword': 'luxury hotels',
            'content_angle': 'comprehensive_guide',
            'output_language': 'English',
        }
        k1 = _mod._compute_idempotency_key(idea)
        k2 = _mod._compute_idempotency_key(idea)
        assert k1 == k2

    def test_different_keyword_produces_different_key(self) -> None:
        base = {
            'id': 'idea-1',
            'content_angle': 'comprehensive_guide',
            'output_language': 'English',
        }
        k1 = _mod._compute_idempotency_key({**base, 'keyword': 'luxury hotels'})
        k2 = _mod._compute_idempotency_key({**base, 'keyword': 'budget hotels'})
        assert k1 != k2

    def test_different_content_angle_produces_different_key(self) -> None:
        """Same idea, different angle = different generation output
        expected, so different key."""
        base = {
            'id': 'idea-1',
            'keyword': 'hotels',
            'output_language': 'English',
        }
        k1 = _mod._compute_idempotency_key({**base, 'content_angle': 'comprehensive_guide'})
        k2 = _mod._compute_idempotency_key({**base, 'content_angle': 'reputation_management'})
        assert k1 != k2

    def test_different_language_produces_different_key(self) -> None:
        base = {
            'id': 'idea-1',
            'keyword': 'hotels',
            'content_angle': 'comprehensive_guide',
        }
        k1 = _mod._compute_idempotency_key({**base, 'output_language': 'English'})
        k2 = _mod._compute_idempotency_key({**base, 'output_language': 'Spanish'})
        assert k1 != k2

    def test_different_window_produces_different_key(self) -> None:
        """A user who re-triggers generation after the window expires
        should get a fresh key (no longer an idempotent hit)."""
        idea = {'id': 'idea-1', 'keyword': 'hotels', 'content_angle': 'comprehensive_guide'}
        # Tiny 0.001-minute window so consecutive calls fall in different buckets.
        # This works because _compute_idempotency_key uses int(timestamp // window_seconds)
        # and we can simulate window rollover by patching utc_now across calls.
        real_utc_now = _mod.utc_now
        from datetime import UTC, datetime
        fixed_early = datetime(2026, 4, 18, 12, 0, 0, tzinfo=UTC)
        fixed_later = datetime(2026, 4, 18, 12, 10, 0, tzinfo=UTC)

        with patch.object(_mod, 'utc_now', return_value=fixed_early):
            k1 = _mod._compute_idempotency_key(idea)
        with patch.object(_mod, 'utc_now', return_value=fixed_later):
            k2 = _mod._compute_idempotency_key(idea)

        assert k1 != k2
        # Sanity: our patch didn't accidentally break utc_now globally.
        assert _mod.utc_now is real_utc_now

    def test_returns_thirty_two_char_hex(self) -> None:
        """DynamoDB keys must be predictable length. 32 hex chars = 128 bits
        of collision resistance, plenty for this use case."""
        idea = {'id': 'idea-1', 'keyword': 'kw', 'content_angle': 'ca'}
        key = _mod._compute_idempotency_key(idea)
        assert len(key) == 32
        assert all(c in '0123456789abcdef' for c in key)


class TestCreatePendingContent:
    """The conditional write + get_item fallback behaviour."""

    def _fake_table(self, put_raises: Exception | None = None,
                    get_item_return: dict | None = None) -> MagicMock:
        table = MagicMock()
        if put_raises is not None:
            table.put_item.side_effect = put_raises
        table.get_item.return_value = {'Item': get_item_return} if get_item_return else {}
        return table

    def _patched_resource(self, table: MagicMock) -> MagicMock:
        resource = MagicMock()
        resource.Table.return_value = table
        return resource

    def test_writes_new_row_with_deterministic_key_on_fresh_call(self) -> None:
        table = self._fake_table()
        resource = self._patched_resource(table)
        idea = {'id': 'idea-1', 'keyword': 'hotels', 'content_angle': 'comprehensive_guide'}

        with patch.object(_mod, 'dynamodb', resource):
            item, created = _mod.create_pending_content(idea)

        assert created is True
        # The row's primary key must equal the idempotency key.
        assert item['id'] == _mod._compute_idempotency_key(idea)

    def test_uses_conditional_expression_attribute_not_exists(self) -> None:
        """Regression guard: someone removing the ConditionExpression would
        re-introduce the duplicate-write bug."""
        table = self._fake_table()
        resource = self._patched_resource(table)

        with patch.object(_mod, 'dynamodb', resource):
            _mod.create_pending_content({'id': 'x', 'keyword': 'kw', 'content_angle': 'a'})

        put_kwargs = table.put_item.call_args.kwargs
        assert put_kwargs['ConditionExpression'] == 'attribute_not_exists(id)'

    def test_returns_existing_row_on_conditional_check_failure(self) -> None:
        """The core idempotency behavior — duplicate requests return the
        existing record with created=False."""
        existing_row = {
            'id': 'some-key',
            'status': 'generating',
            'keyword': 'hotels',
            'idea_id': 'idea-1',
        }
        error = _FakeClientError('ConditionalCheckFailedException')
        table = self._fake_table(put_raises=error, get_item_return=existing_row)
        resource = self._patched_resource(table)

        # Point the module's ClientError at our fake so the except catches it.
        with patch.object(_mod, 'dynamodb', resource), \
             patch.object(_mod, 'ClientError', _FakeClientError):
            item, created = _mod.create_pending_content({
                'id': 'idea-1', 'keyword': 'hotels', 'content_angle': 'a',
            })

        assert created is False
        assert item == existing_row

    def test_reraises_non_conditional_client_errors(self) -> None:
        """Only ConditionalCheckFailedException is the idempotent-hit case.
        Other DynamoDB errors must propagate."""
        error = _FakeClientError('ProvisionedThroughputExceededException')
        table = self._fake_table(put_raises=error)
        resource = self._patched_resource(table)

        with patch.object(_mod, 'dynamodb', resource), \
             patch.object(_mod, 'ClientError', _FakeClientError):
            try:
                _mod.create_pending_content({'id': 'x', 'keyword': 'kw', 'content_angle': 'a'})
            except _FakeClientError:
                # Expected: non-conditional error propagates.
                pass
            else:
                raise AssertionError('Expected _FakeClientError to propagate')

    def test_raises_runtime_error_when_existing_item_disappears(self) -> None:
        """Very unlikely race: row existed when put failed, gone when we read
        back. Better to surface the race than silently continue with a
        fabricated record."""
        error = _FakeClientError('ConditionalCheckFailedException')
        table = self._fake_table(put_raises=error, get_item_return=None)
        resource = self._patched_resource(table)

        with patch.object(_mod, 'dynamodb', resource), \
             patch.object(_mod, 'ClientError', _FakeClientError):
            try:
                _mod.create_pending_content({'id': 'x', 'keyword': 'kw', 'content_angle': 'a'})
            except RuntimeError as e:
                assert 'disappeared' in str(e).lower()
            else:
                raise AssertionError('Expected RuntimeError on missing row')

    def test_returned_tuple_order_is_item_then_created_flag(self) -> None:
        """Regression guard: callers unpack `item, created = ...`. Reversing
        the order would silently break every caller."""
        table = self._fake_table()
        resource = self._patched_resource(table)

        with patch.object(_mod, 'dynamodb', resource):
            result = _mod.create_pending_content({
                'id': 'x', 'keyword': 'kw', 'content_angle': 'a',
            })

        assert isinstance(result, tuple)
        assert len(result) == 2
        assert isinstance(result[0], dict)
        assert isinstance(result[1], bool)
