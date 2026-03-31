"""
Execution Management Consolidated API Lambda

Routes:
- POST /api/trigger-analysis -> trigger-analysis handler
- POST /api/trigger-keyword-analysis -> trigger-keyword-analysis handler
- GET /api/executions/{id} -> get-execution-status handler
"""

import importlib.util
import os
import sys
import logging

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

ROUTE_MAP = {
    '/api/trigger-keyword-analysis': 'trigger-keyword-analysis.py',
    '/api/trigger-analysis': 'trigger-analysis.py',
    '/api/executions': 'get-execution-status.py',
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

    logger.info(f"Routing: resource={resource}, path={path}")

    for route_path, filename in ROUTE_MAP.items():
        if resource.startswith(route_path) or path.startswith(route_path):
            return _get_handler(filename)(event, context)

    logger.error(f"No route matched for resource={resource}, path={path}")
    return {
        'statusCode': 404,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': '{"error": "Route not found"}'
    }
