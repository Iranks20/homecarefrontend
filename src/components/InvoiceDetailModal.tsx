import { useEffect, useState, useCallback } from 'react';
import { X, Pencil, Archive, Printer, Receipt as ReceiptIcon, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import billingService, { type ProcessPaymentData } from '../services/billing';
import type { PaymentMethod } from '../services/paymentMethods';
import type { Invoice, Payment } from '../types';
import { useAuth } from '../contexts/AuthContext';
import {
  formatInvoiceLineItemDescription,
  formatInvoiceQuantity,
} from '../utils/invoiceLineDisplay';
import {
  invoiceDocumentTitle,
  receiptDocumentTitle,
} from '../utils/invoiceDocumentNumbers';
import ShareMenu from './ShareMenu';
import RecordPaymentModal from './RecordPaymentModal';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import {
  downloadInvoicePdf,
  downloadReceiptPdf,
  getInvoicePdfFile,
  getReceiptPdfFile,
  resolvePrimaryReceiptPayment,
} from '../utils/billingPdf';

interface InvoiceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceId: string | null;
  paymentMethods: PaymentMethod[];
  onEdit?: (invoice: Invoice) => void;
  onArchived?: () => void;
  onDeleted?: () => void;
  onChanged?: (invoice: Invoice) => void;
}

function formatUgx(n: number): string {
  return `${Number(n || 0).toLocaleString()} UGX`;
}

function formatDate(value?: string): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function statusPill(invoice: Invoice): { label: string; className: string } {
  const ps = invoice.paymentStatus ?? (invoice.status === 'paid' ? 'paid' : 'unpaid');
  if (ps === 'paid') return { label: 'PAID', className: 'bg-green-100 text-green-800' };
  if (ps === 'partial') return { label: 'PARTIALLY PAID', className: 'bg-amber-100 text-amber-800' };
  if (invoice.status === 'overdue') return { label: 'OVERDUE', className: 'bg-red-100 text-red-800' };
  return { label: 'UNPAID', className: 'bg-yellow-100 text-yellow-800' };
}

