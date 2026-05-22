import type { HistoricalTrendsResponse } from '../../../../types';
import {
  ReportSection, SectionPlaceholder 
} from '../../layout';

interface Props {
  readonly trends: HistoricalTrendsResponse | null;
  readonly loading: boolean;
  readonly error: string | null;
}

const TOP_N = 5;

/**
 * Top improvers and top decliners side by side. The aggregator endpoint
 * (PR D) will eventually provide these directly; until then we sort the
 * `keyword_trends` array client-side by `change`. Five rows on each side
 * is the print-friendly default — enough to spot a campaign-level pattern
 * without bleeding onto a second page.
 */
export function MoversSection({
  trends, loading, error 
}: Props) {
  if (loading) {
    return (
      <ReportSection title="Top movers">
        <SectionPlaceholder variant="loading" message="Computing movers…" />
      </ReportSection>
    );
  }

  if (error) {
    return (
      <ReportSection title="Top movers">
        <SectionPlaceholder variant="error" message={error} />
      </ReportSection>
    );
  }

  const rows = trends?.keyword_trends ?? [];
  if (rows.length === 0) return null;

  const improvers = [...rows]
    .filter((r) => r.change > 0)
    .sort((a, b) => b.change - a.change)
    .slice(0, TOP_N);
  const decliners = [...rows]
    .filter((r) => r.change < 0)
    .sort((a, b) => a.change - b.change)
    .slice(0, TOP_N);

  if (improvers.length === 0 && decliners.length === 0) return null;

  return (
    <ReportSection
      title="Top movers"
      subtitle="Keywords that shifted the most in the period. The improvers list is where momentum is paying off; the decliners list is where to investigate."
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <MoverColumn
          title="Improving"
          accent="positive"
          rows={improvers}
        />
        <MoverColumn
          title="Declining"
          accent="negative"
          rows={decliners}
        />
      </div>
    </ReportSection>
  );
}

function MoverColumn({
  title,
  accent,
  rows,
}: {
  readonly title: string;
  readonly accent: 'positive' | 'negative';
  readonly rows: ReadonlyArray<{
    keyword: string;
    current_score: number;
    change: number;
    change_percent: number;
  }>;
}) {
  if (rows.length === 0) {
    return (
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
          {title}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          No keywords moved in this direction.
        </p>
      </div>
    );
  }

  const accentClass = accent === 'positive'
    ? 'text-emerald-700 dark:text-emerald-400'
    : 'text-red-700 dark:text-red-400';

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 avoid-break-inside">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
        {title}
      </h3>
      <ul className="space-y-2">
        {rows.map((row) => (
          <li
            key={row.keyword}
            className="flex items-baseline justify-between gap-3 text-sm"
          >
            <span className="text-gray-700 dark:text-gray-300 truncate">
              {row.keyword}
            </span>
            <span className={`font-mono font-semibold flex-shrink-0 ${accentClass}`}>
              {row.change > 0 ? '+' : ''}
              {row.change.toFixed(1)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
