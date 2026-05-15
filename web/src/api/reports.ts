/**
 * Reports API client functions.
 *
 * Backed by the consolidated stats-insights Lambda. The endpoints here
 * return pre-aggregated payloads tailored for the print reports —
 * /reports/overview composes data that would otherwise require multiple
 * round-trips (trends + recommendations) to assemble client-side.
 */
import { apiGet } from './client';
import type {
  Recommendation, TrendDirection 
} from '../types';

export interface ReportsOverviewMover {
  keyword: string;
  trend_direction: TrendDirection;
  current_score: number;
  change: number;
  change_percent: number;
}

export interface ReportsOverviewSummary {
  improving_count: number;
  declining_count: number;
  stable_count: number;
}

export interface ReportsOverviewResponse {
  generated_at: string;
  period_type: 'day' | 'week' | 'month';
  days_analyzed: number;
  keywords_analyzed: number;
  overall_score: number;
  previous_score: number;
  change: number;
  change_percent: number;
  trend_direction: TrendDirection;
  summary: ReportsOverviewSummary;
  top_improving: ReportsOverviewMover[];
  top_declining: ReportsOverviewMover[];
  top_recommendations: Recommendation[];
}

export interface ReportsOverviewParams {
  readonly days?: number;
  readonly period?: 'day' | 'week' | 'month';
  readonly top?: number;
}

/**
 * Fetch the cross-keyword executive-summary rollup. Used by the Executive
 * Summary report and the Brand Visibility all-keywords variant.
 */
export function fetchReportsOverview(
  params: ReportsOverviewParams = {},
  signal?: AbortSignal,
): Promise<ReportsOverviewResponse> {
  const query: string[] = [];
  if (params.days !== undefined) query.push(`days=${params.days}`);
  if (params.period) query.push(`period=${params.period}`);
  if (params.top !== undefined) query.push(`top=${params.top}`);
  const qs = query.length > 0 ? `?${query.join('&')}` : '';
  return apiGet<ReportsOverviewResponse>(`/reports/overview${qs}`, { signal });
}


// ---------------------------------------------------------------------------
// Competitor rollup
// ---------------------------------------------------------------------------

export interface CompetitorOutrankedKeyword {
  keyword: string;
  their_best_rank: number;
  our_best_rank: number | null;
  rank_delta: number | null;
  providers: string[];
}

export interface CompetitorExclusiveSource {
  keyword: string;
  url: string;
  domain: string;
  priority: 'high' | 'medium' | 'low';
  citation_count: number;
  provider_count: number;
  providers: string[];
  lift_score: number;
}

export interface CompetitorRollup {
  competitor: string;
  outranked_keywords: CompetitorOutrankedKeyword[];
  exclusive_sources: CompetitorExclusiveSource[];
  outreach_targets: CompetitorExclusiveSource[];
}

export interface CompetitorReportSingleResponse {
  generated_at: string;
  keywords_analyzed: number;
  competitor: string;
  rollup: CompetitorRollup;
}

export interface CompetitorReportAllResponse {
  generated_at: string;
  keywords_analyzed: number;
  competitors: string[];
  rollups: CompetitorRollup[];
}

export type CompetitorReportResponse =
  | CompetitorReportSingleResponse
  | CompetitorReportAllResponse;

export interface CompetitorReportParams {
  readonly competitor?: string;
  readonly keywordLimit?: number;
}

/**
 * Fetch the competitor rollup. When `competitor` is omitted the server
 * returns a `rollups[]` payload covering every configured competitor;
 * when provided, it returns a single `rollup` for that competitor.
 */
export function fetchCompetitorRollup(
  params: CompetitorReportParams = {},
  signal?: AbortSignal,
): Promise<CompetitorReportResponse> {
  const query: string[] = [];
  if (params.competitor) {
    query.push(`competitor=${encodeURIComponent(params.competitor)}`);
  }
  if (params.keywordLimit !== undefined) {
    query.push(`keyword_limit=${params.keywordLimit}`);
  }
  const qs = query.length > 0 ? `?${query.join('&')}` : '';
  return apiGet<CompetitorReportResponse>(`/reports/competitor${qs}`, { signal });
}

export function isSingleCompetitorResponse(
  response: CompetitorReportResponse,
): response is CompetitorReportSingleResponse {
  return 'rollup' in response;
}
