import { usePrintMode } from '../../../hooks/usePrintMode';
import { ReportLayout } from '../layout';
import { useExecutiveSummary } from './useExecutiveSummary';
import { HeadlineSection } from './sections/HeadlineSection';
import { WinsAndGapsSection } from './sections/WinsAndGapsSection';
import { NextActionsSection } from './sections/NextActionsSection';

/**
 * Executive Summary report — the single-page deck a CMO or VP Marketing
 * would print before a quarterly business review. Sources its data from
 * `/reports/overview`, the consolidated aggregator endpoint, so it
 * doesn't replicate cross-keyword aggregation logic on the client.
 *
 * Three sections, in this order:
 *   1. Headline — overall score, 30-day movement, breadth.
 *   2. Top wins and gaps — three improvers, three decliners.
 *   3. Next actions — top three recommendations.
 *
 * Designed to fit on two printed pages: sections 1+2 on the first,
 * section 3 on the second (via `startNewPage` on NextActionsSection).
 */
export function ExecutiveSummaryReport() {
  const data = useExecutiveSummary();

  usePrintMode({ ready: data.ready });

  return (
    <ReportLayout
      title="Executive Summary"
      subtitle="The one-page state of brand visibility across AI search engines. For quarterly reviews and exec stand-ups."
    >
      <HeadlineSection
        data={data.data}
        loading={data.loading}
        error={data.error}
      />
      <WinsAndGapsSection
        data={data.data}
        loading={data.loading}
        error={data.error}
      />
      <NextActionsSection
        data={data.data}
        loading={data.loading}
        error={data.error}
      />
    </ReportLayout>
  );
}
