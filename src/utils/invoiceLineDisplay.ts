import type { InvoiceLineItem } from '../types';

export type InvoiceQuantityUnit = 'day' | 'week' | 'month' | 'unit';

export function formatDocumentDate(value?: string | null): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatInvoiceQuantity(quantity: number, quantityUnit?: string | null): string {
  const qty = Math.max(1, Math.floor(Number(quantity) || 1));
  const unit = (quantityUnit ?? 'unit').toLowerCase();
  if (unit === 'day') return qty === 1 ? '1 day' : `${qty} days`;
  if (unit === 'week') return qty === 1 ? '1 week' : `${qty} weeks`;
  if (unit === 'month') return qty === 1 ? '1 month' : `${qty} months`;
  return String(qty);
}

export function formatServicePeriodLabel(from?: string | null, to?: string | null): string | null {
  const fromLabel = formatDocumentDate(from);
  const toLabel = formatDocumentDate(to);
  if (fromLabel && toLabel) return `${fromLabel} – ${toLabel}`;
  if (fromLabel) return `from ${fromLabel}`;
  if (toLabel) return `until ${toLabel}`;
  return null;
}

export function formatInvoiceLineDescription(
  description: string,
  serviceDateFrom?: string | null,
  serviceDateTo?: string | null
): string {
  const base = (description || '').trim();
  const period = formatServicePeriodLabel(serviceDateFrom, serviceDateTo);
  if (!period) return base || '—';
  if (!base) return period;
  return `${base} (${period})`;
}

export function formatInvoiceLineItemDescription(line: Pick<
  InvoiceLineItem,
  'description' | 'serviceName' | 'serviceDateFrom' | 'serviceDateTo'
>): string {
  return formatInvoiceLineDescription(
    line.description || line.serviceName || '',
    line.serviceDateFrom,
    line.serviceDateTo
  );
}

export function formatDateForInput(value?: string | null): string {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().split('T')[0];
}

export function normalizeQuantityUnit(value?: string | null): InvoiceQuantityUnit {
  const unit = (value ?? 'unit').toLowerCase();
  if (unit === 'day' || unit === 'week' || unit === 'month') return unit;
  return 'unit';
}
