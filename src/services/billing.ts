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
  paymentDate?: string;
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
  serviceId?: string;
  consultationProviderId?: string;
  consultationSpecialistId?: string;
  consultationTherapistId?: string;
  quantity?: number;
  quantityUnit?: 'day' | 'week' | 'month' | 'unit';
  serviceDateFrom?: string;
  serviceDateTo?: string;
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
  displayInvoiceNumber?: string | null;
  displayReceiptNumber?: string | null;
  paymentDate?: string | null;
  lines?: InvoiceLinePayload[];
}

export type ConsultationProviderSource = 'user' | 'specialist' | 'therapist';

export interface ConsultationProvider {
  source: ConsultationProviderSource;
  id: string;
  name: string;
  role: 'specialist' | 'therapist';
  specialization?: string | null;
  consultationFee: number;
}

type InvoiceApi = Invoice & {
  patient?: { id: string; name: string; email: string; phone?: string; title?: string | null } | null;
  service?: { id: string; name: string } | null;
  lineItems?: InvoiceLineItem[];
  payments?: PaymentApi[];
};

type PaymentApi = Partial<Payment> & { id?: string; invoiceId?: string };

function normalizePayment(p: PaymentApi, fallback?: { patientId?: string; patientName?: string }): Payment {
  const status = (typeof p.status === 'string' ? p.status.toLowerCase() : 'completed') as Payment['status'];
  return {
    id: String(p.id ?? ''),
    patientId: p.patientId ?? fallback?.patientId,
    patientName: p.patientName ?? fallback?.patientName,
    invoiceId: String(p.invoiceId ?? ''),
    amount: Number(p.amount ?? 0),
    method: String(p.method ?? ''),
    status,
    transactionId: p.transactionId != null ? String(p.transactionId) : undefined,
    date: String(p.date ?? ''),
    description: String(p.description ?? ''),
    createdAt: p.createdAt,
  };
}

function normalizeLineItem(
  li: Partial<InvoiceLineItem> & {
    id?: string;
    quantityUnit?: string | null;
    serviceDateFrom?: string | null;
    serviceDateTo?: string | null;
    consultationProviderId?: string | null;
    consultationProviderName?: string | null;
    consultationSpecialistId?: string | null;
    consultationSpecialistName?: string | null;
    consultationTherapistId?: string | null;
    consultationTherapistName?: string | null;
  }
): InvoiceLineItem {
  return {
    id: String(li.id ?? ''),
    serviceId: String(li.serviceId ?? ''),
    serviceName: li.serviceName != null ? String(li.serviceName) : undefined,
    procedureCode: li.procedureCode != null ? String(li.procedureCode) : null,
    description: String(li.description ?? ''),
    quantity: Number(li.quantity ?? 1),
    quantityUnit: li.quantityUnit != null ? (String(li.quantityUnit).toLowerCase() as InvoiceLineItem['quantityUnit']) : null,
    serviceDateFrom: li.serviceDateFrom != null ? String(li.serviceDateFrom) : null,
    serviceDateTo: li.serviceDateTo != null ? String(li.serviceDateTo) : null,
    unitPrice: Number(li.unitPrice ?? 0),
    lineAmount: Number(li.lineAmount ?? 0),
    sortOrder: Number(li.sortOrder ?? 0),
    consultationProviderId: li.consultationProviderId ?? null,
    consultationProviderName: li.consultationProviderName ?? null,
    consultationSpecialistId: li.consultationSpecialistId ?? null,
    consultationSpecialistName: li.consultationSpecialistName ?? null,
    consultationTherapistId: li.consultationTherapistId ?? null,
    consultationTherapistName: li.consultationTherapistName ?? null,
  };
}

