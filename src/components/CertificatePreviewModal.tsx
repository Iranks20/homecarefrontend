import { X, Award, Shield, Download } from 'lucide-react';
import { ExamCertificate } from '../services/exam';

interface CertificatePreviewModalProps {
  isOpen: boolean;
  certificate: ExamCertificate | null;
  onClose: () => void;
}

export default function CertificatePreviewModal({
  isOpen,
  certificate,
  onClose,
}: CertificatePreviewModalProps) {
  if (!isOpen || !certificate) {
    return null;
  }

  const handleDownload = () => {
    const certificateHtml = `
      <html>
        <head>
          <title>Certificate - ${certificate.certificateNumber}</title>
          <style>
            body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; background: #f5f3ff; }
            .certificate {
              width: 800px;
              margin: 40px auto;
              padding: 40px;
              background: white;
              border: 12px solid #e8e4ff;
              box-shadow: 0 20px 40px rgba(31, 41, 55, 0.15);
            }
            .header {
              text-align: center;
              margin-bottom: 24px;
              color: #312e81;
            }
            .title {
              font-size: 36px;
              letter-spacing: 2px;
              text-transform: uppercase;
              margin-bottom: 8px;
            }
            .subtitle {
              font-size: 18px;
              color: #4c1d95;
              letter-spacing: 3px;
            }
            .recipient {
              text-align: center;
              margin: 32px 0;
            }
            .recipient-name {
              font-size: 32px;
              font-weight: bold;
              color: #1a1a1a;
            }
            .details {
              text-align: center;
              color: #4b5563;
              font-size: 18px;
            }
            .footer {
              display: flex;
              justify-content: space-between;
              margin-top: 40px;
              color: #4338ca;
            }
            .signature {
              border-top: 2px solid #c4b5fd;
              padding-top: 8px;
              width: 45%;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="certificate">
            <div class="header">
              <div class="title">Certificate of Achievement</div>
              <div class="subtitle">Teamwork Homecare Training Division</div>
            </div>
            <div class="details">This certifies that</div>
            <div class="recipient">
              <div class="recipient-name">${certificate.userName ?? 'Candidate'}</div>
            </div>
            <div class="details">
              has successfully completed the requirements for<br/>
              <strong>${certificate.examTitle ?? 'Training Examination'}</strong><br/>
              with a score of ${certificate.score}%<br/>
              Certificate No. ${certificate.certificateNumber}
            </div>
            <div class="footer">
              <div>
                Issued: ${new Date(certificate.issuedAt).toLocaleDateString()}
              </div>
              <div class="signature">
                ${certificate.approvedByName ?? 'Training Administrator'}
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(certificateHtml);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <p className="text-sm uppercase tracking-wider text-indigo-500 font-semibold">
              Certificate Preview
            </p>
            <h3 className="text-xl font-bold text-gray-900">{certificate.examTitle ?? 'Training Exam'}</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-10 space-y-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 text-indigo-700">
              <Shield className="h-6 w-6" />
              <span className="tracking-[0.3em] uppercase text-sm font-semibold">Teamwork Homecare</span>
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mt-4">Certificate of Excellence</h2>
            <p className="text-lg text-gray-600 mt-2">Awarded in recognition of outstanding performance</p>
          </div>

          <div className="text-center">
            <p className="text-sm uppercase tracking-[0.5em] text-indigo-400">Awarded to</p>
            <p className="text-3xl font-bold text-gray-900 mt-3">{certificate.userName ?? 'Candidate'}</p>
          </div>

          <div className="text-center text-gray-700 leading-relaxed">
            <p>
              For successfully completing the{' '}
              <span className="font-semibold text-indigo-700">{certificate.examTitle ?? 'training examination'}</span>{' '}
              with a score of{' '}
              <span className="font-semibold text-indigo-700">{certificate.score}%</span>.
            </p>
            <p className="mt-2">Certificate Number: {certificate.certificateNumber}</p>
            <p>Issued on {new Date(certificate.issuedAt).toLocaleDateString()}</p>
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-indigo-100 text-sm text-gray-600">
            <div>
              <p className="font-semibold text-gray-900">Status</p>
              <p className="capitalize">{certificate.status.toLowerCase()}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-gray-900">Approved By</p>
              <p>{certificate.approvedByName ?? 'Pending Approval'}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t bg-white">
          <button onClick={onClose} className="btn-outline">
            Close
          </button>
          <button onClick={handleDownload} className="btn-primary inline-flex items-center gap-2">
            <Download className="h-4 w-4" />
            Download / Print
          </button>
        </div>
      </div>
    </div>
  );
}

