import {
  describe, it, expect,
} from 'vitest';
import {
  render, screen 
} from '@testing-library/react';
import { RankHistorySection } from './RankHistorySection';
import type {
  HistoricalTrendsResponse, TrendDataPoint 
} from '../../../../types';

function buildPoint(period: string, score: number): TrendDataPoint {
  return {
    period,
    visibility_score: score,
    total_mentions: 1,
    provider_count: 1,
    best_rank: 1,
    analysis_runs: 1,
  };
}

function buildTrends(points: TrendDataPoint[]): HistoricalTrendsResponse {
  const scores = points.map((p) => p.visibility_score);
  return {
    period_type: 'day',
    days_analyzed: 30,
    data_points: points.length,
    trend_data: points,
    trend_direction: 'stable',
    summary: {
      current_score: scores[scores.length - 1] ?? 0,
      previous_score: scores[scores.length - 2] ?? 0,
      change: 0,
      change_percent: 0,
      average_score: scores.reduce((a, b) => a + b, 0) / Math.max(scores.length, 1),
      max_score: Math.max(...scores, 0),
      min_score: Math.min(...scores, 0),
    },
  };
}

describe('RankHistorySection — sampling', () => {
  it('renders every row when point count is below the cap', () => {
    const points = Array.from({ length: 5 }, (_, i) =>
      buildPoint(`2026-05-0${i + 1}`, 50 + i),
    );
    render(
      <RankHistorySection trends={buildTrends(points)} loading={false} error={null} />,
    );
    // 5 data rows + 1 header row.
    expect(screen.getAllByRole('row')).toHaveLength(6);
  });

  it('caps the table at 14 rows when point count exceeds the cap', () => {
    const points = Array.from({ length: 30 }, (_, i) =>
      buildPoint(`d-${i.toString().padStart(2, '0')}`, 40 + i),
    );
    render(
      <RankHistorySection trends={buildTrends(points)} loading={false} error={null} />,
    );
    // 14 sampled data rows + 1 header row.
    expect(screen.getAllByRole('row')).toHaveLength(15);
  });

  it('keeps the first and last data points when sampling', () => {
    const points = Array.from({ length: 30 }, (_, i) =>
      buildPoint(`d-${i.toString().padStart(2, '0')}`, 40 + i),
    );
    render(
      <RankHistorySection trends={buildTrends(points)} loading={false} error={null} />,
    );
    expect(screen.getByText('d-00')).toBeInTheDocument();
    expect(screen.getByText('d-29')).toBeInTheDocument();
  });
});

describe('RankHistorySection — placeholder states', () => {
  it('renders empty state when trend_data is empty', () => {
    render(
      <RankHistorySection
        trends={buildTrends([])}
        loading={false}
        error={null}
      />,
    );
    expect(screen.getByText(/at least two analysis runs/i)).toBeInTheDocument();
  });

  it('renders empty state when trends is null', () => {
    render(
      <RankHistorySection trends={null} loading={false} error={null} />,
    );
    expect(screen.getByText(/at least two analysis runs/i)).toBeInTheDocument();
  });

  it('renders loading state when loading is true', () => {
    render(
      <RankHistorySection trends={null} loading error={null} />,
    );
    expect(screen.getByText(/Loading trend data/i)).toBeInTheDocument();
  });

  it('renders error message when error is set', () => {
    render(
      <RankHistorySection trends={null} loading={false} error="Network blew up" />,
    );
    expect(screen.getByText(/Network blew up/i)).toBeInTheDocument();
  });
});
