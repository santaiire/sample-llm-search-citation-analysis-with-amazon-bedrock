import type { Keyword } from '../../../types';

interface Props {
  readonly keywords: ReadonlyArray<Keyword>;
  readonly selected: string | null;
  readonly onChange: (keyword: string) => void;
  /**
   * Optional label override. Defaults to "Keyword" — most keyword-scoped
   * reports want this generic label, but a per-keyword report might want
   * something more specific like "Drill into".
   */
  readonly label?: string;
}

/**
 * Keyword selector reused across reports that scope their data to a single
 * keyword. Lives in the report's `actions` slot in screen mode and is hidden
 * from the printout (selection is reflected in the URL/H1 instead).
 */
export function ReportKeywordSelector({
  keywords,
  selected,
  onChange,
  label = 'Keyword',
}: Props) {
  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor="report-keyword-select"
        className="text-xs font-medium text-gray-500 dark:text-gray-400"
      >
        {label}
      </label>
      <select
        id="report-keyword-select"
        value={selected ?? ''}
        onChange={(event) => onChange(event.target.value)}
        className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 min-w-[14rem]"
      >
        {!selected && <option value="">Select a keyword…</option>}
        {keywords.map((keyword) => (
          <option key={keyword.keyword} value={keyword.keyword}>
            {keyword.keyword}
          </option>
        ))}
      </select>
    </div>
  );
}
