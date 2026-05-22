import type { CitationGapsResponse } from '../../../../types';
import {
  ReportSection, SectionPlaceholder 
} from '../../layout';

interface Props {
  readonly gaps: CitationGapsResponse | null;
  readonly loading: boolean;
  readonly error: string | null;
}

const MAX_TARGETS = 15;

/**
 * The actionable outreach list: top citation gaps ordered by priority then
 * citation count. Each row tells the strategist *why* the source matters
 * (provider count, citing competitors) so triage doesn't require clicking
 * through to the citation-gaps view.
 *
 * We take from `top_gaps` when the report is across-all-keywords (the
 * cross-keyword shape of the response) and fall back to `gaps` for the
 * single-keyword shape.
 */
export function TopCitationTargetsSection({
  gaps, loading, error 
}: Props) {
  if (loading) {
    return (
      <ReportSection
        title="Top citation targets"
        subtitle="Where to focus PR / outreach effort, ordered by impact."
      >
        <SectionPlaceholder variant="loading" message="Loading citation gaps…" />
      </ReportSection>
    );
  }

  if (error) {
    return (
      <ReportSection title="Top citation targets">
        <SectionPlaceholder variant="error" message={error} />
      </ReportSection>
    );
  }

  const sources = (gaps?.top_gaps ?? gaps?.gaps ?? []).slice(0, MAX_TARGETS);

  if (sources.length === 0) {
    return (
      <ReportSection title="Top citation targets">
        <SectionPlaceholder
          variant="empty"
          message="No citation gaps found. Either every source already cites first-party brands, or no analysis has run for these keywords yet."
        />
      </ReportSection>
    );
  }

  return (
    <ReportSection
      title="Top citation targets"
      subtitle="Sources citing competitors but not us, ordered by priority. Getting first-party brands mentioned on the high-priority sources should produce the biggest visibility lift."
    >
      <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <Th>Priority</Th>
              <Th>Domain &amp; URL</Th>
              <Th>Keyword</Th>
              <Th>Cites</Th>
              <Th>Providers</Th>
              <Th>Competitors named</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {sources.map((source) => (
              <tr key={source.url}>
                <Td>
                  <PriorityBadge priority={source.priority} />
                </Td>
                <Td>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {source.domain}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-md">
                    {source.url}
                  </p>
                </Td>
                <Td className="text-xs">{source.keyword ?? '—'}</Td>
                <Td>{source.citation_count}</Td>
                <Td>{source.provider_count}</Td>
                <Td className="text-xs">
                  {source.competitor_brands.length > 0
                    ? source.competitor_brands.slice(0, 3).join(', ')
                    : '—'}
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ReportSection>
  );
}

function Th({ children }: { readonly children: React.ReactNode }) {
  return (
    <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
      {children}
    </th>
  );
}

function Td({
  children,
  className = '',
}: {
  readonly children: React.ReactNode;
  readonly className?: string;
}) {
  return (
    <td className={`px-3 py-2 text-gray-700 dark:text-gray-300 align-top ${className}`}>
      {children}
    </td>
  );
}

function PriorityBadge({ priority }: { readonly priority: 'high' | 'medium' | 'low' }) {
  const styles = priorityStyles(priority);
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold uppercase ${styles}`}
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
