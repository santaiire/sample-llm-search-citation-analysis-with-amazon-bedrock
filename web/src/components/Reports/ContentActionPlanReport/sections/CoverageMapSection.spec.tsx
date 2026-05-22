import {
  describe, it, expect,
} from 'vitest';
import {
  render, screen, within 
} from '@testing-library/react';
import { CoverageMapSection } from './CoverageMapSection';
import type {
  CitationGapsResponse,
  ContentIdea,
  ContentStudioHistory,
} from '../../../../types';

/**
 * CoverageMapSection joins three data sources keyword-by-keyword:
 * citation gaps, generated briefs (Content Studio history), and open
 * ideas. The join + sort + status-label logic is the section's reason
 * for existing — these tests pin every transition.
 */

function buildGaps(
  summaries: Array<{
    keyword: string;
    gap_count: number;
    high_priority_gaps: number 
  }>,
): CitationGapsResponse {
  return {
    summary: {
      gap_count: summaries.reduce((acc, s) => acc + s.gap_count, 0),
      high_priority_gaps: summaries.reduce((acc, s) => acc + s.high_priority_gaps, 0),
      total_sources: 0,
      covered_count: 0,
      coverage_rate: 0,
    },
    keyword_summaries: summaries.map((s) => ({
      keyword: s.keyword,
      gap_count: s.gap_count,
      high_priority_gaps: s.high_priority_gaps,
      coverage_rate: 0,
    })),
    gaps: [],
    covered_sources: [],
    domain_summary: [],
  };
}

function brief(id: string, keyword: string, status: 'generated' | 'pending' | 'failed' | 'generating'): ContentStudioHistory {
  return {
    id,
    keyword,
    idea_type: 'visibility_gap',
    idea_title: id,
    content_angle: 'comprehensive_guide',
    generated_content: {
      title: id,
      meta_description: 'm',
      body: 'b',
      suggested_headings: [],
      key_points: [],
    },
    raw_content: '',
    competitor_sources_used: 0,
    status,
    viewed: false,
    created_at: '2026-05-01T00:00:00Z',
    updated_at: '2026-05-01T00:00:00Z',
  };
}

function idea(id: string, keyword: string | null): ContentIdea {
  return {
    id,
    type: 'visibility_gap',
    priority: 'high',
    title: id,
    description: 'd',
    keyword,
    source: 'analysis',
    actionable: true,
    content_angle: 'comprehensive_guide',
  };
}

describe('CoverageMapSection — joining gaps + briefs + ideas', () => {
  it('counts only briefs with status=generated against the briefCount column', () => {
    const gaps = buildGaps([{
      keyword: 'shoes',
      gap_count: 3,
      high_priority_gaps: 1 
    }]);
    const history = [
      brief('h1', 'shoes', 'generated'),
      brief('h2', 'shoes', 'pending'),
      brief('h3', 'shoes', 'failed'),
    ];
    render(
      <CoverageMapSection
        gaps={gaps}
        ideas={[]}
        history={history}
        loading={false}
        error={null}
      />,
    );
    const row = screen.getByText('shoes').closest('tr');
    expect(row).not.toBeNull();
    // Columns: keyword, gaps(3), hi-pri(1), briefs(1 — only 'generated'), ideas(0), status
    const cells = within(row as HTMLElement).getAllByRole('cell');
    expect(cells[3]).toHaveTextContent('1');
  });

  it('counts only ideas with a non-null keyword', () => {
    const gaps = buildGaps([{
      keyword: 'shoes',
      gap_count: 3,
      high_priority_gaps: 1 
    }]);
    const ideas = [
      idea('i1', 'shoes'),
      idea('i2', null),
      idea('i3', 'shoes'),
    ];
    render(
      <CoverageMapSection
        gaps={gaps}
        ideas={ideas}
        history={[]}
        loading={false}
        error={null}
      />,
    );
    const row = screen.getByText('shoes').closest('tr');
    const cells = within(row as HTMLElement).getAllByRole('cell');
    // Columns: keyword, gaps, hi-pri, briefs, ideas, status
    expect(cells[4]).toHaveTextContent('2');
  });

  it('creates a row from history-only or idea-only keywords (no gaps)', () => {
    render(
      <CoverageMapSection
        gaps={buildGaps([])}
        ideas={[idea('i1', 'orphan-from-ideas')]}
        history={[brief('h1', 'orphan-from-briefs', 'generated')]}
        loading={false}
        error={null}
      />,
    );
    expect(screen.getByText('orphan-from-ideas')).toBeInTheDocument();
    expect(screen.getByText('orphan-from-briefs')).toBeInTheDocument();
  });
});

