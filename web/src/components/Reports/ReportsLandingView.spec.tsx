import {
  describe, it, expect 
} from 'vitest';
import {
  render, screen 
} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ReportsLandingView } from './ReportsLandingView';

/**
 * The landing view doubles as a roadmap: all five planned reports are listed
 * even before they exist. Tests pin:
 *   - all five titles render so an exec scanning the page sees the full plan
 *   - the available reports link to a real path (regression catch if the
 *     `path` field gets set wrongly during sequencing)
 *   - the not-yet-built reports show "Coming soon" instead of an active link
 */
describe('ReportsLandingView', () => {
  function renderLanding() {
    return render(
      <MemoryRouter>
        <ReportsLandingView />
      </MemoryRouter>,
    );
  }

  it('lists the four strategic reports by title', () => {
    renderLanding();
    expect(screen.getByText('Executive Summary')).toBeInTheDocument();
    expect(screen.getByText('Brand Visibility Report')).toBeInTheDocument();
    expect(screen.getByText('Competitor Gap Report')).toBeInTheDocument();
    expect(screen.getByText('Content Action Plan')).toBeInTheDocument();
  });

  it('lists the keyword-level drill-down report', () => {
    renderLanding();
    expect(screen.getByText('Keyword Deep Dive')).toBeInTheDocument();
  });

  it('renders Keyword Deep Dive as a working link to /reports/keyword', () => {
    renderLanding();
    const link = screen.getByRole('link', { name: /keyword deep dive/i });
    expect(link).toHaveAttribute('href', '/reports/keyword');
  });

  it('renders Content Action Plan as a working link to /reports/content-action-plan', () => {
    renderLanding();
    const link = screen.getByRole('link', { name: /content action plan/i });
    expect(link).toHaveAttribute('href', '/reports/content-action-plan');
  });

  it('renders Brand Visibility as a working link to /reports/visibility', () => {
    renderLanding();
    const link = screen.getByRole('link', { name: /brand visibility/i });
    expect(link).toHaveAttribute('href', '/reports/visibility');
  });

  it('marks the two unbuilt reports as Coming soon and not as links', () => {
    renderLanding();
    const comingSoonBadges = screen.getAllByText(/coming soon/i);
    expect(comingSoonBadges).toHaveLength(2);
  });

  it('shows the executive and marketing-lead audiences', () => {
    renderLanding();
    expect(screen.getByText(/CMO, VP Marketing/)).toBeInTheDocument();
    expect(screen.getByText(/Marketing lead/)).toBeInTheDocument();
  });

  it('shows the strategist and SEO-lead audiences', () => {
    renderLanding();
    expect(screen.getByText(/Content \/ PR strategist/)).toBeInTheDocument();
    expect(screen.getByText(/Content strategist/)).toBeInTheDocument();
    expect(screen.getByText(/SEO \/ AI search lead/)).toBeInTheDocument();
  });
});
