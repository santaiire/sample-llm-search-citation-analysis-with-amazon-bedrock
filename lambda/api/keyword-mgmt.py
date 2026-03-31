"""
Keyword Management Consolidated API Lambda

Routes:
- GET /api/keywords -> get-keywords handler
- POST/PUT/DELETE /api/keywords/* -> manage-keywords handler
- POST/GET/DELETE /api/keyword-research/* -> keyword-research handler
"""

import importlib.util
import os
import sys
import logging

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

ROUTE_MAP = {
    '/api/keyword-research': 'keyword-research.py',
    '/api/keywords': None,  # Handled below based on method
}

_handler_cache = {}
_THIS_DIR = os.path.dirname(os.path.abspath(__file__))


def _get_handler(filename):
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
    resource = event.get('resource', '')
    path = event.get('path', '')
    method = event.get('httpMethod', 'GET')

    logger.info(f"Routing: resource={resource}, path={path}, method={method}")

    # keyword-research routes take priority (longer prefix)
    if resource.startswith('/api/keyword-research') or path.startswith('/api/keyword-research'):
        return _get_handler('keyword-research.py')(event, context)

    # /api/keywords routes: GET goes to get-keywords, mutations go to manage-keywords
    if resource.startswith('/api/keywords') or path.startswith('/api/keywords'):
        if method == 'GET' and not (event.get('pathParameters') or {}).get('id'):
            return _get_handler('get-keywords.py')(event, context)
        return _get_handler('manage-keywords.py')(event, context)

    logger.error(f"No route matched for resource={resource}, path={path}")
    return {
        'statusCode': 404,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': '{"error": "Route not found"}'
    }