function normalizeInvoice(invoice: InvoiceApi): Invoice {
  const status = invoice.status?.toLowerCase() as Invoice['status'] | undefined;
  const rawLines = invoice.lineItems;
  const lineItems = Array.isArray(rawLines) ? rawLines.map((li) => normalizeLineItem(li)) : undefined;
  const patientName = invoice.patientName ?? invoice.patient?.name ?? 'Unknown Patient';
  const rawPayments = invoice.payments;
  const payments = Array.isArray(rawPayments)
    ? rawPayments.map((p) => normalizePayment(p, { patientId: invoice.patientId, patientName }))
    : undefined;
  const amountPaid = typeof invoice.amountPaid === 'number' ? invoice.amountPaid : undefined;
  const balanceDue =
    typeof invoice.balanceDue === 'number'
      ? invoice.balanceDue
      : amountPaid != null
      ? Math.max(0, invoice.amount - amountPaid)
      : undefined;
  const paymentStatus =
    (invoice.paymentStatus as Invoice['paymentStatus']) ??
    (status === 'paid' ? 'paid' : amountPaid && amountPaid > 0 ? 'partial' : 'unpaid');
  return {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    displayInvoiceNumber: invoice.displayInvoiceNumber ?? null,
    displayReceiptNumber: invoice.displayReceiptNumber ?? null,
    patientId: invoice.patientId,
    patientName,
    patientTitle: invoice.patientTitle ?? invoice.patient?.title ?? undefined,
    patientPhone: invoice.patientPhone ?? invoice.patient?.phone ?? undefined,
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
    amountPaid,
    balanceDue,
    paymentStatus,
    payments,
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
    const body: Record<string, unknown> = {
      patientId: data.patientId,
      date: data.date,
      dueDate: data.dueDate,
      description: data.description,
      status: String(data.status).toUpperCase(),
      displayInvoiceNumber: data.displayInvoiceNumber?.trim() || null,
      displayReceiptNumber: data.displayReceiptNumber?.trim() || null,
      lines: data.lines ?? [],
    };
    if (data.paymentDate) body.paymentDate = data.paymentDate;
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
    if (data.displayInvoiceNumber !== undefined) {
      body.displayInvoiceNumber =
        data.displayInvoiceNumber == null || String(data.displayInvoiceNumber).trim() === ''
          ? null
          : String(data.displayInvoiceNumber).trim();
    }
    if (data.displayReceiptNumber !== undefined) {
      body.displayReceiptNumber =
        data.displayReceiptNumber == null || String(data.displayReceiptNumber).trim() === ''
          ? null
          : String(data.displayReceiptNumber).trim();
    }
    if (data.paymentDate !== undefined) {
      body.paymentDate = data.paymentDate || null;
    }
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
    const response = await apiService.get<PaymentApi[]>(API_ENDPOINTS.BILLING.PAYMENTS, { params });
    const raw = Array.isArray(response.data) ? response.data : [];
    return {
      payments: raw.map((p) => normalizePayment(p)),
      pagination: response.pagination,
    };
  }

  async getPayment(id: string): Promise<Payment> {
    const response = await apiService.get<PaymentApi>(API_ENDPOINTS.BILLING.PAYMENT_BY_ID(id));
    return normalizePayment(response.data);
  }

  async processPayment(data: ProcessPaymentData): Promise<Payment> {
    const response = await apiService.post<PaymentApi>(API_ENDPOINTS.BILLING.PROCESS_PAYMENT, {
      invoiceId: data.invoiceId,
      patientId: data.patientId,
      amount: data.amount,
      method: String(data.method),
      transactionId: data.transactionId,
      description: data.notes?.trim() || 'Payment received',
      paymentDate: data.paymentDate,
    });
    return normalizePayment(response.data, { patientId: data.patientId });
  }

  async getRevenueReport(): Promise<Record<string, any>> {
    const response = await apiService.get<Record<string, any>>(API_ENDPOINTS.BILLING.REVENUE_REPORT);
    return response.data ?? {};
  }

  async getOutstandingReport(): Promise<Record<string, any>> {
    const response = await apiService.get<Record<string, any>>(API_ENDPOINTS.BILLING.OUTSTANDING_REPORT);
    return response.data ?? {};
  }

  async getConsultationProviders(): Promise<ConsultationProvider[]> {
    const response = await apiService.get<ConsultationProvider[]>(
      API_ENDPOINTS.BILLING.CONSULTATION_PROVIDERS
    );
    const raw = Array.isArray(response.data) ? response.data : [];
    return raw.map((p) => ({
      ...p,
      source: p.source ?? 'user',
    }));
  }
}

export const billingService = new BillingService();
export default billingService;
