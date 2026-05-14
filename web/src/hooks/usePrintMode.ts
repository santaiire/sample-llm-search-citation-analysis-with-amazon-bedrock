import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Detects whether the current route is in print mode (`?print=1`) and, if so,
 * automatically opens the browser's print dialog after a short delay.
 *
 * The delay gives lazy-loaded views, charts, and async data hooks time to
 * render before the screenshot the print dialog snapshots.
 *
 * @param ready  Optional flag that callers can use to gate auto-print until
 *               their data has loaded. When `false` the hook waits; when
 *               `true` it kicks the print dialog after `printDelayMs`.
 * @param printDelayMs  Default 1500ms — long enough for chart.js renders to
 *                      complete on a typical dashboard view but short enough
 *                      that the user doesn't feel a lag.
 *
 * @returns `isPrintMode` flag for the caller to decide layout choices.
 */
export function usePrintMode({
  ready = true,
  printDelayMs = 1500,
}: {
  ready?: boolean;
  printDelayMs?: number 
} = {}): { isPrintMode: boolean } {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const isPrintMode = params.get('print') === '1';

  useEffect(() => {
    if (!isPrintMode || !ready) {
      return;
    }

    const timer = window.setTimeout(() => {
      window.print();
    }, printDelayMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isPrintMode, ready, printDelayMs]);

  return { isPrintMode };
}
