import { useState } from 'react';
import { Share2, Download, MessageCircle, Mail, Copy, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';

interface ShareableFile {
  blob: Blob;
  filename: string;
}

interface ShareMenuProps {
  /** Generates the PDF (or other file) to attach/download on demand. */
  getFile: () => Promise<ShareableFile>;
  /** Short title used for native share and email subject. */
  title: string;
  /** Plain-text summary sent alongside the file (WhatsApp/SMS/email body, native share text). */
  text: string;
  /** Patient phone number, used to prefill WhatsApp/SMS recipients when available. */
  phone?: string;
  /** Patient email, used to prefill the email recipient when available. */
  email?: string;
}

function digitsOnly(phone?: string): string {
  return (phone ?? '').replace(/[^\d+]/g, '').replace(/^00/, '+');
}

function triggerDownload(file: ShareableFile) {
  const url = URL.createObjectURL(file.blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** Share/print actions for an invoice or receipt: native share sheet (with the PDF attached,
 * where supported), quick links to WhatsApp/Email/SMS, plain download, and copy-to-clipboard —
 * covers "share on different social platforms" without needing a hosted public link. */
export default function ShareMenu({ getFile, title, text, phone, email }: ShareMenuProps) {
  const [busy, setBusy] = useState<string | null>(null);

  const canNativeShareFiles = (() => {
    const nav = navigator as Navigator & {
      canShare?: (data?: ShareData) => boolean;
      share?: (data?: ShareData) => Promise<void>;
    };
    if (!nav.share || !nav.canShare) return false;
    try {
      const probe = new File([''], 'probe.pdf', { type: 'application/pdf' });
      return nav.canShare({ files: [probe] });
    } catch {
      return false;
    }
  })();

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    try {
      await fn();
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        toast.error(err?.message ?? 'Unable to share right now');
      }
    } finally {
      setBusy(null);
    }
  };

  const handleNativeShare = () =>
    run('native', async () => {
      const file = await getFile();
      const shareFile = new File([file.blob], file.filename, { type: 'application/pdf' });
      const nav = navigator as Navigator & { share: (data?: ShareData) => Promise<void> };
      await nav.share({ title, text, files: [shareFile] });
    });

  const handleWhatsApp = () =>
    run('whatsapp', async () => {
      const file = await getFile();
      triggerDownload(file);
      const digits = digitsOnly(phone).replace(/^\+/, '');
      const base = digits ? `https://wa.me/${digits}` : 'https://wa.me/';
      window.open(`${base}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
      toast.info('PDF downloaded — attach it in WhatsApp before sending.');
    });

  const handleEmail = () =>
    run('email', async () => {
      const file = await getFile();
      triggerDownload(file);
      const mailto = `mailto:${email ?? ''}?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(text)}`;
      window.location.href = mailto;
      toast.info('PDF downloaded — attach it to the email before sending.');
    });

  const handleSms = () =>
    run('sms', async () => {
      const digits = digitsOnly(phone);
      window.location.href = `sms:${digits}?body=${encodeURIComponent(text)}`;
    });

  const handleCopy = () =>
    run('copy', async () => {
      await navigator.clipboard.writeText(text);
      toast.success('Summary copied to clipboard');
    });

  const handleDownload = () =>
    run('download', async () => {
      const file = await getFile();
      triggerDownload(file);
    });

  const buttonClass =
    'inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <div className="flex flex-wrap items-center gap-2">
      {canNativeShareFiles && (
        <button type="button" onClick={handleNativeShare} disabled={busy !== null} className={buttonClass}>
          {busy === 'native' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Share2 className="h-3.5 w-3.5" />}
          Share
        </button>
      )}
      <button type="button" onClick={handleWhatsApp} disabled={busy !== null} className={buttonClass} title="Share via WhatsApp">
        {busy === 'whatsapp' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MessageCircle className="h-3.5 w-3.5" />}
        WhatsApp
      </button>
      <button type="button" onClick={handleEmail} disabled={busy !== null} className={buttonClass} title="Share via email">
        {busy === 'email' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
        Email
      </button>
      <button type="button" onClick={handleSms} disabled={busy !== null} className={buttonClass} title="Share via SMS">
        {busy === 'sms' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MessageCircle className="h-3.5 w-3.5" />}
        SMS
      </button>
      <button type="button" onClick={handleCopy} disabled={busy !== null} className={buttonClass} title="Copy summary text">
        {busy === 'copy' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Copy className="h-3.5 w-3.5" />}
        Copy
      </button>
      <button type="button" onClick={handleDownload} disabled={busy !== null} className={buttonClass} title="Download PDF">
        {busy === 'download' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
        Download
      </button>
    </div>
  );
}
