import {
  describe, it, expect,
} from 'vitest';
import {
  render, screen 
} from '@testing-library/react';
import { PerKeywordTableSection } from './PerKeywordTableSection';
import type { HistoricalTrendsResponse } from '../../../../types';

function directionFor(change: number): 'improving' | 'declining' | 'stable' {
  if (change > 0) return 'improving';
  if (change < 0) return 'declining';
  return 'stable';
}

function buildTrend(
  rows: Array<{
    keyword: string;
    current_score: number;
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
      current_score: r.current_score,
      change: r.change,
      change_percent: r.change * 2,
    })),
  };
}

describe('PerKeywordTableSection — ordering', () => {
  it('orders rows by current_score descending', () => {
    render(
      <PerKeywordTableSection
        trends={buildTrend([
          {
            keyword: 'low',
            current_score: 20,
            change: 0 
          },
          {
            keyword: 'high',
            current_score: 80,
            change: 0 
          },
          {
            keyword: 'mid',
            current_score: 50,
            change: 0 
          },
        ])}
        loading={false}
        error={null}
      />,
    );
    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('high');
    expect(rows[2]).toHaveTextContent('mid');
    expect(rows[3]).toHaveTextContent('low');
  });
});

describe('PerKeywordTableSection — mover highlight', () => {
  it('applies the positive-mover class when change >= +5', () => {
    render(
      <PerKeywordTableSection
        trends={buildTrend([
          {
            keyword: 'big-up',
            current_score: 60,
            change: 6 
          },
        ])}
        loading={false}
        error={null}
      />,
    );
    const row = screen.getByText('big-up').closest('tr');
    expect(row?.className).toContain('emerald');
  });

  it('applies the negative-mover class when change <= -5', () => {
    render(
      <PerKeywordTableSection
        trends={buildTrend([
          {
            keyword: 'big-down',
            current_score: 40,
            change: -7 
          },
        ])}
        loading={false}
        error={null}
      />,
    );
    const row = screen.getByText('big-down').closest('tr');
    expect(row?.className).toContain('red');
  });

  it('does NOT highlight rows with change magnitude below the +/-5 threshold', () => {
    render(
      <PerKeywordTableSection
        trends={buildTrend([
          {
            keyword: 'tiny-up',
            current_score: 50,
            change: 3 
          },
          {
            keyword: 'tiny-down',
            current_score: 50,
            change: -3 
          },
        ])}
        loading={false}
        error={null}
      />,
    );
    const upRow = screen.getByText('tiny-up').closest('tr');
    const downRow = screen.getByText('tiny-down').closest('tr');
    expect(upRow?.className).not.toContain('emerald');
    expect(downRow?.className).not.toContain('red');
  });
});

describe('PerKeywordTableSection — empty + placeholder states', () => {
  it('returns null when keyword_trends is empty', () => {
    const { container } = render(
      <PerKeywordTableSection
        trends={buildTrend([])}
        loading={false}
        error={null}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders loading placeholder when loading is true', () => {
    render(
      <PerKeywordTableSection trends={null} loading error={null} />,
    );
    expect(
      screen.getByText(/Loading per-keyword rankings/i),
    ).toBeInTheDocument();
  });

  it('renders error message when error is set', () => {
    render(
      <PerKeywordTableSection
        trends={null}
        loading={false}
        error="Network down"
      />,
    );
    expect(screen.getByText('Network down')).toBeInTheDocument();
  });
});

describe('PerKeywordTableSection — change formatting', () => {
  it('prefixes positive changes with a plus sign', () => {
    render(
      <PerKeywordTableSection
        trends={buildTrend([
          {
            keyword: 'kw',
            current_score: 60,
            change: 4 
          },
        ])}
        loading={false}
        error={null}
      />,
    );
    expect(screen.getByText('+4.0')).toBeInTheDocument();
  });

  it('renders negative changes with a minus sign', () => {
    render(
      <PerKeywordTableSection
        trends={buildTrend([
          {
            keyword: 'kw',
            current_score: 40,
            change: -4 
          },
        ])}
        loading={false}
        error={null}
      />,
    );
    expect(screen.getByText('-4.0')).toBeInTheDocument();
  });
});
