
import React, { useState } from 'react';
import { submitApplication } from '../../Service/api';

const initialFormData = {
  familyStatus: '',
  householdIncomeBracket: '',
  disabledParents: false,
  chronicIllnessInFamily: false,
  siblingsInSchool: '0',
  schoolId: '',
  studentCategory: '',
  admissionNumber: '',
  outstandingFees: '',
  chiefLetterUrl: '',
  feeStructureUrl: '',
  reportCardUrl: '',
  parentIDOrDeathCertificateUrl: '',
  studentIDOrBirthCertUrl: '',
};

const documentFields = [
  {
    name: 'chiefLetterUrl',
    label: "Chief's Letter",
    description: 'Reference URL for the chief’s letter.',
  },
  {
    name: 'feeStructureUrl',
    label: 'School Fee Structure',
    description: 'Reference URL for the current fee structure.',
  },
  {
    name: 'reportCardUrl',
    label: 'Academic Report Card',
    description: 'Reference URL for the latest report card.',
  },
  {
    name: 'parentIDOrDeathCertificateUrl',
    label: 'Parent ID or Death Certificate',
    description:
      'Provide the document reference required for your family circumstances.',
  },
  {
    name: 'studentIDOrBirthCertUrl',
    label: 'Student ID or Birth Certificate',
    description: 'Reference URL for the student identification document.',
  },
];

const inputClass =
  'mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100';

const labelClass = 'text-sm font-semibold text-slate-700';

