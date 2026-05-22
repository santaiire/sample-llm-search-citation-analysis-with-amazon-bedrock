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

interface KeywordCoverage {
  keyword: string;
  gapCount: number;
  highPriorityGaps: number;
  briefCount: number;
  ideaCount: number;
}

/**
 * The "where do we stand" matrix: every tracked keyword that appears in
 * citation gaps OR existing briefs OR open ideas, joined into one row.
 *
 * Highlights:
 *  - Rows where there are gaps but no brief and no idea: blocked work.
 *  - Rows where there is a brief but no gap data: content investments
 *    that may or may not be paying off (worth re-running analysis).
 *
 * The join is client-side because the citation-gaps and content-studio
 * endpoints don't share a foreign key. A backend rollup would be cleaner
 * but isn't blocking for the v1 of this report.
 */
export function CoverageMapSection({
  gaps,
  ideas,
  history,
  loading,
  error,
}: Props) {
  if (loading) {
    return (
      <ReportSection title="Coverage map">
        <SectionPlaceholder variant="loading" message="Building coverage map…" />
      </ReportSection>
    );
  }

  if (error) {
    return (
      <ReportSection title="Coverage map">
        <SectionPlaceholder variant="error" message={error} />
      </ReportSection>
    );
  }

  const rows = buildCoverageRows(gaps, ideas, history);

  if (rows.length === 0) {
    return null;
  }

  return (
    <ReportSection
      title="Coverage map"
      subtitle="Per-keyword snapshot: where the gaps are, what briefs already exist, and what ideas are queued up."
    >
      <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <Th>Keyword</Th>
              <Th>Gaps</Th>
              <Th>High priority</Th>
              <Th>Briefs ready</Th>
              <Th>Ideas queued</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {rows.map((row) => (
              <tr
                key={row.keyword}
                className={statusRowClass(row)}
              >
                <Td className="font-medium">{row.keyword}</Td>
                <Td>{row.gapCount}</Td>
                <Td>{row.highPriorityGaps}</Td>
                <Td>{row.briefCount}</Td>
                <Td>{row.ideaCount}</Td>
                <Td className="text-xs">{statusLabelFor(row)}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ReportSection>
  );
}

function buildCoverageRows(
  gaps: CitationGapsResponse | null,
  ideas: ReadonlyArray<ContentIdea>,
  history: ReadonlyArray<ContentStudioHistory>,
): KeywordCoverage[] {
  const map = new Map<string, KeywordCoverage>();

  const ensureRow = (keyword: string): KeywordCoverage => {
    const existing = map.get(keyword);
    if (existing) return existing;
    const fresh: KeywordCoverage = {
      keyword,
      gapCount: 0,
      highPriorityGaps: 0,
      briefCount: 0,
      ideaCount: 0,
    };
    map.set(keyword, fresh);
    return fresh;
  };

  for (const summary of gaps?.keyword_summaries ?? []) {
    const row = ensureRow(summary.keyword);
    row.gapCount = summary.gap_count;
    row.highPriorityGaps = summary.high_priority_gaps;
  }

  for (const item of history) {
    if (item.status !== 'generated') continue;
    const row = ensureRow(item.keyword);
    row.briefCount += 1;
  }

  for (const idea of ideas) {
    if (!idea.keyword) continue;
    const row = ensureRow(idea.keyword);
    row.ideaCount += 1;
  }

  // Sort: most blocked first (highest gaps with no briefs), then alphabetic.
  return Array.from(map.values()).sort((a, b) => {
    const aBlocked = a.gapCount > 0 && a.briefCount === 0 ? 1 : 0;
    const bBlocked = b.gapCount > 0 && b.briefCount === 0 ? 1 : 0;
    if (aBlocked !== bBlocked) return bBlocked - aBlocked;
    if (b.highPriorityGaps !== a.highPriorityGaps) {
      return b.highPriorityGaps - a.highPriorityGaps;
    }
    return a.keyword.localeCompare(b.keyword);
  });
}

function statusLabelFor(row: KeywordCoverage): string {
  if (row.gapCount === 0 && row.briefCount > 0) return 'Covered';
  if (row.gapCount > 0 && row.briefCount === 0 && row.ideaCount === 0) {
    return 'Blocked';
  }
  if (row.gapCount > 0 && row.ideaCount > 0 && row.briefCount === 0) {
    return 'Planned';
  }
  if (row.gapCount > 0 && row.briefCount > 0) return 'In progress';
  return '—';
}

function statusRowClass(row: KeywordCoverage): string {
  if (row.gapCount > 0 && row.briefCount === 0 && row.ideaCount === 0) {
    return 'bg-red-50 dark:bg-red-950/20';
  }
  return '';
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
