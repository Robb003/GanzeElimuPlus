
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { recordPrivacyAcknowledgement } from '../Service/api';

export default function Consent() {
  const navigate = useNavigate();

  const [applicantType, setApplicantType] = useState('adult');

  const [acknowledged, setAcknowledged] = useState(false);

  const [guardian, setGuardian] = useState({
    fullName: '',
    relationship: '',
    phoneNumber: '',
    consentGiven: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGuardianChange = (e) => {
    const { name, value } = e.target;

    setGuardian((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const canContinue =
    acknowledged &&
    (
      applicantType === 'adult' ||
      (
        guardian.fullName.trim() &&
        guardian.relationship.trim() &&
        guardian.phoneNumber.trim() &&
        guardian.consentGiven
      )
    );

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!canContinue) {
      setError('Please complete the required confirmation before continuing.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // The backend determines the official privacy notice version.
      const payload = {
        applicantType,
        acknowledged,
        ...(applicantType === 'minor' && {
          guardian: {
            fullName: guardian.fullName.trim(),
            relationship: guardian.relationship.trim(),
            phoneNumber: guardian.phoneNumber.trim(),
            consentGiven: guardian.consentGiven,
          },
        }),
      };

      await recordPrivacyAcknowledgement(payload);

      navigate('/applicant-dashboard', { replace: true });
    } catch (err) {
      console.error('Privacy acknowledgement error:', err);

      setError(
        err.response?.data?.message ||
        'Unable to save your acknowledgement. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-3xl">

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100 text-green-800">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-9 w-9"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7l8-4z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4"
              />
            </svg>
          </div>

          <h1 className="mt-4 text-2xl font-bold text-slate-900 sm:text-3xl">
            Data Protection & Privacy
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            Ganze NG-CDF Bursary Programme – ElimuPlus
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"
        >

          {/* Introduction */}
          <section>
            <h2 className="text-lg font-bold text-slate-900">
              1. Introduction
            </h2>

            <p className="mt-2 text-sm leading-7 text-slate-600">
              This Privacy Notice explains how personal information
              is collected, used, stored and protected when you use
              ElimuPlus to apply for the Ganze NG-CDF Bursary Programme.
            </p>

            <p className="mt-2 text-sm leading-7 text-slate-600">
              Personal information will be handled in accordance
              with the Kenya Data Protection Act, 2019, and applicable
              data protection regulations.
            </p>
          </section>

          {/* Information collected */}
          <section className="border-t border-slate-100 pt-5">
            <h2 className="text-lg font-bold text-slate-900">
              2. Information We Collect
            </h2>

            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-600">
              <li>Full name and contact information.</li>
              <li>National identification or birth certificate details.</li>
              <li>School and education information.</li>
              <li>Parent or guardian information where applicable.</li>
              <li>Family and financial circumstances relevant to bursary eligibility.</li>
              <li>Supporting documents required for application verification.</li>
              <li>Disability or health-related information where relevant and lawfully required.</li>
            </ul>
          </section>

          {/* Purpose */}
          <section className="border-t border-slate-100 pt-5">
            <h2 className="text-lg font-bold text-slate-900">
              3. Why We Collect Your Information
            </h2>

            <p className="mt-2 text-sm leading-7 text-slate-600">
              Your information is used for purposes including:
            </p>

            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-600">
              <li>Creating and managing applicant accounts.</li>
              <li>Assessing bursary applications.</li>
              <li>Verifying applicant identity and supporting documents.</li>
              <li>Communicating application decisions and updates.</li>
              <li>Administering approved bursary payments.</li>
              <li>Maintaining financial accountability and audit records.</li>
            </ul>
          </section>

          {/* Sharing */}
          <section className="border-t border-slate-100 pt-5">
            <h2 className="text-lg font-bold text-slate-900">
              4. Sharing of Information
            </h2>

            <p className="mt-2 text-sm leading-7 text-slate-600">
              Information may be accessed by authorised bursary
              administrators and shared with relevant schools,
              government authorities or service providers where
              necessary for programme administration and where
              permitted by law.
            </p>

            <p className="mt-2 text-sm leading-7 text-slate-600">
              Access will be restricted to authorised persons and
              appropriate security safeguards will be applied.
            </p>
          </section>

          {/* Security and retention */}
          <section className="border-t border-slate-100 pt-5">
            <h2 className="text-lg font-bold text-slate-900">
              5. Storage, Security and Retention
            </h2>

            <p className="mt-2 text-sm leading-7 text-slate-600">
              Appropriate technical and organisational measures
              will be used to protect personal information against
              unauthorised access, loss, misuse or disclosure.
            </p>

            <p className="mt-2 text-sm leading-7 text-slate-600">
              Personal information will be retained only for the
              period required for the stated purposes and applicable
              legal, financial and audit obligations.
            </p>
          </section>

          {/* Rights */}
          <section className="border-t border-slate-100 pt-5">
            <h2 className="text-lg font-bold text-slate-900">
              6. Your Data Protection Rights
            </h2>

            <p className="mt-2 text-sm leading-7 text-slate-600">
              Subject to applicable law, you may have the right to:
            </p>

            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-600">
              <li>Be informed about how your information is used.</li>
              <li>Access your personal information.</li>
              <li>Request correction of inaccurate information.</li>
              <li>Request deletion where legally applicable.</li>
              <li>Object to or restrict certain processing.</li>
              <li>Exercise other rights provided under Kenyan law.</li>
            </ul>
          </section>

          {/* Controller details */}
          <section className="rounded-xl bg-amber-50 p-4">
            <h2 className="font-bold text-slate-900">
              7. Contact for Privacy Matters
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-700">
              Data Controller: [Insert the confirmed legal name of
              the responsible organisation].
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-700">
              Privacy Contact: [Insert official email address and
              contact details].
            </p>

            <p className="mt-2 text-xs leading-5 text-amber-800">
              These details must be completed and verified before
              this notice is published to applicants.
            </p>
          </section>

          {/* Applicant type */}
          <section className="border-t border-slate-100 pt-5">
            <h2 className="text-lg font-bold text-slate-900">
              8. Applicant Confirmation
            </h2>

            <p className="mt-2 text-sm text-slate-600">
              Please indicate your age category.
            </p>

            <div className="mt-4 space-y-3">
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-4">
                <input
                  type="radio"
                  name="applicantType"
                  value="adult"
                  checked={applicantType === 'adult'}
                  onChange={(e) => {
                    setApplicantType(e.target.value);
                    setAcknowledged(false);
                  }}
                  className="h-4 w-4 accent-green-800"
                />

                <span className="text-sm font-medium text-slate-800">
                  I am 18 years or older.
                </span>
              </label>

              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-4">
                <input
                  type="radio"
                  name="applicantType"
                  value="minor"
                  checked={applicantType === 'minor'}
                  onChange={(e) => {
                    setApplicantType(e.target.value);
                    setAcknowledged(false);
                  }}
                  className="h-4 w-4 accent-green-800"
                />

                <span className="text-sm font-medium text-slate-800">
                  I am under 18 years old.
                </span>
              </label>
            </div>

            {/* Adult acknowledgement */}
            {applicantType === 'adult' && (
              <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={acknowledged}
                    onChange={(e) => setAcknowledged(e.target.checked)}
                    className="mt-1 h-4 w-4 accent-green-800"
                  />

                  <span className="text-sm leading-6 text-slate-700">
                    I confirm that I have read and understood this
                    Privacy Notice and acknowledge the information
                    provided about the processing of my personal data.
                  </span>
                </label>
              </div>
            )}

            {/* Minor / guardian details */}
            {applicantType === 'minor' && (
              <div className="mt-5 space-y-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
                <h3 className="font-bold text-slate-900">
                  Parent or Guardian Authorisation
                </h3>

                <p className="text-sm leading-6 text-slate-600">
                  A parent or legally authorised guardian must
                  complete the required authorisation for the
                  processing of a child's personal data.
                </p>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Parent / Guardian Full Name
                  </label>

                  <input
                    type="text"
                    name="fullName"
                    value={guardian.fullName}
                    onChange={handleGuardianChange}
                    placeholder="Enter full name"
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-green-700 focus:ring-2 focus:ring-green-100"
                    required={applicantType === 'minor'}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Relationship to Applicant
                  </label>

                  <select
                    name="relationship"
                    value={guardian.relationship}
                    onChange={handleGuardianChange}
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-green-700"
                    required={applicantType === 'minor'}
                  >
                    <option value="">Select relationship</option>
                    <option value="Parent">Parent</option>
                    <option value="Legal Guardian">Legal Guardian</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Parent / Guardian Phone Number
                  </label>

                  <input
                    type="tel"
                    name="phoneNumber"
                    value={guardian.phoneNumber}
                    onChange={handleGuardianChange}
                    placeholder="Enter phone number"
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-green-700 focus:ring-2 focus:ring-green-100"
                    required={applicantType === 'minor'}
                  />
                </div>

                <label className="flex cursor-pointer items-start gap-3 border-t border-blue-200 pt-4">
                  <input
                    type="checkbox"
                    checked={guardian.consentGiven}
                    onChange={(e) =>
                      setGuardian((previous) => ({
                        ...previous,
                        consentGiven: e.target.checked,
                      }))
                    }
                    className="mt-1 h-4 w-4 accent-green-800"
                  />

                  <span className="text-sm leading-6 text-slate-700">
                    I confirm that I am the parent or legally
                    authorised guardian of this applicant, and
                    I provide the required authorisation for the
                    processing of the child's personal data as
                    explained in this Privacy Notice.
                  </span>
                </label>

                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={acknowledged}
                    onChange={(e) => setAcknowledged(e.target.checked)}
                    className="mt-1 h-4 w-4 accent-green-800"
                  />

                  <span className="text-sm leading-6 text-slate-700">
                    I confirm that the applicant and I have been
                    informed about this Privacy Notice.
                  </span>
                </label>
              </div>
            )}
          </section>

          {/* Error */}
          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {/* Submit */}
          <div className="border-t border-slate-100 pt-5">
            <button
              type="submit"
              disabled={!canContinue || loading}
              className="w-full rounded-xl bg-green-800 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-green-900 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {loading
                ? 'Saving Confirmation...'
                : 'Acknowledge and Continue'}
            </button>

            <p className="mt-3 text-center text-xs leading-5 text-slate-500">
              Your confirmation will be recorded before you
              proceed to the applicant dashboard.
            </p>
          </div>

        </form>

        <p className="mt-6 text-center text-xs text-slate-400">
          ElimuPlus | Ganze NG-CDF Bursary Programme
        </p>
      </div>
    </div>
  );
}
