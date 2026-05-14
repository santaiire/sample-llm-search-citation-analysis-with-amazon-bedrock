import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { renderHook } from '@testing-library/react';
import { useBrandVisibilityReport } from './useBrandVisibilityReport';

vi.mock('../../../hooks/useVisibilityMetrics', () => ({useVisibilityMetrics: vi.fn()}));
vi.mock('../../../hooks/useHistoricalTrends', () => ({useHistoricalTrends: vi.fn()}));

import { useVisibilityMetrics } from '../../../hooks/useVisibilityMetrics';
import { useHistoricalTrends } from '../../../hooks/useHistoricalTrends';

const mockVisibility = useVisibilityMetrics as ReturnType<typeof vi.fn>;
const mockTrends = useHistoricalTrends as ReturnType<typeof vi.fn>;

describe('useBrandVisibilityReport', () => {
  const fetchVisibilityMetrics = vi.fn();
  const fetchHistoricalTrends = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockVisibility.mockReturnValue({
      data: {
        keyword: 'shoes',
        summary: { first_party_avg_score: 50 } 
      },
      loading: false,
      error: null,
      fetchVisibilityMetrics,
    });
    mockTrends.mockReturnValue({
      data: {
        trend_data: [],
        summary: {
          current_score: 50,
          change: 0 
        } 
      },
      loading: false,
      error: null,
      fetchHistoricalTrends,
    });
  });

  it('fetches visibility and trends in per-keyword mode', () => {
    renderHook(() => useBrandVisibilityReport('best running shoes'));
    expect(fetchVisibilityMetrics).toHaveBeenCalledWith('best running shoes');
  });

  it('fetches keyword-scoped trends in per-keyword mode', () => {
    renderHook(() => useBrandVisibilityReport('best running shoes'));
    expect(fetchHistoricalTrends).toHaveBeenCalledWith('best running shoes', 'day', 30);
  });

  it('skips visibility fetch in all-keywords mode to avoid N+1', () => {
    renderHook(() => useBrandVisibilityReport(null));
    expect(fetchVisibilityMetrics).not.toHaveBeenCalled();
  });

  it('fetches cross-keyword trends in all-keywords mode', () => {
    renderHook(() => useBrandVisibilityReport(null));
    expect(fetchHistoricalTrends).toHaveBeenCalledWith(undefined, 'day', 30);
  });

  it('reports ready=true once both slices have settled in per-keyword mode', () => {
    const { result } = renderHook(() => useBrandVisibilityReport('shoes'));
    expect(result.current.ready).toBe(true);
  });

  it('reports ready=false when trends slice is still loading', () => {
    mockTrends.mockReturnValue({
      data: null,
      loading: true,
      error: null,
      fetchHistoricalTrends,
    });
    const { result } = renderHook(() => useBrandVisibilityReport('shoes'));
    expect(result.current.ready).toBe(false);
  });
});
