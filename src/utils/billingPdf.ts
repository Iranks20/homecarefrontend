import { jsPDF, GState } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import type { Invoice, Payment } from '../types';
import { getLogoBase64, getLogoImageFormat } from './logo';

// ---------------------------------------------------------------------------
// Layout constants
// ---------------------------------------------------------------------------
const MARGIN = 15;
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const FOOTER_RULE_Y = 280;
const FOOTER_TEXT_Y = 285;

// ---------------------------------------------------------------------------
// Palette — one consistent brand system used across every invoice/receipt.
// ---------------------------------------------------------------------------
const BRAND: [number, number, number] = [30, 64, 175]; // indigo-700
const INK: [number, number, number] = [17, 24, 39]; // slate-900
const MUTED: [number, number, number] = [100, 116, 139]; // slate-500
const BORDER: [number, number, number] = [226, 232, 240]; // slate-200
const CARD_BG: [number, number, number] = [248, 250, 252]; // slate-50

type StatusKey = 'paid' | 'partial' | 'overdue' | 'unpaid';

const STATUS_STYLE: Record<
  StatusKey,
  {
    label: string;
    text: [number, number, number];
    bg: [number, number, number];
    stamp?: [number, number, number];
    /** Font size tuned per-label so short ("PAID") and long ("PARTIALLY PAID")
     * watermark text end up roughly the same physical width on the page. */
    stampSize?: number;
  }
> = {
  paid: { label: 'PAID', text: [21, 128, 61], bg: [220, 252, 231], stamp: [22, 163, 74], stampSize: 78 },
  partial: {
    label: 'PARTIALLY PAID',
    text: [180, 83, 9],
    bg: [254, 243, 199],
    stamp: [217, 119, 6],
    stampSize: 40,
  },
  overdue: { label: 'OVERDUE', text: [185, 28, 28], bg: [254, 226, 226], stamp: [220, 38, 38], stampSize: 58 },
  unpaid: { label: 'PENDING', text: [71, 85, 105], bg: [241, 245, 249] },
};

const PAYMENT_STATUS_STYLE: Record<string, [number, number, number]> = {
  completed: [21, 128, 61],
  pending: [180, 83, 9],
  failed: [185, 28, 28],
  refunded: [100, 116, 139],
};

// ---------------------------------------------------------------------------
// Small drawing helpers — keep every call site terse and consistent.
// ---------------------------------------------------------------------------
const setText = (doc: jsPDF, c: readonly [number, number, number]) => doc.setTextColor(c[0], c[1], c[2]);
const setFill = (doc: jsPDF, c: readonly [number, number, number]) => doc.setFillColor(c[0], c[1], c[2]);
const setDraw = (doc: jsPDF, c: readonly [number, number, number]) => doc.setDrawColor(c[0], c[1], c[2]);

function formatUgx(n: number): string {
  return `${Number(n || 0).toLocaleString()} UGX`;
}

function formatDate(value: string | Date): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function resolveStatusKey(invoice: Invoice): StatusKey {
  const ps = invoice.paymentStatus ?? (invoice.status === 'paid' ? 'paid' : 'unpaid');
  if (ps === 'paid') return 'paid';
  if (ps === 'partial') return 'partial';
  if (invoice.status === 'overdue') return 'overdue';
  return 'unpaid';
}

/**
 * Some invoices (older records, or ones marked paid without an itemized
 * payment being logged) have an amount paid but no entries in `payments`.
 * The invoice detail view still wants to offer a receipt in that case, so
 * this synthesizes a single stand-in Payment representing the amount paid,
 * for both the "Receipt" button list and generateReceiptPdf(). Returns null
 * when real payment records already exist (no fallback needed) or nothing
 * has actually been paid yet.
 */
export function resolvePrimaryReceiptPayment(invoice: Invoice): Payment | null {
  if (invoice.payments && invoice.payments.length > 0) return null;

  const amountPaid = invoice.amountPaid ?? (invoice.status === 'paid' ? invoice.amount : 0);
  if (amountPaid <= 0) return null;

  return {
    id: `${invoice.id}-fallback-payment`,
    invoiceId: invoice.id,
    amount: amountPaid,
    method: 'Not specified',
    status: 'completed',
    date: invoice.date,
    description: invoice.description || invoice.serviceName || 'Payment',
  };
}

