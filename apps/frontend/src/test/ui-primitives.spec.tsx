import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { ErrorAlert } from '../components/ui/ErrorAlert';
import { ApiError } from '../api/errors';

describe('UI Primitives Test Suite', () => {
  describe('Button Component', () => {
    it('renders children and handles onClick handler', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Submit Action</Button>);

      const button = screen.getByRole('button', { name: /submit action/i });
      expect(button).toBeInTheDocument();
      fireEvent.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('renders with correct variant and size classes', () => {
      render(
        <Button variant="danger" size="lg">
          Delete Item
        </Button>,
      );
      const button = screen.getByRole('button', { name: /delete item/i });
      expect(button).toHaveClass('btn-danger');
      expect(button).toHaveClass('btn-lg');
    });

    it('renders loading spinner and disables button when isLoading is true', () => {
      const handleClick = vi.fn();
      render(
        <Button isLoading onClick={handleClick}>
          Processing
        </Button>,
      );

      const button = screen.getByRole('button', { name: /processing/i });
      expect(button).toBeDisabled();
      fireEvent.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('renders left and right icons when not loading', () => {
      render(
        <Button
          leftIcon={<span data-testid="left-icon">L</span>}
          rightIcon={<span data-testid="right-icon">R</span>}
        >
          Icon Button
        </Button>,
      );

      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });
  });

  describe('Input Component', () => {
    it('renders input with label and helper text', () => {
      render(
        <Input
          id="test-input"
          label="Email Address"
          helperText="We will never share your email."
          placeholder="user@example.com"
        />,
      );

      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByText('We will never share your email.')).toBeInTheDocument();
    });

    it('renders validation error and sets aria-invalid', () => {
      render(<Input id="email-field" label="Email" error="Invalid email address format" />);

      const input = screen.getByLabelText(/email/i);
      expect(input).toHaveAttribute('aria-invalid', 'true');
      const errorAlert = screen.getByRole('alert');
      expect(errorAlert).toHaveTextContent('Invalid email address format');
    });

    it('accepts text input changes', () => {
      const handleChange = vi.fn();
      render(<Input id="username" label="Username" onChange={handleChange} />);

      const input = screen.getByLabelText(/username/i);
      fireEvent.change(input, { target: { value: 'johndoe' } });
      expect(handleChange).toHaveBeenCalled();
      expect((input as HTMLInputElement).value).toBe('johndoe');
    });
  });

  describe('Modal Component', () => {
    it('renders dialog, title, content and footer when open', () => {
      render(
        <Modal
          isOpen={true}
          onClose={vi.fn()}
          title="Confirm Action"
          footer={<button>Confirm</button>}
        >
          <p>Are you sure you want to proceed?</p>
        </Modal>,
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Confirm Action')).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
    });

    it('does not render anything when isOpen is false', () => {
      const { container } = render(
        <Modal isOpen={false} onClose={vi.fn()} title="Closed Modal">
          <p>Hidden content</p>
        </Modal>,
      );

      expect(container.firstChild).toBeNull();
    });

    it('triggers onClose when clicking close button', () => {
      const handleClose = vi.fn();
      render(
        <Modal isOpen={true} onClose={handleClose} title="Test Modal">
          <p>Content</p>
        </Modal>,
      );

      const closeButton = screen.getByRole('button', { name: /close dialog/i });
      fireEvent.click(closeButton);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('triggers onClose when pressing Escape key', () => {
      const handleClose = vi.fn();
      render(
        <Modal isOpen={true} onClose={handleClose} title="Test Modal">
          <p>Content</p>
        </Modal>,
      );

      fireEvent.keyDown(window, { key: 'Escape' });
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('ErrorAlert Component (RFC 7807 Spec)', () => {
    it('renders nothing when error is null', () => {
      const { container } = render(<ErrorAlert error={null} />);
      expect(container.firstChild).toBeNull();
    });

    it('renders basic string error message', () => {
      render(<ErrorAlert error="Something went wrong" />);
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('renders RFC 7807 ApiError with title, code, correlation ID, and field validation errors', () => {
      const apiError = new ApiError({
        title: 'Validation Failed',
        status: 422,
        detail: 'The submitted request payload contains invalid fields.',
        code: 'VALIDATION_ERROR',
        correlationId: 'req-uuid-12345',
        errors: [
          { field: 'title', message: 'Title is required' },
          { field: 'isbn', message: 'ISBN must be 13 digits' },
        ],
      });

      render(<ErrorAlert error={apiError} />);

      expect(screen.getByText(/Validation Failed/i)).toBeInTheDocument();
      expect(screen.getByText(/\(VALIDATION_ERROR\)/i)).toBeInTheDocument();
      expect(
        screen.getByText('The submitted request payload contains invalid fields.'),
      ).toBeInTheDocument();
      expect(screen.getByText(/req-uuid-12345/i)).toBeInTheDocument();
      expect(screen.getByText(/title:/i)).toBeInTheDocument();
      expect(screen.getByText('Title is required')).toBeInTheDocument();
      expect(screen.getByText(/isbn:/i)).toBeInTheDocument();
      expect(screen.getByText('ISBN must be 13 digits')).toBeInTheDocument();
    });

    it('renders retry button and triggers callback when onRetry is passed', () => {
      const handleRetry = vi.fn();
      render(<ErrorAlert error="Network timeout" onRetry={handleRetry} />);

      const retryBtn = screen.getByRole('button', { name: /retry request/i });
      expect(retryBtn).toBeInTheDocument();
      fireEvent.click(retryBtn);
      expect(handleRetry).toHaveBeenCalledTimes(1);
    });
  });
});
