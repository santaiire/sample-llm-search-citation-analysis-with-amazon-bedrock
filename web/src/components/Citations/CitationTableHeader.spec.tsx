import {
  render, screen, fireEvent 
} from '@testing-library/react';
import {
  describe, it, expect, vi 
} from 'vitest';
import { CitationTableHeader } from './CitationTableHeader';
import type { SortConfig } from '../../exporters/citationParser';

const DESC_CITATIONS = {
  column: 'citations',
  direction: 'desc' 
} satisfies SortConfig;
const DESC_KEYWORDS = {
  column: 'keywords',
  direction: 'desc' 
} satisfies SortConfig;

describe('CitationTableHeader', () => {
  const renderInTable = (ui: React.ReactElement) => render(<table>{ui}</table>);

  it('displays #, URL, and Domain column headers', () => {
    const onSort = vi.fn();
    renderInTable(<CitationTableHeader sort={DESC_CITATIONS} onSort={onSort} />);
    
    expect(screen.getByText('#')).toBeInTheDocument();
    expect(screen.getByText('URL')).toBeInTheDocument();
    expect(screen.getByText('Domain')).toBeInTheDocument();
  });

  it('displays Keywords and Citations column headers', () => {
    const onSort = vi.fn();
    renderInTable(<CitationTableHeader sort={DESC_CITATIONS} onSort={onSort} />);
    
    expect(screen.getByText('Keywords')).toBeInTheDocument();
    expect(screen.getByText('Citations')).toBeInTheDocument();
  });

  it('calls onSort with keywords when Keywords header clicked', () => {
    const onSort = vi.fn();
    renderInTable(<CitationTableHeader sort={DESC_CITATIONS} onSort={onSort} />);
    
    fireEvent.click(screen.getByText('Keywords'));
    expect(onSort).toHaveBeenCalledWith('keywords');
  });

  it('calls onSort with citations when Citations header clicked', () => {
    const onSort = vi.fn();
    renderInTable(<CitationTableHeader sort={DESC_KEYWORDS} onSort={onSort} />);
    
    fireEvent.click(screen.getByText('Citations'));
    expect(onSort).toHaveBeenCalledWith('citations');
  });

  it('calls onSort with domain when Domain header clicked', () => {
    const onSort = vi.fn();
    renderInTable(<CitationTableHeader sort={DESC_CITATIONS} onSort={onSort} />);
    
    fireEvent.click(screen.getByText('Domain'));
    expect(onSort).toHaveBeenCalledWith('domain');
  });

  it('shows sort indicator for active sort column', () => {
    const onSort = vi.fn();
    renderInTable(<CitationTableHeader sort={DESC_KEYWORDS} onSort={onSort} />);
    
    const keywordsHeader = screen.getByText('Keywords').closest('th');
    expect(keywordsHeader?.querySelector('svg')).toBeInTheDocument();
  });
});
