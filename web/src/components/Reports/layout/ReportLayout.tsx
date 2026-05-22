import type { ReactNode } from 'react';

interface Props {
  /**
   * The report's headline (e.g. "Keyword Deep Dive: best running shoes").
   * Rendered as an H1 at the top of the page.
   */
  readonly title: string;
  /**
   * One-line description of what the report covers and who it's for.
   * Helps a reader who picks up the printout cold understand the context.
   */
  readonly subtitle?: string;
  /**
   * Right-aligned slot for a subset of header content that isn't the title:
   * filter chips, persona selector, etc. These render alongside the title
   * on screen but are hidden in the print output via `print-hidden`.
   */
  readonly actions?: ReactNode;
  /**
   * The body of the report — usually a stack of <ReportSection /> elements.
   */
  readonly children: ReactNode;
}

/**
 * Standard layout for any report page.
 *
 * Provides a consistent print-friendly chrome:
 * - H1 with timestamp underneath so the printout is self-identifying.
 * - Optional subtitle giving the report's purpose and audience.
 * - An `actions` slot for screen-only controls (selectors, filters); these
 *   are stripped from the PDF via `.print-hidden`.
 *
 * Reports should compose this layout instead of building their own header
 * so the PDF output stays visually coherent across all five report types.
 */
export function ReportLayout({
  title,
  subtitle,
  actions,
  children,
}: Props) {
  const generatedAt = new Date().toLocaleString();

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between border-b border-gray-200 dark:border-gray-700 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 max-w-2xl">
              {subtitle}
            </p>
          )}
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            Generated {generatedAt}
          </p>
        </div>
        {actions && <div className="print-hidden">{actions}</div>}
      </header>
      <div className="space-y-6">{children}</div>
    </div>
  );
}