interface CompanyInfo {
  name: string;
  tagline: string;
  email: string;
  phone: string;
  website: string;
  poBox: string;
  location: string;
  bankName: string;
  accountName: string;
  bankAccountNumber: string;
  momoMerchantName: string;
  mtnMomoMerchant: string;
  airtelPayMerchant: string;
}

const COMPANY_FALLBACK: CompanyInfo = {
  name: 'Teamwork Physiotherapy Centre International',
  tagline: 'Expert care behind every recovery',
  email: 'internationalphysiocentre@gmail.com',
  phone: '0200909453',
  website: 'physio-international.com',
  poBox: 'P.O. Box 107270',
  location: 'Location off Martyrs Way, Ntinda',
  bankName: 'Pearl Bank',
  accountName: 'Teamwork Physiotherapy Centre International',
  bankAccountNumber: '4020068000421',
  momoMerchantName: 'Teamwork Physiotherapy International',
  mtnMomoMerchant: '06887312',
  airtelPayMerchant: '4426738',
};

async function getCompanyInfo(): Promise<CompanyInfo> {
  return { ...COMPANY_FALLBACK };
}

/** Thin brand-colored rule across the very top of the page. */
function drawAccentBar(doc: jsPDF): void {
  setFill(doc, BRAND);
  doc.rect(0, 0, PAGE_WIDTH, 3, 'F');
}

function drawStatusPill(doc: jsPDF, rightX: number, y: number, statusKey: StatusKey): void {
  const style = STATUS_STYLE[statusKey];
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  const textW = doc.getTextWidth(style.label);
  const padX = 3;
  const w = textW + padX * 2;
  const h = 5.5;
  setFill(doc, style.bg);
  doc.roundedRect(rightX - w, y - h + 1.8, w, h, 1.4, 1.4, 'F');
  setText(doc, style.text);
  doc.text(style.label, rightX - padX, y, { align: 'right' });
}

/** Letterhead: accent bar, logo/company block on the left, document title +
 * number + status pill on the right, then a hairline divider. Returns the y
 * cursor to continue drawing from. */
