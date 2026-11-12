
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

import { AuthProvider } from './authcontext';
import { useAuth } from './useAuth';

import API from '../Service/api';

vi.mock('../Service/api', () => ({
  default: {
    get: vi.fn(),
  },
  registerUser: vi.fn(),
  loginUser: vi.fn(),
}));

function AuthConsumer() {
  const { user, token, loading, isAuthenticated } = useAuth();

  return (
    <div>
      <p data-testid="loading">{String(loading)}</p>
      <p data-testid="authenticated">{String(isAuthenticated)}</p>
      <p data-testid="token">{token || 'No token'}</p>
      <p data-testid="user">{user?.name || 'No user'}</p>
    </div>
  );
}

describe('AuthProvider session restoration', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('finishes loading when no saved token exists', async () => {
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    expect(API.get).not.toHaveBeenCalled();
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
  });

  it('restores a valid saved session', async () => {
    localStorage.setItem('token', 'valid-test-token');
    localStorage.setItem(
      'user',
      JSON.stringify({ name: 'Test Applicant', role: 'applicant' })
    );

    API.get.mockResolvedValue({
      data: { name: 'Test Applicant', role: 'applicant' },
    });

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    expect(API.get).toHaveBeenCalledWith('/auth/profile');
    expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
    expect(screen.getByTestId('user')).toHaveTextContent('Test Applicant');
    expect(localStorage.getItem('token')).toBe('valid-test-token');
  });

  it('clears an invalid saved session', async () => {
    localStorage.setItem('token', 'expired-test-token');
    localStorage.setItem(
      'user',
      JSON.stringify({ name: 'Old Applicant', role: 'applicant' })
    );

    API.get.mockRejectedValue(new Error('Unauthorized'));

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    expect(screen.getByTestId('user')).toHaveTextContent('No user');
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });
});
