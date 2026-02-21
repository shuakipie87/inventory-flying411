import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach } from 'vitest';
import App from '../App';
import LoginPage from '../pages/LoginPage';
import { useAuthStore } from '../stores/authStore';

// Reset auth store between tests so state doesn't leak
beforeEach(() => {
  useAuthStore.setState({ user: null, token: null, isAuthenticated: false });
});

describe('App', () => {
  it('renders without crashing', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>
    );
    // App should render something — at minimum the Toaster or Suspense fallback
    expect(document.body).toBeTruthy();
  });
});

describe('LoginPage', () => {
  it('renders the login form', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Welcome back')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });
});

describe('ProtectedRoute', () => {
  it('redirects unauthenticated users to login', () => {
    // Auth store is already reset (unauthenticated) via beforeEach
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <App />
      </MemoryRouter>
    );

    // Unauthenticated users should be redirected to /login,
    // so the login page content should appear
    expect(screen.getByText('Welcome back')).toBeInTheDocument();
  });
});