async function drawLetterhead(
  doc: jsPDF,
  opts: { title: string; subtitle: string; company: CompanyInfo; showLogo: boolean; statusKey?: StatusKey }
): Promise<number> {
  drawAccentBar(doc);
  const y = 19;

  // Left column: the logo now carries the brand on its own — no company-name
  // text is drawn next to it. The tagline/contact line stack underneath it
  // instead of beside it. If the logo can't be loaded for some reason, fall
  // back to the company name as text so the header is never left blank.
  let logoBottom = 0;
  let logoLoaded = false;

  if (opts.showLogo) {
    try {
      const logoBase64 = await getLogoBase64();
      if (logoBase64) {
        // Matches the source asset's actual aspect ratio (165x50) so the logo
        // isn't stretched — fixed height, width derived from it.
        const logoTop = 8;
        const h = 12;
        const w = h * (165 / 50);
        doc.addImage(logoBase64, getLogoImageFormat(logoBase64), MARGIN, logoTop, w, h);
        logoBottom = logoTop + h;
        logoLoaded = true;
      }
    } catch {
      // Logo is optional — text-only header is a perfectly fine fallback.
    }
  }

  if (!logoLoaded) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    setText(doc, BRAND);
    doc.text(opts.company.name, MARGIN, y - 1.5);
    logoBottom = y - 1.5 + 3.5;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  setText(doc, MUTED);
  doc.text(opts.company.tagline, MARGIN, logoBottom + 4.5);

  const contactLine = [
    opts.company.phone ? `Tel: ${opts.company.phone}` : '',
    opts.company.email,
    opts.company.website,
  ]
    .filter(Boolean)
    .join('   •   ');
  if (contactLine) {
    doc.text(contactLine, MARGIN, logoBottom + 8.1);
  }

  const secondaryLine = [opts.company.location, opts.company.poBox].filter(Boolean).join('   •   ');
  if (secondaryLine) {
    doc.text(secondaryLine, MARGIN, logoBottom + 11.7);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  setText(doc, BRAND);
  doc.text(opts.title, PAGE_WIDTH - MARGIN, y - 1.5, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  setText(doc, MUTED);
  doc.text(opts.subtitle, PAGE_WIDTH - MARGIN, y + 4, { align: 'right' });

  if (opts.statusKey) {
    drawStatusPill(doc, PAGE_WIDTH - MARGIN, y + 11, opts.statusKey);
  }

  const dividerY = y + 16;
  setDraw(doc, BORDER);
  doc.setLineWidth(0.4);
  doc.line(MARGIN, dividerY, PAGE_WIDTH - MARGIN, dividerY);
  return dividerY + 9;
}

type CardRow = string | [string, string];

/** A single rounded, filled info card with a small uppercase title and either
 * plain lines or label/value pairs (right-aligned value). Returns the y just
 * below the card so callers can stack the next element. */
function drawCard(doc: jsPDF, x: number, y: number, w: number, title: string, rows: CardRow[]): number {
  const pad = 4;
  const headerH = 6.5;
  const rowH = 5.2;
  const h = pad * 2 + headerH + rows.length * rowH - 2.5;

  setFill(doc, CARD_BG);
  setDraw(doc, BORDER);
  doc.setLineWidth(0.3);
  doc.roundedRect(x, y, w, h, 2, 2, 'FD');

  let cy = y + pad + 2.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  setText(doc, MUTED);
  doc.text(title.toUpperCase(), x + pad, cy);
  cy += headerH;

  rows.forEach((row) => {
    if (Array.isArray(row)) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      setText(doc, MUTED);
      doc.text(row[0], x + pad, cy);
      doc.setFont('helvetica', 'bold');
      setText(doc, INK);
      doc.text(row[1], x + w - pad, cy, { align: 'right' });
    } else {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      setText(doc, INK);
      doc.text(row, x + pad, cy);
    }
    cy += rowH;
  });

  return y + h;
}

/** Large, faint, rotated status stamp across the middle of the page — the same
 * "PAID" / "OVERDUE" visual cue used by most invoicing systems. Drawn with low
 * opacity so it never competes with the real content on top of it. Skipped for
 * plain-pending invoices, where a stamp would just be visual noise. */
function drawWatermark(doc: jsPDF, statusKey: StatusKey): void {
  const style = STATUS_STYLE[statusKey];
  if (!style.stamp) return;
  doc.saveGraphicsState();
  doc.setGState(new GState({ opacity: 0.07 }));
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(style.stampSize ?? 60);
  setText(doc, style.stamp);
  doc.text(style.label, PAGE_WIDTH / 2, PAGE_HEIGHT / 2, {
    align: 'center',
    angle: 35,
  });
  doc.restoreGraphicsState();
}

/** Stamps a page footer (hairline + note + page number) on every page of the
 * document. Called once, after all content has been placed, so it reliably
 * covers pages created by table pagination. The watermark itself is drawn
 * separately, before content, so it sits visually behind the page instead of
 * over the top of it — see drawWatermark() call sites. */
function finalizeFooters(doc: jsPDF, note: string): void {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    setDraw(doc, BORDER);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, FOOTER_RULE_Y, PAGE_WIDTH - MARGIN, FOOTER_RULE_Y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    setText(doc, MUTED);
    doc.text(note, MARGIN, FOOTER_TEXT_Y);
    const pageLabel = `Page ${i} of ${pageCount}`;
    doc.text(pageLabel, PAGE_WIDTH - MARGIN, FOOTER_TEXT_Y, { align: 'right' });
  }
}

function ensureSpace(doc: jsPDF, y: number, needed: number, limit = 265): number {
  if (y + needed > limit) {
    doc.addPage();
    return MARGIN + 10;
  }
  return y;
}

// ---------------------------------------------------------------------------
// Invoice
// ---------------------------------------------------------------------------

/** Generate a full invoice PDF: letterhead, status stamp, bill-to/details cards,
 * an itemized table, totals, and the full payment ledger so recipients can see
 * exactly what has been paid and what's outstanding. */
