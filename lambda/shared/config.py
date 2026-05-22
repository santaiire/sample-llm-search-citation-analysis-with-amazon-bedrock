"""Configuration for Lambda functions."""

import os
from dataclasses import dataclass


# Centralized AI provider constants
# Used for validation, iteration, and provider count calculations
class Provider:
    """AI provider identifiers - single source of truth."""
    # LLM Providers (generate AI responses with citations)
    OPENAI = 'openai'
    PERPLEXITY = 'perplexity'
    GEMINI = 'gemini'
    CLAUDE = 'claude'

    # Search Providers (return search results directly)
    BRAVE = 'brave'
    TAVILY = 'tavily'
    EXA = 'exa'
    SERPAPI = 'serpapi'
    FIRECRAWL = 'firecrawl'

# List of LLM providers (for iteration)
LLM_PROVIDERS: list[str] = [
    Provider.OPENAI,
    Provider.PERPLEXITY,
    Provider.GEMINI,
    Provider.CLAUDE
]

# List of search providers (for iteration)
SEARCH_PROVIDERS: list[str] = [
    Provider.BRAVE,
    Provider.TAVILY,
    Provider.EXA,
    Provider.SERPAPI,
    Provider.FIRECRAWL
]

# All providers combined (for backward compatibility)
PROVIDERS: list[str] = LLM_PROVIDERS + SEARCH_PROVIDERS


@dataclass
class LambdaConfig:
    """Configuration settings for Lambda functions."""

    # AWS Configuration
    region: str = os.environ.get("AWS_REGION", "us-west-2")

    # Note: LLM model IDs are resolved via shared.models (ModelRole + ModelTier).
    # Env overrides: BEDROCK_MODEL_<ROLE> or BEDROCK_TIER_<ROLE>.

    # Browser Configuration
    browser_session_timeout: int = 3600  # 1 hour

    # DynamoDB Table Names (from environment variables)
    @property
    def crawled_content_table(self) -> str:
        return os.environ.get('DYNAMODB_TABLE_CRAWLED_CONTENT', 'CitationAnalysis-CrawledContent')
