import { render } from '@testing-library/react';
import { LoadingSpinner } from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders with default size', () => {
    const { container } = render(<LoadingSpinner />);
    const spinner = container.querySelector('div > div');
    expect(spinner).toHaveClass('h-8', 'w-8');
  });

  it('renders with small size', () => {
    const { container } = render(<LoadingSpinner size="sm" />);
    const spinner = container.querySelector('div > div');
    expect(spinner).toHaveClass('h-4', 'w-4');
  });

  it('renders with large size', () => {
    const { container } = render(<LoadingSpinner size="lg" />);
    const spinner = container.querySelector('div > div');
    expect(spinner).toHaveClass('h-12', 'w-12');
  });

  it('renders with flex container', () => {
    const { container } = render(<LoadingSpinner />);
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('flex', 'items-center', 'justify-center');
  });

  it('renders with border styling', () => {
    const { container } = render(<LoadingSpinner />);
    const spinner = container.querySelector('div > div');
    expect(spinner).toHaveClass('border-b-2', 'border-blue-600');
  });
});