export async function generateInvoicePdf(invoice: Invoice): Promise<jsPDF> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const company = await getCompanyInfo();
  const statusKey = resolveStatusKey(invoice);

  let y = await drawLetterhead(doc, {
    title: 'INVOICE',
    subtitle: `#${invoice.invoiceNumber ?? invoice.id.slice(0, 8)}`,
    company,
    showLogo: true,
    statusKey,
  });

  // Drawn now (before the cards/table below) so it sits behind the page's
  // content instead of over the top of it. willDrawPage on the line-items
  // table below re-stamps it for any continuation pages.
  drawWatermark(doc, statusKey);

  const cardW = (CONTENT_WIDTH - 6) / 2;
  const billToRows: CardRow[] = [invoice.patientName];
  if (invoice.patientPhone) billToRows.push(['Phone', invoice.patientPhone]);
  const detailsRows: CardRow[] = [
    ['Issue date', formatDate(invoice.date)],
    ['Due date', formatDate(invoice.dueDate)],
  ];

  const billBottom = drawCard(doc, MARGIN, y, cardW, 'Bill To', billToRows);
  const detailsBottom = drawCard(doc, MARGIN + cardW + 6, y, cardW, 'Invoice Details', detailsRows);
  y = Math.max(billBottom, detailsBottom) + 8;

  if (invoice.description) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    setText(doc, MUTED);
    const memoLines = doc.splitTextToSize(`Memo: ${invoice.description}`, CONTENT_WIDTH);
    doc.text(memoLines, MARGIN, y);
    y += memoLines.length * 4.2 + 4;
  }

  const items = invoice.lineItems?.length
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
      ];

  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN, bottom: 30 },
    head: [['Description', 'Qty', 'Rate', 'Amount']],
    body: items.map((li) => [
      (li.description || li.serviceName || '—').toString(),
      String(li.quantity),
      formatUgx(li.unitPrice),
      formatUgx(li.lineAmount),
    ]),
    theme: 'plain',
    styles: {
      font: 'helvetica',
      fontSize: 8.5,
      textColor: INK,
      cellPadding: { top: 2.8, bottom: 2.8, left: 2, right: 2 },
      lineColor: BORDER,
      lineWidth: 0.15,
    },
    headStyles: { fillColor: BRAND, textColor: 255, fontStyle: 'bold', fontSize: 8.5 },
    alternateRowStyles: { fillColor: CARD_BG },
    columnStyles: {
      0: { halign: 'left', cellWidth: 'auto' },
      1: { halign: 'center', cellWidth: 16 },
      2: { halign: 'right', cellWidth: 30 },
      3: { halign: 'right', cellWidth: 30, fontStyle: 'bold' },
    },
    // Page 1's watermark is drawn explicitly above (before this table runs).
    // Any continuation page created by this table's own pagination needs its
    // own stamp too, since it never goes through the drawLetterhead() call.
    willDrawPage: (data) => {
      if (data.pageNumber > 1) drawWatermark(doc, statusKey);
    },
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  const amountPaid = invoice.amountPaid ?? (invoice.status === 'paid' ? invoice.amount : 0);
  const balanceDue = invoice.balanceDue ?? Math.max(0, invoice.amount - amountPaid);

  y = ensureSpace(doc, y, 34);
  const totalsW = 78;
  const totalsX = PAGE_WIDTH - MARGIN - totalsW;
  const totalsRow = (label: string, value: string, opts?: { bold?: boolean; color?: [number, number, number] }) => {
    doc.setFont('helvetica', opts?.bold ? 'bold' : 'normal');
    doc.setFontSize(9);
    setText(doc, opts?.color ?? INK);
    doc.text(label, totalsX, y);
    doc.text(value, totalsX + totalsW, y, { align: 'right' });
    y += 6;
  };
  setText(doc, MUTED);
  totalsRow('Invoice total', formatUgx(invoice.amount));
  if (amountPaid > 0) {
    totalsRow('Amount paid', formatUgx(amountPaid), { color: STATUS_STYLE.paid.text });
  }

  // Enough clearance below the last totals row's baseline (descenders in
  // "Amount paid" reach ~2-2.5mm below it) that the box never draws over it.
  y += 5;
  const balanceBoxH = 11;
  setFill(doc, balanceDue > 0 ? STATUS_STYLE[statusKey === 'overdue' ? 'overdue' : 'unpaid'].bg : STATUS_STYLE.paid.bg);
  doc.roundedRect(totalsX - 4, y - 7.5, totalsW + 4, balanceBoxH, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  setText(doc, balanceDue > 0 ? (statusKey === 'overdue' ? STATUS_STYLE.overdue.text : INK) : STATUS_STYLE.paid.text);
  doc.text(balanceDue > 0 ? 'Balance due' : 'Fully paid', totalsX, y);
  doc.text(formatUgx(balanceDue), totalsX + totalsW, y, { align: 'right' });
  y += 12;

  // Payment details — how to actually pay this invoice (bank + mobile money),
  // straight off the company's real paper stationery, so every invoice
  // doubles as its own payment slip.
  y = ensureSpace(doc, y, 40);
  const paymentCardW = (CONTENT_WIDTH - 6) / 2;
  const bankBottom = drawCard(doc, MARGIN, y, paymentCardW, 'Bank Transfer', [
    company.bankName,
    ['Account name', company.accountName],
    ['Account number', company.bankAccountNumber],
  ]);
  const momoBottom = drawCard(doc, MARGIN + paymentCardW + 6, y, paymentCardW, 'Mobile Money', [
    company.momoMerchantName,
    ['MTN MoMo merchant', company.mtnMomoMerchant],
    ['Airtel Pay merchant', company.airtelPayMerchant],
  ]);
  y = Math.max(bankBottom, momoBottom) + 8;

  const payments = invoice.payments ?? [];
  if (payments.length > 0) {
    y = ensureSpace(doc, y, 20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    setText(doc, INK);
    doc.text('Payment history', MARGIN, y);
    y += 4;

    const sortedPayments = [...payments].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN, bottom: 30 },
      head: [['Date', 'Method', 'Reference', 'Status', 'Amount']],
      body: sortedPayments.map((p) => [
        formatDate(p.date),
        p.method || '—',
        p.transactionId || '—',
        p.status.charAt(0).toUpperCase() + p.status.slice(1),
        formatUgx(p.amount),
      ]),
      theme: 'plain',
      styles: {
        font: 'helvetica',
        fontSize: 8,
        textColor: INK,
        cellPadding: { top: 2.2, bottom: 2.2, left: 2, right: 2 },
        lineColor: BORDER,
        lineWidth: 0.15,
      },
      headStyles: { fillColor: INK, textColor: 255, fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: CARD_BG },
      columnStyles: {
        0: { cellWidth: 28 },
        1: { cellWidth: 32 },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 26 },
        4: { halign: 'right', cellWidth: 28, fontStyle: 'bold' },
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 3) {
          const key = String(data.cell.raw).toLowerCase();
          const color = PAYMENT_STATUS_STYLE[key];
          if (color) data.cell.styles.textColor = color;
        }
      },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
  }

  y = ensureSpace(doc, y, 12);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  setText(doc, MUTED);
  const contactBits = [company.email, company.phone].filter(Boolean).join(' or ');
  const closing = contactBits
    ? `Questions about this invoice or arranging an installment plan? Contact us at ${contactBits}.`
    : 'Questions about this invoice or arranging an installment plan? Please get in touch.';
  doc.text(closing, MARGIN, y);

  finalizeFooters(doc, `${company.name} | Computer-generated invoice`);
  return doc;
}

