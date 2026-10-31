
import React, { useState } from 'react';
import { submitApplication } from '../../Service/api';

const initialFormData = {
  familyStatus: '',
  householdIncomeBracket: '',
  disabledParents: false,
  chronicIllnessInFamily: false,
  siblingsInSchool: '0',
  schoolName: '',
  studentCategory: '',
  admissionNumber: '',
  outstandingFees: '',
};

const initialDocuments = {
  chiefLetter: null,
  feeStructure: null,
  reportCard: null,
  parentIDOrDeathCertificate: null,
  studentIDOrBirthCert: null,
};

const documentFields = [
  {
    name: 'chiefLetter',
    label: "Chief's Letter",
    description: 'Upload an official letter from your area chief.',
  },
  {
    name: 'feeStructure',
    label: 'School Fee Structure',
    description: 'Upload the current school fee structure.',
  },
  {
    name: 'reportCard',
    label: 'Academic Report Card',
    description: 'Upload your latest academic report card.',
  },
  {
    name: 'parentIDOrDeathCertificate',
    label: 'Parent / Guardian ID',
    description: 'Upload your parent or guardian identification document.',
  },
  {
    name: 'studentIDOrBirthCert',
    label: 'Student ID or Birth Certificate',
    description: 'Upload your student identification document or birth certificate.',
  },
];

const studentCategories = [
  'Primary',
  'Junior Secondary',
  'Senior Secondary',
  'TVET / Polytechnic',
  'College',
  'University',
];

const inputClass =
  'mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100';

const labelClass = 'text-sm font-semibold text-slate-700';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const isOrphanStatus = (status) =>
  status === 'total-orphan' ||
  status === 'partial-orphan-single-parent';

