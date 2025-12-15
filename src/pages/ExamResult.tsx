import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, Award, ArrowLeft } from 'lucide-react';
import { ExamAttempt } from '../services/exam';
import { useApi } from '../hooks/useApi';
import { examService } from '../services/exam';
import CertificatePreviewModal from '../components/CertificatePreviewModal';

export default function ExamResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const result = location.state?.result as ExamAttempt | undefined;
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const {
    data: attempt,
    loading,
  } = useApi<ExamAttempt | null>(
    async () => {
      if (result) return result;
      if (!id) return null;
      return examService.getAttemptById(id);
    },
    [id, result]
  );

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Loading results...</h3>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Results not found</h3>
        <p className="mt-1 text-sm text-gray-500">Unable to load exam results.</p>
        <button onClick={() => navigate('/training')} className="mt-4 btn-primary">
          Back to Training
        </button>
      </div>
    );
  }

  const score = attempt.score ?? 0;
  const passed = attempt.passed ?? false;
  const timeSpent = attempt.timeSpent ?? 0;
  const certificate = attempt.certificate;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="card mb-6">
        <div className="text-center">
          {passed ? (
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
          ) : (
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <XCircle className="h-10 w-10 text-red-600" />
            </div>
          )}

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {attempt.examTitle ?? 'Exam Results'}
          </h1>

          <div className="flex items-center justify-center gap-8 mt-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900">{score}%</div>
              <div className="text-sm text-gray-600 mt-1">Score</div>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <Clock className="h-5 w-5" />
                {timeSpent} min
              </div>
              <div className="text-sm text-gray-600 mt-1">Time Spent</div>
            </div>
          </div>

          <div className="mt-6">
            <span
              className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                passed
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {passed ? (
                <>
                  <Award className="h-4 w-4 mr-2" />
                  Passed
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Failed
                </>
              )}
            </span>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Exam Details</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-gray-600">Submitted At</span>
            <span className="font-medium">
              {attempt.submittedAt
                ? new Date(attempt.submittedAt).toLocaleString()
                : 'N/A'}
            </span>
          </div>
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-gray-600">Status</span>
            <span className="font-medium capitalize">{attempt.status.toLowerCase().replace('_', ' ')}</span>
          </div>
          {attempt.userName && (
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-gray-600">Candidate</span>
              <span className="font-medium">{attempt.userName}</span>
            </div>
          )}
        </div>
      </div>

      {passed && (
        <div className="card mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Certification</h2>
          {certificate ? (
            <>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-500">Certificate Number</p>
                  <p className="text-lg font-semibold text-gray-900">{certificate.certificateNumber}</p>
                  <p className="text-sm text-gray-500">
                    Issued {new Date(certificate.issuedAt).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    certificate.status === 'APPROVED'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {certificate.status === 'APPROVED' ? 'Approved' : 'Pending Approval'}
                </span>
              </div>
              <p className="text-gray-600 mt-4">
                {certificate.status === 'APPROVED'
                  ? 'Your certificate has been approved. You can download or print it anytime.'
                  : 'Your certificate is pending administrator approval. You will be notified once it is ready to download.'}
              </p>
              <div className="flex items-center gap-3 mt-4">
                <button onClick={() => setIsPreviewOpen(true)} className="btn-primary">
                  {certificate.status === 'APPROVED' ? 'View Certificate' : 'Preview Certificate'}
                </button>
              </div>
            </>
          ) : (
            <p className="text-gray-600">
              Your certificate is being generated. Please check back shortly to view its status.
            </p>
          )}
        </div>
      )}

      <div className="mt-6 flex items-center justify-center gap-4">
        <button onClick={() => navigate('/training')} className="btn-outline flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Training
        </button>
        <button
          onClick={() => navigate(`/training/exam/${attempt.examId}/take`)}
          className="btn-primary"
        >
          View Exam Details
        </button>
      </div>

      <CertificatePreviewModal
        isOpen={isPreviewOpen}
        certificate={certificate ?? null}
        onClose={() => setIsPreviewOpen(false)}
      />
    </div>
  );
}

