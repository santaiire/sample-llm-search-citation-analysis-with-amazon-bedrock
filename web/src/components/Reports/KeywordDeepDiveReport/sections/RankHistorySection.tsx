import type { HistoricalTrendsResponse } from '../../../../types';
import { ReportSection } from '../../layout';
import { SectionPlaceholder } from './SectionPlaceholder';

interface Props {
  readonly trends: HistoricalTrendsResponse | null;
  readonly loading: boolean;
  readonly error: string | null;
}

/**
 * 30-day visibility-score history. Renders as a compact table rather than a
 * chart for the first version: tables print reliably to PDF without canvas
 * sizing surprises and are easier to scan in a printed report.
 *
 * We sample at most 14 evenly spaced points so the table fits on a page
 * even for accounts with many analysis runs per day. The summary line above
 * the table preserves the exact min/max/average so detail isn't lost.
 */
const MAX_ROWS = 14;

export function RankHistorySection({
  trends, loading, error 
}: Props) {
  if (loading) {
    return (
      <ReportSection
        title="Rank history"
        subtitle="How this keyword's visibility has moved over the last 30 days."
      >
        <SectionPlaceholder variant="loading" message="Loading trend data…" />
      </ReportSection>
    );
  }

  if (error) {
    return (
      <ReportSection title="Rank history">
        <SectionPlaceholder variant="error" message={error} />
      </ReportSection>
    );
  }

  const trendData = trends?.trend_data ?? [];
  if (trendData.length === 0) {
    return (
      <ReportSection title="Rank history">
        <SectionPlaceholder
          variant="empty"
          message="Not enough history yet — at least two analysis runs are needed to draw a trend."
        />
      </ReportSection>
    );
  }

  const sampled = sampleEvenly(trendData, MAX_ROWS);
  const summary = trends?.summary;

  return (
    <ReportSection
      title="Rank history"
      subtitle="How this keyword's visibility has moved over the last 30 days."
    >
      {summary && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          Average score{' '}
          <span className="font-medium text-gray-900 dark:text-white">
            {summary.average_score.toFixed(1)}
          </span>
          {' · '}
          Range{' '}
          <span className="font-medium text-gray-900 dark:text-white">
            {summary.min_score.toFixed(1)}–{summary.max_score.toFixed(1)}
          </span>
        </p>
      )}
      <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <Th>Period</Th>
              <Th>Score</Th>
              <Th>Mentions</Th>
              <Th>Best rank</Th>
              <Th>Providers</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {sampled.map((point) => (
              <tr key={point.period}>
                <Td>{point.period}</Td>
                <Td className="font-medium">{point.visibility_score.toFixed(1)}</Td>
                <Td>{point.total_mentions}</Td>
                <Td>{point.best_rank ?? '—'}</Td>
                <Td>{point.provider_count}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ReportSection>
  );
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

function sampleEvenly<T>(items: ReadonlyArray<T>, max: number): T[] {
  if (items.length <= max) return [...items];
  const step = (items.length - 1) / (max - 1);
  return Array.from({ length: max }, (_, i) => items[Math.round(i * step)]);
}