// ---------------------------------------------------------------------------
// Receipt
// ---------------------------------------------------------------------------

/** Generate a receipt PDF for one specific payment — the running balance reflects
 * the invoice's state at generation time. */
export async function generateReceiptPdf(invoice: Invoice, payment: Payment): Promise<jsPDF> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const company = await getCompanyInfo();

  let y = await drawLetterhead(doc, {
    title: 'RECEIPT',
    subtitle: `Invoice #${invoice.invoiceNumber ?? invoice.id.slice(0, 8)}`,
    company,
    showLogo: true,
  });

  const cardW = (CONTENT_WIDTH - 6) / 2;
  const fromRows: CardRow[] = [invoice.patientName];
  if (invoice.patientPhone) fromRows.push(['Phone', invoice.patientPhone]);
  const paymentRows: CardRow[] = [
    ['Date', formatDate(payment.date)],
    ['Method', payment.method || '—'],
  ];
  if (payment.transactionId) paymentRows.push(['Reference', payment.transactionId]);

  const fromBottom = drawCard(doc, MARGIN, y, cardW, 'Received From', fromRows);
  const paymentBottom = drawCard(doc, MARGIN + cardW + 6, y, cardW, 'Payment', paymentRows);
  y = Math.max(fromBottom, paymentBottom) + 8;

  const boxH = 22;
  setFill(doc, STATUS_STYLE.paid.bg);
  setDraw(doc, BORDER);
  doc.setLineWidth(0.3);
  doc.roundedRect(MARGIN, y, CONTENT_WIDTH, boxH, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  setText(doc, MUTED);
  doc.text('AMOUNT RECEIVED', MARGIN + 5, y + 8);
  doc.setFontSize(18);
  setText(doc, STATUS_STYLE.paid.text);
  doc.text(formatUgx(payment.amount), MARGIN + 5, y + 17);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  setText(doc, MUTED);
  const forLabel = (payment.description || invoice.description || invoice.serviceName || '').toString();
  const forLines = doc.splitTextToSize(`For: ${forLabel}`, CONTENT_WIDTH - 100);
  doc.text(forLines, MARGIN + 95, y + 12, { align: 'left' });
  y += boxH + 10;

  const amountPaid = invoice.amountPaid ?? payment.amount;
  const balanceDue = invoice.balanceDue ?? Math.max(0, invoice.amount - amountPaid);

  const totalsW = 78;
  const totalsX = PAGE_WIDTH - MARGIN - totalsW;
  const totalsRow = (label: string, value: string, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(9);
    setText(doc, bold ? INK : MUTED);
    doc.text(label, totalsX, y);
    doc.text(value, totalsX + totalsW, y, { align: 'right' });
    y += 6;
  };
  totalsRow('Invoice total', formatUgx(invoice.amount));
  totalsRow('Total paid to date', formatUgx(amountPaid));
  totalsRow(
    'Balance remaining',
    balanceDue > 0 ? formatUgx(balanceDue) : 'Fully paid',
    true
  );
  y += 16;

  setDraw(doc, MUTED);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y, MARGIN + 65, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  setText(doc, MUTED);
  doc.text('Authorized signature', MARGIN, y + 4);

  finalizeFooters(doc, `${company.name} | Computer-generated receipt`);
  return doc;
}

