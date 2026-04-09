import { apiService } from './api';
import { API_ENDPOINTS } from '../config/api';
import { Invoice, InvoiceLineItem, Payment, PaginatedResponse, BillingSummary } from '../types';

export interface InvoiceQueryParams {
  patientId?: string;
  /** 'unpaid' (default) = pending+overdue only, 'paid', 'all' */
  status?: string;
  includeArchived?: boolean;
  dateFrom?: string;
  dateTo?: string;
  period?: 'day' | 'week' | 'month';
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaymentQueryParams {
  patientId?: string;
  invoiceId?: string;
  status?: Payment['status'];
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface ProcessPaymentData {
  invoiceId: string;
  patientId: string;
  amount: number;
  method: Payment['method'];
  transactionId?: string;
  notes?: string;
}

export interface GenerateInvoiceData {
  patientId: string;
  services: Array<{
    serviceId: string;
    serviceName: string;
    amount: number;
    quantity?: number;
    notes?: string;
  }>;
  dueDate: string;
  notes?: string;
}

export interface InvoiceLinePayload {
  serviceId: string;
  quantity?: number;
  unitPrice?: number;
  description?: string;
  procedureCode?: string | null;
}

export interface InvoiceSavePayload {
  patientId: string;
  date: string;
  dueDate: string;
  description: string;
  status: Invoice['status'];
  lines: InvoiceLinePayload[];
  paymentMethod?: string;
}

type InvoiceApi = Invoice & {
  patient?: { id: string; name: string; email: string; title?: string | null } | null;
  service?: { id: string; name: string } | null;
  lineItems?: InvoiceLineItem[];
};

function normalizeLineItem(li: Partial<InvoiceLineItem> & { id?: string }): InvoiceLineItem {
  return {
    id: String(li.id ?? ''),
    serviceId: String(li.serviceId ?? ''),
    serviceName: li.serviceName != null ? String(li.serviceName) : undefined,
    procedureCode: li.procedureCode != null ? String(li.procedureCode) : null,
    description: String(li.description ?? ''),
    quantity: Number(li.quantity ?? 1),
    unitPrice: Number(li.unitPrice ?? 0),
    lineAmount: Number(li.lineAmount ?? 0),
    sortOrder: Number(li.sortOrder ?? 0),
  };
}

function normalizeInvoice(invoice: InvoiceApi): Invoice {
  const status = invoice.status?.toLowerCase() as Invoice['status'] | undefined;
  const rawLines = invoice.lineItems;
  const lineItems = Array.isArray(rawLines) ? rawLines.map((li) => normalizeLineItem(li)) : undefined;
  return {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    patientId: invoice.patientId,
    patientName: invoice.patientName ?? invoice.patient?.name ?? 'Unknown Patient',
    patientTitle: invoice.patientTitle ?? invoice.patient?.title ?? undefined,
    serviceId: invoice.serviceId,
    serviceName: invoice.serviceName ?? invoice.service?.name ?? 'Unknown Service',
    amount: invoice.amount,
    date: invoice.date,
    dueDate: invoice.dueDate,
    status: status ?? 'pending',
    paymentMethod: invoice.paymentMethod != null ? String(invoice.paymentMethod) : undefined,
    description: invoice.description,
    archivedAt: invoice.archivedAt ?? undefined,
    createdAt: invoice.createdAt,
    lineItems,
  };
}

export class BillingService {
  async getInvoices(params?: InvoiceQueryParams): Promise<{
    invoices: Invoice[];
    pagination?: PaginatedResponse<Invoice>['pagination'];
  }> {
    const response = await apiService.get<InvoiceApi[] | { data?: InvoiceApi[]; pagination?: unknown }>(
      API_ENDPOINTS.BILLING.INVOICES,
      { params }
    );
    const raw = response as { data?: InvoiceApi[]; pagination?: PaginatedResponse<Invoice>['pagination'] };
    const list = Array.isArray(raw.data) ? raw.data : Array.isArray((response as any).data) ? (response as any).data : [];
    return {
      invoices: list.map(normalizeInvoice),
      pagination: raw.pagination ?? (response as any).pagination,
    };
  }

  async archiveInvoice(id: string): Promise<Invoice> {
    const response = await apiService.patch<{ data?: InvoiceApi } | InvoiceApi>(API_ENDPOINTS.BILLING.ARCHIVE_INVOICE(id));
    const raw = response as { data?: InvoiceApi };
    return normalizeInvoice(raw.data ?? (response as unknown as InvoiceApi));
  }

  async getBillingSummary(params?: { period?: string; dateFrom?: string; dateTo?: string }): Promise<BillingSummary> {
    const response = await apiService.get<{ data?: BillingSummary } & BillingSummary>(API_ENDPOINTS.BILLING.SUMMARY, {
      params,
    });
    const raw = response as { data?: BillingSummary };
    return raw.data ?? (response as unknown as BillingSummary);
  }

  async getInvoice(id: string): Promise<Invoice> {
    const response = await apiService.get<InvoiceApi>(API_ENDPOINTS.BILLING.INVOICE_BY_ID(id));
    return normalizeInvoice(response.data);
  }

  async createInvoice(data: InvoiceSavePayload): Promise<Invoice> {
    const body = {
      patientId: data.patientId,
      date: data.date,
      dueDate: data.dueDate,
      description: data.description,
      status: String(data.status).toUpperCase(),
      lines: data.lines,
    };
    const response = await apiService.post<InvoiceApi>(API_ENDPOINTS.BILLING.INVOICES, body);
    return normalizeInvoice(response.data);
  }

  async updateInvoice(id: string, data: Partial<InvoiceSavePayload>): Promise<Invoice> {
    const body: Record<string, unknown> = {};
    if (data.patientId !== undefined) body.patientId = data.patientId;
    if (data.date !== undefined) body.date = data.date;
    if (data.dueDate !== undefined) body.dueDate = data.dueDate;
    if (data.description !== undefined) body.description = data.description;
    if (data.status !== undefined) body.status = String(data.status).toUpperCase();
    if (data.lines !== undefined) body.lines = data.lines;
    const response = await apiService.put<InvoiceApi>(API_ENDPOINTS.BILLING.INVOICE_BY_ID(id), body);
    return normalizeInvoice(response.data);
  }

  async deleteInvoice(id: string): Promise<void> {
    await apiService.delete(API_ENDPOINTS.BILLING.INVOICE_BY_ID(id));
  }

  async generateInvoice(data: GenerateInvoiceData): Promise<Invoice> {
    const response = await apiService.post<InvoiceApi>(API_ENDPOINTS.BILLING.GENERATE_INVOICE, data);
    return normalizeInvoice(response.data);
  }

  async getPayments(params?: PaymentQueryParams): Promise<{
    payments: Payment[];
    pagination?: PaginatedResponse<Payment>['pagination'];
  }> {
    const response = await apiService.get<Payment[]>(API_ENDPOINTS.BILLING.PAYMENTS, { params });
    const payments = Array.isArray(response.data) ? response.data : [];
    return {
      payments,
      pagination: response.pagination,
    };
  }

  async getPayment(id: string): Promise<Payment> {
    const response = await apiService.get<Payment>(API_ENDPOINTS.BILLING.PAYMENT_BY_ID(id));
    return response.data;
  }

  async processPayment(data: ProcessPaymentData): Promise<Payment> {
    const response = await apiService.post<Payment>(API_ENDPOINTS.BILLING.PROCESS_PAYMENT, {
      invoiceId: data.invoiceId,
      patientId: data.patientId,
      amount: data.amount,
      method: String(data.method),
      transactionId: data.transactionId,
      description: data.notes ?? `Payment for invoice ${data.invoiceId}`,
    });
    return response.data;
  }

  async getRevenueReport(): Promise<Record<string, any>> {
    const response = await apiService.get<Record<string, any>>(API_ENDPOINTS.BILLING.REVENUE_REPORT);
    return response.data ?? {};
  }

  async getOutstandingReport(): Promise<Record<string, any>> {
    const response = await apiService.get<Record<string, any>>(API_ENDPOINTS.BILLING.OUTSTANDING_REPORT);
    return response.data ?? {};
  }
}

export const billingService = new BillingService();
export default billingService;
