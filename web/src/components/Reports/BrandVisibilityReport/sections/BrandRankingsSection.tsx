import type { VisibilityMetricsResponse } from '../../../../types';
import {
  ReportSection, SectionPlaceholder 
} from '../../layout';

interface Props {
  readonly visibility: VisibilityMetricsResponse | null;
  readonly loading: boolean;
  readonly error: string | null;
}

const MAX_BRANDS = 15;

/**
 * Per-keyword brand rankings: every brand the AI engines mentioned for this
 * keyword, with score, share of voice, best rank, mentions, providers, and
 * classification. First-party rows are tinted to make them visually
 * distinguishable from competitor and other-third-party rows in print.
 */
export function BrandRankingsSection({
  visibility, loading, error 
}: Props) {
  if (loading) {
    return (
      <ReportSection title="Brand rankings">
        <SectionPlaceholder variant="loading" message="Loading brand rankings…" />
      </ReportSection>
    );
  }

  if (error) {
    return (
      <ReportSection title="Brand rankings">
        <SectionPlaceholder variant="error" message={error} />
      </ReportSection>
    );
  }

  if (!visibility) return null;

  const brands = visibility.brands.slice(0, MAX_BRANDS);
  if (brands.length === 0) {
    return (
      <ReportSection title="Brand rankings">
        <SectionPlaceholder
          variant="empty"
          message="No brand mentions extracted for this keyword."
        />
      </ReportSection>
    );
  }

  return (
    <ReportSection
      title="Brand rankings"
      subtitle="All brands the AI engines mentioned for this keyword. First-party rows are highlighted."
    >
      <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <Th>Brand</Th>
              <Th>Score</Th>
              <Th>Share of voice</Th>
              <Th>Best rank</Th>
              <Th>Mentions</Th>
              <Th>Providers</Th>
              <Th>Type</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {brands.map((brand) => (
              <tr
                key={brand.name}
                className={brand.classification === 'first_party' ? 'bg-emerald-50 dark:bg-emerald-950/20' : ''}
              >
                <Td className="font-medium">{brand.name}</Td>
                <Td>{brand.visibility_score.toFixed(1)}</Td>
                <Td>{brand.share_of_voice.toFixed(1)}%</Td>
                <Td>{brand.best_rank ?? '—'}</Td>
                <Td>{brand.total_mentions}</Td>
                <Td>{brand.provider_count}</Td>
                <Td>
                  <ClassificationBadge classification={brand.classification} />
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
    <td className={`px-3 py-2 text-gray-700 dark:text-gray-300 ${className}`}>
      {children}
    </td>
  );
}

function ClassificationBadge({classification,}: {readonly classification: 'first_party' | 'competitor' | 'other';}) {
  const styles = badgeStyles(classification);
  const label = classification === 'first_party'
    ? 'first-party'
    : classification;
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${styles}`}
    >
      {label}
    </span>
  );
}

function badgeStyles(c: 'first_party' | 'competitor' | 'other'): string {
  if (c === 'first_party') {
    return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
  }
  if (c === 'competitor') {
    return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300';
  }
  return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
}
