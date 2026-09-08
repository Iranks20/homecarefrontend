import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { Invoice } from '../types';
import type { PaymentMethod } from '../services/paymentMethods';
import type { ProcessPaymentData } from '../services/billing';
import { invoicePaymentReferenceLabel } from '../utils/invoiceDocumentNumbers';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: ProcessPaymentData) => Promise<void>;
  invoice: Invoice | null;
  paymentMethods: PaymentMethod[];
}

function formatUgx(n: number): string {
  return `${Number(n || 0).toLocaleString()} UGX`;
}

function formatDateForInput(value?: string, fallback?: Date): string {
  if (value) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
  }
  const d = fallback ?? new Date();
  return d.toISOString().split('T')[0];
}

export default function RecordPaymentModal({
  isOpen,
  onClose,
  onSave,
  invoice,
  paymentMethods,
}: RecordPaymentModalProps) {
  const balanceDue = invoice ? invoice.balanceDue ?? invoice.amount - (invoice.amountPaid ?? 0) : 0;
  const [amount, setAmount] = useState<string>('');
  const [method, setMethod] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !invoice) return;
    setAmount(balanceDue > 0 ? String(balanceDue) : '');
    setMethod('');
    setPaymentDate(formatDateForInput());
    setTransactionId('');
    setNotes('');
    setError(null);
    setIsSubmitting(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, invoice?.id]);

  if (!isOpen || !invoice) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError('Enter an amount greater than zero.');
      return;
    }
    if (numericAmount > balanceDue + 0.01) {
      setError(`Amount exceeds the remaining balance of ${formatUgx(balanceDue)}.`);
      return;
    }
    if (!method) {
      setError('Select a payment method.');
      return;
    }
    if (!paymentDate) {
      setError('Enter the payment date.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: ProcessPaymentData = {
        invoiceId: invoice.id,
        patientId: invoice.patientId,
        amount: numericAmount,
        method,
        paymentDate,
      };
      if (transactionId.trim()) payload.transactionId = transactionId.trim();
      payload.notes = notes.trim() || invoicePaymentReferenceLabel(invoice);
      await onSave(payload);
      setIsSubmitting(false);
      onClose();
    } catch (err: unknown) {
      setIsSubmitting(false);
      setError(err instanceof Error ? err.message : 'Unable to record payment. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Record Payment</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Invoice total</span>
              <span>{formatUgx(invoice.amount)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Already paid</span>
              <span>{formatUgx(invoice.amountPaid ?? 0)}</span>
            </div>
            <div className="flex justify-between font-semibold text-gray-900 mt-1 pt-1 border-t border-gray-200">
              <span>Balance due</span>
              <span>{formatUgx(balanceDue)}</span>
            </div>
          </div>

          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount received (UGX) *</label>
            <input
              type="number"
              min={0}
              step={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="input-field"
            />
            <p className="mt-1 text-xs text-gray-500">
              Enter less than the full balance to record a partial / installment payment.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment date *</label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              required
              className="input-field"
            />
            <p className="mt-1 text-xs text-gray-500">
              Shown on the receipt. Set this to when payment was actually received.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment method *</label>
            <select value={method} onChange={(e) => setMethod(e.target.value)} required className="input-field">
              <option value="">Select payment method</option>
              {paymentMethods.map((m) => (
                <option key={m.id} value={m.name}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reference / transaction ID</label>
            <input
              type="text"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              className="input-field"
              placeholder="Mobile money code, receipt no., etc. (optional)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input-field"
              placeholder="Optional note for this payment"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t">
            <button type="button" onClick={onClose} className="btn-outline">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting || balanceDue <= 0}>
              {isSubmitting ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
