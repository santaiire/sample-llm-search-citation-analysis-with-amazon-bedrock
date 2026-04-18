"""
Health Check Endpoint

Simple health check for monitoring and load balancer integration.
Returns 200 OK with system status.
"""

import json
import logging

from shared.utils import get_timestamp

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


def handler(event, context):
    """
    Health check handler.

    Returns:
        200 OK with timestamp and status
    """
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
        'body': json.dumps({
            'status': 'healthy',
            'timestamp': get_timestamp(),
            'service': 'citation-analysis-api',
        })
    }
