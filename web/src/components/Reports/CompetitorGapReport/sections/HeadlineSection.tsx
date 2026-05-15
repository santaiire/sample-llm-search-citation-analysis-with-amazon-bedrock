import type { CompetitorRollup } from '../../../../api/reports';
import {
  ReportSection, SectionPlaceholder 
} from '../../layout';

interface Props {
  readonly competitor: string;
  readonly rollup: CompetitorRollup | null;
  readonly keywordsAnalyzed: number;
  readonly loading: boolean;
  readonly error: string | null;
}

/**
 * Three-number headline: how many keywords this competitor outranks
 * us on, how many sources cite them but not us, and the count of
 * "high lift" outreach targets in their list. Lifts are filtered
 * with priority = 'high' so the metric reflects work that actually
 * matters.
 */
export function HeadlineSection({
  competitor, rollup, keywordsAnalyzed, loading, error,
}: Props) {
  if (loading) {
    return (
      <ReportSection title="Headline">
        <SectionPlaceholder variant="loading" message="Loading rollup…" />
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

  if (!rollup) {
    return (
      <ReportSection title="Headline">
        <SectionPlaceholder
          variant="empty"
          message="No rollup data yet. Run an analysis to populate."
        />
      </ReportSection>
    );
  }

  const outrankedCount = rollup.outranked_keywords.length;
  const exclusiveCount = rollup.exclusive_sources.length;
  const highLiftCount = rollup.exclusive_sources.filter(
    (s) => s.priority === 'high',
  ).length;

  return (
    <ReportSection title="Headline">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
        Across {keywordsAnalyzed} tracked keywords, vs <strong>{competitor}</strong>:
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Metric
          label="Outranked keywords"
          value={outrankedCount}
          accent={outrankedCount > 0 ? 'negative' : 'neutral'}
          footnote="Keywords where they beat our best rank"
        />
        <Metric
          label="Exclusive sources"
          value={exclusiveCount}
          accent={exclusiveCount > 0 ? 'negative' : 'neutral'}
          footnote="Sources citing them but not us"
        />
        <Metric
          label="High-lift targets"
          value={highLiftCount}
          accent={highLiftCount > 0 ? 'positive' : 'neutral'}
          footnote="High-priority outreach opportunities"
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
  accent,
}: {
  readonly label: string;
  readonly value: number;
  readonly footnote: string;
  readonly accent: Accent;
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

function accentClassFor(accent: Accent): string {
  if (accent === 'positive') return 'text-emerald-700 dark:text-emerald-400';
  if (accent === 'negative') return 'text-red-700 dark:text-red-400';
  return 'text-gray-900 dark:text-white';
}
