
import React from 'react';
import { Link } from 'react-router-dom';

const features = [
  {
    number: '01',
    title: 'Accessible Applications',
    description:
      'Provide eligible students with a clear process for applying for bursary support.',
  },
  {
    number: '02',
    title: 'Transparent Verification',
    description:
      'Applications and supporting documents undergo a structured review process.',
  },
  {
    number: '03',
    title: 'Accountable Funding',
    description:
      'Support responsible bursary allocation and maintain records of funding decisions.',
  },
];

export default function About() {
  return (
    <section
      id="about"
      className="overflow-hidden bg-white py-16 sm:py-20 lg:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section heading */}
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-[#14532D]">
            About ElimuPlus
          </span>

          <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-[#0F172A] sm:text-4xl lg:text-5xl">
            Creating a clearer path to
            <span className="block text-[#14532D]">
              educational support
            </span>
          </h2>

          <p className="mt-5 text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">
            ElimuPlus is designed to support the Ganze NG-CDF bursary
            application process through accessible applications,
            structured document verification, and accountable
            bursary management.
          </p>
        </div>

        {/* Feature cards */}
        <div className="mt-12 grid grid-cols-1 gap-5 sm:mt-16 md:grid-cols-3 md:gap-6">
          {features.map((feature) => (
            <article
              key={feature.number}
              className="group rounded-2xl border border-slate-200 bg-[#F8FAFC] p-6 transition duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:bg-white hover:shadow-lg sm:p-8"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-sm font-extrabold text-[#14532D] transition group-hover:bg-[#14532D] group-hover:text-white">
                {feature.number}
              </span>

              <h3 className="mt-6 text-xl font-bold text-[#0F172A]">
                {feature.title}
              </h3>

              <p className="mt-3 text-sm leading-7 text-slate-600">
                {feature.description}
              </p>
            </article>
          ))}
        </div>

        {/* Call to action */}
        <div className="mt-10 flex flex-col items-start justify-between gap-5 rounded-2xl bg-[#14532D] p-6 sm:mt-12 sm:flex-row sm:items-center sm:p-8 lg:p-10">
          <div>
            <h3 className="text-xl font-bold text-white sm:text-2xl">
              Your educational journey matters.
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-100">
              Explore the application process and prepare your
              supporting documents before applying.
            </p>
          </div>

          <Link
            to="/register"
            className="inline-flex min-h-12 w-full shrink-0 items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-bold text-[#14532D] transition hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300 sm:w-auto"
          >
            Get Started
          </Link>
        </div>
      </div>
    </section>
  );
}
