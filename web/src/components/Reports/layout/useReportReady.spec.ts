import {
  describe, it, expect 
} from 'vitest';
import { renderHook } from '@testing-library/react';
import { useReportReady } from './useReportReady';

/**
 * `useReportReady` is the single source of truth for "all the report's data
 * has loaded — go ahead and auto-print". The semantics tested here:
 *
 * - empty input is trivially ready (nothing to wait for)
 * - any slice still loading => not ready
 * - a slice that has settled with a value (data !== null) is ready
 * - a slice that has settled with an error is also ready (don't block print
 *   on a failed fetch — the section will render its error state)
 * - a slice that has settled with neither data nor error is NOT ready —
 *   that's the brief moment between mount and the first fetch starting,
 *   when `loading` is still false but `data` is still null
 */
describe('useReportReady', () => {
  it('returns true when slice list is empty', () => {
    const { result } = renderHook(() => useReportReady([]));
    expect(result.current).toBe(true);
  });

  it('returns false when any slice is loading', () => {
    const { result } = renderHook(() =>
      useReportReady([
        {
          loading: false,
          data: { ok: true },
          error: null 
        },
        {
          loading: true,
          data: null,
          error: null 
        },
      ]),
    );
    expect(result.current).toBe(false);
  });

  it('returns true when every slice has resolved data', () => {
    const { result } = renderHook(() =>
      useReportReady([
        {
          loading: false,
          data: { a: 1 },
          error: null 
        },
        {
          loading: false,
          data: { b: 2 },
          error: null 
        },
      ]),
    );
    expect(result.current).toBe(true);
  });

  it('treats a settled error as ready (so print is not blocked by a failed fetch)', () => {
    const { result } = renderHook(() =>
      useReportReady([
        {
          loading: false,
          data: null,
          error: 'boom' 
        },
        {
          loading: false,
          data: { ok: true },
          error: null 
        },
      ]),
    );
    expect(result.current).toBe(true);
  });

  it('returns false when a slice is settled but has no data and no error', () => {
    const { result } = renderHook(() =>
      useReportReady([
        {
          loading: false,
          data: null,
          error: null 
        },
      ]),
    );
    expect(result.current).toBe(false);
  });
});
