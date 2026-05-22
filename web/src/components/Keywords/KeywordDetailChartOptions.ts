/**
 * Theme-aware Chart.js option factories for the keyword detail
 * panel. Kept in a separate file so `KeywordDetailComponents.tsx`
 * stays under the 400-line `max-lines` ESLint cap.
 *
 * Call with the result of `getChartTheme(isDark)` so chart chrome
 * (axis ticks, grid, legend, tooltip) adapts to the active theme.
 */
import type { ChartTheme } from '../ui/chartTheme';

interface SimpleTooltipContext {
  readonly dataset: { readonly label?: string };
  readonly parsed: { readonly y: number | null };
}

const themedLegend = (theme: ChartTheme) => ({
  display: true,
  position: 'bottom' as const,
  labels: { color: theme.textColor },
});

const themedTooltip = (theme: ChartTheme) => ({
  backgroundColor: theme.tooltipBackground,
  borderColor: theme.tooltipBorder,
  borderWidth: 1,
  titleColor: theme.tooltipText,
  bodyColor: theme.tooltipText,
});

const themedAxis = (theme: ChartTheme, extra: Record<string, unknown> = {}) => ({
  ticks: {
    color: theme.textColor,
    ...(extra.ticks as object ?? {}) 
  },
  grid: { color: theme.gridColor },
  ...extra,
});

export const lineChartOptions = (theme: ChartTheme) => ({
  responsive: true,
  plugins: {
    legend: themedLegend(theme),
    tooltip: {
      ...themedTooltip(theme),
      callbacks: {
        label: (context: SimpleTooltipContext) =>
          `${context.dataset.label ?? ''}: ${context.parsed.y ?? 0} citations`,
      },
    },
  },
  scales: {
    y: themedAxis(theme, { beginAtZero: true }),
    x: themedAxis(theme),
  },
});

export const barChartOptions = (theme: ChartTheme) => ({
  responsive: true,
  plugins: {
    legend: themedLegend(theme),
    tooltip: {
      ...themedTooltip(theme),
      callbacks: {
        label: (context: SimpleTooltipContext) =>
          `${context.dataset.label ?? ''}: ${context.parsed.y ?? 0}`,
        footer: (tooltipItems: Array<{ readonly parsed: { readonly y: number | null } }>) => {
          const total = tooltipItems.reduce((sum, item) => sum + (item.parsed.y ?? 0), 0);
          return `Total: ${total}`;
        },
      },
    },
  },
  scales: {
    x: themedAxis(theme, { stacked: true }),
    y: themedAxis(theme, {
      stacked: true,
      beginAtZero: true,
      ticks: { stepSize: 1 } 
    }),
  },
});
