import {
  useState, useCallback,
} from 'react';
import {
  API_BASE_URL,
  authenticatedFetch,
  getErrorMessage,
  ApiRequestError,
} from '../infrastructure';
import type { ReportsOverviewResponse } from '../api/reports';

interface BackendErrorResponse {error: string;}

function isBackendErrorResponse(data: unknown): data is BackendErrorResponse {
  return typeof data === 'object'
    && data !== null
    && 'error' in data
    && typeof (data as BackendErrorResponse).error === 'string';
}

function isReportsOverviewResponse(data: unknown): data is ReportsOverviewResponse {
  if (typeof data !== 'object' || data === null) return false;
  if ('error' in data) return false;
  return 'overall_score' in data
    && 'top_improving' in data
    && 'top_declining' in data
    && 'top_recommendations' in data;
}

/**
 * Imperative hook for the cross-keyword reports-overview rollup. Pairs
 * with the `/reports/overview` aggregator endpoint and is consumed by
 * the Executive Summary report and (optionally) the Brand Visibility
 * all-keywords variant.
 *
 * Imperative (rather than auto-fetching) so the report component can
 * compose this slice with `useReportReady` exactly the same way as
 * other report slices, and so a refresh button can re-run the fetch
 * without unmount/remount.
 */
export function useReportsOverview() {
  const [data, setData] = useState<ReportsOverviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReportsOverview = useCallback(async (
    days = 30,
    period: 'day' | 'week' | 'month' = 'day',
    top = 3,
  ): Promise<ReportsOverviewResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        days: days.toString(),
        period,
        top: top.toString(),
      });
      const response = await authenticatedFetch(
        `${API_BASE_URL}/reports/overview?${params}`,
      );
      if (!response.ok) {
        throw new ApiRequestError(
          'Failed to fetch reports overview',
          response.status,
        );
      }
      const json: unknown = await response.json();
      if (isBackendErrorResponse(json)) {
        throw new ApiRequestError(json.error);
      }
      if (!isReportsOverviewResponse(json)) {
        throw new ApiRequestError('Invalid response format');
      }
      setData(json);
      return json;
    } catch (err) {
      const message = getErrorMessage(err, 'visibility');
      setError(message);
      // Surfaces network/CORS issues during development; the report's
      // SectionPlaceholder takes over for the user-facing error message.
      console.error('[reportsOverview] Error fetching overview:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    data,
    loading,
    error,
    fetchReportsOverview,
  };
}
