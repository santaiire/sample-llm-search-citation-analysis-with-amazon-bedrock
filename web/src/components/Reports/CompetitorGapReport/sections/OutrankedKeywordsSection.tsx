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
 * Keywords where this competitor outranks every first-party brand,
 * sorted by rank delta descending so the biggest gaps anchor the
 * top of the table — those are the keywords where the strategist
 * would invest first.
 */
export function OutrankedKeywordsSection({
  rollup, loading, error 
}: Props) {
  if (loading) {
    return (
      <ReportSection title="Outranked keywords">
        <SectionPlaceholder variant="loading" message="Loading…" />
      </ReportSection>
    );
  }

  if (error) {
    return (
      <ReportSection title="Outranked keywords">
        <SectionPlaceholder variant="error" message={error} />
      </ReportSection>
    );
  }

  if (!rollup) return null;
  if (rollup.outranked_keywords.length === 0) {
    return (
      <ReportSection
        title="Outranked keywords"
        subtitle="No keywords where this competitor beats us right now."
      >
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Maintain current investment on the keywords already covered.
        </p>
      </ReportSection>
    );
  }

  return (
    <ReportSection
      title="Outranked keywords"
      subtitle="Keywords where this competitor's best rank beats every first-party brand. Largest gap to us first."
    >
      <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <Th>Keyword</Th>
              <Th>Their rank</Th>
              <Th>Our rank</Th>
              <Th>Delta</Th>
              <Th>Providers</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {rollup.outranked_keywords.map((row) => (
              <tr key={row.keyword}>
                <Td className="font-medium">{row.keyword}</Td>
                <Td>#{row.their_best_rank}</Td>
                <Td>{row.our_best_rank ? `#${row.our_best_rank}` : '—'}</Td>
                <Td>
                  <span className="text-red-700 dark:text-red-400 font-mono font-semibold">
                    {row.rank_delta === null ? '—' : `+${row.rank_delta}`}
                  </span>
                </Td>
                <Td className="text-xs">{row.providers.join(', ') || '—'}</Td>
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
    <td className={`px-3 py-2 text-gray-700 dark:text-gray-300 ${className}`}>
      {children}
    </td>
  );
}
