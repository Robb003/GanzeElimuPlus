
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const initialForm = {
  fullName: '',
  phoneNumber: '',
  password: '',
  confirmPassword: '',
  identityType: 'nationalID',
  identityNumber: '',
  ward: '',
  village: '',
};

const wards = ['Ganze', 'Bamba', 'Jaribuni', 'Sokoke'];

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const updateField = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const changeIdentityType = (event) => {
    setForm((previous) => ({
      ...previous,
      identityType: event.target.value,
      identityNumber: '',
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!form.identityNumber.trim()) {
      setError('Please enter your selected identity number.');
      return;
    }

    if (form.password.length < 8) {
      setError('Your password must contain at least 8 characters.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Your passwords do not match.');
      return;
    }

    const payload = {
      fullName: form.fullName.trim(),
      phoneNumber: form.phoneNumber.trim(),
      password: form.password,
      ward: form.ward,
      village: form.village.trim(),
      ...(form.identityType === 'nationalID'
        ? { nationalID: form.identityNumber.trim() }
        : {
            birthCertificateNumber: form.identityNumber.trim(),
          }),
    };

    try {
      setLoading(true);

      await register(payload);

      setSuccess(
        'Your account has been created successfully. Redirecting to login...'
      );

      setForm({ ...initialForm });

      // Registration does not automatically log the user in.
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 1200);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Registration failed. Please check your details and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'mt-2 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#166534] focus:ring-4 focus:ring-emerald-100';

  return (
    <main className="min-h-screen bg-[#F8FAFC] px-4 py-6 sm:px-6 sm:py-10 lg:py-14">
      <div className="mx-auto max-w-6xl">
        <div className="grid overflow-hidden rounded-2xl bg-white shadow-xl shadow-slate-900/5 sm:rounded-3xl lg:grid-cols-2">

          {/* Branding panel: desktop */}
          <section className="relative hidden flex-col justify-between overflow-hidden bg-[#14532D] p-10 text-white lg:flex xl:p-14">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl"
            />

            <div className="relative">
              <Link to="/" className="inline-flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-xl font-extrabold text-[#14532D]">
                  E
                </span>
                <span className="text-2xl font-extrabold">
                  ElimuPlus
                </span>
              </Link>

              <p className="mt-16 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-200">
                Ganze NG-CDF Bursary Programme
              </p>

              <h1 className="mt-5 text-4xl font-extrabold leading-tight xl:text-5xl">
                Your journey towards educational support starts here.
              </h1>

              <p className="mt-6 max-w-md leading-8 text-emerald-100">
                Create your account to access the bursary application
                process, submit your details, and follow your
                application progress.
              </p>
            </div>

            <div className="relative mt-16 rounded-2xl border border-white/15 bg-white/10 p-5">
              <p className="font-semibold">Before you register</p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-emerald-50">
                <li>• Use a phone number you can access.</li>
                <li>• Provide either a National ID or birth certificate number.</li>
                <li>• Enter your correct ward and village.</li>
              </ul>
            </div>
          </section>

          {/* Registration form */}
          <section className="min-w-0 p-5 sm:p-8 lg:p-10 xl:p-12">

            {/* Mobile branding */}
            <div className="mb-8 lg:hidden">
              <Link to="/" className="inline-flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#14532D] text-lg font-extrabold text-white">
                  E
                </span>
                <span className="text-xl font-extrabold text-[#14532D]">
                  ElimuPlus
                </span>
              </Link>
            </div>

            <div>
              <p className="text-sm font-semibold text-[#166534]">
                CREATE YOUR ACCOUNT
              </p>

              <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[#0F172A]">
                Register
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Enter your details to create your ElimuPlus account.
              </p>
            </div>

            {error && (
              <div
                role="alert"
                aria-live="polite"
                className="mt-6 break-words rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            {success && (
              <div
                role="status"
                aria-live="polite"
                className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
              >
                {success}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="mt-7 space-y-5"
            >
              {/* Full name */}
              <div>
                <label
                  htmlFor="fullName"
                  className="text-sm font-semibold text-slate-700"
                >
                  Full name
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  placeholder="Enter your full name"
                  value={form.fullName}
                  onChange={updateField}
                  className={inputClass}
                  required
                  maxLength={120}
                />
              </div>

              {/* Phone number */}
              <div>
                <label
                  htmlFor="phoneNumber"
                  className="text-sm font-semibold text-slate-700"
                >
                  Phone number
                </label>
                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  autoComplete="tel"
                  placeholder="e.g. 0712345678"
                  value={form.phoneNumber}
                  onChange={updateField}
                  className={inputClass}
                  required
                />
                <p className="mt-1 text-xs text-slate-500">
                  Use a phone number you can access.
                </p>
              </div>

              {/* Identity document */}
              <fieldset>
                <legend className="text-sm font-semibold text-slate-700">
                  Identity document
                </legend>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Select only one. Do not provide both numbers.
                </p>

                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm transition ${
                      form.identityType === 'nationalID'
                        ? 'border-[#166534] bg-emerald-50 text-[#14532D]'
                        : 'border-slate-200 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="identityType"
                      value="nationalID"
                      checked={form.identityType === 'nationalID'}
                      onChange={changeIdentityType}
                      className="accent-[#14532D]"
                    />
                    National ID
                  </label>

                  <label
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm transition ${
                      form.identityType === 'birthCertificateNumber'
                        ? 'border-[#166534] bg-emerald-50 text-[#14532D]'
                        : 'border-slate-200 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="identityType"
                      value="birthCertificateNumber"
                      checked={
                        form.identityType === 'birthCertificateNumber'
                      }
                      onChange={changeIdentityType}
                      className="accent-[#14532D]"
                    />
                    Birth certificate
                  </label>
                </div>

                <label
                  htmlFor="identityNumber"
                  className="mt-4 block text-sm font-semibold text-slate-700"
                >
                  {form.identityType === 'nationalID'
                    ? 'National ID number'
                    : 'Birth certificate number'}
                </label>

                <input
                  id="identityNumber"
                  name="identityNumber"
                  type="text"
                  autoComplete="off"
                  placeholder={
                    form.identityType === 'nationalID'
                      ? 'Enter your National ID number'
                      : 'Enter your birth certificate number'
                  }
                  value={form.identityNumber}
                  onChange={updateField}
                  className={inputClass}
                  required
                />
              </fieldset>

              {/* Ward and village */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="ward"
                    className="text-sm font-semibold text-slate-700"
                  >
                    Ward
                  </label>

                  <select
                    id="ward"
                    name="ward"
                    value={form.ward}
                    onChange={updateField}
                    className={inputClass}
                    required
                  >
                    <option value="">Select ward</option>
                    {wards.map((ward) => (
                      <option key={ward} value={ward}>
                        {ward}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="village"
                    className="text-sm font-semibold text-slate-700"
                  >
                    Village
                  </label>

                  <input
                    id="village"
                    name="village"
                    type="text"
                    autoComplete="address-level2"
                    placeholder="Enter village"
                    value={form.village}
                    onChange={updateField}
                    className={inputClass}
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="text-sm font-semibold text-slate-700"
                >
                  Password
                </label>

                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Create a password"
                    value={form.password}
                    onChange={updateField}
                    className={`${inputClass} pr-20`}
                    minLength={8}
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded px-2 py-2 text-xs font-semibold text-[#14532D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>

                <p className="mt-1 text-xs text-slate-500">
                  Use at least 8 characters.
                </p>
              </div>

              {/* Confirm password */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="text-sm font-semibold text-slate-700"
                >
                  Confirm password
                </label>

                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Enter your password again"
                  value={form.confirmPassword}
                  onChange={updateField}
                  className={inputClass}
                  minLength={8}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex min-h-12 w-full items-center justify-center rounded-xl bg-[#14532D] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#166534] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-bold text-[#14532D] hover:underline"
              >
                Log in
              </Link>
            </p>

            <p className="mt-5 text-center text-xs leading-5 text-slate-500">
              Your information should be accurate and will be handled
              according to the application's privacy and security
              requirements.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
