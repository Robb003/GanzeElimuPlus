
import React from 'react'
import { Link } from 'react-router-dom'
import { assets } from '../assets/assets'

export default function Herosection() {
  return (
    <section
      id="home"
      className="relative overflow-hidden bg-[#F8FAFC]"
    >
      {/* Soft decorative background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 -top-32 h-72 w-72 rounded-full bg-emerald-100/60 blur-3xl"
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-10 sm:px-6 sm:py-14 md:gap-12 md:py-16 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-20">

        {/* Hero content */}
        <div className="max-w-2xl">

          {/* Programme label */}
          <div className="mb-5 inline-flex max-w-full items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-[#14532D] sm:mb-6 sm:px-4 sm:text-sm">
            <span
              className="h-2 w-2 shrink-0 rounded-full bg-[#F59E0B]"
              aria-hidden="true"
            />
            <span>Ganze NG-CDF Bursary Programme</span>
          </div>

          {/* Main heading */}
          <h1 className="text-3xl font-extrabold leading-[1.15] tracking-tight text-[#14532D] sm:text-4xl md:text-5xl lg:text-6xl">
            Empowering Ganze's Future.
            <span className="mt-2 block text-[#0F172A]">
              Secure Your Bursary{' '}
              <span className="text-[#B77908]">Today.</span>
            </span>
          </h1>

          {/* Description */}
          <p className="mt-5 max-w-xl text-sm leading-7 text-slate-600 sm:mt-6 sm:text-base sm:leading-8 lg:text-lg">
            Access bursary support through a simpler, more
            transparent application process. ElimuPlus aims to
            connect eligible students in Ganze Constituency with
            educational funding and support their journey to success.
          </p>

          {/* Action buttons */}
          <div className="mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:items-center">

            <Link
              to="/register"
              className="group inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-xl bg-[#14532D] px-6 py-3.5 text-base font-bold text-white shadow-md shadow-green-950/10 transition duration-200 hover:bg-[#166534] focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300 sm:w-auto sm:px-7"
            >
              Apply for a Bursary

              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="h-5 w-5 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                />
              </svg>
            </Link>

          </div>

          {/* Trust indicators */}
          <div className="mt-7 grid grid-cols-1 gap-3 border-t border-slate-200 pt-5 text-sm text-slate-600 sm:mt-8 sm:grid-cols-2 sm:gap-4">

            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[#14532D]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m9 12 2 2 4-4"
                  />
                </svg>
              </span>

              <span>
                <span className="block font-semibold text-slate-800">
                  Secure Applications
                </span>
                <span className="text-xs text-slate-500">
                  Protected application workflow
                </span>
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-800">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m8 12 3 3 5-6"
                  />
                </svg>
              </span>

              <span>
                <span className="block font-semibold text-slate-800">
                  Transparent Review
                </span>
                <span className="text-xs text-slate-500">
                  Structured document verification
                </span>
              </span>
            </div>

          </div>
        </div>

        {/* Hero image */}
        <div className="relative mx-auto w-full max-w-xl lg:max-w-none">

          {/* Decorative shapes */}
          <div
            aria-hidden="true"
            className="absolute -right-2 -top-2 h-20 w-20 rounded-2xl bg-[#D1FAE5] sm:-right-4 sm:-top-4 sm:h-28 sm:w-28"
          />

          <div
            aria-hidden="true"
            className="absolute -bottom-3 -left-2 h-20 w-20 rounded-2xl bg-amber-100 sm:-bottom-4 sm:-left-4 sm:h-28 sm:w-28"
          />

          <div className="relative overflow-hidden rounded-2xl border border-white bg-white p-1.5 shadow-xl shadow-slate-900/10 sm:rounded-3xl sm:p-2">

            <img
              src={assets.heroImage}
              alt="Students studying together and working towards their educational goals"
              fetchPriority="high"
              className="h-64 w-full rounded-xl object-cover object-center sm:h-80 sm:rounded-2xl md:h-[420px] lg:h-[500px]"
            />

            {/* Image caption */}
            <div className="absolute inset-x-1.5 bottom-1.5 rounded-b-xl bg-gradient-to-t from-black/80 via-black/35 to-transparent px-4 pb-4 pt-14 sm:inset-x-2 sm:bottom-2 sm:rounded-b-2xl sm:px-6 sm:pb-6 sm:pt-20">
              <p className="text-base font-bold text-white sm:text-xl">
                Investing in Education
              </p>

              <p className="mt-1 text-xs leading-5 text-white/90 sm:text-sm">
                Supporting the next generation of Ganze.
              </p>
            </div>

          </div>
        </div>

      </div>
    </section>
  )
}
