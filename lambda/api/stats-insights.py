"""
Stats & Insights Consolidated API Lambda

Routes requests to the appropriate handler based on API Gateway resource path.
Consolidates 6 separate Lambdas into one to reduce CloudFormation resource count:
- GET /api/stats -> get-stats handler
- GET /api/visibility -> get-visibility-metrics handler
- GET /api/prompt-insights -> get-prompt-insights handler
- GET /api/citation-gaps -> get-citation-gaps handler
- GET /api/recommendations -> get-recommendations handler
- GET /api/trends -> get-historical-trends handler
"""

import importlib.util
import os
import sys
import logging

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Map resource paths to handler module filenames
ROUTE_MAP = {
    '/api/stats': 'get-stats.py',
    '/api/visibility': 'get-visibility-metrics.py',
    '/api/prompt-insights': 'get-prompt-insights.py',
    '/api/citation-gaps': 'get-citation-gaps.py',
    '/api/recommendations': 'get-recommendations.py',
    '/api/trends': 'get-historical-trends.py',
}

# Cache loaded handler functions
_handler_cache = {}

# Directory where this file lives (Lambda deployment root)
_THIS_DIR = os.path.dirname(os.path.abspath(__file__))


def _get_handler(filename):
    """Load a handler from a hyphenated Python file and cache it."""
    if filename not in _handler_cache:
        filepath = os.path.join(_THIS_DIR, filename)
        module_name = filename.replace('-', '_').replace('.py', '')
        spec = importlib.util.spec_from_file_location(module_name, filepath)
        mod = importlib.util.module_from_spec(spec)
        sys.modules[module_name] = mod
        spec.loader.exec_module(mod)
        _handler_cache[filename] = mod.handler
    return _handler_cache[filename]


def handler(event, context):
    """
    Router handler that dispatches to the correct sub-handler
    based on the API Gateway resource path.
    """
    resource = event.get('resource', '')
    path = event.get('path', '')

    logger.info(f"Routing request: resource={resource}, path={path}")

    # Try resource first (API Gateway template path), then fall back to actual path
    for route_path, filename in ROUTE_MAP.items():
        if resource.startswith(route_path) or path.startswith(route_path):
            logger.info(f"Matched route {route_path} -> {filename}")
            sub_handler = _get_handler(filename)
            return sub_handler(event, context)

    logger.error(f"No route matched for resource={resource}, path={path}")
    return {
        'statusCode': 404,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        },
        'body': '{"error": "Route not found"}'
    }
