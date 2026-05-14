import type {
  CitationGapsResponse,
  ContentIdea,
  ContentStudioHistory,
} from '../../../../types';
import {
  ReportSection, SectionPlaceholder 
} from '../../layout';

interface Props {
  readonly gaps: CitationGapsResponse | null;
  readonly ideas: ReadonlyArray<ContentIdea>;
  readonly history: ReadonlyArray<ContentStudioHistory>;
  readonly loading: boolean;
  readonly error: string | null;
}

/**
 * Top-of-report summary: how many gaps the strategist needs to plan against,
 * how many briefs are already ready, and the coverage ratio. Sized so a
 * skimmer can lift the operational state in one glance — "we have 18 gaps
 * and 3 ready briefs, that's the headline".
 */
export function HeadlineSection({
  gaps,
  ideas,
  history,
  loading,
  error,
}: Props) {
  if (loading) {
    return (
      <ReportSection title="Headline">
        <SectionPlaceholder variant="loading" message="Loading content plan…" />
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

  const totalGaps = gaps?.total_gaps ?? gaps?.summary?.gap_count ?? 0;
  const highPriority = gaps?.total_high_priority
    ?? gaps?.summary?.high_priority_gaps
    ?? 0;
  const generatedBriefs = history.filter((h) => h.status === 'generated').length;
  const pendingIdeas = ideas.length;

  return (
    <ReportSection title="Headline">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Metric
          label="Citation gaps"
          value={totalGaps}
          footnote="Sources citing competitors but not us"
        />
        <Metric
          label="High priority"
          value={highPriority}
          accent="negative"
          footnote="Cited by ≥2 providers, no first-party"
        />
        <Metric
          label="Briefs ready"
          value={generatedBriefs}
          accent="positive"
          footnote="Generated content awaiting publish"
        />
        <Metric
          label="Suggested topics"
          value={pendingIdeas}
          footnote="Open ideas from Content Studio"
        />
      </div>
    </ReportSection>
  );
}

function Metric({
  label,
  value,
  footnote,
  accent = 'neutral',
}: {
  readonly label: string;
  readonly value: number;
  readonly footnote: string;
  readonly accent?: 'positive' | 'negative' | 'neutral';
}) {
  const accentClass = accentClassFor(accent);

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

function accentClassFor(accent: 'positive' | 'negative' | 'neutral'): string {
  if (accent === 'positive') return 'text-emerald-700 dark:text-emerald-400';
  if (accent === 'negative') return 'text-red-700 dark:text-red-400';
  return 'text-gray-900 dark:text-white';
}
