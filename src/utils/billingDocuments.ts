import type { Invoice } from '../types';
import invoiceTemplate from '../templates/invoice-print.html?raw';
import receiptTemplate from '../templates/receipt-print.html?raw';
import { getLogoUrl } from './logo';

const formatUgx = (n: number) => `${Number(n).toLocaleString()} UGX`;

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDocumentDate(d: string | Date): string {
  return new Date(d).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function ugxAmountCaption(n: number): string {
  return `Uganda Shillings ${Number(n).toLocaleString()} only`;
}

type LineItem = { qty: string; description: string; rate: string; amount: string };

function buildLineItems(invoice: Invoice): LineItem[] {
  const particulars = [invoice.description, invoice.serviceName ? `Service: ${invoice.serviceName}` : '']
    .filter(Boolean)
    .join(' — ');
  const rate = formatUgx(invoice.amount);
  const amount = formatUgx(invoice.amount);
  const rows: LineItem[] = Array.from({ length: 6 }, () => ({
    qty: '',
    description: '',
    rate: '',
    amount: '',
  }));
  rows[0] = { qty: '1', description: particulars || '—', rate, amount };
  return rows;
}

export function buildInvoicePrintHtml(invoice: Invoice): string {
  let html = invoiceTemplate;
  const items = buildLineItems(invoice);
  const vars: Record<string, string> = {
    invoiceNumber: escapeHtml(invoice.invoiceNumber || ''),
    invoiceDate: escapeHtml(formatDocumentDate(invoice.date)),
    clientName: escapeHtml(invoice.patientName || ''),
    totalAmount: escapeHtml(formatUgx(invoice.amount)),
  };
  items.forEach((row, i) => {
    vars[`items${i}qty`] = escapeHtml(row.qty);
    vars[`items${i}description`] = escapeHtml(row.description);
    vars[`items${i}rate`] = escapeHtml(row.rate);
    vars[`items${i}amount`] = escapeHtml(row.amount);
  });
  Object.entries(vars).forEach(([key, value]) => {
    html = html.split(`{{${key}}}`).join(value);
  });
  return html;
}

export function buildReceiptPrintHtml(invoice: Invoice): string {
  let html = receiptTemplate;
  const paymentFor = [invoice.serviceName, invoice.description].filter(Boolean).join(' — ') || 'Services rendered';
  const vars: Record<string, string> = {
    logoUrl: escapeHtml(getLogoUrl()),
    receiptNumber: escapeHtml(invoice.invoiceNumber || ''),
    receiptDate: escapeHtml(formatDocumentDate(new Date())),
    payerName: escapeHtml(invoice.patientName || ''),
    amountInWords: escapeHtml(ugxAmountCaption(invoice.amount)),
    paymentFor: escapeHtml(paymentFor),
    cashCheque: escapeHtml('Cash'),
    balance: escapeHtml('—'),
    amountPaid: escapeHtml(formatUgx(invoice.amount)),
  };
  Object.entries(vars).forEach(([key, value]) => {
    html = html.split(`{{${key}}}`).join(value);
  });
  return html;
}

export function openBillingPrintDocument(html: string): boolean {
  const w = window.open('', '_blank');
  if (!w) {
    return false;
  }
  w.document.write(html);
  w.document.close();
  return true;
}
