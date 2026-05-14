import type { PersonaRankingsResponse } from '../../../../types';
import { ReportSection } from '../../layout';
import { SectionPlaceholder } from '../../layout/SectionPlaceholder';

interface Props {
  readonly personas: PersonaRankingsResponse | null;
  readonly loading: boolean;
  readonly error: string | null;
}

/**
 * Persona impact only earns a slot in the report when persona choice
 * actually changes the ranking story. If every persona ranks first-party
 * brands roughly the same, we suppress the section to avoid bloating the
 * report with a table that says "personas don't matter here".
 *
 * Threshold: at least one first-party brand has a best/worst rank delta
 * of >= 3 across personas. That's enough for a marketer to consider
 * tweaking persona prompts to favor the better-performing one.
 */
const MEANINGFUL_DELTA = 3;

export function PersonaImpactSection({
  personas, loading, error 
}: Props) {
  if (loading) {
    return (
      <ReportSection title="Persona impact">
        <SectionPlaceholder variant="loading" message="Loading persona breakdown…" />
      </ReportSection>
    );
  }

  if (error) {
    return (
      <ReportSection title="Persona impact">
        <SectionPlaceholder variant="error" message={error} />
      </ReportSection>
    );
  }

  if (!personas || personas.personas.length <= 1) {
    return null;
  }

  const firstParty = personas.cross_persona_summary.brands.filter(
    (brand) => brand.classification === 'first_party',
  );

  if (firstParty.length === 0) {
    return null;
  }

  const meaningful = firstParty.some(
    (brand) => brand.worst_rank - brand.best_rank >= MEANINGFUL_DELTA,
  );

  if (!meaningful) {
    return (
      <ReportSection
        title="Persona impact"
        subtitle="Persona choice does not materially change ranking for this keyword."
      >
        <p className="text-sm text-gray-600 dark:text-gray-300">
          First-party brands rank within{' '}
          <span className="font-medium">{MEANINGFUL_DELTA}</span>{' '}
          positions across all configured personas — persona-specific
          optimisation is unlikely to move the needle here.
        </p>
      </ReportSection>
    );
  }

  return (
    <ReportSection
      title="Persona impact"
      subtitle="Where in your persona library does this keyword perform best, and where does it slip?"
    >
      <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <Th>First-party brand</Th>
              <Th>Best rank</Th>
              <Th>Worst rank</Th>
              <Th>Δ</Th>
              <Th>Best persona</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {firstParty.map((brand) => {
              const delta = brand.worst_rank - brand.best_rank;
              const highlight = delta >= MEANINGFUL_DELTA;
              return (
                <tr
                  key={brand.name}
                  className={highlight ? 'bg-amber-50 dark:bg-amber-950/20' : ''}
                >
                  <Td className="font-medium">{brand.name}</Td>
                  <Td>{brand.best_rank}</Td>
                  <Td>{brand.worst_rank}</Td>
                  <Td>{delta}</Td>
                  <Td>{brand.best_persona}</Td>
                </tr>
              );
            })}
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
