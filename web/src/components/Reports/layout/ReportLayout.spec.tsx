import {
  describe, it, expect 
} from 'vitest';
import {
  render, screen 
} from '@testing-library/react';
import { ReportLayout } from './ReportLayout';

describe('ReportLayout', () => {
  it('renders the report title as an H1', () => {
    render(
      <ReportLayout title="Keyword Deep Dive: best running shoes">
        <p>body</p>
      </ReportLayout>,
    );
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Keyword Deep Dive: best running shoes',
      }),
    ).toBeInTheDocument();
  });

  it('renders the optional subtitle', () => {
    render(
      <ReportLayout title="Demo" subtitle="Some description">
        <p>body</p>
      </ReportLayout>,
    );
    expect(screen.getByText('Some description')).toBeInTheDocument();
  });

  it('renders a generated-at timestamp so the printout is self-identifying', () => {
    render(
      <ReportLayout title="Demo">
        <p>body</p>
      </ReportLayout>,
    );
    expect(screen.getByText(/Generated /)).toBeInTheDocument();
  });

  it('renders body children', () => {
    render(
      <ReportLayout title="Demo">
        <p data-testid="body">body</p>
      </ReportLayout>,
    );
    expect(screen.getByTestId('body')).toBeInTheDocument();
  });

  it('marks the actions slot with print-hidden so screen-only controls drop out of the PDF', () => {
    const { container } = render(
      <ReportLayout
        title="Demo"
        actions={<button data-testid="filter">Filter</button>}
      >
        <p>body</p>
      </ReportLayout>,
    );
    const button = screen.getByTestId('filter');
    expect(button).toBeInTheDocument();
    // Walk up to the action wrapper which carries the .print-hidden class.
    const wrapper = container.querySelector('.print-hidden');
    expect(wrapper).not.toBeNull();
    expect(wrapper).toContainElement(button);
  });
});
