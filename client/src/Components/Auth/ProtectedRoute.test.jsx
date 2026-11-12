
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

import ProtectedRoute from './ProtectedRoute';
import { useAuth } from '../../Context/useAuth';

vi.mock('../../Context/useAuth', () => ({
  useAuth: vi.fn(),
}));

describe('ProtectedRoute', () => {
  it('redirects unauthenticated users to login', () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
      loading: false,
      user: null,
    });

    render(
      <MemoryRouter initialEntries={['/applicant-dashboard']}>
        <Routes>
          <Route path="/login" element={<p>Login page</p>} />

          <Route
            element={<ProtectedRoute allowedRoles={['applicant']} />}
          >
            <Route
              path="/applicant-dashboard"
              element={<p>Applicant dashboard</p>}
            />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Login page')).toBeInTheDocument();
  });

  it('allows authenticated applicants to access their dashboard', () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: { role: 'applicant' },
    });

    render(
      <MemoryRouter initialEntries={['/applicant-dashboard']}>
        <Routes>
          <Route path="/login" element={<p>Login page</p>} />

          <Route
            element={<ProtectedRoute allowedRoles={['applicant']} />}
          >
            <Route
              path="/applicant-dashboard"
              element={<p>Applicant dashboard</p>}
            />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Applicant dashboard')).toBeInTheDocument();
  });

  it('blocks users with unauthorized roles', () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: { role: 'clerk' },
    });

    render(
      <MemoryRouter initialEntries={['/applicant-dashboard']}>
        <Routes>
          <Route path="/" element={<p>Home page</p>} />

          <Route
            element={<ProtectedRoute allowedRoles={['applicant']} />}
          >
            <Route
              path="/applicant-dashboard"
              element={<p>Applicant dashboard</p>}
            />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Home page')).toBeInTheDocument();
  });
it('shows a loading message while checking the session', () => {
  useAuth.mockReturnValue({
    isAuthenticated: false,
    loading: true,
    user: null,
  });

  render(
    <MemoryRouter initialEntries={['/applicant-dashboard']}>
      <Routes>
        <Route
          element={<ProtectedRoute allowedRoles={['applicant']} />}
        >
          <Route
            path="/applicant-dashboard"
            element={<p>Applicant dashboard</p>}
          />
        </Route>
      </Routes>
    </MemoryRouter>
  );

  expect(
    screen.getByText('Checking your session...')
  ).toBeInTheDocument();

  expect(
    screen.queryByText('Applicant dashboard')
  ).not.toBeInTheDocument();
});
});
