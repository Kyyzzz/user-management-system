import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import RegisterForm from './RegisterForm';
import { authService } from '../services/authService';

vi.mock('../services/authService', () => ({
  authService: {
    register: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderRegisterForm = () => {
  return render(
    <BrowserRouter>
      <RegisterForm />
    </BrowserRouter>
  );
};

describe('RegisterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders register form with all fields', () => {
    renderRegisterForm();
    
    expect(screen.getByRole('heading', { name: /create an account/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('displays password requirements', () => {
    renderRegisterForm();
    
    expect(screen.getByText(/minimum 8 characters/i)).toBeInTheDocument();
    expect(screen.getByText(/at least one uppercase letter/i)).toBeInTheDocument();
    expect(screen.getByText(/at least one lowercase letter/i)).toBeInTheDocument();
    expect(screen.getByText(/at least one number/i)).toBeInTheDocument();
    expect(screen.getByText(/at least one special character/i)).toBeInTheDocument();
  });

  it('shows validation errors for empty fields', async () => {
    const user = userEvent.setup();
    renderRegisterForm();

    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/last name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  it('validates email format', async () => {
    const user = userEvent.setup();
    renderRegisterForm();

    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
    await user.type(emailInput, 'invalid-email');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    // Native email validation blocks submission in the browser/DOM, so RHF won't
    // surface the "Invalid email address" message. Assert the HTML validity state.
    expect(emailInput.validity.valid).toBe(false);
  });

  it('validates password strength requirements', async () => {
    const user = userEvent.setup();
    renderRegisterForm();

    const passwordInput = screen.getByLabelText(/^password$/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    // Test weak password
    await user.type(passwordInput, 'weak');
    await user.click(submitButton);

    await waitFor(() => {
      expect(document.getElementById('password-error')).toHaveTextContent(
        /minimum 8 characters/i,
      );
    });
  });

  it('validates password confirmation match', async () => {
    const user = userEvent.setup();
    renderRegisterForm();

    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    await user.type(passwordInput, 'Password123!');
    await user.type(confirmPasswordInput, 'Password456!');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  it('updates password requirement indicators as user types', async () => {
    const user = userEvent.setup();
    renderRegisterForm();

    const passwordInput = screen.getByLabelText(/^password$/i);

    // Type a password that meets all requirements
    await user.type(passwordInput, 'Password123!');

    // All requirements should show as met (check marks visible)
    await waitFor(() => {
      const requirements = screen.getAllByText('✓');
      expect(requirements).toHaveLength(5);
    });
  });

  it('successfully registers a new user', async () => {
    const user = userEvent.setup();
    const mockUser = {
      id: 1,
      email: 'newuser@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'user' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    vi.mocked(authService.register).mockResolvedValue(mockUser);
    renderRegisterForm();

    await user.type(screen.getByLabelText(/first name/i), 'John');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');
    await user.type(screen.getByLabelText(/email/i), 'newuser@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'Password123!');
    await user.type(screen.getByLabelText(/confirm password/i), 'Password123!');

    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(authService.register).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        role: 'user',
      });
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  it('displays error message on registration failure', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Email already registered';

    vi.mocked(authService.register).mockRejectedValue({
      response: {
        data: {
          message: errorMessage,
        },
      },
    });

    renderRegisterForm();

    await user.type(screen.getByLabelText(/first name/i), 'John');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');
    await user.type(screen.getByLabelText(/email/i), 'existing@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'Password123!');
    await user.type(screen.getByLabelText(/confirm password/i), 'Password123!');

    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('disables form during submission', async () => {
    const user = userEvent.setup();
    
    vi.mocked(authService.register).mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );

    renderRegisterForm();

    await user.type(screen.getByLabelText(/first name/i), 'John');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');
    await user.type(screen.getByLabelText(/email/i), 'newuser@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'Password123!');
    await user.type(screen.getByLabelText(/confirm password/i), 'Password123!');

    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(screen.getByText(/creating account/i)).toBeInTheDocument();
  });

  it('has link to login page', () => {
    renderRegisterForm();
    
    const loginLink = screen.getByRole('link', { name: /sign in/i });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute('href', '/login');
  });
});
