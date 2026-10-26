
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login, loading: authLoading } = useAuth();

  const [form, setForm] = useState({
    phoneNumber: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loading = submitting || authLoading;

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      setSubmitting(true);

      const loggedInUser = await login({
        phoneNumber: form.phoneNumber.trim(),
        password: form.password,
      });

      // Navigate according to the role returned by the backend
      switch (loggedInUser.role) {
        case 'applicant':
          navigate('/applicant-dashboard', { replace: true });
          break;

        case 'clerk':
          navigate('/clerk-dashboard', { replace: true });
          break;

        case 'board':
          navigate('/board-dashboard', { replace: true });
          break;

        case 'admin':
          navigate('/admin-dashboard', { replace: true });
          break;

        case 'agent':
          navigate('/agent-dashboard', { replace: true });
          break;

        default:
          navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Unable to log in. Please check your phone number and password.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'mt-2 block min-h-12 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#166534] focus:ring-4 focus:ring-emerald-100';

  return (
    <main className="flex min-h-screen min-h-[100svh] items-center justify-center overflow-x-hidden bg-[#F8FAFC] px-3 py-5 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <div className="grid overflow-hidden rounded-2xl bg-white shadow-lg shadow-slate-900/5 sm:rounded-3xl sm:shadow-xl lg:grid-cols-2">

          {/* Branding panel: tablet and desktop */}
          <section className="relative hidden min-w-0 flex-col justify-between overflow-hidden bg-[#14532D] p-8 text-white md:flex lg:p-9 xl:p-12">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl xl:h-80 xl:w-80"
            />

            <div className="relative">
              <Link
                to="/"
                aria-label="ElimuPlus home"
                className="inline-flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-xl font-extrabold text-[#14532D]">
                  E
                </span>

                <span className="text-xl font-extrabold xl:text-2xl">
                  ElimuPlus
                </span>
              </Link>

              <p className="mt-12 text-xs font-bold uppercase tracking-[0.18em] text-emerald-200 lg:mt-16">
                Welcome back
              </p>

              <h1 className="mt-4 max-w-md text-3xl font-extrabold leading-tight lg:text-4xl xl:text-5xl">
                Continue your educational journey.
              </h1>

              <p className="mt-5 max-w-md text-sm leading-7 text-emerald-100 lg:text-base">
                Sign in to manage your bursary application, check
                its progress, and stay connected with ElimuPlus.
              </p>
            </div>

            <div className="relative mt-10 rounded-2xl border border-white/15 bg-white/10 p-4 lg:p-5">
              <p className="text-sm font-semibold lg:text-base">
                Your account, your progress
              </p>

              <p className="mt-2 text-sm leading-6 text-emerald-100">
                Use the phone number and password you registered with.
              </p>
            </div>
          </section>

          {/* Login form */}
          <section className="min-w-0 p-5 sm:p-8 md:p-7 lg:p-9 xl:p-12">

            {/* Mobile branding */}
            <div className="mb-8 md:mb-9">
              <Link
                to="/"
                aria-label="ElimuPlus home"
                className="inline-flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#166534] md:hidden"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#14532D] text-lg font-extrabold text-white">
                  E
                </span>

                <span className="text-xl font-extrabold text-[#14532D]">
                  ElimuPlus
                </span>
              </Link>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#166534] sm:text-sm">
                Your account
              </p>

              <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[#0F172A] sm:text-3xl">
                Log in
              </h2>

              <p className="mt-2 max-w-md text-sm leading-6 text-slate-600 sm:text-base">
                Welcome back. Enter your details to access your account.
              </p>
            </div>

            {error && (
              <div
                role="alert"
                aria-live="polite"
                className="mt-5 break-words rounded-xl border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-700 sm:p-4"
              >
                {error}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="mt-6 space-y-5 sm:mt-8 sm:space-y-6"
            >
              <div className="min-w-0">
                <label
                  htmlFor="phoneNumber"
                  className="block text-sm font-semibold text-slate-700"
                >
                  Phone number
                </label>

                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="Enter your phone number"
                  value={form.phoneNumber}
                  onChange={handleChange}
                  className={inputClass}
                  required
                />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                  <label
                    htmlFor="password"
                    className="text-sm font-semibold text-slate-700"
                  >
                    Password
                  </label>

                  <Link
                    to="/forgot-password"
                    className="rounded text-xs font-semibold text-[#14532D] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 sm:text-sm"
                  >
                    Forgot password?
                  </Link>
                </div>

                <div className="relative min-w-0">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={handleChange}
                    className={`${inputClass} pr-20`}
                    required
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((previous) => !previous)
                    }
                    aria-label={
                      showPassword ? 'Hide password' : 'Show password'
                    }
                    aria-pressed={showPassword}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded px-2 py-2 text-xs font-bold text-[#14532D] hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 sm:text-sm"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex min-h-12 w-full items-center justify-center rounded-xl bg-[#14532D] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#166534] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Signing in...' : 'Log In'}
              </button>
            </form>

            <div className="my-6 flex items-center gap-3 sm:my-7 sm:gap-4">
              <div className="h-px min-w-0 flex-1 bg-slate-200" />

              <span className="shrink-0 text-[10px] font-semibold tracking-wide text-slate-400 sm:text-xs">
                NEW TO ELIMUPLUS?
              </span>

              <div className="h-px min-w-0 flex-1 bg-slate-200" />
            </div>

            <Link
              to="/register"
              className="flex min-h-12 w-full items-center justify-center rounded-xl border border-[#14532D] px-5 py-3 text-sm font-bold text-[#14532D] transition-colors hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100"
            >
              Create an Account
            </Link>

            <p className="mx-auto mt-6 max-w-sm text-center text-xs leading-5 text-slate-500 sm:mt-7 sm:text-sm sm:leading-6">
              Keep your password private.
            </p>

            <p className="mt-5 text-center text-xs text-slate-400">
              <Link to="/" className="hover:text-[#14532D] hover:underline">
                ← Back to home
              </Link>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