export default function InvoiceDetailModal({
  isOpen,
  onClose,
  invoiceId,
  paymentMethods,
  onEdit,
  onArchived,
  onDeleted,
  onChanged,
}: InvoiceDetailModalProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(false);
  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const load = useCallback(async () => {
    if (!invoiceId) return;
    setLoading(true);
    try {
      const data = await billingService.getInvoice(invoiceId);
      setInvoice(data);
    } catch (err: any) {
      toast.error(err?.message ?? 'Unable to load invoice');
    } finally {
      setLoading(false);
    }
  }, [invoiceId]);

  useEffect(() => {
    if (isOpen && invoiceId) {
      void load();
    } else {
      setInvoice(null);
    }
  }, [isOpen, invoiceId, load]);

  if (!isOpen) return null;

  const balanceDue = invoice ? invoice.balanceDue ?? Math.max(0, invoice.amount - (invoice.amountPaid ?? 0)) : 0;
  const payments = invoice?.payments ?? [];
  const fallbackReceipt = invoice ? resolvePrimaryReceiptPayment(invoice) : null;
  const receiptPayments = payments.length > 0 ? payments : fallbackReceipt ? [fallbackReceipt] : [];

  const handleRecordPayment = async (payload: ProcessPaymentData) => {
    await billingService.processPayment(payload);
    toast.success('Payment recorded');
    const data = await billingService.getInvoice(invoiceId!);
    setInvoice(data);
    onChanged?.(data);
  };

  const handleArchive = async () => {
    if (!invoice) return;
    setArchiving(true);
    try {
      await billingService.archiveInvoice(invoice.id);
      toast.success('Invoice archived');
      onArchived?.();
      onChanged?.(invoice);
      onClose();
    } catch (err: any) {
      toast.error(err?.message ?? 'Unable to archive invoice');
    } finally {
      setArchiving(false);
    }
  };

  const handleDelete = async () => {
    if (!invoice) return;
    await billingService.deleteInvoice(invoice.id);
    toast.success('Invoice permanently deleted');
    setConfirmDeleteOpen(false);
    onDeleted?.();
    onClose();
  };

  const shareTextFor = (inv: Invoice) => {
    const bits = [
      `${invoiceDocumentTitle(inv)} — ${inv.patientName}`,
      `Amount: ${formatUgx(inv.amount)}`,
    ];
    const paid = inv.amountPaid ?? 0;
    const due = inv.balanceDue ?? Math.max(0, inv.amount - paid);
    if (paid > 0 && due > 0) {
      bits.push(`Paid: ${formatUgx(paid)} — Balance due: ${formatUgx(due)}`);
    } else if (due <= 0) {
      bits.push('Status: Fully paid');
    } else {
      bits.push(`Due: ${formatDate(inv.dueDate)}`);
    }
    return bits.join('\n');
  };

  const receiptTextFor = (inv: Invoice, payment: Payment) =>
    `${receiptDocumentTitle(inv)} — ${inv.patientName}\nAmount paid: ${formatUgx(
      payment.amount
    )} (${payment.method})\nDate: ${formatDate(payment.date)}`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {invoice ? invoiceDocumentTitle(invoice) : 'Invoice'}
            </h2>
            {invoice?.invoiceNumber && (
              <p className="text-xs text-gray-400">Internal ref: #{invoice.invoiceNumber}</p>
            )}
            {invoice && <p className="text-sm text-gray-500">{invoice.patientName}</p>}
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading || !invoice ? (
          <div className="p-8 text-center text-sm text-gray-500">Loading invoice...</div>
        ) : (
          <div className="p-5 space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${statusPill(invoice).className}`}>
                {statusPill(invoice).label}
              </span>
              <span className="text-sm text-gray-500">
                Date: {formatDate(invoice.date)} · Due: {formatDate(invoice.dueDate)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-lg border border-gray-200 p-3">
                <p className="text-xs text-gray-500">Invoice total</p>
                <p className="text-lg font-semibold text-gray-900">{formatUgx(invoice.amount)}</p>
              </div>
              <div className="rounded-lg border border-gray-200 p-3">
                <p className="text-xs text-gray-500">Amount paid</p>
                <p className="text-lg font-semibold text-green-700">{formatUgx(invoice.amountPaid ?? 0)}</p>
              </div>
              <div className="rounded-lg border border-gray-200 p-3">
                <p className="text-xs text-gray-500">Balance due</p>
                <p className={`text-lg font-semibold ${balanceDue > 0 ? 'text-red-700' : 'text-gray-900'}`}>
                  {formatUgx(balanceDue)}
                </p>
              </div>
            </div>

            {invoice.description && (
              <p className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-3">
                {invoice.description}
              </p>
            )}

            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Charges</h3>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                    <tr>
                      <th className="text-right px-3 py-2">Qty</th>
                      <th className="text-left px-3 py-2">Description</th>
                      <th className="text-right px-3 py-2">Rate</th>
                      <th className="text-right px-3 py-2">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(invoice.lineItems?.length
                      ? invoice.lineItems
                      : [
                          {
                            id: 'summary',
                            serviceId: invoice.serviceId ?? '',
                            serviceName: invoice.serviceName,
                            description: invoice.description,
                            quantity: 1,
                            unitPrice: invoice.amount,
                            lineAmount: invoice.amount,
                            sortOrder: 0,
                          },
                        ]
                    ).map((li) => (
                      <tr key={li.id}>
                        <td className="px-3 py-2 text-right text-gray-600">
                          {formatInvoiceQuantity(li.quantity, li.quantityUnit)}
                        </td>
                        <td className="px-3 py-2 text-gray-900">
                          {formatInvoiceLineItemDescription(li)}
                        </td>
                        <td className="px-3 py-2 text-right text-gray-600">{formatUgx(li.unitPrice)}</td>
                        <td className="px-3 py-2 text-right font-medium text-gray-900">{formatUgx(li.lineAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-900">Payment history</h3>
                {balanceDue > 0 && (
                  <button
                    type="button"
                    onClick={() => setRecordPaymentOpen(true)}
                    className="btn-primary text-xs px-3 py-1.5"
                  >
                    Record Payment
                  </button>
                )}
              </div>
              {receiptPayments.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No payments recorded yet{balanceDue > 0 ? ' — supports partial / installment payments.' : '.'}
                </p>
              ) : (
                <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
                  {receiptPayments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between px-3 py-2 text-sm">
                      <div>
                        <p className="text-gray-900 font-medium">{formatUgx(p.amount)}</p>
                        <p className="text-xs text-gray-500">
                          {formatDate(p.date)} · {p.method}
                          {p.transactionId ? ` · Ref: ${p.transactionId}` : ''}
                          {p.status !== 'completed' ? ` · ${p.status.toUpperCase()}` : ''}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => invoice && void downloadReceiptPdf(invoice, p)}
                        className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-800"
                        title="Download receipt for this payment"
                      >
                        <ReceiptIcon className="h-3.5 w-3.5" />
                        Receipt
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => void downloadInvoicePdf(invoice)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print / Download Invoice
                </button>
                {invoice.status === 'pending' && onEdit && (
                  <button
                    type="button"
                    onClick={() => onEdit(invoice)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </button>
                )}
                {!invoice.archivedAt && (
                  <button
                    type="button"
                    onClick={() => void handleArchive()}
                    disabled={archiving}
                    className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <Archive className="h-3.5 w-3.5" />
                    {archiving ? 'Archiving...' : 'Archive'}
                  </button>
                )}
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-white px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete permanently
                  </button>
                )}
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 mb-1.5">Share this invoice</p>
                <ShareMenu
                  getFile={() => getInvoicePdfFile(invoice)}
                  title={invoiceDocumentTitle(invoice)}
                  text={shareTextFor(invoice)}
                  phone={invoice.patientPhone}
                />
              </div>

              {receiptPayments.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1.5">
                    Share latest receipt ({formatUgx(receiptPayments[0]!.amount)} on {formatDate(receiptPayments[0]!.date)})
                  </p>
                  <ShareMenu
                    getFile={() => getReceiptPdfFile(invoice, receiptPayments[0]!)}
                    title={receiptDocumentTitle(invoice)}
                    text={receiptTextFor(invoice, receiptPayments[0]!)}
                    phone={invoice.patientPhone}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <RecordPaymentModal
        isOpen={recordPaymentOpen}
        onClose={() => setRecordPaymentOpen(false)}
        onSave={handleRecordPayment}
        invoice={invoice}
        paymentMethods={paymentMethods}
      />

      {invoice && (
        <ConfirmDeleteModal
          isOpen={confirmDeleteOpen}
          onClose={() => setConfirmDeleteOpen(false)}
          onConfirm={handleDelete}
          title={`Delete ${invoiceDocumentTitle(invoice)}?`}
          confirmLabel="Delete invoice permanently"
          description={
            <>
              <p>
                You are permanently deleting <strong>{invoiceDocumentTitle(invoice)}</strong> for{' '}
                <strong>{invoice.patientName}</strong> ({formatUgx(invoice.amount)}).
              </p>
              <p className="mt-2">
                This also deletes every payment and receipt recorded against it. There is no undo — consider using
                Archive instead if you just want it out of the active list.
              </p>
            </>
          }
        />
      )}
    </div>
  );
}
