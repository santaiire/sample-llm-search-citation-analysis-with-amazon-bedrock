"""
Citations & Content Consolidated API Lambda

Routes requests to the appropriate handler based on API Gateway resource path.
Consolidates 5 separate Lambdas into one:
- GET /api/citations -> get-citations handler
- GET /api/url-breakdown -> get-url-breakdown handler
- GET /api/searches -> get-searches handler
- GET /api/crawled-content -> get-crawled-content handler
- GET /api/raw-responses/* -> browse-raw-responses handler
"""

import importlib.util
import os
import sys
import logging

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

ROUTE_MAP = {
    '/api/citations': 'get-citations.py',
    '/api/url-breakdown': 'get-url-breakdown.py',
    '/api/searches': 'get-searches.py',
    '/api/crawled-content': 'get-crawled-content.py',
    '/api/raw-responses': 'browse-raw-responses.py',
}

_handler_cache = {}
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
    """Router handler that dispatches based on API Gateway resource path."""
    resource = event.get('resource', '')
    path = event.get('path', '')

    logger.info(f"Routing request: resource={resource}, path={path}")

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
