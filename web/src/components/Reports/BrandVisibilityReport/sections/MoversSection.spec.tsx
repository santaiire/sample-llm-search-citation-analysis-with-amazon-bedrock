import {
  describe, it, expect,
} from 'vitest';
import {
  render, screen, within 
} from '@testing-library/react';
import { MoversSection } from './MoversSection';
import type { HistoricalTrendsResponse } from '../../../../types';

function directionFor(change: number): 'improving' | 'declining' | 'stable' {
  if (change > 0) return 'improving';
  if (change < 0) return 'declining';
  return 'stable';
}

function buildTrend(
  rows: Array<{
    keyword: string;
    change: number 
  }>,
): HistoricalTrendsResponse {
  return {
    period_type: 'day',
    days_analyzed: 30,
    data_points: 0,
    trend_data: [],
    trend_direction: 'stable',
    summary: {
      current_score: 0,
      previous_score: 0,
      change: 0,
      change_percent: 0,
      average_score: 0,
      max_score: 0,
      min_score: 0,
    },
    keyword_trends: rows.map((r) => ({
      keyword: r.keyword,
      trend_direction: directionFor(r.change),
      current_score: 50 + r.change,
      change: r.change,
      change_percent: r.change * 2,
    })),
    overall: {
      improving_count: rows.filter((r) => r.change > 0).length,
      declining_count: rows.filter((r) => r.change < 0).length,
      stable_count: rows.filter((r) => r.change === 0).length,
      avg_score: 50,
    },
  };
}

describe('MoversSection — improver list', () => {
  it('lists keywords with positive change in the Improving column', () => {
    render(
      <MoversSection
        trends={buildTrend([
          {
            keyword: 'up-a',
            change: 3 
          },
          {
            keyword: 'down-a',
            change: -2 
          },
        ])}
        loading={false}
        error={null}
      />,
    );
    const improvingHeading = screen.getByRole('heading', { name: 'Improving' });
    const column = improvingHeading.closest('div');
    expect(column).not.toBeNull();
    expect(within(column as HTMLElement).getByText('up-a')).toBeInTheDocument();
    expect(within(column as HTMLElement).queryByText('down-a')).not.toBeInTheDocument();
  });

  it('orders improvers by change descending', () => {
    render(
      <MoversSection
        trends={buildTrend([
          {
            keyword: 'small-up',
            change: 1 
          },
          {
            keyword: 'big-up',
            change: 9 
          },
          {
            keyword: 'medium-up',
            change: 5 
          },
        ])}
        loading={false}
        error={null}
      />,
    );
    const improvingHeading = screen.getByRole('heading', { name: 'Improving' });
    const column = improvingHeading.closest('div');
    const items = within(column as HTMLElement).getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('big-up');
    expect(items[1]).toHaveTextContent('medium-up');
    expect(items[2]).toHaveTextContent('small-up');
  });

  it('caps each direction at five entries', () => {
    const rows = Array.from({ length: 8 }, (_, i) => ({
      keyword: `up-${i}`,
      change: i + 1,
    }));
    render(
      <MoversSection
        trends={buildTrend(rows)}
        loading={false}
        error={null}
      />,
    );
    const improvingHeading = screen.getByRole('heading', { name: 'Improving' });
    const column = improvingHeading.closest('div');
    expect(within(column as HTMLElement).getAllByRole('listitem')).toHaveLength(5);
  });
});

describe('MoversSection — decliner list and empty handling', () => {
  it('orders decliners by change ascending (most negative first)', () => {
    render(
      <MoversSection
        trends={buildTrend([
          {
            keyword: 'small-down',
            change: -1 
          },
          {
            keyword: 'big-down',
            change: -9 
          },
          {
            keyword: 'medium-down',
            change: -5 
          },
        ])}
        loading={false}
        error={null}
      />,
    );
    const decliningHeading = screen.getByRole('heading', { name: 'Declining' });
    const column = decliningHeading.closest('div');
    const items = within(column as HTMLElement).getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('big-down');
    expect(items[1]).toHaveTextContent('medium-down');
    expect(items[2]).toHaveTextContent('small-down');
  });

  it('shows the "no improvers" empty copy when only decliners exist', () => {
    render(
      <MoversSection
        trends={buildTrend([
          {
            keyword: 'down-a',
            change: -3 
          },
        ])}
        loading={false}
        error={null}
      />,
    );
    expect(
      screen.getByText(/No keywords moved in this direction/i),
    ).toBeInTheDocument();
  });

  it('returns null (no section rendered) when keyword_trends is empty', () => {
    const { container } = render(
      <MoversSection
        trends={buildTrend([])}
        loading={false}
        error={null}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('returns null when no keyword has a non-zero change', () => {
    const { container } = render(
      <MoversSection
        trends={buildTrend([
          {
            keyword: 'flat-a',
            change: 0 
          },
          {
            keyword: 'flat-b',
            change: 0 
          },
        ])}
        loading={false}
        error={null}
      />,
    );
    expect(container.firstChild).toBeNull();
  });
});

describe('MoversSection — placeholder states', () => {
  it('renders loading placeholder when loading is true', () => {
    render(<MoversSection trends={null} loading error={null} />);
    expect(screen.getByText(/Computing movers/i)).toBeInTheDocument();
  });

  it('renders error message when error is set', () => {
    render(<MoversSection trends={null} loading={false} error="boom" />);
    expect(screen.getByText('boom')).toBeInTheDocument();
  });
});
