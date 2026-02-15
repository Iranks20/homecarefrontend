import { apiService } from './api';
import { API_ENDPOINTS } from '../config/api';
import { Invoice, Payment, PaginatedResponse, BillingSummary } from '../types';

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

type InvoiceApi = Invoice & {
  patient?: { id: string; name: string; email: string } | null;
  service?: { id: string; name: string } | null;
};

function normalizeInvoice(invoice: InvoiceApi): Invoice {
  const status = invoice.status?.toLowerCase() as Invoice['status'] | undefined;
  return {
    id: invoice.id,
    patientId: invoice.patientId,
    patientName: invoice.patientName ?? invoice.patient?.name ?? 'Unknown Patient',
    serviceId: invoice.serviceId,
    serviceName: invoice.serviceName ?? invoice.service?.name ?? 'Unknown Service',
    amount: invoice.amount,
    date: invoice.date,
    dueDate: invoice.dueDate,
    status: status ?? 'pending',
    description: invoice.description,
    archivedAt: invoice.archivedAt ?? undefined,
    createdAt: invoice.createdAt,
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
    return normalizeInvoice(raw.data ?? (response as InvoiceApi));
  }

  async getBillingSummary(params?: { period?: string; dateFrom?: string; dateTo?: string }): Promise<BillingSummary> {
    const response = await apiService.get<{ data?: BillingSummary } & BillingSummary>(API_ENDPOINTS.BILLING.SUMMARY, {
      params,
    });
    const raw = response as { data?: BillingSummary };
    return raw.data ?? (response as BillingSummary);
  }

  async getInvoice(id: string): Promise<Invoice> {
    const response = await apiService.get<InvoiceApi>(API_ENDPOINTS.BILLING.INVOICE_BY_ID(id));
    return normalizeInvoice(response.data);
  }

  async createInvoice(data: Omit<Invoice, 'id'>): Promise<Invoice> {
    const response = await apiService.post<InvoiceApi>(API_ENDPOINTS.BILLING.INVOICES, data);
    return normalizeInvoice(response.data);
  }

  async updateInvoice(id: string, data: Partial<Omit<Invoice, 'id'>>): Promise<Invoice> {
    const response = await apiService.put<InvoiceApi>(API_ENDPOINTS.BILLING.INVOICE_BY_ID(id), data);
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
    const response = await apiService.post<Payment>(API_ENDPOINTS.BILLING.PROCESS_PAYMENT, data);
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
