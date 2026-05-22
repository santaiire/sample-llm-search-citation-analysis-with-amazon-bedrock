import type {
  ReportsOverviewMover,
  ReportsOverviewResponse,
} from '../../../../api/reports';
import {
  ReportSection, SectionPlaceholder 
} from '../../layout';

interface Props {
  readonly data: ReportsOverviewResponse | null;
  readonly loading: boolean;
  readonly error: string | null;
}

/**
 * The "what worked / what didn't" pair. Surfaces the top three improvers
 * and decliners side-by-side so the reader can match a campaign decision
 * to a measurable outcome (or its absence) on a single page.
 */
export function WinsAndGapsSection({
  data, loading, error 
}: Props) {
  if (loading) {
    return (
      <ReportSection title="Top wins and gaps">
        <SectionPlaceholder variant="loading" message="Loading movers…" />
      </ReportSection>
    );
  }

  if (error) {
    return (
      <ReportSection title="Top wins and gaps">
        <SectionPlaceholder variant="error" message={error} />
      </ReportSection>
    );
  }

  if (!data) return null;

  return (
    <ReportSection
      title="Top wins and gaps"
      subtitle="Top three movers in each direction. Wins are where investment paid off; gaps are where to focus the next sprint."
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <MoverColumn
          title="Wins"
          accent="positive"
          rows={data.top_improving}
          emptyMessage="No keywords improved in the period. The next sprint should focus on the gaps panel."
        />
        <MoverColumn
          title="Gaps"
          accent="negative"
          rows={data.top_declining}
          emptyMessage="No keywords declined in the period. Maintain current investment."
        />
      </div>
    </ReportSection>
  );
}

function MoverColumn({
  title,
  accent,
  rows,
  emptyMessage,
}: {
  readonly title: string;
  readonly accent: 'positive' | 'negative';
  readonly rows: ReadonlyArray<ReportsOverviewMover>;
  readonly emptyMessage: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
          {title}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">{emptyMessage}</p>
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
