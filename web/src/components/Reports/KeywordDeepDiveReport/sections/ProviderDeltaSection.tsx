import type { BrandMentionsResponse } from '../../../../types';
import { ReportSection } from '../../layout';
import { SectionPlaceholder } from './SectionPlaceholder';

interface Props {
  readonly mentions: BrandMentionsResponse | null;
  readonly loading: boolean;
  readonly error: string | null;
}

/**
 * Per-provider ranking breakdown for first-party brands. Shows where each AI
 * engine places your brand and where it does not appear at all (a "—" cell
 * is more actionable than a missing row, because it surfaces invisibility).
 *
 * If first-party brands aren't configured, the section explains why nothing
 * is shown rather than rendering a confusing empty table.
 */
export function ProviderDeltaSection({
  mentions, loading, error 
}: Props) {
  if (loading) {
    return (
      <ReportSection title="Provider differences">
        <SectionPlaceholder variant="loading" message="Loading provider data…" />
      </ReportSection>
    );
  }

  if (error) {
    return (
      <ReportSection title="Provider differences">
        <SectionPlaceholder variant="error" message={error} />
      </ReportSection>
    );
  }

  if (!mentions) {
    return null;
  }

  const firstParty = mentions.aggregated.first_party_brands;
  if (firstParty.length === 0) {
    return (
      <ReportSection title="Provider differences">
        <SectionPlaceholder
          variant="empty"
          message="No first-party brand mentions for this keyword. Either the brand isn't appearing in any AI response, or no first-party brands are configured."
        />
      </ReportSection>
    );
  }

  // Stable provider list across all first-party brands to anchor the columns.
  const providers = Array.from(
    new Set(firstParty.flatMap((brand) => brand.providers)),
  ).sort((a, b) => a.localeCompare(b));

  return (
    <ReportSection
      title="Provider differences"
      subtitle="Where each AI engine ranks your first-party brands."
    >
      <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <Th>Brand</Th>
              {providers.map((provider) => (
                <Th key={provider}>{provider}</Th>
              ))}
              <Th>Best rank</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {firstParty.map((brand) => (
              <tr key={brand.name}>
                <Td className="font-medium">{brand.name}</Td>
                {providers.map((provider) => {
                  const appearance = brand.appearances.find(
                    (a) => a.provider === provider,
                  );
                  return (
                    <Td key={provider}>
                      {appearance ? `#${appearance.rank}` : '—'}
                    </Td>
                  );
                })}
                <Td className="font-medium">#{brand.best_rank}</Td>
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
