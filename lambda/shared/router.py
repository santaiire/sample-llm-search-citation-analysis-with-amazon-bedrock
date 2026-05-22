"""
Shared helpers for consolidated API Lambda routers.

Several API Lambdas act as thin routers that dispatch to sub-handlers living
in hyphenated Python files in the same directory (e.g. `manage-schedule.py`).
This module centralizes the boilerplate for loading and caching those
sub-handlers so each router file can stay small and focused on its route map.

Usage:
    from shared.router import HandlerLoader

    _handlers = HandlerLoader(__file__)

    def handler(event, context):
        ...
        return _handlers.get('trigger-analysis.py')(event, context)
"""

from __future__ import annotations

import importlib.util
import os
import sys
from collections.abc import Callable


class HandlerLoader:
    """
    Lazily loads and caches Lambda sub-handlers from sibling .py files.

    Files with hyphenated names (not valid Python module names) are loaded
    via `importlib.util.spec_from_file_location`. Each file is loaded at most
    once per Lambda container (the function is cached), matching the previous
    per-router `_handler_cache` behavior.
    """

    def __init__(self, router_file: str) -> None:
        """
        Args:
            router_file: The router's `__file__`. Sub-handlers are resolved
                relative to this file's directory.
        """
        self._dir = os.path.dirname(os.path.abspath(router_file))
        self._cache: dict[str, Callable] = {}

    def get(self, filename: str) -> Callable:
        """
        Return the `handler` callable exported by `filename`.

        Args:
            filename: Sub-handler filename (e.g. 'manage-schedule.py').

        Returns:
            The `handler` function from the loaded module.
        """
        cached = self._cache.get(filename)
        if cached is not None:
            return cached

        filepath = os.path.join(self._dir, filename)
        module_name = filename.replace('-', '_').replace('.py', '')
        spec = importlib.util.spec_from_file_location(module_name, filepath)
        if spec is None or spec.loader is None:
            raise ImportError(f"Could not load handler spec for {filepath!r}")

        module = importlib.util.module_from_spec(spec)
        sys.modules[module_name] = module
        spec.loader.exec_module(module)

        handler_fn = getattr(module, 'handler', None)
        if handler_fn is None:
            raise AttributeError(
                f"Module {filename!r} has no 'handler' attribute"
            )

        self._cache[filename] = handler_fn
        return handler_fn


__all__ = ['HandlerLoader', 'path_contains_segment', 'path_matches_route']


def path_contains_segment(segment: str, request_path: str) -> bool:
    """Return True iff ``segment`` appears as a complete path segment in ``request_path``.

    A segment is a match iff one of:
    - The request path equals the segment exactly.
    - The request path ends with the segment preceded by ``/``
      (``endswith`` is sufficient when segment starts with ``/``).
    - The request path contains ``segment + '/'`` (interior child).

    This is the core primitive both `path_matches_route` and the
    tuple-key `route_handler` matcher are built on. Centralizing it
    prevents the substring-collision bug from creeping back in
    (`/api/stats-bogus` matching `/api/stats`). See audit item 26.

    Precondition: ``segment`` starts with ``/``.
    """
    if not request_path:
        return False
    if request_path == segment:
        return True
    # `/ideas` will not end-match `/my-ideas` because the leading `/` of
    # segment forces a boundary character. Works for any segment that
    # begins with `/`.
    if request_path.endswith(segment):
        return True
    return (segment + '/') in request_path


def path_matches_route(route_path: str, resource: str, path: str) -> bool:
    """Return True iff ``resource`` or ``path`` is ``route_path`` or a child.

    Used by consolidated routers (`stats-insights`, `citations-content`,
    etc.) which test both the API Gateway template ``resource`` and the
    concrete request ``path`` against a route prefix.

    The match predicate here is prefix-based (route matches itself or any
    segment-child), NOT suffix-based — it's the opposite of
    `path_contains_segment`, which is for sub-route matching within a
    longer path.

    Args:
        route_path: The route prefix (e.g. ``/api/stats``, no trailing slash).
        resource: API Gateway ``resource`` field.
        path: API Gateway ``path`` field.
    """
    for candidate in (resource, path):
        if not candidate:
            continue
        if candidate == route_path:
            return True
        # Segment-child match: `/api/stats/summary` is under `/api/stats`
        # but `/api/stats-bogus` is not.
        if candidate.startswith(route_path + '/'):
            return True
    return False
