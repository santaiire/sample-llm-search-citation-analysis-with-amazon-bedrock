import type { ReportsOverviewResponse } from '../../../../api/reports';
import type { Recommendation } from '../../../../types';
import {
  ReportSection, SectionPlaceholder 
} from '../../layout';

interface Props {
  readonly data: ReportsOverviewResponse | null;
  readonly loading: boolean;
  readonly error: string | null;
}

/**
 * The "what to do next" panel — the report's call to action. Top three
 * rule-based recommendations from the aggregator, with priority,
 * description, expected action, and impact in a card layout that
 * survives print pagination thanks to `avoid-break-inside`.
 */
export function NextActionsSection({
  data, loading, error 
}: Props) {
  if (loading) {
    return (
      <ReportSection title="Next actions">
        <SectionPlaceholder variant="loading" message="Loading recommendations…" />
      </ReportSection>
    );
  }

  if (error) {
    return (
      <ReportSection title="Next actions">
        <SectionPlaceholder variant="error" message={error} />
      </ReportSection>
    );
  }

  if (!data || data.top_recommendations.length === 0) {
    return (
      <ReportSection title="Next actions">
        <SectionPlaceholder
          variant="empty"
          message="No outstanding recommendations. The visibility plan is on track."
        />
      </ReportSection>
    );
  }

  return (
    <ReportSection
      title="Next actions"
      subtitle="Top three recommendations from the analysis engine, ordered by priority."
      startNewPage
    >
      <ol className="space-y-3 list-decimal list-inside">
        {data.top_recommendations.map((rec) => (
          <RecommendationCard key={`${rec.title}::${rec.action}`} rec={rec} />
        ))}
      </ol>
    </ReportSection>
  );
}

function RecommendationCard({ rec }: { readonly rec: Recommendation }) {
  return (
    <li className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800 avoid-break-inside">
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          {rec.title}
        </h3>
        <PriorityBadge priority={rec.priority} />
      </div>
      <p className="text-sm text-gray-700 dark:text-gray-300">{rec.description}</p>
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div>
          <p className="font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Action
          </p>
          <p className="text-gray-700 dark:text-gray-300 mt-1">{rec.action}</p>
        </div>
        <div>
          <p className="font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Expected impact
          </p>
          <p className="text-gray-700 dark:text-gray-300 mt-1">{rec.impact}</p>
        </div>
      </div>
    </li>
  );
}

function PriorityBadge({ priority }: { readonly priority: 'high' | 'medium' | 'low' }) {
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
