import type {
  VisibilityMetricsResponse,
  HistoricalTrendsResponse,
} from '../../../../types';
import { ReportSection } from '../../layout';
import { SectionPlaceholder } from '../../layout/SectionPlaceholder';

interface Props {
  readonly visibility: VisibilityMetricsResponse | null;
  readonly trends: HistoricalTrendsResponse | null;
  readonly loading: boolean;
  readonly error: string | null;
}

/**
 * The headline answer to "how is this keyword doing right now?". Shows the
 * first-party visibility score, the period-over-period change, and the trend
 * direction. Sized to dominate the first page of the printed report so a
 * skimmer can lift the bottom-line answer without reading further.
 */
export function HeadlineSection({
  visibility, trends, loading, error,
}: Props) {
  if (loading) {
    return (
      <ReportSection title="Headline">
        <SectionPlaceholder variant="loading" message="Loading visibility…" />
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

  if (!visibility) {
    return (
      <ReportSection title="Headline">
        <SectionPlaceholder
          variant="empty"
          message="No visibility data found for this keyword. Run an analysis to populate the report."
        />
      </ReportSection>
    );
  }

  const score = visibility.summary.first_party_avg_score;
  const sov = visibility.summary.first_party_total_sov;
  const competitorScore = visibility.summary.competitor_avg_score;

  const change = trends?.summary.change ?? 0;
  const direction = trends?.trend_direction ?? 'stable';

  const scoreAccent: 'positive' | 'negative' =
    score >= competitorScore ? 'positive' : 'negative';
  const trendAccent = trendAccentFor(direction);
  const trendFootnote = formatTrendFootnote(change);

  return (
    <ReportSection title="Headline">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Metric
          label="First-party visibility"
          value={`${score.toFixed(1)}`}
          accent={scoreAccent}
          footnote={`Competitor avg: ${competitorScore.toFixed(1)}`}
        />
        <Metric
          label="Share of voice"
          value={`${sov.toFixed(1)}%`}
          footnote="Across tracked first-party brands"
        />
        <Metric
          label="30-day trend"
          value={formatTrend(direction, change)}
          accent={trendAccent}
          footnote={trendFootnote}
        />
      </div>
    </ReportSection>
  );
}

function formatTrendFootnote(change: number): string {
  if (change === 0) return 'No change since previous period';
  const sign = change > 0 ? '+' : '';
  return `${sign}${change.toFixed(1)} since previous period`;
}

function trendAccentFor(
  direction: 'improving' | 'declining' | 'stable',
): 'positive' | 'negative' | 'neutral' {
  if (direction === 'improving') return 'positive';
  if (direction === 'declining') return 'negative';
  return 'neutral';
}

function Metric({
  label,
  value,
  footnote,
  accent = 'neutral',
}: {
  readonly label: string;
  readonly value: string;
  readonly footnote: string;
  readonly accent?: 'positive' | 'negative' | 'neutral';
}) {
  const accentClass = {
    positive: 'text-emerald-700 dark:text-emerald-400',
    negative: 'text-red-700 dark:text-red-400',
    neutral: 'text-gray-900 dark:text-white',
  }[accent];

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
      <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </p>
      <p className={`text-2xl font-semibold mt-1 ${accentClass}`}>{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
        {footnote}
      </p>
    </div>
  );
}

function formatTrend(
  direction: 'improving' | 'declining' | 'stable',
  change: number,
): string {
  if (direction === 'improving') return 'Improving';
  if (direction === 'declining') return 'Declining';
  return change === 0 ? 'Stable' : 'Stable (volatile)';
}
