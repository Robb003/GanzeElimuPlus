
import { useEffect, useState } from 'react';

import DocumentChecklist from './DocumentChecklist';
import DocumentViewer from './DocumentViewer';

import {
  fetchApplicationDocument,
  processVerification,
} from '../../Service/api';

const DOCUMENT_TYPES = [
  'chiefLetter',
  'feeStructure',
  'reportCard',
  'parentIDOrDeathCertificate',
  'studentIDOrBirthCert',
];

const DOCUMENT_LABELS = {
  chiefLetter: "Chief's Letter",
  feeStructure: 'School Fee Structure',
  reportCard: 'Academic Report Card',
  parentIDOrDeathCertificate: 'Parent ID / Death Certificate',
  studentIDOrBirthCert: 'Student ID / Birth Certificate',
};

export default function ApplicationReview({
  application,
  onDecisionComplete,
}) {
  const [selectedDocument, setSelectedDocument] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');
  const [loadingDocument, setLoadingDocument] = useState(false);
  const [documentError, setDocumentError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  const [rejectionReason, setRejectionReason] = useState('');
  const [decisionLoading, setDecisionLoading] = useState(false);
  const [decisionError, setDecisionError] = useState('');
  const [decisionMessage, setDecisionMessage] = useState('');

  const applicationId = application?._id;

  // Confirm that all five documents were submitted.
  const allDocumentsSubmitted = DOCUMENT_TYPES.every(
    (type) => Boolean(application?.documents?.[type]?.originalName)
  );

  // Reset the review interface when another application is selected.
  useEffect(() => {
    setSelectedDocument('');
    setDocumentUrl('');
    setDocumentError('');
    setLoadingDocument(false);
    setRetryCount(0);

    setRejectionReason('');
    setDecisionLoading(false);
    setDecisionError('');
    setDecisionMessage('');
  }, [applicationId]);

  // Retrieve the selected private PDF from the backend.
  useEffect(() => {
    if (!applicationId || !selectedDocument) {
      setDocumentUrl('');
      setLoadingDocument(false);
      return;
    }

    let cancelled = false;
    let temporaryUrl = null;

    const loadDocument = async () => {
      setLoadingDocument(true);
      setDocumentError('');
      setDocumentUrl('');

      try {
        const pdfBlob = await fetchApplicationDocument(
          applicationId,
          selectedDocument
        );

        if (cancelled) return;

        if (!(pdfBlob instanceof Blob) || pdfBlob.size === 0) {
          throw new Error('The document is empty or invalid.');
        }

        if (
          pdfBlob.type &&
          pdfBlob.type !== 'application/pdf' &&
          pdfBlob.type !== 'application/octet-stream'
        ) {
          throw new Error('The retrieved file is not a valid PDF.');
        }

        temporaryUrl = URL.createObjectURL(pdfBlob);
        setDocumentUrl(temporaryUrl);
      } catch (error) {
        if (cancelled) return;

        console.error('Document preview failed:', error);

        setDocumentError(
          error.response?.data?.message ||
          error.message ||
          'Unable to load this document. Please try again.'
        );
      } finally {
        if (!cancelled) {
          setLoadingDocument(false);
        }
      }
    };

    loadDocument();

    return () => {
      cancelled = true;

      if (temporaryUrl) {
        URL.revokeObjectURL(temporaryUrl);
      }
    };
  }, [applicationId, selectedDocument, retryCount]);

  const handleRetryDocument = () => {
    if (!selectedDocument) return;

    setDocumentError('');
    setDocumentUrl('');
    setRetryCount((previous) => previous + 1);
  };

  // Submit one decision for the entire application.
  const handleDecision = async (action) => {
    if (!applicationId || decisionLoading) return;

    const trimmedReason = rejectionReason.trim();

    if (action === 'Verified' && !allDocumentsSubmitted) {
      setDecisionError(
        'All five supporting documents must be available before verification.'
      );
      return;
    }

    if (action === 'Rejected' && !trimmedReason) {
      setDecisionError(
        'Please provide a reason before rejecting this application.'
      );
      return;
    }

    setDecisionLoading(true);
    setDecisionError('');
    setDecisionMessage('');

    try {
      const payload =
        action === 'Rejected'
          ? {
              action: 'Rejected',
              notes: trimmedReason,
            }
          : {
              action: 'Verified',
            };

      const response = await processVerification(
        applicationId,
        payload
      );

      setDecisionMessage(
        response?.message ||
        (action === 'Verified'
          ? 'All five documents verified successfully.'
          : 'Application rejected successfully.')
      );

      setRejectionReason('');

      // Allow the dashboard to refresh its queue after a decision.
      if (onDecisionComplete) {
        onDecisionComplete(response);
      }
    } catch (error) {
      console.error('Application decision failed:', error);

      setDecisionError(
        error.response?.data?.message ||
        'Unable to record the decision. Please try again.'
      );
    } finally {
      setDecisionLoading(false);
    }
  };

  if (!application) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <h2 className="font-semibold text-slate-800">
          No application selected
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Select an application from the review queue to begin reviewing documents.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-6">

      {/* Application information */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Application number
            </p>

            <h2 className="mt-1 text-lg font-bold text-slate-900">
              {application.applicationNumber || 'Not available'}
            </h2>
          </div>

          <span className="w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            Document review
          </span>
        </div>
      </div>

      {/* Document checklist and PDF viewer */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">

        <DocumentChecklist
          documents={application.documents || {}}
          documentReviews={application.documentReviews || {}}
          selectedDocument={selectedDocument}
          onSelectDocument={(documentType) => {
            setSelectedDocument(documentType);
            setDocumentError('');
          }}
        />

        <div className="min-w-0 space-y-3">

          {documentError && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {documentError}
            </div>
          )}

          <DocumentViewer
            documentName={
              DOCUMENT_LABELS[selectedDocument] ||
              'Select a document'
            }
            documentUrl={documentUrl}
            loading={loadingDocument}
            onRetry={handleRetryDocument}
          />

        </div>
      </div>

      {/* Overall application decision */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Application verification decision
          </h2>

          <p className="mt-1 text-sm text-slate-600">
            Review all five documents above before making one decision
            for this application.
          </p>
        </div>

        <div className="mt-4 rounded-lg bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-800">
            Documents submitted: {DOCUMENT_TYPES.filter(
              (type) => application.documents?.[type]?.originalName
            ).length} / 5
          </p>

          {!allDocumentsSubmitted && (
            <p className="mt-2 text-sm text-amber-700">
              Verification is unavailable because one or more documents
              are missing.
            </p>
          )}
        </div>

        {/* Rejection reason */}
        <div className="mt-5">
          <label
            htmlFor="rejectionReason"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Reason for rejection
            <span className="ml-1 text-red-600">*</span>
          </label>

          <textarea
            id="rejectionReason"
            rows={4}
            maxLength={2000}
            value={rejectionReason}
            onChange={(event) => {
              setRejectionReason(event.target.value);
              setDecisionError('');
            }}
            placeholder="Explain why the application or supporting documents are being rejected..."
            disabled={decisionLoading}
            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-green-700 focus:ring-2 focus:ring-green-100 disabled:bg-slate-100"
          />

          <p className="mt-1 text-right text-xs text-slate-500">
            {rejectionReason.length}/2000 characters
          </p>
        </div>

        {/* Decision feedback */}
        {decisionError && (
          <div
            role="alert"
            className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {decisionError}
          </div>
        )}

        {decisionMessage && (
          <div
            role="status"
            className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
          >
            {decisionMessage}
          </div>
        )}

        {/* Application-level decision buttons */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">

          <button
            type="button"
            onClick={() => handleDecision('Verified')}
            disabled={decisionLoading || !allDocumentsSubmitted}
            className="flex-1 rounded-lg bg-green-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {decisionLoading ? 'Processing...' : 'Verify all five documents'}
          </button>

          <button
            type="button"
            onClick={() => handleDecision('Rejected')}
            disabled={decisionLoading}
            className="flex-1 rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {decisionLoading ? 'Processing...' : 'Reject application'}
          </button>

        </div>

        <p className="mt-3 text-xs text-slate-500">
          Your decision applies to the entire application, not to individual
          documents. Rejection requires a written reason.
        </p>

      </div>
    </section>
  );
}
