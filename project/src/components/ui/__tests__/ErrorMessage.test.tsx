import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { ErrorMessage } from '../ErrorMessage';

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  AlertTriangle: () => <div data-testid="alert-icon" />
}));

describe('ErrorMessage', () => {
  it('renders string error message', () => {
    render(<ErrorMessage error="Test error message" />);
    expect(screen.getByText('Test error message')).toBeInTheDocument();
    expect(screen.getByTestId('alert-icon')).toBeInTheDocument();
  });

  it('renders ApiError message', () => {
    const apiError = { message: 'API error message', status: 400 };
    render(<ErrorMessage error={apiError} />);
    expect(screen.getByText('API error message')).toBeInTheDocument();
    expect(screen.getByTestId('alert-icon')).toBeInTheDocument();
  });

  it('renders with correct styling', () => {
    render(<ErrorMessage error="Test error" />);
    const container = screen.getByRole('alert');
    expect(container).toHaveClass('bg-red-50', 'border-l-4', 'border-red-400', 'p-4');
  });

  it('handles undefined error gracefully', () => {
    render(<ErrorMessage error={undefined as any} />);
    expect(screen.getByText('Um erro inesperado ocorreu')).toBeInTheDocument();
  });

  it('handles null error gracefully', () => {
    render(<ErrorMessage error={null as any} />);
    expect(screen.getByText('Um erro inesperado ocorreu')).toBeInTheDocument();
  });
});