export default function ApplicationForm() {
  const [formData, setFormData] = useState(initialFormData);
  const [documents, setDocuments] = useState(initialDocuments);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successData, setSuccessData] = useState(null);

  // Handle ordinary form inputs
  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (
      name === 'familyStatus' &&
      value === 'both-parents-alive'
    ) {
      setDocuments((previous) => ({
        ...previous,
        parentIDOrDeathCertificate: null,
      }));
    }

    setErrorMessage('');
  };

  // Handle PDF uploads
  const handleDocumentChange = (event) => {
    const { name, files } = event.target;
    const file = files?.[0];

    if (!file) return;

    const isPDF =
      file.type === 'application/pdf' &&
      file.name.toLowerCase().endsWith('.pdf');

    if (!isPDF) {
      setErrorMessage('Only PDF documents are accepted.');
      event.target.value = '';
      return;
    }

    if (file.size === 0 || file.size > MAX_FILE_SIZE) {
      setErrorMessage(
        'Each PDF document must be greater than 0 bytes and must not exceed 10 MB.'
      );
      event.target.value = '';
      return;
    }

    setDocuments((previous) => ({
      ...previous,
      [name]: file,
    }));

    setErrorMessage('');
  };

  // Handle application submission
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) return;

    setErrorMessage('');
    setSuccessData(null);

    // Safely read text fields
    const schoolName = (formData.schoolName ?? '').trim();
    const admissionNumber = (formData.admissionNumber ?? '').trim();

    // Validate family information
    if (
      !formData.familyStatus ||
      !formData.householdIncomeBracket
    ) {
      setErrorMessage(
        'Please complete all required family information.'
      );
      return;
    }

    // Validate school information
    if (
      schoolName.length < 2 ||
      schoolName.length > 200 ||
      !formData.studentCategory ||
      !admissionNumber ||
      admissionNumber.length > 50
    ) {
      setErrorMessage(
        'Please provide a valid school name, education category and admission number.'
      );
      return;
    }

    if (!studentCategories.includes(formData.studentCategory)) {
      setErrorMessage('Please select a valid education category.');
      return;
    }

    // Validate outstanding fees
    const outstandingFees = Number(formData.outstandingFees);

    if (
      formData.outstandingFees === '' ||
      !Number.isSafeInteger(outstandingFees) ||
      outstandingFees < 0
    ) {
      setErrorMessage(
        'Enter a valid outstanding fee amount using whole Kenyan shillings.'
      );
      return;
    }

    // Validate siblings
    const siblingsInSchool = Number(formData.siblingsInSchool);

    if (
      formData.siblingsInSchool === '' ||
      !Number.isSafeInteger(siblingsInSchool) ||
      siblingsInSchool < 0
    ) {
      setErrorMessage(
        'Enter a valid number of siblings in school.'
      );
      return;
    }

    // Validate mandatory documents
    const requiredDocuments = documentFields.every(
      ({ name }) => Boolean(documents[name])
    );

    if (!requiredDocuments) {
      setErrorMessage(
        'Please upload all five required supporting documents in PDF format.'
      );
      return;
    }

    // Validate uploaded PDF files
    const invalidDocument = documentFields.find(({ name }) => {
      const file = documents[name];

      return (
        !file ||
        file.type !== 'application/pdf' ||
        !file.name.toLowerCase().endsWith('.pdf') ||
        file.size === 0 ||
        file.size > MAX_FILE_SIZE
      );
    });

    if (invalidDocument) {
      setErrorMessage(
        `Please upload a valid PDF for ${invalidDocument.label}. Maximum size is 10 MB.`
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // Create multipart form data
      const applicationData = new FormData();

      // FAMILY INFORMATION
      applicationData.append(
        'familyStatus',
        formData.familyStatus
      );

      applicationData.append(
        'householdIncomeBracket',
        formData.householdIncomeBracket
      );

      applicationData.append(
        'disabledParents',
        String(formData.disabledParents)
      );

      applicationData.append(
        'chronicIllnessInFamily',
        String(formData.chronicIllnessInFamily)
      );

      applicationData.append(
        'siblingsInSchool',
        String(siblingsInSchool)
      );

      // SCHOOL INFORMATION
      // Applicants enter the school name manually.
      // School verification happens during review.
      applicationData.append(
        'schoolName',
        schoolName
      );

      applicationData.append(
        'studentCategory',
        formData.studentCategory
      );

      applicationData.append(
        'admissionNumber',
        admissionNumber
      );

      applicationData.append(
        'outstandingFees',
        String(outstandingFees)
      );

      // SUPPORTING DOCUMENTS
      documentFields.forEach(({ name }) => {
        applicationData.append(name, documents[name]);
      });

      // SUBMIT TO BACKEND
      const response = await submitApplication(applicationData);

      // Support either an Axios response or a service
      // that already returns response.data.
      const result =
        response?.data?.data ??
        response?.data ??
        response;

      setSuccessData({
        applicationNumber: result?.applicationNumber || 'Submitted',
        status: result?.status || 'Submitted',
        message:
          result?.message ||
          'Your bursary application has been submitted successfully.',
      });

      // Reset form data
      setFormData(initialFormData);
      setDocuments(initialDocuments);

      // Clear file input values
      event.target.reset();

    } catch (error) {
      console.error(
        'Application submission error:',
        error.response?.data || error
      );

      setErrorMessage(
        error.response?.data?.message ||
          error.response?.data?.error ||
          'We could not submit your application. Please check your details and try again.'
      );

    } finally {
      setIsSubmitting(false);
    }
  };

  // SUCCESS SCREEN
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
          {successData.message}
        </p>

        <div className="mt-6 rounded-xl bg-slate-50 p-5">

          <p className="text-sm text-slate-500">
            Application number
          </p>

          <p className="mt-1 break-all text-lg font-bold text-emerald-800">
            {successData.applicationNumber}
          </p>

          <p className="mt-4 text-sm text-slate-500">
            Application status
          </p>

          <p className="mt-1 font-semibold text-slate-800">
            {successData.status}
          </p>

        </div>

        <p className="mt-5 text-sm leading-6 text-slate-600">
          Keep your application number for future reference.
          Submission does not guarantee an award. Your application
          will follow the programme's review process.
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

        {/* HEADER */}
        <div className="bg-emerald-900 px-5 py-7 text-white sm:px-8 sm:py-9">

          <p className="text-sm font-medium text-emerald-200">
            GANZE'S FUTURE
          </p>

          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
            Bursary Application
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50">
            Complete the sections below carefully. Ensure that
            your personal, school and supporting document
            information is accurate before submitting.
          </p>

        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-9 p-5 sm:p-8"
          encType="multipart/form-data"
        >

          {/* ERROR MESSAGE */}
          {errorMessage && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800"
            >
              {errorMessage}
            </div>
          )}

          {/* 1. FAMILY INFORMATION */}
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

              {/* FAMILY STATUS */}
              <div>
                <label
                  htmlFor="familyStatus"
                  className={labelClass}
                >
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

                  <option value="total-orphan">
                    Total orphan
                  </option>

                  <option value="partial-orphan-single-parent">
                    Partial orphan / single parent
                  </option>

                  <option value="both-parents-alive">
                    Both parents alive
                  </option>
                </select>
              </div>

              {/* HOUSEHOLD INCOME */}
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

                  <option value="under-10k">
                    Below KES 10,000
                  </option>

                  <option value="10k-30k">
                    KES 10,000–30,000
                  </option>

                  <option value="above-30k">
                    Above KES 30,000
                  </option>
                </select>
              </div>

              {/* ORPHAN DOCUMENT */}
              {isOrphanStatus(formData.familyStatus) && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 sm:col-span-2">

                  <h3 className="text-sm font-bold text-amber-900">
                    Death Certificate Required
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-amber-800">
                    You have indicated that you are an orphan.
                    Upload the relevant death certificate as
                    evidence of your family circumstances.
                  </p>

                  <label
                    htmlFor="parentIDOrDeathCertificate"
                    className="mt-4 block text-sm font-semibold text-slate-700"
                  >
                    Death Certificate (PDF) *
                  </label>

                  <input
                    id="parentIDOrDeathCertificate"
                    name="parentIDOrDeathCertificate"
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleDocumentChange}
                    required
                    className={inputClass}
                  />

                  {documents.parentIDOrDeathCertificate && (
                    <p className="mt-2 break-all text-sm font-medium text-emerald-800">
                      ✓ {documents.parentIDOrDeathCertificate.name}
                    </p>
                  )}

                  <p className="mt-2 text-xs text-amber-800">
                    PDF only. Maximum 10 MB. Total orphans must
                    provide evidence for both deceased parents.
                  </p>

                </div>
              )}

              {/* SIBLINGS */}
              <div>
                <label
                  htmlFor="siblingsInSchool"
                  className={labelClass}
                >
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

            {/* DISABILITY AND CHRONIC ILLNESS */}
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

          {/* 2. SCHOOL INFORMATION */}
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

              {/* SCHOOL NAME */}
              <div className="sm:col-span-2">

                <label
                  htmlFor="schoolName"
                  className={labelClass}
                >
                  School Name *
                </label>

                <input
                  id="schoolName"
                  name="schoolName"
                  type="text"
                  value={formData.schoolName}
                  onChange={handleChange}
                  required
                  minLength={2}
                  maxLength={200}
                  placeholder="Enter your official school name"
                  className={inputClass}
                />

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Enter the official name of your school as it appears
                  on your admission documents. The school will be
                  verified during application review.
                </p>

              </div>

              {/* STUDENT CATEGORY */}
              <div>

                <label
                  htmlFor="studentCategory"
                  className={labelClass}
                >
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

                  {studentCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>

              </div>

              {/* ADMISSION NUMBER */}
              <div>

                <label
                  htmlFor="admissionNumber"
                  className={labelClass}
                >
                  Admission / registration number *
                </label>

                <input
                  id="admissionNumber"
                  name="admissionNumber"
                  type="text"
                  value={formData.admissionNumber}
                  onChange={handleChange}
                  required
                  maxLength={50}
                  placeholder="Enter your admission number"
                  className={inputClass}
                />

              </div>

              {/* OUTSTANDING FEES */}
              <div className="sm:col-span-2">

                <label
                  htmlFor="outstandingFees"
                  className={labelClass}
                >
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

          {/* 3. SUPPORTING DOCUMENTS */}
          <section>

            <div className="mb-5 border-b border-slate-200 pb-3">

              <h2 className="text-lg font-bold text-slate-900">
                3. Supporting Documents
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Upload all required supporting documents in PDF
                format. Each document must not exceed 10 MB.
              </p>

            </div>

            <div className="space-y-5">

              {documentFields.map((document) => {
                const isParentDocument =
                  document.name === 'parentIDOrDeathCertificate';

                const isOrphan = isOrphanStatus(
                  formData.familyStatus
                );

                // Orphan applicants upload their death
                // certificate in the family information section.
                if (isParentDocument && isOrphan) {
                  return null;
                }

                const label = isParentDocument
                  ? 'Parent / Guardian ID'
                  : document.label;

                return (
                  <div key={document.name}>

                    <label
                      htmlFor={document.name}
                      className={labelClass}
                    >
                      {label} *
                    </label>

                    <input
                      id={document.name}
                      name={document.name}
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={handleDocumentChange}
                      required
                      className={inputClass}
                    />

                    {documents[document.name] && (
                      <p className="mt-2 break-all text-sm font-medium text-emerald-800">
                        ✓ {documents[document.name].name}
                      </p>
                    )}

                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      {document.description} PDF only. Maximum 10 MB.
                    </p>

                  </div>
                );
              })}

            </div>

          </section>

          {/* 4. DECLARATION */}
          <section className="rounded-xl bg-slate-50 p-4 sm:p-5">

            <h2 className="font-semibold text-slate-900">
              Before you submit
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Ensure that all information provided is accurate
              and all supporting documents are genuine and
              readable. Providing false information or
              misleading documents may lead to rejection of
              your application.
            </p>

          </section>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-emerald-800 px-6 py-4 font-semibold text-white shadow-sm transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting
              ? 'Submitting Application...'
              : 'Submit Application'}
          </button>

          <p className="text-center text-xs text-slate-500">
            Fields marked with * are required.
          </p>

        </form>

      </div>

    </section>
  );
}
