import {
  describe, it, expect,
} from 'vitest';
import {
  render, screen 
} from '@testing-library/react';
import { NextActionsSection } from './NextActionsSection';
import type { ReportsOverviewResponse } from '../../../../api/reports';
import type { Recommendation } from '../../../../types';

function buildRec(
  title: string,
  priority: 'high' | 'medium' | 'low',
  overrides: Partial<Recommendation> = {},
): Recommendation {
  return {
    type: 'gap',
    priority,
    title,
    description: 'Description for ' + title,
    action: 'Action for ' + title,
    impact: 'Impact for ' + title,
    ...overrides,
  };
}

function buildData(recs: Recommendation[]): ReportsOverviewResponse {
  return {
    generated_at: '2026-05-15T07:00:00Z',
    period_type: 'day',
    days_analyzed: 30,
    keywords_analyzed: 10,
    overall_score: 60,
    previous_score: 55,
    change: 5,
    change_percent: 9.1,
    trend_direction: 'stable',
    summary: {
      improving_count: 0,
      declining_count: 0,
      stable_count: 0 
    },
    top_improving: [],
    top_declining: [],
    top_recommendations: recs,
  };
}

describe('NextActionsSection — content', () => {
  it('renders each recommendation title as an h3', () => {
    render(
      <NextActionsSection
        data={buildData([
          buildRec('First action', 'high'),
          buildRec('Second action', 'medium'),
        ])}
        loading={false}
        error={null}
      />,
    );
    expect(screen.getByRole('heading', {
      level: 3,
      name: 'First action' 
    }))
      .toBeInTheDocument();
    expect(screen.getByRole('heading', {
      level: 3,
      name: 'Second action' 
    }))
      .toBeInTheDocument();
  });

  it('renders the description, action, and impact for a recommendation', () => {
    render(
      <NextActionsSection
        data={buildData([
          buildRec('Pitch publishers', 'high', {
            description: 'Outdoor outlets cite competitors only.',
            action: 'Reach out to Outside, Backpacker, REI Co-op Journal',
            impact: '5-10% visibility lift',
          }),
        ])}
        loading={false}
        error={null}
      />,
    );
    expect(screen.getByText('Outdoor outlets cite competitors only.'))
      .toBeInTheDocument();
    expect(screen.getByText('Reach out to Outside, Backpacker, REI Co-op Journal'))
      .toBeInTheDocument();
    expect(screen.getByText('5-10% visibility lift')).toBeInTheDocument();
  });

  it('renders the priority label as a badge', () => {
    render(
      <NextActionsSection
        data={buildData([buildRec('Action A', 'high')])}
        loading={false}
        error={null}
      />,
    );
    expect(screen.getByText('high')).toBeInTheDocument();
  });
});

describe('NextActionsSection — empty + placeholder states', () => {
  it('renders the empty copy when there are no recommendations', () => {
    render(
      <NextActionsSection
        data={buildData([])}
        loading={false}
        error={null}
      />,
    );
    expect(
      screen.getByText(/visibility plan is on track/i),
    ).toBeInTheDocument();
  });

  it('renders the loading placeholder when loading is true', () => {
    render(<NextActionsSection data={null} loading error={null} />);
    expect(screen.getByText(/Loading recommendations/i)).toBeInTheDocument();
  });

  it('renders the error message when error is set', () => {
    render(<NextActionsSection data={null} loading={false} error="boom" />);
    expect(screen.getByText('boom')).toBeInTheDocument();
  });

  it('renders the empty copy when data exists but recommendations array is empty', () => {
    render(
      <NextActionsSection
        data={buildData([])}
        loading={false}
        error={null}
      />,
    );
    expect(
      screen.getByText(/visibility plan is on track/i),
    ).toBeInTheDocument();
  });
});
