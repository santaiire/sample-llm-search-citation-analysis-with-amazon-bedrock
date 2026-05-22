import type {
  VisibilityMetricsResponse,
  HistoricalTrendsResponse,
} from '../../../../types';
import {
  ReportSection, SectionPlaceholder 
} from '../../layout';

interface Props {
  readonly visibility: VisibilityMetricsResponse | null;
  readonly trends: HistoricalTrendsResponse | null;
  readonly loading: boolean;
  readonly error: string | null;
}

/**
 * Per-keyword headline metrics: first-party score, share of voice, gap to
 * competitor average. These three numbers tell the marketing-lead reader
 * "are we ahead, level, or behind" before they read anything else in the
 * report.
 */
export function PerKeywordHeadlineSection({
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
          message="No visibility data found for this keyword."
        />
      </ReportSection>
    );
  }

  const { summary } = visibility;
  const fpScore = summary.first_party_avg_score;
  const compScore = summary.competitor_avg_score;
  const gap = (fpScore - compScore).toFixed(1);
  const gapAccent: 'positive' | 'negative' = fpScore >= compScore ? 'positive' : 'negative';
  const change = trends?.summary.change ?? 0;
  const changeText = formatChangeFootnote(change);

  return (
    <ReportSection title="Headline">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Metric
          label="First-party visibility"
          value={`${fpScore.toFixed(1)}`}
          accent="neutral"
          footnote={changeText}
        />
        <Metric
          label="Share of voice"
          value={`${summary.first_party_total_sov.toFixed(1)}%`}
          accent="neutral"
          footnote={`Competitor SOV: ${summary.competitor_total_sov.toFixed(1)}%`}
        />
        <Metric
          label="Gap to competitor avg"
          value={`${gap.startsWith('-') ? '' : '+'}${gap}`}
          accent={gapAccent}
          footnote={`Competitor avg: ${compScore.toFixed(1)}`}
        />
      </div>
    </ReportSection>
  );
}

function Metric({
  label,
  value,
  footnote,
  accent,
}: {
  readonly label: string;
  readonly value: string;
  readonly footnote: string;
  readonly accent: 'positive' | 'negative' | 'neutral';
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

function accentClassFor(accent: 'positive' | 'negative' | 'neutral'): string {
  if (accent === 'positive') return 'text-emerald-700 dark:text-emerald-400';
  if (accent === 'negative') return 'text-red-700 dark:text-red-400';
  return 'text-gray-900 dark:text-white';
}

function formatChangeFootnote(change: number): string {
  if (change === 0) return 'No 30-day change';
  const sign = change > 0 ? '+' : '';
  return `${sign}${change.toFixed(1)} over 30 days`;
}
