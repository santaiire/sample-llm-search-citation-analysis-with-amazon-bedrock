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
 * All-keywords overview header — improving / declining / stable counts plus
 * the average score. Reads from `/trends` (no keyword) which already
 * computes these aggregates server-side.
 */
export function CrossKeywordHeadlineSection({
  trends, loading, error 
}: Props) {
  if (loading) {
    return (
      <ReportSection title="Headline">
        <SectionPlaceholder variant="loading" message="Loading aggregate trends…" />
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

  const overall = trends?.overall;
  if (!overall) {
    return (
      <ReportSection title="Headline">
        <SectionPlaceholder
          variant="empty"
          message="No aggregate trend data yet. Run an analysis to populate."
        />
      </ReportSection>
    );
  }

  return (
    <ReportSection title="Headline">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Metric label="Average score" value={overall.avg_score.toFixed(1)} />
        <Metric label="Improving" value={overall.improving_count.toString()} accent="positive" />
        <Metric label="Declining" value={overall.declining_count.toString()} accent="negative" />
        <Metric label="Stable" value={overall.stable_count.toString()} />
      </div>
    </ReportSection>
  );
}

function Metric({
  label,
  value,
  accent = 'neutral',
}: {
  readonly label: string;
  readonly value: string;
  readonly accent?: 'positive' | 'negative' | 'neutral';
}) {
  const accentClass = accentClassFor(accent);
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
      <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </p>
      <p className={`text-2xl font-semibold mt-1 ${accentClass}`}>{value}</p>
    </div>
  );
}

function accentClassFor(accent: 'positive' | 'negative' | 'neutral'): string {
  if (accent === 'positive') return 'text-emerald-700 dark:text-emerald-400';
  if (accent === 'negative') return 'text-red-700 dark:text-red-400';
  return 'text-gray-900 dark:text-white';
}
