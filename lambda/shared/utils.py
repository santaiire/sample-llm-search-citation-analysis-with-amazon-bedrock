"""Utility functions for Lambda functions."""

import logging
import os
from datetime import UTC, datetime
from typing import Any
from urllib.parse import parse_qs, urlencode, urlparse

import boto3

# Set up logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Wire format for ISO 8601 UTC timestamps across the system. Downstream callers
# (DynamoDB sort keys, API clients, S3 keys) rely on the trailing 'Z' suffix,
# so `datetime.now(UTC)` output is normalized by replacing '+00:00' with 'Z'.
# DO NOT change this format without coordinating with every consumer.
_UTC_SUFFIX_NATIVE = '+00:00'
_UTC_SUFFIX_WIRE = 'Z'

# DynamoDB resource (lazy initialization)
_dynamodb = None


def _get_dynamodb():
    """Get DynamoDB resource (lazy initialization)."""
    global _dynamodb
    if _dynamodb is None:
        _dynamodb = boto3.resource('dynamodb')
    return _dynamodb


def get_brand_config(table_name: str | None = None) -> dict[str, Any]:
    """
    Get brand tracking configuration from DynamoDB.

    Args:
        table_name: Optional table name override. If not provided,
                   uses DYNAMODB_TABLE_BRAND_CONFIG environment variable.

    Returns:
        Brand configuration dictionary or empty dict if not found/error.
    """
    brand_config_table = table_name or os.environ.get('DYNAMODB_TABLE_BRAND_CONFIG')
    if not brand_config_table:
        return {}
    try:
        dynamodb = _get_dynamodb()
        table = dynamodb.Table(brand_config_table)
        response = table.get_item(Key={'config_id': 'default'})
        return response.get('Item', {})
    except Exception as e:
        logger.error(f"Error getting brand config: {e}")
        return {}


def normalize_url(url: str) -> str:
    """
    Normalize URL by removing tracking parameters.

    Args:
        url: Original URL with potential tracking parameters

    Returns:
        Normalized URL with tracking parameters removed
    """
    try:
        parsed = urlparse(url)

        # Remove tracking parameters
        query_params = parse_qs(parsed.query)
        tracking_params = [
            'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
            'fbclid', 'gclid', 'msclkid', 'ref', 'source', '_ga', 'mc_cid', 'mc_eid'
        ]
        clean_params = {k: v for k, v in query_params.items()
                       if k not in tracking_params}

        # Rebuild URL with domain + path + clean params
        clean_query = urlencode(clean_params, doseq=True)
        normalized = f"{parsed.scheme}://{parsed.netloc}{parsed.path}"
        if clean_query:
            normalized += f"?{clean_query}"

        return normalized
    except Exception as e:
        logger.warning(f"Error normalizing URL {url}: {e}")
        return url


def utc_now() -> datetime:
    """Return current time as a timezone-aware UTC datetime.

    Use this anywhere the legacy code called `datetime.utcnow()`. The return
    is timezone-aware (tzinfo=UTC), so arithmetic against it must use other
    timezone-aware datetimes. Use `.replace(tzinfo=None)` only when comparing
    against naive datetimes parsed from stored ISO strings.
    """
    return datetime.now(UTC)


def get_timestamp() -> str:
    """Return current UTC time as an ISO 8601 string with a trailing 'Z'.

    Wire format: `YYYY-MM-DDTHH:MM:SS.ffffffZ` (microsecond precision). This
    is the canonical wire format for DynamoDB sort keys, API responses, and
    S3 object metadata in this project. Downstream code parses with either
    `fromisoformat(s.replace('Z', '+00:00'))` or strict prefix matching.
    """
    return utc_now().isoformat().replace(_UTC_SUFFIX_NATIVE, _UTC_SUFFIX_WIRE)


def get_timestamp_compact() -> str:
    """Return current UTC time as `YYYYMMDD-HHMMSS`.

    Used for S3 object prefixes and Step Functions execution names where a
    filesystem-safe, lexicographically-sortable stamp is required. Second
    precision — if you need more, use `get_timestamp()` and munge.
    """
    return utc_now().strftime('%Y%m%d-%H%M%S')


def extract_domain(url: str) -> str:
    """
    Extract domain from URL.

    Args:
        url: URL to extract domain from

    Returns:
        Domain name
    """
    try:
        parsed = urlparse(url)
        return parsed.netloc
    except Exception:
        return "unknown"


def brand_names_match(candidate: str, tracked: str) -> bool:
    """Safely test whether two brand names refer to the same brand.

    Designed as a fallback for classification logic when a brand extraction
    record is missing the authoritative `classification` field. Uses
    normalized exact matching — NOT substring matching — so `"Inn"` does
    not match `"Holiday Inn"` or `"linkedin.com"`.

    Normalization:
    - Lowercase
    - Strip leading/trailing whitespace
    - Collapse internal whitespace runs into a single space

    Returns False for any non-string input.
    """
    if not isinstance(candidate, str) or not isinstance(tracked, str):
        return False

    def _norm(s: str) -> str:
        return " ".join(s.lower().split())

    c = _norm(candidate)
    t = _norm(tracked)
    if not c or not t:
        return False
    return c == t
