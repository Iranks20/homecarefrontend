import type { Invoice, InvoiceLineItem } from '../types';
import invoiceTemplate from '../templates/invoice-print.html?raw';
import receiptTemplate from '../templates/receipt-print.html?raw';
import invoiceLogoHref from '../templates/invoice_logo.png?url';

const formatUgx = (n: number) => `${Number(n).toLocaleString()} UGX`;

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function imgSrcAttr(url: string): string {
  return escapeHtml(resolveBillingAssetUrl(url));
}

function resolveBillingAssetUrl(href: string): string {
  if (/^https?:\/\//i.test(href)) {
    return href;
  }
  if (typeof window !== 'undefined' && href.startsWith('/')) {
    return `${window.location.origin}${href}`;
  }
  return href;
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

function particularsForLine(li: InvoiceLineItem): string {
  const code = li.procedureCode?.trim();
  const name = li.serviceName?.trim();
  const desc = (li.description || '').trim();
  let raw = '';
  if (code) {
    raw += `[${code}] `;
  }
  if (name) {
    raw += `${name}`;
    if (desc && desc !== name) {
      raw += `: ${desc}`;
    }
  } else if (desc) {
    raw += desc;
  } else {
    raw = '—';
  }
  return escapeHtml(raw);
}

function buildLineRowsFromInvoice(invoice: Invoice): string {
  const items = invoice.lineItems?.length
    ? invoice.lineItems
    : [];
  if (items.length > 0) {
    return items
      .map((li) => {
        const qty = String(li.quantity);
        const rate = formatUgx(li.unitPrice);
        const amt = formatUgx(li.lineAmount);
        return `<tr class="item-row"><td class="num">${escapeHtml(qty)}</td><td class="particulars-cell">${particularsForLine(li)}</td><td class="money">${escapeHtml(rate)}</td><td class="money">${escapeHtml(amt)}</td></tr>`;
      })
      .join('');
  }
  const particulars = [invoice.description, invoice.serviceName ? `Service: ${invoice.serviceName}` : '']
    .filter(Boolean)
    .join(' — ');
  const rate = formatUgx(invoice.amount);
  const amount = formatUgx(invoice.amount);
  return `<tr class="item-row"><td class="num">1</td><td class="particulars-cell">${escapeHtml(particulars || '—')}</td><td class="money">${escapeHtml(rate)}</td><td class="money">${escapeHtml(amount)}</td></tr>`;
}

function blankRows(count: number): string {
  return Array.from({ length: count }, () => '<tr class="blank-row"><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>').join('');
}

function paymentForSummary(invoice: Invoice): string {
  if (invoice.lineItems?.length) {
    const parts = invoice.lineItems.map((li) => li.description || li.serviceName || 'Item').filter(Boolean);
    const unique = [...new Set(parts)];
    if (unique.length <= 3) {
      return unique.join('; ');
    }
    return `${unique.slice(0, 2).join('; ')}; and ${unique.length - 2} other service(s)`;
  }
  return [invoice.serviceName, invoice.description].filter(Boolean).join(' — ') || 'Services rendered';
}

export function buildInvoicePrintHtml(invoice: Invoice): string {
  let html = invoiceTemplate;
  const dataRows = buildLineRowsFromInvoice(invoice);
  const lineCount = invoice.lineItems?.length ? invoice.lineItems.length : 1;
  const pad = Math.max(0, 6 - lineCount);
  const vars: Record<string, string> = {
    lineItemsBody: dataRows + blankRows(pad),
    logoUrl: imgSrcAttr(invoiceLogoHref),
    invoiceNumber: escapeHtml(invoice.invoiceNumber || '—'),
    invoiceDate: escapeHtml(formatDocumentDate(invoice.date)),
    clientName: escapeHtml(invoice.patientName || '—'),
    clientTitle: escapeHtml((invoice.patientTitle ?? '').trim() || 'Mr'),
    totalAmount: escapeHtml(formatUgx(invoice.amount)),
  };
  Object.entries(vars).forEach(([key, value]) => {
    html = html.split(`{{${key}}}`).join(value);
  });
  return html;
}

export function buildReceiptPrintHtml(invoice: Invoice): string {
  let html = receiptTemplate;
  const vars: Record<string, string> = {
    logoUrl: imgSrcAttr(invoiceLogoHref),
    receiptNumber: escapeHtml(invoice.invoiceNumber || '—'),
    receiptDate: escapeHtml(formatDocumentDate(invoice.date)),
    payerName: escapeHtml(invoice.patientName || '—'),
    amountInWords: escapeHtml(ugxAmountCaption(invoice.amount)),
    paymentFor: escapeHtml(paymentForSummary(invoice)),
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
