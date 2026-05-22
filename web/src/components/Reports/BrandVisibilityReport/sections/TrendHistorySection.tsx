import type {
  HistoricalTrendsResponse, TrendDataPoint 
} from '../../../../types';
import {
  ReportSection, SectionPlaceholder 
} from '../../layout';

interface Props {
  readonly trends: HistoricalTrendsResponse | null;
  readonly loading: boolean;
  readonly error: string | null;
}

const MAX_ROWS = 14;

/**
 * Sampled trend history for the per-keyword report. The raw `trend_data`
 * can hold up to 30 rows for a 30-day window; printing all 30 wastes a
 * full page on a near-flat curve. Sampling evenly to ≤14 rows keeps the
 * shape readable in print without losing inflection points.
 */
export function TrendHistorySection({
  trends, loading, error 
}: Props) {
  if (loading) {
    return (
      <ReportSection title="Trend history">
        <SectionPlaceholder variant="loading" message="Loading trend history…" />
      </ReportSection>
    );
  }

  if (error) {
    return (
      <ReportSection title="Trend history">
        <SectionPlaceholder variant="error" message={error} />
      </ReportSection>
    );
  }

  const points = trends?.trend_data ?? [];
  if (points.length === 0) return null;

  const sampled = sampleEvenly(points, MAX_ROWS);

  return (
    <ReportSection
      title="Trend history"
      subtitle={`Visibility score across the last ${trends?.days_analyzed ?? 30} days. Sampled to ${sampled.length} rows for print.`}
      startNewPage
    >
      <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <Th>Period</Th>
              <Th>Score</Th>
              <Th>Best rank</Th>
              <Th>Mentions</Th>
              <Th>Providers</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {sampled.map((p) => (
              <tr key={p.period}>
                <Td className="font-mono text-xs">{p.period}</Td>
                <Td>{p.visibility_score.toFixed(1)}</Td>
                <Td>{p.best_rank ?? '—'}</Td>
                <Td>{p.total_mentions}</Td>
                <Td>{p.provider_count}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ReportSection>
  );
}

function sampleEvenly(points: TrendDataPoint[], max: number): TrendDataPoint[] {
  if (points.length <= max) return points;
  const step = (points.length - 1) / (max - 1);
  return Array.from({ length: max }, (_, i) => points[Math.round(i * step)]);
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
