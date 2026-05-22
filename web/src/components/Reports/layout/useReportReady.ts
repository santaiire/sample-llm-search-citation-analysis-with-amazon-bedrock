/**
 * Combine the loading state of every data hook a report depends on into a
 * single "is the page ready to print" boolean.
 *
 * Reports compose 4-7 independent fetches; each report still cares about its
 * own per-section loading UI, but for the auto-print scheduling we need one
 * aggregate signal so `usePrintMode` knows when *all* sections have settled.
 *
 * A loading flag is considered "settled" when the hook is no longer fetching
 * (`loading === false`) AND it has either produced data or surfaced an error.
 * This keeps print from firing during the brief moment between mount and the
 * first fetch starting, when `loading` is still `false` but `data` is `null`.
 */
export interface ReportDataSlice {
  loading: boolean;
  data: unknown;
  error: string | null;
}

export function useReportReady(slices: ReportDataSlice[]): boolean {
  if (slices.length === 0) return true;
  return slices.every((slice) => {
    if (slice.loading) return false;
    return slice.data !== null || slice.error !== null;
  });
}
