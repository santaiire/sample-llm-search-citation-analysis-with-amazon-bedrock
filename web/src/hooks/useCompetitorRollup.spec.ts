import {
  describe, it, expect, vi, beforeEach, afterEach,
} from 'vitest';
import {
  renderHook, act 
} from '@testing-library/react';
import { useCompetitorRollup } from './useCompetitorRollup';

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

const SINGLE_RESPONSE = {
  generated_at: '2026-05-15T07:00:00Z',
  keywords_analyzed: 4,
  competitor: 'Adidas',
  rollup: {
    competitor: 'Adidas',
    outranked_keywords: [],
    exclusive_sources: [],
    outreach_targets: [],
  },
};

const ALL_RESPONSE = {
  generated_at: '2026-05-15T07:00:00Z',
  keywords_analyzed: 4,
  competitors: ['Adidas', 'Asics'],
  rollups: [
    {
      competitor: 'Adidas',
      outranked_keywords: [],
      exclusive_sources: [],
      outreach_targets: [],
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

describe('useCompetitorRollup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns null data before fetch', () => {
    const { result } = renderHook(() => useCompetitorRollup());
    expect(result.current.data).toBeNull();
  });

  it('passes the competitor name in the URL when provided', async () => {
    mockFetch.mockResolvedValue(mockOk(SINGLE_RESPONSE));
    const { result } = renderHook(() => useCompetitorRollup());
    await act(async () => {
      await result.current.fetchCompetitorRollup('Adidas');
    });
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('competitor=Adidas');
  });

  it('omits competitor param when not provided', async () => {
    mockFetch.mockResolvedValue(mockOk(ALL_RESPONSE));
    const { result } = renderHook(() => useCompetitorRollup());
    await act(async () => {
      await result.current.fetchCompetitorRollup();
    });
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).not.toContain('competitor=');
  });

  it('stores the parsed single-competitor response', async () => {
    mockFetch.mockResolvedValue(mockOk(SINGLE_RESPONSE));
    const { result } = renderHook(() => useCompetitorRollup());
    await act(async () => {
      await result.current.fetchCompetitorRollup('Adidas');
    });
    expect(result.current.data).toStrictEqual(SINGLE_RESPONSE);
  });

  it('stores the parsed all-competitors response', async () => {
    mockFetch.mockResolvedValue(mockOk(ALL_RESPONSE));
    const { result } = renderHook(() => useCompetitorRollup());
    await act(async () => {
      await result.current.fetchCompetitorRollup();
    });
    expect(result.current.data).toStrictEqual(ALL_RESPONSE);
  });

  it('records the error message when the response is not OK', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({}),
    } as unknown as Response);
    const { result } = renderHook(() => useCompetitorRollup());
    await act(async () => {
      await result.current.fetchCompetitorRollup('Unknown');
    });
    expect(result.current.error).toBeTruthy();
  });

  it('rejects responses missing both rollup and rollups fields', async () => {
    mockFetch.mockResolvedValue(mockOk({ unrelated: 'shape' }));
    const { result } = renderHook(() => useCompetitorRollup());
    await act(async () => {
      await result.current.fetchCompetitorRollup();
    });
    expect(result.current.error).toBeTruthy();
  });
});