describe('CoverageMapSection — status labels', () => {
  it('labels keyword with gaps but no briefs and no ideas as Blocked', () => {
    render(
      <CoverageMapSection
        gaps={buildGaps([{
          keyword: 'shoes',
          gap_count: 5,
          high_priority_gaps: 2 
        }])}
        ideas={[]}
        history={[]}
        loading={false}
        error={null}
      />,
    );
    expect(screen.getByText('Blocked')).toBeInTheDocument();
  });

  it('labels keyword with gaps + ideas but no briefs as Planned', () => {
    render(
      <CoverageMapSection
        gaps={buildGaps([{
          keyword: 'shoes',
          gap_count: 5,
          high_priority_gaps: 2 
        }])}
        ideas={[idea('i1', 'shoes')]}
        history={[]}
        loading={false}
        error={null}
      />,
    );
    expect(screen.getByText('Planned')).toBeInTheDocument();
  });

  it('labels keyword with gaps + briefs as In progress', () => {
    render(
      <CoverageMapSection
        gaps={buildGaps([{
          keyword: 'shoes',
          gap_count: 5,
          high_priority_gaps: 2 
        }])}
        ideas={[]}
        history={[brief('h1', 'shoes', 'generated')]}
        loading={false}
        error={null}
      />,
    );
    expect(screen.getByText('In progress')).toBeInTheDocument();
  });

  it('labels keyword with no gaps but briefs as Covered', () => {
    render(
      <CoverageMapSection
        gaps={buildGaps([])}
        ideas={[]}
        history={[brief('h1', 'shoes', 'generated')]}
        loading={false}
        error={null}
      />,
    );
    expect(screen.getByText('Covered')).toBeInTheDocument();
  });
});

describe('CoverageMapSection — sort + placeholder states', () => {
  it('orders blocked rows above non-blocked rows', () => {
    const gaps = buildGaps([
      {
        keyword: 'a-non-blocked',
        gap_count: 5,
        high_priority_gaps: 1 
      },
      {
        keyword: 'b-blocked',
        gap_count: 2,
        high_priority_gaps: 1 
      },
    ]);
    render(
      <CoverageMapSection
        gaps={gaps}
        ideas={[]}
        history={[brief('h1', 'a-non-blocked', 'generated')]}
        loading={false}
        error={null}
      />,
    );
    const rows = screen.getAllByRole('row');
    // Header is rows[0]; first data row should be the blocked one even though
    // alphabetically a-non-blocked sorts first.
    expect(rows[1]).toHaveTextContent('b-blocked');
    expect(rows[2]).toHaveTextContent('a-non-blocked');
  });

  it('returns null (no section rendered) when there is no data at all', () => {
    const { container } = render(
      <CoverageMapSection
        gaps={buildGaps([])}
        ideas={[]}
        history={[]}
        loading={false}
        error={null}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders the loading placeholder when loading is true', () => {
    render(
      <CoverageMapSection
        gaps={null}
        ideas={[]}
        history={[]}
        loading
        error={null}
      />,
    );
    expect(screen.getByText(/Building coverage map/i)).toBeInTheDocument();
  });

  it('renders the error placeholder when error is set', () => {
    render(
      <CoverageMapSection
        gaps={null}
        ideas={[]}
        history={[]}
        loading={false}
        error="Backend down"
      />,
    );
    expect(screen.getByText(/Backend down/i)).toBeInTheDocument();
  });
});
