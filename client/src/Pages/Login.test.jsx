
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

import Login from './Login';
import { useAuth } from '../Context/useAuth';

vi.mock('../Context/useAuth', () => ({
  useAuth: vi.fn(),
}));

describe('Login component', () => {
  const loginMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    useAuth.mockReturnValue({
      login: loginMock,
      loading: false,
    });
  });

  it('redirects an applicant after successful login', async () => {
    const user = userEvent.setup();

    loginMock.mockResolvedValue({
      token: 'test-token',
      role: 'applicant',
    });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/applicant-dashboard"
            element={<p>Applicant dashboard</p>}
          />
        </Routes>
      </MemoryRouter>
    );

    await user.type(
      screen.getByLabelText(/phone number/i),
      '0712345678'
    );

    await user.type(
      screen.getByLabelText(/^password$/i),
      'SecurePassword123!'
    );

    await user.click(
      screen.getByRole('button', { name: 'Log In' })
    );

    expect(await screen.findByText('Applicant dashboard'))
      .toBeInTheDocument();

    expect(loginMock).toHaveBeenCalledWith({
      phoneNumber: '0712345678',
      password: 'SecurePassword123!',
    });
  });

  it('displays an error when login fails', async () => {
    const user = userEvent.setup();

    loginMock.mockRejectedValue(
      new Error('Invalid phone number or password.')
    );

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    await user.type(
      screen.getByLabelText(/phone number/i),
      '0712345678'
    );

    await user.type(
      screen.getByLabelText(/^password$/i),
      'WrongPassword123!'
    );

    await user.click(
      screen.getByRole('button', { name: 'Log In' })
    );

    expect(
      await screen.findByRole('alert')
    ).toHaveTextContent('Invalid phone number or password.');
  });

  it('trims whitespace from the phone number before login', async () => {
    const user = userEvent.setup();

    loginMock.mockResolvedValue({
      token: 'test-token',
      role: 'applicant',
    });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    await user.type(
      screen.getByLabelText(/phone number/i),
      ' 0712345678 '
    );

    await user.type(
      screen.getByLabelText(/^password$/i),
      'SecurePassword123!'
    );

    await user.click(
      screen.getByRole('button', { name: 'Log In' })
    );

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith({
        phoneNumber: '0712345678',
        password: 'SecurePassword123!',
      });
    });
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const passwordInput = screen.getByLabelText(/^password$/i);

    expect(passwordInput).toHaveAttribute('type', 'password');

    await user.click(
      screen.getByRole('button', { name: 'Show password' })
    );

    expect(passwordInput).toHaveAttribute('type', 'text');

    await user.click(
      screen.getByRole('button', { name: 'Hide password' })
    );

    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('displays an error for an unrecognized account role', async () => {
    const user = userEvent.setup();

    loginMock.mockResolvedValue({
      token: 'test-token',
      role: 'unknown',
    });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    await user.type(
      screen.getByLabelText(/phone number/i),
      '0712345678'
    );

    await user.type(
      screen.getByLabelText(/^password$/i),
      'SecurePassword123!'
    );

    await user.click(
      screen.getByRole('button', { name: 'Log In' })
    );

    expect(await screen.findByRole('alert'))
      .toHaveTextContent(
        'Your account has an unrecognized role. Please contact the administrator.'
      );
  });

  it('disables the login button while authentication is loading', () => {
    useAuth.mockReturnValue({
      login: loginMock,
      loading: true,
    });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    expect(
      screen.getByRole('button', { name: 'Log In' })
    ).toBeDisabled();
  });

});
