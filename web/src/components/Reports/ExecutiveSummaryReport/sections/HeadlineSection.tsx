import type { ReportsOverviewResponse } from '../../../../api/reports';
import {
  ReportSection, SectionPlaceholder 
} from '../../layout';

interface Props {
  readonly data: ReportsOverviewResponse | null;
  readonly loading: boolean;
  readonly error: string | null;
}

/**
 * Top-of-deck hero metrics. The CMO question is "are we winning, level,
 * or losing right now"; three numbers answer that without scrolling:
 * overall score, the headline movement, and the breadth of motion
 * (improving vs declining keyword counts).
 */
export function HeadlineSection({
  data, loading, error 
}: Props) {
  if (loading) {
    return (
      <ReportSection title="Headline">
        <SectionPlaceholder variant="loading" message="Loading executive summary…" />
      </ReportSection>
    );
  }

  if (error) {
    return (
      <ReportSection title="Headline">
        <SectionPlaceholder variant="error" message={error} />
      </ReportSection>
    );
  }

  if (!data) {
    return (
      <ReportSection title="Headline">
        <SectionPlaceholder
          variant="empty"
          message="No analysis data yet. Run an analysis to populate the executive summary."
        />
      </ReportSection>
    );
  }

  const movementAccent = movementAccentFor(data.change);
  const movementText = formatMovement(data.change, data.change_percent);

  return (
    <ReportSection title="Headline">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Metric
          label="Overall visibility"
          value={data.overall_score.toFixed(1)}
          footnote={`Across ${data.keywords_analyzed} keywords, ${data.days_analyzed} days`}
        />
        <Metric
          label="30-day movement"
          value={movementText}
          accent={movementAccent}
          footnote={data.trend_direction.toUpperCase()}
        />
        <Metric
          label="Keyword breadth"
          value={`${data.summary.improving_count}/${data.summary.improving_count + data.summary.declining_count + data.summary.stable_count}`}
          accent={data.summary.improving_count >= data.summary.declining_count ? 'positive' : 'negative'}
          footnote={`${data.summary.declining_count} declining, ${data.summary.stable_count} stable`}
        />
      </div>
    </ReportSection>
  );
}

type Accent = 'positive' | 'negative' | 'neutral';

function Metric({
  label,
  value,
  footnote,
  accent = 'neutral',
}: {
  readonly label: string;
  readonly value: string;
  readonly footnote: string;
  readonly accent?: Accent;
}) {
  const accentClass = accentClassFor(accent);
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
      <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </p>
      <p className={`text-2xl font-semibold mt-1 ${accentClass}`}>{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{footnote}</p>
    </div>
  );
}

function movementAccentFor(change: number): Accent {
  if (change > 0) return 'positive';
  if (change < 0) return 'negative';
  return 'neutral';
}

function formatMovement(change: number, changePct: number): string {
  if (change === 0) return 'No change';
  const sign = change > 0 ? '+' : '';
  return `${sign}${change.toFixed(1)} (${sign}${changePct.toFixed(1)}%)`;
}

function accentClassFor(accent: Accent): string {
  if (accent === 'positive') return 'text-emerald-700 dark:text-emerald-400';
  if (accent === 'negative') return 'text-red-700 dark:text-red-400';
  return 'text-gray-900 dark:text-white';
}
