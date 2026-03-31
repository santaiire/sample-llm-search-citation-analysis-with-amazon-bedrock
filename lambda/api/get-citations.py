"""
Get Citations API Lambda

Returns deduplicated citation URLs sorted by total mentions across all keywords.
Queries the CitationAnalysis-Citations table (deduplicated data) instead of raw search results.
"""

import sys
import logging
import boto3
from boto3.dynamodb.conditions import Key
from collections import Counter, defaultdict
import os

# Add shared module to path
sys.path.insert(0, '/opt/python')

from shared.decorators import api_handler, validate
from shared.api_response import success_response
from shared.utils import get_brand_config

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb')

# Fail-fast: Required environment variables
CITATIONS_TABLE = os.environ['CITATIONS_TABLE']
citations_table = dynamodb.Table(CITATIONS_TABLE)

# Optional: Brand config table for dynamic brand detection
BRAND_CONFIG_TABLE = os.environ.get('DYNAMODB_TABLE_BRAND_CONFIG')


def _get_tracked_brands():
    """Get all tracked brands from config for URL matching."""
    config = get_brand_config(BRAND_CONFIG_TABLE)
    tracked_brands = config.get('tracked_brands', {})

    brands = []
    for category in ['first_party', 'competitors']:
        for brand in tracked_brands.get(category, []):
            if isinstance(brand, str):
                brands.append({'name': brand, 'terms': [brand.lower()]})
            elif isinstance(brand, dict):
                name = brand.get('name', '')
                aliases = brand.get('aliases', [])
                terms = [name.lower()] + [a.lower() for a in aliases]
                brands.append({'name': name, 'terms': terms})

    return brands


def _detect_brand_in_url(url_lower, tracked_brands):
    """Detect brand mention in URL using tracked brands config."""
    for brand in tracked_brands:
        for term in brand['terms']:
            if term and term in url_lower:
                return brand['name']
    return 'Other'


def _scan_all_citations(keyword=None):
    """
    Scan the deduplicated Citations table.
    If keyword is provided, query by partition key for efficiency.
    Otherwise, full scan to get all citations across all keywords.
    """
    items = []

    if keyword:
        # Efficient query by partition key
        response = citations_table.query(
            KeyConditionExpression=Key('keyword').eq(keyword)
        )
        items.extend(response.get('Items', []))
        while response.get('LastEvaluatedKey'):
            response = citations_table.query(
                KeyConditionExpression=Key('keyword').eq(keyword),
                ExclusiveStartKey=response['LastEvaluatedKey']
            )
            items.extend(response.get('Items', []))
    else:
        # Full scan for all keywords
        response = citations_table.scan()
        items.extend(response.get('Items', []))
        while response.get('LastEvaluatedKey'):
            response = citations_table.scan(
                ExclusiveStartKey=response['LastEvaluatedKey']
            )
            items.extend(response.get('Items', []))

    return items


def _aggregate_citations(items, tracked_brands):
    """
    Aggregate citations by normalized_url across all keywords.
    Each item in the Citations table has: keyword, normalized_url, citation_count,
    citing_providers, priority, first_seen, last_updated.
    """
    # Group by normalized_url across keywords
    url_data = defaultdict(lambda: {
        'total_count': 0,
        'keywords': set(),
        'providers': set(),
        'provider_counts': Counter(),
    })

    provider_totals = Counter()
    brand_mentions = Counter()

    for item in items:
        url = item.get('normalized_url', '')
        if not url:
            continue

        kw = item.get('keyword', '')
        count = int(item.get('citation_count', 0))
        providers = item.get('citing_providers', [])

        entry = url_data[url]
        entry['total_count'] += count
        if kw:
            entry['keywords'].add(kw)
        for p in providers:
            entry['providers'].add(p)
            entry['provider_counts'][p] += 1

        # Provider stats
        for p in providers:
            provider_totals[p] += 1

        # Brand detection
        url_lower = url.lower()
        detected_brand = _detect_brand_in_url(url_lower, tracked_brands)
        brand_mentions[detected_brand] += count

    return url_data, provider_totals, brand_mentions


@api_handler
@validate({
    'keyword': {'type': str, 'max_length': 500},
})
def handler(event, context, keyword=None):
    """
    GET /api/citations?keyword=xxx

    Returns all distinct citation URLs from the deduplicated Citations table,
    sorted by total mentions across all keywords. No server-side limit so the
    frontend receives the full dataset for client-side sorting and Excel export.
    """
    tracked_brands = _get_tracked_brands()

    # Query the deduplicated Citations table
    items = _scan_all_citations(keyword=keyword)
    logger.info(f"Fetched {len(items)} citation records from Citations table")

    # Aggregate by URL across all keywords
    url_data, provider_totals, brand_mentions = _aggregate_citations(items, tracked_brands)

    # Build sorted list of distinct URLs by total citation count
    top_urls = sorted(
        [
            {
                'url': url,
                'citation_count': data['total_count'],
                'by_provider': dict(data['provider_counts']),
                'keyword_count': len(data['keywords']),
                'keywords': sorted(list(data['keywords'])),
            }
            for url, data in url_data.items()
        ],
        key=lambda x: (-x['citation_count'], -x['keyword_count'], x['url'])
    )

    provider_stats = [
        {'provider': p, 'citation_count': c}
        for p, c in provider_totals.items()
    ]

    brand_stats = [
        {'brand': b, 'mention_count': c}
        for b, c in brand_mentions.items()
    ]

    return success_response({
        'total_citations': len(items),
        'top_urls': top_urls,
        'provider_stats': provider_stats,
        'brand_stats': brand_stats,
    }, event)