// ---------------------------------------------------------------------------
// Filenames / download & share helpers
// ---------------------------------------------------------------------------
function pdfFilename(prefix: string, invoice: Invoice): string {
  const safe = (invoice.invoiceNumber ?? invoice.id).replace(/[^a-z0-9]/gi, '_');
  return `${prefix}_${safe}.pdf`;
}

export async function downloadInvoicePdf(invoice: Invoice): Promise<void> {
  const doc = await generateInvoicePdf(invoice);
  doc.save(pdfFilename('Invoice', invoice));
}

export async function downloadReceiptPdf(invoice: Invoice, payment: Payment): Promise<void> {
  const doc = await generateReceiptPdf(invoice, payment);
  doc.save(pdfFilename('Receipt', invoice));
}

export async function getInvoicePdfFile(invoice: Invoice): Promise<{ blob: Blob; filename: string }> {
  const doc = await generateInvoicePdf(invoice);
  return { blob: doc.output('blob'), filename: pdfFilename('Invoice', invoice) };
}

export async function getReceiptPdfFile(
  invoice: Invoice,
  payment: Payment
): Promise<{ blob: Blob; filename: string }> {
  const doc = await generateReceiptPdf(invoice, payment);
  return { blob: doc.output('blob'), filename: pdfFilename('Receipt', invoice) };
}
