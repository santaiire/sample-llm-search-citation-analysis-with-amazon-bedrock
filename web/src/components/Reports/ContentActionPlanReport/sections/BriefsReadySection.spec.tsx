import {
  describe, it, expect,
} from 'vitest';
import {
  render, screen 
} from '@testing-library/react';
import { BriefsReadySection } from './BriefsReadySection';
import type { ContentStudioHistory } from '../../../../types';

function buildBrief(
  id: string,
  title: string,
  status: 'generated' | 'pending' | 'failed' | 'generating',
): ContentStudioHistory {
  return {
    id,
    keyword: 'kw',
    idea_type: 'visibility_gap',
    idea_title: title,
    content_angle: 'comprehensive_guide',
    generated_content: {
      title,
      meta_description: 'm',
      body: 'b',
      suggested_headings: [],
      key_points: ['Point A', 'Point B', 'Point C', 'Point D', 'Point E'],
    },
    raw_content: '',
    competitor_sources_used: 0,
    status,
    viewed: false,
    created_at: '2026-05-01T00:00:00Z',
    updated_at: '2026-05-01T00:00:00Z',
  };
}

describe('BriefsReadySection', () => {
  it('filters out briefs that are not in generated status', () => {
    render(
      <BriefsReadySection
        history={[
          buildBrief('h1', 'Generated brief', 'generated'),
          buildBrief('h2', 'Pending brief', 'pending'),
          buildBrief('h3', 'Failed brief', 'failed'),
        ]}
        loading={false}
        error={null}
      />,
    );
    expect(screen.getByText('Generated brief')).toBeInTheDocument();
    expect(screen.queryByText('Pending brief')).not.toBeInTheDocument();
    expect(screen.queryByText('Failed brief')).not.toBeInTheDocument();
  });

  it('caps the rendered list at 8 briefs', () => {
    const briefs = Array.from({ length: 12 }, (_, i) =>
      buildBrief(`h${i}`, `Brief ${i}`, 'generated'),
    );
    render(<BriefsReadySection history={briefs} loading={false} error={null} />);
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(8);
  });

  it('renders only the first four key points per brief', () => {
    render(
      <BriefsReadySection
        history={[buildBrief('h1', 'Brief A', 'generated')]}
        loading={false}
        error={null}
      />,
    );
    // 5 key points in fixture, capped at 4 in render.
    expect(screen.getAllByRole('listitem')).toHaveLength(4);
  });

  it('renders the empty state when no briefs are generated yet', () => {
    render(
      <BriefsReadySection
        history={[buildBrief('h1', 'Pending', 'pending')]}
        loading={false}
        error={null}
      />,
    );
    expect(
      screen.getByText(/No generated briefs are waiting/i),
    ).toBeInTheDocument();
  });

  it('renders the loading placeholder when loading is true', () => {
    render(<BriefsReadySection history={[]} loading error={null} />);
    expect(screen.getByText(/Loading content history/i)).toBeInTheDocument();
  });

  it('renders the error placeholder when error is set', () => {
    render(<BriefsReadySection history={[]} loading={false} error="Backend down" />);
    expect(screen.getByText(/Backend down/i)).toBeInTheDocument();
  });
});
