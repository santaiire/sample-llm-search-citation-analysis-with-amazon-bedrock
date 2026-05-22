import {
  describe, it, expect, vi, beforeEach, afterEach,
} from 'vitest';
import {
  renderHook, act 
} from '@testing-library/react';
import { useReportsOverview } from './useReportsOverview';

vi.mock('../infrastructure', async () => {
  const actual = await vi.importActual('../infrastructure');
  return {
    ...actual,
    API_BASE_URL: 'https://api.test.com',
    authenticatedFetch: vi.fn(),
  };
});

import { authenticatedFetch } from '../infrastructure';

const mockFetch = authenticatedFetch as ReturnType<typeof vi.fn>;

const SAMPLE_OVERVIEW = {
  generated_at: '2026-05-14T12:00:00Z',
  period_type: 'day',
  days_analyzed: 30,
  keywords_analyzed: 4,
  overall_score: 57.5,
  previous_score: 57.0,
  change: 0.5,
  change_percent: 0.9,
  trend_direction: 'stable',
  summary: {
    improving_count: 2,
    declining_count: 1,
    stable_count: 1 
  },
  top_improving: [
    {
      keyword: 'a',
      current_score: 80,
      change: 8,
      change_percent: 11.1,
      trend_direction: 'improving' 
    },
  ],
  top_declining: [
    {
      keyword: 'c',
      current_score: 30,
      change: -10,
      change_percent: -25,
      trend_direction: 'declining' 
    },
  ],
  top_recommendations: [
    {
      type: 'gap',
      priority: 'high',
      title: 'r1',
      description: 'd',
      action: 'a',
      impact: 'i' 
    },
  ],
};

function mockOk(payload: unknown) {
  return {
    ok: true,
    status: 200,
    json: async () => payload,
  } as unknown as Response;
}

describe('useReportsOverview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns null data before fetch', () => {
    const { result } = renderHook(() => useReportsOverview());
    expect(result.current.data).toBeNull();
  });

  it('passes days, period, and top into the request URL', async () => {
    mockFetch.mockResolvedValue(mockOk(SAMPLE_OVERVIEW));
    const { result } = renderHook(() => useReportsOverview());
    await act(async () => {
      await result.current.fetchReportsOverview(60, 'week', 5);
    });
    const calledWith = mockFetch.mock.calls[0][0] as string;
    expect(calledWith).toContain('days=60');
    expect(calledWith).toContain('period=week');
    expect(calledWith).toContain('top=5');
  });

  it('targets the /reports/overview endpoint path', async () => {
    mockFetch.mockResolvedValue(mockOk(SAMPLE_OVERVIEW));
    const { result } = renderHook(() => useReportsOverview());
    await act(async () => {
      await result.current.fetchReportsOverview();
    });
    const calledWith = mockFetch.mock.calls[0][0] as string;
    expect(calledWith).toContain('/reports/overview');
  });

  it('uses defaults of 30 days, day period, top=3 when no args supplied', async () => {
    mockFetch.mockResolvedValue(mockOk(SAMPLE_OVERVIEW));
    const { result } = renderHook(() => useReportsOverview());
    await act(async () => {
      await result.current.fetchReportsOverview();
    });
    const calledWith = mockFetch.mock.calls[0][0] as string;
    expect(calledWith).toContain('days=30');
    expect(calledWith).toContain('period=day');
    expect(calledWith).toContain('top=3');
  });

  it('stores the parsed overview payload after a successful fetch', async () => {
    mockFetch.mockResolvedValue(mockOk(SAMPLE_OVERVIEW));
    const { result } = renderHook(() => useReportsOverview());
    await act(async () => {
      await result.current.fetchReportsOverview();
    });
    expect(result.current.data?.overall_score).toBe(57.5);
  });

  it('returns the parsed payload from the fetch promise', async () => {
    mockFetch.mockResolvedValue(mockOk(SAMPLE_OVERVIEW));
    const { result } = renderHook(() => useReportsOverview());
    const holder: { value: typeof SAMPLE_OVERVIEW | null } = { value: null };
    await act(async () => {
      holder.value = await result.current.fetchReportsOverview();
    });
    expect(holder.value?.top_improving).toHaveLength(1);
  });

  it('returns null and records error when the response is not OK', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    } as unknown as Response);
    const { result } = renderHook(() => useReportsOverview());
    const holder: { value: unknown } = { value: 'unset' };
    await act(async () => {
      holder.value = await result.current.fetchReportsOverview();
    });
    expect(holder.value).toBeNull();
    expect(result.current.error).toBeTruthy();
  });

  it('returns null and records error when the backend body is a {error} shape', async () => {
    mockFetch.mockResolvedValue(mockOk({ error: 'No data' }));
    const { result } = renderHook(() => useReportsOverview());
    await act(async () => {
      await result.current.fetchReportsOverview();
    });
    expect(result.current.error).toBeTruthy();
    expect(result.current.data).toBeNull();
  });

  it('rejects responses missing the overall_score field as malformed', async () => {
    mockFetch.mockResolvedValue(mockOk({ unrelated: 'shape' }));
    const { result } = renderHook(() => useReportsOverview());
    await act(async () => {
      await result.current.fetchReportsOverview();
    });
    expect(result.current.error).toBeTruthy();
  });

  it('clears loading flag once the fetch settles', async () => {
    mockFetch.mockResolvedValue(mockOk(SAMPLE_OVERVIEW));
    const { result } = renderHook(() => useReportsOverview());
    await act(async () => {
      await result.current.fetchReportsOverview();
    });
    expect(result.current.loading).toBe(false);
  });
});
