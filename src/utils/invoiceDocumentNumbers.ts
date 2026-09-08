import type { Invoice } from '../types';

export function invoiceDocumentNumber(invoice: Pick<Invoice, 'displayInvoiceNumber'>): string {
  const value = invoice.displayInvoiceNumber?.trim();
  return value || '—';
}

export function receiptDocumentNumber(invoice: Pick<Invoice, 'displayReceiptNumber'>): string {
  const value = invoice.displayReceiptNumber?.trim();
  return value || '—';
}

export function invoiceDocumentTitle(invoice: Pick<Invoice, 'displayInvoiceNumber'>): string {
  const value = invoice.displayInvoiceNumber?.trim();
  return value ? `Invoice #${value}` : 'Invoice';
}

export function receiptDocumentTitle(invoice: Pick<Invoice, 'displayReceiptNumber'>): string {
  const value = invoice.displayReceiptNumber?.trim();
  return value ? `Receipt #${value}` : 'Receipt';
}

export function adminInvoiceReference(
  invoice: Pick<Invoice, 'displayInvoiceNumber' | 'invoiceNumber' | 'id'>
): string {
  const display = invoice.displayInvoiceNumber?.trim();
  if (display) return display;
  if (invoice.invoiceNumber) return `#${invoice.invoiceNumber}`;
  return `#${invoice.id.slice(0, 8)}`;
}

export function invoicePaymentReferenceLabel(
  invoice: Pick<Invoice, 'displayInvoiceNumber' | 'invoiceNumber' | 'serviceName' | 'description'>
): string {
  const printed = invoice.displayInvoiceNumber?.trim();
  const internal = invoice.invoiceNumber?.trim();
  const invoiceLabel = printed
    ? `Invoice #${printed}`
    : internal
    ? `Invoice #${internal}`
    : 'Invoice';
  const service = (invoice.serviceName || '').trim();
  if (service && service !== '—' && service.toLowerCase() !== 'unknown service') {
    return `${invoiceLabel} — ${service}`;
  }
  const memo = (invoice.description || '').trim();
  if (memo) return `${invoiceLabel} — ${memo}`;
  return invoiceLabel;
}

export function receiptPaymentForLabel(
  invoice: Pick<Invoice, 'displayInvoiceNumber' | 'invoiceNumber' | 'serviceName' | 'description'>,
  paymentDescription?: string | null
): string {
  const raw = (paymentDescription || '').trim();
  const looksLikeInternalId =
    /^Payment for invoice\s+[a-z0-9]+$/i.test(raw) ||
    raw === 'Payment recorded when invoice marked as paid';
  if (raw && !looksLikeInternalId) return raw;
  return invoicePaymentReferenceLabel(invoice);
}

export function adminInvoiceReferenceWithInternal(
  invoice: Pick<Invoice, 'displayInvoiceNumber' | 'invoiceNumber' | 'id'>
): string {
  const display = invoice.displayInvoiceNumber?.trim();
  const internal = invoice.invoiceNumber ? `#${invoice.invoiceNumber}` : `#${invoice.id.slice(0, 8)}`;
  if (display && invoice.invoiceNumber && display !== invoice.invoiceNumber) {
    return `${display} (${internal})`;
  }
  return adminInvoiceReference(invoice);
}

export function pdfFilenameReference(
  invoice: Pick<Invoice, 'displayInvoiceNumber' | 'invoiceNumber' | 'id'>,
  prefix: string
): string {
  const label = invoice.displayInvoiceNumber?.trim() || invoice.invoiceNumber || invoice.id.slice(0, 8);
  const safe = label.replace(/[^a-z0-9]/gi, '_');
  return `${prefix}_${safe}.pdf`;
}