export default function ApplicationForm() {
  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successData, setSuccessData] = useState(null);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value,
    }));

    setErrorMessage('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessData(null);

    if (!formData.familyStatus || !formData.householdIncomeBracket) {
      setErrorMessage('Please complete all required family information.');
      return;
    }

    if (
      !formData.schoolId.trim() ||
      !formData.studentCategory ||
      !formData.admissionNumber.trim()
    ) {
      setErrorMessage('Please complete all required school information.');
      return;
    }

    const schoolIdPattern = /^[a-fA-F0-9]{24}$/;

    if (!schoolIdPattern.test(formData.schoolId.trim())) {
      setErrorMessage(
        'The school ID must be a valid 24-character MongoDB ID. A school selection dropdown can replace this field when connected to the schools API.'
      );
      return;
    }

    const outstandingFees = Number(formData.outstandingFees);
    const siblingsInSchool = Number(formData.siblingsInSchool);

    if (
      formData.outstandingFees === '' ||
      !Number.isSafeInteger(outstandingFees) ||
      outstandingFees < 0
    ) {
      setErrorMessage(
        'Enter a valid outstanding fee amount using a whole number of Kenyan shillings.'
      );
      return;
    }

    if (
      formData.siblingsInSchool === '' ||
      !Number.isSafeInteger(siblingsInSchool) ||
      siblingsInSchool < 0
    ) {
      setErrorMessage(
        'Enter a valid non-negative number of siblings in school.'
      );
      return;
    }

    const requiredDocuments = documentFields.every(({ name }) =>
      formData[name].trim()
    );

    if (!requiredDocuments) {
      setErrorMessage('Please provide all five required document references.');
      return;
    }

    const invalidDocument = documentFields.find(({ name }) => {
      try {
        const url = new URL(formData[name].trim());
        return !['http:', 'https:'].includes(url.protocol);
      } catch {
        return true;
      }
    });

    if (invalidDocument) {
      setErrorMessage(
        `Please enter a valid HTTP or HTTPS URL for ${invalidDocument.label}.`
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const applicationData = {
        familyStatus: formData.familyStatus,
        householdIncomeBracket: formData.householdIncomeBracket,
        disabledParents: formData.disabledParents,
        chronicIllnessInFamily: formData.chronicIllnessInFamily,
        siblingsInSchool,
        schoolId: formData.schoolId.trim(),
        studentCategory: formData.studentCategory,
        admissionNumber: formData.admissionNumber.trim(),
        outstandingFees,
        chiefLetterUrl: formData.chiefLetterUrl.trim(),
        feeStructureUrl: formData.feeStructureUrl.trim(),
        reportCardUrl: formData.reportCardUrl.trim(),
        parentIDOrDeathCertificateUrl:
          formData.parentIDOrDeathCertificateUrl.trim(),
        studentIDOrBirthCertUrl: formData.studentIDOrBirthCertUrl.trim(),
      };

      const result = await submitApplication(applicationData);

      setSuccessData({
        applicationNumber: result.applicationNumber,
        status: result.status,
        message: result.message,
      });

      setFormData(initialFormData);
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message ||
          'We could not submit your application. Please check your details and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (successData) {
    return (
      <section className="mx-auto max-w-3xl rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm sm:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-800">
          ✓
        </div>

        <h1 className="mt-5 text-center text-2xl font-bold text-slate-900">
          Application Submitted
        </h1>

        <p className="mt-3 text-center text-sm leading-6 text-slate-600">
          {successData.message ||
            'Your bursary application has been submitted successfully.'}
        </p>

        <div className="mt-6 rounded-xl bg-slate-50 p-5">
          <p className="text-sm text-slate-500">Application number</p>
          <p className="mt-1 break-all text-lg font-bold text-emerald-800">
            {successData.applicationNumber}
          </p>

          <p className="mt-4 text-sm text-slate-500">Application status</p>
          <p className="mt-1 font-semibold text-slate-800">
            {successData.status}
          </p>
        </div>

        <p className="mt-5 text-sm leading-6 text-slate-600">
          Keep your application number for future reference. Submission does
          not guarantee an award; your application will follow the programme's
          review process.
        </p>

        <button
          type="button"
          onClick={() => setSuccessData(null)}
          className="mt-6 w-full rounded-xl bg-emerald-800 px-5 py-3 font-semibold text-white transition hover:bg-emerald-900"
        >
          Return to Application Form
        </button>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-5xl pb-10">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-emerald-900 px-5 py-7 text-white sm:px-8 sm:py-9">
          <p className="text-sm font-medium text-emerald-200">
            GANZE'S FUTURE
          </p>

          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
            Bursary Application
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50">
            Complete the sections below carefully. Ensure that your personal,
            school and supporting document information is accurate before
            submitting.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-9 p-5 sm:p-8">
          {errorMessage && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800"
            >
              {errorMessage}
            </div>
          )}

          {/* Family and vulnerability information */}
          <section>
            <div className="mb-5 border-b border-slate-200 pb-3">
              <h2 className="text-lg font-bold text-slate-900">
                1. Family Information
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Provide truthful information about your household circumstances.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="familyStatus" className={labelClass}>
                  Family status *
                </label>
                <select
                  id="familyStatus"
                  name="familyStatus"
                  value={formData.familyStatus}
                  onChange={handleChange}
                  required
                  className={inputClass}
                >
                  <option value="">Select family status</option>
                  <option value="total-orphan">Total orphan</option>
                  <option value="partial-orphan-single-parent">
                    Partial orphan / single parent
                  </option>
                  <option value="both-parents-alive">
                    Both parents alive
                  </option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="householdIncomeBracket"
                  className={labelClass}
                >
                  Household income bracket *
                </label>
                <select
                  id="householdIncomeBracket"
                  name="householdIncomeBracket"
                  value={formData.householdIncomeBracket}
                  onChange={handleChange}
                  required
                  className={inputClass}
                >
                  <option value="">Select income bracket</option>
                  <option value="under-10000">
                    Below KES 10,000
                  </option>
                  <option value="10000-30000">
                    KES 10,000–30,000
                  </option>
                  <option value="above-30000">
                    Above KES 30,000
                  </option>
                </select>
              </div>

              <div>
                <label htmlFor="siblingsInSchool" className={labelClass}>
                  Number of siblings in school *
                </label>
                <input
                  id="siblingsInSchool"
                  name="siblingsInSchool"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.siblingsInSchool}
                  onChange={handleChange}
                  required
                  className={inputClass}
                />
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4">
                <input
                  type="checkbox"
                  name="disabledParents"
                  checked={formData.disabledParents}
                  onChange={handleChange}
                  className="mt-1 h-4 w-4 accent-emerald-800"
                />
                <span>
                  <span className="block text-sm font-semibold text-slate-800">
                    Disability in the parent or guardian
                  </span>
                  <span className="mt-1 block text-sm text-slate-500">
                    Select if this applies to your household.
                  </span>
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4">
                <input
                  type="checkbox"
                  name="chronicIllnessInFamily"
                  checked={formData.chronicIllnessInFamily}
                  onChange={handleChange}
                  className="mt-1 h-4 w-4 accent-emerald-800"
                />
                <span>
                  <span className="block text-sm font-semibold text-slate-800">
                    Chronic illness in the family
                  </span>
                  <span className="mt-1 block text-sm text-slate-500">
                    Select if this applies to your household.
                  </span>
                </span>
              </label>
            </div>
          </section>

          {/* School information */}
          <section>
            <div className="mb-5 border-b border-slate-200 pb-3">
              <h2 className="text-lg font-bold text-slate-900">
                2. School Information
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Enter the school details associated with this application.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="schoolId" className={labelClass}>
                  School ID *
                </label>
                <input
                  id="schoolId"
                  name="schoolId"
                  type="text"
                  value={formData.schoolId}
                  onChange={handleChange}
                  required
                  placeholder="Enter the registered school's ID"
                  className={inputClass}
                />
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  This field currently expects the school's database ID, not
                  its name. We should replace it with a dropdown of verified
                  schools connected to the backend.
                </p>
              </div>

              <div>
                <label htmlFor="studentCategory" className={labelClass}>
                  Education category *
                </label>
                <select
                  id="studentCategory"
                  name="studentCategory"
                  value={formData.studentCategory}
                  onChange={handleChange}
                  required
                  className={inputClass}
                >
                  <option value="">Select category</option>
                  <option value="Primary">Primary</option>
                  <option value="Junior Secondary">Junior Secondary</option>
                  <option value="Senior Secondary">Senior Secondary</option>
                  <option value="TVET">TVET</option>
                  <option value="Polytechnic">Polytechnic</option>
                  <option value="College">College</option>
                  <option value="University">University</option>
                </select>
              </div>

              <div>
                <label htmlFor="admissionNumber" className={labelClass}>
                  Admission / registration number *
                </label>
                <input
                  id="admissionNumber"
                  name="admissionNumber"
                  type="text"
                  value={formData.admissionNumber}
                  onChange={handleChange}
                  required
                  maxLength={100}
                  placeholder="Enter your admission number"
                  className={inputClass}
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="outstandingFees" className={labelClass}>
                  Outstanding school fees (KES) *
                </label>
                <input
                  id="outstandingFees"
                  name="outstandingFees"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.outstandingFees}
                  onChange={handleChange}
                  required
                  placeholder="e.g. 25000"
                  className={inputClass}
                />
              </div>
            </div>
          </section>

          {/* Supporting documents */}
          <section>
            <div className="mb-5 border-b border-slate-200 pb-3">
              <h2 className="text-lg font-bold text-slate-900">
                3. Supporting Documents
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Enter the HTTP or HTTPS URLs of the five required documents.
                These are document references, not file uploads.
              </p>
            </div>

            <div className="space-y-5">
              {documentFields.map((document) => (
                <div key={document.name}>
                  <label
                    htmlFor={document.name}
                    className={labelClass}
                  >
                    {document.label} *
                  </label>

                  <input
                    id={document.name}
                    name={document.name}
                    type="url"
                    value={formData[document.name]}
                    onChange={handleChange}
                    required
                    placeholder="https://..."
                    className={inputClass}
                  />

                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    {document.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Submission */}
          <section className="rounded-xl bg-slate-50 p-4 sm:p-5">
            <h2 className="font-semibold text-slate-900">
              Before you submit
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Check that the information is correct and that your document
              links are accessible to the authorised reviewers. Your
              application will be processed according to the bursary
              programme's review procedures.
            </p>
          </section>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-emerald-800 px-6 py-4 font-semibold text-white shadow-sm transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Submitting Application...' : 'Submit Application'}
          </button>

          <p className="text-center text-xs text-slate-500">
            Fields marked with * are required.
          </p>
        </form>
      </div>
    </section>
  );
}
