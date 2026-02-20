import { X, Award, Shield, Download } from 'lucide-react';
import { ExamCertificate } from '../services/exam';
import { getLogoHtml } from '../utils/logo';

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
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
              margin: 0; 
              padding: 0; 
              background: linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%);
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .certificate {
              width: 900px;
              max-width: 95%;
              margin: 40px auto;
              padding: 60px 50px;
              background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%);
              border: 16px solid #1e40af;
              box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05);
              position: relative;
            }
            .certificate::before {
              content: '';
              position: absolute;
              top: 20px;
              left: 20px;
              right: 20px;
              bottom: 20px;
              border: 2px solid #3b82f6;
              pointer-events: none;
            }
            .watermark {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-45deg);
              font-size: 120px;
              color: rgba(30, 64, 175, 0.05);
              font-weight: bold;
              z-index: 0;
              pointer-events: none;
              white-space: nowrap;
            }
            .certificate-content {
              position: relative;
              z-index: 1;
            }
            .header {
              text-align: center;
              margin-bottom: 40px;
              position: relative;
            }
            .header-logo {
              max-height: 70px;
              width: auto;
              margin: 0 auto 20px;
              display: block;
              filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
            }
            .title {
              font-size: 42px;
              font-weight: 700;
              letter-spacing: 3px;
              text-transform: uppercase;
              margin-bottom: 12px;
              color: #1e40af;
              text-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
            }
            .subtitle {
              font-size: 20px;
              color: #3b82f6;
              letter-spacing: 4px;
              font-weight: 500;
            }
            .recipient {
              text-align: center;
              margin: 48px 0;
              padding: 32px 0;
              border-top: 3px solid #e5e7eb;
              border-bottom: 3px solid #e5e7eb;
            }
            .recipient-label {
              font-size: 16px;
              color: #6b7280;
              margin-bottom: 16px;
              font-style: italic;
            }
            .recipient-name {
              font-size: 36px;
              font-weight: 700;
              color: #111827;
              margin: 16px 0;
              letter-spacing: 1px;
            }
            .details {
              text-align: center;
              color: #374151;
              font-size: 16px;
              line-height: 1.8;
              margin: 32px 0;
            }
            .details strong {
              color: #1e40af;
              font-weight: 600;
            }
            .certificate-number {
              background: #f0f9ff;
              padding: 12px 24px;
              border-radius: 6px;
              display: inline-block;
              margin: 20px 0;
              border: 2px solid #bfdbfe;
            }
            .footer {
              display: flex;
              justify-content: space-between;
              margin-top: 48px;
              padding-top: 24px;
              border-top: 2px solid #e5e7eb;
            }
            .footer-left {
              text-align: left;
              color: #6b7280;
              font-size: 13px;
            }
            .signature {
              border-top: 3px solid #1e40af;
              padding-top: 12px;
              width: 45%;
              text-align: center;
            }
            .signature-name {
              font-weight: 600;
              color: #1e40af;
              font-size: 15px;
              margin-top: 8px;
            }
            .signature-title {
              font-size: 12px;
              color: #6b7280;
              margin-top: 4px;
            }
            @media (max-width: 900px) {
              .certificate {
                width: 100%;
                margin: 20px auto;
                padding: 40px 30px;
                border-width: 12px;
              }
              .title {
                font-size: 32px;
                letter-spacing: 2px;
              }
              .subtitle {
                font-size: 16px;
                letter-spacing: 2px;
              }
              .header-logo {
                max-height: 55px;
              }
              .recipient-name {
                font-size: 28px;
              }
            }
            @media (max-width: 600px) {
              .certificate {
                padding: 30px 20px;
                border-width: 10px;
              }
              .title {
                font-size: 24px;
                letter-spacing: 1px;
              }
              .subtitle {
                font-size: 14px;
                letter-spacing: 1px;
              }
              .header-logo {
                max-height: 45px;
              }
              .recipient-name {
                font-size: 24px;
              }
              .footer {
                flex-direction: column;
                gap: 20px;
              }
              .signature {
                width: 100%;
              }
            }
            @media print {
              body {
                background: white;
              }
              .certificate {
                box-shadow: none;
                border-width: 12px;
              }
              @page {
                margin: 1cm;
                size: letter;
              }
            }
          </style>
        </head>
        <body>
          <div class="certificate">
            <div class="watermark">CERTIFICATE</div>
            <div class="certificate-content">
              <div class="header">
                ${getLogoHtml('header-logo')}
                <div class="title">Certificate of Achievement</div>
                <div class="subtitle">Teamwork Physio International</div>
              </div>
              <div class="details" style="font-size: 18px; margin-bottom: 8px;">This is to certify that</div>
              <div class="recipient">
                <div class="recipient-label">has successfully completed</div>
                <div class="recipient-name">${certificate.userName ?? 'Candidate'}</div>
              </div>
              <div class="details">
                the requirements for<br/>
                <strong style="font-size: 20px;">${certificate.examTitle ?? 'Training Examination'}</strong><br/>
                <span style="margin-top: 12px; display: inline-block;">with a score of <strong>${certificate.score}%</strong></span>
              </div>
              <div class="certificate-number">
                <strong>Certificate Number:</strong> ${certificate.certificateNumber}
              </div>
              <div class="footer">
                <div class="footer-left">
                  <div style="font-weight: 600; color: #374151; margin-bottom: 4px;">Date Issued</div>
                  <div>${new Date(certificate.issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                </div>
                <div class="signature">
                  <div class="signature-name">${certificate.approvedByName ?? 'Training Administrator'}</div>
                  <div class="signature-title">Authorized Signatory</div>
                </div>
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

