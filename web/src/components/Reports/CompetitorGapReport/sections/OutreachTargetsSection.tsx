import type { CompetitorRollup } from '../../../../api/reports';
import {
  ReportSection, SectionPlaceholder 
} from '../../layout';

interface Props {
  readonly rollup: CompetitorRollup | null;
  readonly loading: boolean;
  readonly error: string | null;
}

/**
 * Outreach targets — the prioritised list of sources that cite this
 * competitor but not first-party brands. The lift score is already
 * computed server-side; we just render it. Top targets get their own
 * page because each card is meaty (URL, domain, providers) and
 * pagination across them is what the strategist will pin to a wall.
 */
export function OutreachTargetsSection({
  rollup, loading, error 
}: Props) {
  if (loading) {
    return (
      <ReportSection title="Top outreach targets">
        <SectionPlaceholder variant="loading" message="Loading…" />
      </ReportSection>
    );
  }

  if (error) {
    return (
      <ReportSection title="Top outreach targets">
        <SectionPlaceholder variant="error" message={error} />
      </ReportSection>
    );
  }

  if (!rollup) return null;
  if (rollup.outreach_targets.length === 0) {
    return (
      <ReportSection
        title="Top outreach targets"
        subtitle="No outreach targets identified."
      >
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Either no sources cite this competitor without first-party
          coverage, or the citation-gap analysis hasn&apos;t run yet.
        </p>
      </ReportSection>
    );
  }

  return (
    <ReportSection
      title="Top outreach targets"
      subtitle="Sources to pitch first. Lift = provider coverage scaled by citation count. Higher lift means a single placement moves more keywords."
      startNewPage
    >
      <div className="space-y-3">
        {rollup.outreach_targets.map((target) => (
          <TargetCard key={`${target.url}::${target.keyword}`} target={target} />
        ))}
      </div>
    </ReportSection>
  );
}

function TargetCard({target,}: {readonly target: CompetitorRollup['outreach_targets'][number];}) {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800 avoid-break-inside">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            {target.domain}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {target.url}
          </p>
        </div>
        <PriorityBadge priority={target.priority} />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 text-xs">
        <Metric label="Lift" value={target.lift_score.toFixed(2)} />
        <Metric label="Citations" value={target.citation_count.toString()} />
        <Metric label="Providers" value={target.provider_count.toString()} />
        <Metric label="Keyword" value={target.keyword} />
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string;
}) {
  return (
    <div>
      <p className="font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        {label}
      </p>
      <p className="text-gray-900 dark:text-white mt-0.5 truncate">{value}</p>
    </div>
  );
}

function PriorityBadge({priority,}: {readonly priority: 'high' | 'medium' | 'low';}) {
  const styles = priorityStyles(priority);
  return (
    <span
      className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold uppercase ${styles}`}
    >
      {priority}
    </span>
  );
}

function priorityStyles(priority: 'high' | 'medium' | 'low'): string {
  if (priority === 'high') {
    return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300';
  }
  if (priority === 'medium') {
    return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300';
  }
  return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
}
