import type { HistoricalTrendsResponse } from '../../../../types';
import {
  ReportSection, SectionPlaceholder 
} from '../../layout';

interface Props {
  readonly trends: HistoricalTrendsResponse | null;
  readonly loading: boolean;
  readonly error: string | null;
}

/**
 * Per-keyword leaderboard for the all-keywords variant. Sorted by current
 * score descending so the strongest performers anchor the top of the page.
 *
 * Movers (`change` rows where the magnitude is >= 5 points) are highlighted
 * with a positive/negative tint so a reader can spot the keywords that
 * actually shifted in the period without computing the deltas themselves.
 */
const MOVE_THRESHOLD = 5;

export function PerKeywordTableSection({
  trends, loading, error 
}: Props) {
  if (loading) {
    return (
      <ReportSection title="Per-keyword leaderboard">
        <SectionPlaceholder variant="loading" message="Loading per-keyword rankings…" />
      </ReportSection>
    );
  }

  if (error) {
    return (
      <ReportSection title="Per-keyword leaderboard">
        <SectionPlaceholder variant="error" message={error} />
      </ReportSection>
    );
  }

  const rows = trends?.keyword_trends ?? [];
  if (rows.length === 0) {
    return null;
  }

  const sorted = [...rows].sort((a, b) => b.current_score - a.current_score);

  return (
    <ReportSection
      title="Per-keyword leaderboard"
      subtitle="Current score and 30-day change for every tracked keyword. Sorted strongest to weakest. Movers (≥5 points) are highlighted."
    >
      <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <Th>Keyword</Th>
              <Th>Score</Th>
              <Th>Change</Th>
              <Th>%</Th>
              <Th>Direction</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {sorted.map((row) => (
              <tr key={row.keyword} className={moverRowClass(row.change)}>
                <Td className="font-medium">{row.keyword}</Td>
                <Td>{row.current_score.toFixed(1)}</Td>
                <Td>
                  {row.change > 0 ? '+' : ''}
                  {row.change.toFixed(1)}
                </Td>
                <Td>
                  {row.change_percent > 0 ? '+' : ''}
                  {row.change_percent.toFixed(1)}%
                </Td>
                <Td>
                  <DirectionBadge direction={row.trend_direction} />
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ReportSection>
  );
}

function moverRowClass(change: number): string {
  if (Math.abs(change) < MOVE_THRESHOLD) return '';
  if (change > 0) return 'bg-emerald-50 dark:bg-emerald-950/20';
  return 'bg-red-50 dark:bg-red-950/20';
}

function Th({ children }: { readonly children: React.ReactNode }) {
  return (
    <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
      {children}
    </th>
  );
}

function Td({
  children,
  className = '',
}: {
  readonly children: React.ReactNode;
  readonly className?: string;
}) {
  return (
    <td className={`px-3 py-2 text-gray-700 dark:text-gray-300 ${className}`}>
      {children}
    </td>
  );
}

function DirectionBadge({direction,}: {readonly direction: 'improving' | 'declining' | 'stable';}) {
  const styles = directionStyles(direction);
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium uppercase tracking-wide ${styles}`}
    >
      {direction}
    </span>
  );
}

function directionStyles(d: 'improving' | 'declining' | 'stable'): string {
  if (d === 'improving') {
    return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
  }
  if (d === 'declining') {
    return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300';
  }
  return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
}
