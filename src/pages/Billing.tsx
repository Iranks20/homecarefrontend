import { useMemo, useState } from 'react';
import {
  Search,
  Download,
  Eye,
  DollarSign,
  Calendar,
  User,
  FileText,
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  Printer,
  Archive,
  BarChart3,
  FileSpreadsheet,
  Receipt,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { Invoice } from '../types';
import AddEditInvoiceModal from '../components/AddEditInvoiceModal';
import InvoiceDetailModal from '../components/InvoiceDetailModal';
import { billingService, type InvoiceSavePayload } from '../services/billing';
import { paymentMethodService } from '../services/paymentMethods';
import { patientService } from '../services/patients';
import servicesService from '../services/services';
import { useApi, useApiMutation } from '../hooks/useApi';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import { downloadInvoicePdf, downloadReceiptPdf, resolvePrimaryReceiptPayment } from '../utils/billingPdf';
import { adminInvoiceReferenceWithInternal } from '../utils/invoiceDocumentNumbers';

const formatUgx = (n: number) => `${Number(n).toLocaleString()} UGX`;

function escapeCsv(value: string | number): string {
  const s = String(value);
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Billing() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const canIssueBillingDocuments = user?.role === 'biller' || user?.role === 'admin';

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'unpaid' | 'paid' | 'all'>('unpaid');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
  const [includeArchived, setIncludeArchived] = useState(false);
  const [dateFilter, setDateFilter] = useState('all');
  const [reportPeriod, setReportPeriod] = useState<'day' | 'week' | 'month'>('month');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [detailInvoiceId, setDetailInvoiceId] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const { addNotification } = useNotifications();

  const {
    data: invoicesData,
    loading: loadingInvoices,
    error: invoicesError,
    refetch: refetchInvoices,
  } = useApi(
    () =>
      billingService.getInvoices({
        limit: 500,
        status: statusFilter,
        includeArchived,
      }),
    [statusFilter, includeArchived]
  );

  const { data: summaryData, refetch: refetchSummary } = useApi(
    () => billingService.getBillingSummary({ period: reportPeriod }),
    [reportPeriod]
  );

  const { data: patientsData } = useApi(() => patientService.getPatients({ limit: 200 }), []);
  const { data: servicesData } = useApi(() => servicesService.getServices({ limit: 200 }), []);
  const { data: paymentMethodsData } = useApi(
    () => paymentMethodService.getPaymentMethods({ includeInactive: false }),
    []
  );
  const { data: consultationProvidersData } = useApi(
    () => billingService.getConsultationProviders(),
    []
  );

  const invoices = invoicesData?.invoices ?? [];
  const patients = patientsData?.patients ?? [];
  const services = servicesData?.services ?? [];
  const summary = summaryData ?? null;
  const paymentMethods = paymentMethodsData ?? [];
  const consultationProviders = consultationProvidersData ?? [];

  const createInvoiceMutation = useApiMutation(billingService.createInvoice.bind(billingService));
  const updateInvoiceMutation = useApiMutation((params: { id: string; data: InvoiceSavePayload }) =>
    billingService.updateInvoice(params.id, params.data)
  );
  const archiveInvoiceMutation = useApiMutation(billingService.archiveInvoice.bind(billingService));
  const deleteInvoiceMutation = useApiMutation(billingService.deleteInvoice.bind(billingService));

  const filteredInvoices = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return invoices.filter((invoice) => {
      const lineMatch = (invoice.lineItems ?? []).some(
        (li) =>
          (li.description?.toLowerCase() || '').includes(q) ||
          (li.serviceName?.toLowerCase() || '').includes(q) ||
          (li.procedureCode?.toLowerCase() || '').includes(q)
      );
      const matchesSearch =
        (invoice.patientName?.toLowerCase() || '').includes(q) ||
        (invoice.serviceName?.toLowerCase() || '').includes(q) ||
        (invoice.invoiceNumber?.toLowerCase() || '').includes(q) ||
        (invoice.displayInvoiceNumber?.toLowerCase() || '').includes(q) ||
        (invoice.displayReceiptNumber?.toLowerCase() || '').includes(q) ||
        (invoice.id?.toLowerCase() || '').includes(q) ||
        (invoice.description?.toLowerCase() || '').includes(q) ||
        lineMatch;

      let matchesDate = true;
      if (dateFilter !== 'all') {
        const invoiceDate = new Date(invoice.date);
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        if (dateFilter === 'last30') matchesDate = invoiceDate >= thirtyDaysAgo;
        else if (dateFilter === 'overdue') matchesDate = invoice.status === 'overdue';
      }

      const matchesPaymentMethod =
        paymentMethodFilter === 'all' ||
        (invoice.paymentMethod ?? '').trim().toLowerCase() === paymentMethodFilter.toLowerCase();

      return matchesSearch && matchesDate && matchesPaymentMethod;
    });
  }, [invoices, searchTerm, dateFilter, paymentMethodFilter]);

  const totalAmount = filteredInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const paidAmount = filteredInvoices
    .filter((invoice) => invoice.status === 'paid')
    .reduce((sum, invoice) => sum + invoice.amount, 0);
  const pendingAmount = filteredInvoices
    .filter((invoice) => invoice.status === 'pending')
    .reduce((sum, invoice) => sum + invoice.amount, 0);
  const overdueAmount = filteredInvoices
    .filter((invoice) => invoice.status === 'overdue')
    .reduce((sum, invoice) => sum + invoice.amount, 0);

  const isFullyPaid = (invoice: Invoice): boolean => {
    const ps = invoice.paymentStatus ?? (invoice.status === 'paid' ? 'paid' : 'unpaid');
    return ps === 'paid';
  };

  const invoiceMatchesFilter = (invoice: Invoice, filter: typeof statusFilter): boolean => {
    if (filter === 'all') return true;
    const ps = invoice.paymentStatus ?? (invoice.status === 'paid' ? 'paid' : 'unpaid');
    if (filter === 'paid') return ps === 'paid';
    return ps !== 'paid';
  };

  const handleAddInvoice = async (invoiceData: InvoiceSavePayload) => {
    try {
      const patientName = patients.find((p) => p.id === invoiceData.patientId)?.name ?? 'Patient';
      const createdInvoice = await createInvoiceMutation.mutate(invoiceData);
      toast.success(`Invoice for ${patientName} has been created successfully.`);
      addNotification({
        title: 'Invoice created',
        message: `${patientName}'s invoice has been created.`,
        type: 'success',
        userId: 'system',
        priority: 'medium',
        category: 'system',
      });
      setIsAddModalOpen(false);
      if (isFullyPaid(createdInvoice) && statusFilter === 'unpaid') {
        setStatusFilter('paid');
        toast.info('Invoice is fully paid — switched to the Paid tab.');
        await refetchSummary();
        return;
      }
      if (!invoiceMatchesFilter(createdInvoice, statusFilter)) {
        setStatusFilter('all');
        toast.info('Showing all invoices so you can see the new invoice.');
        await refetchSummary();
        return;
      }
      await Promise.all([refetchInvoices(), refetchSummary()]);
    } catch (error: any) {
      toast.error(error?.message ?? 'Failed to create invoice. Please try again.');
      addNotification({
        title: 'Unable to create invoice',
        message: error?.message ?? 'Please try again later.',
        type: 'error',
        userId: 'system',
        priority: 'high',
        category: 'system',
      });
      throw error;
    }
  };

  const handleEditInvoice = async (invoiceData: InvoiceSavePayload) => {
    if (!selectedInvoice) return;
    try {
      const patientName = patients.find((p) => p.id === invoiceData.patientId)?.name ?? 'Patient';
      const updatedInvoice = await updateInvoiceMutation.mutate({ id: selectedInvoice.id, data: invoiceData });
      toast.success(`Invoice for ${patientName} has been updated successfully.`);
      addNotification({
        title: 'Invoice updated',
        message: `${patientName}'s invoice has been updated.`,
        type: 'success',
        userId: 'system',
        priority: 'medium',
        category: 'system',
      });
      setIsEditModalOpen(false);
      setSelectedInvoice(null);
      if (isFullyPaid(updatedInvoice) && statusFilter === 'unpaid') {
        setStatusFilter('paid');
        toast.info('Invoice is fully paid — switched to the Paid tab.');
        await refetchSummary();
        return;
      }
      await Promise.all([refetchInvoices(), refetchSummary()]);
    } catch (error: any) {
      toast.error(error?.message ?? 'Failed to update invoice. Please try again.');
      addNotification({
        title: 'Unable to update invoice',
        message: error?.message ?? 'Please try again later.',
        type: 'error',
        userId: 'system',
        priority: 'high',
        category: 'system',
      });
      throw error;
    }
  };

  const handleArchiveInvoice = async (invoiceId: string, patientName: string) => {
    if (!window.confirm(`Archive invoice for ${patientName}? It will be hidden from the default list.`)) return;
    try {
      await archiveInvoiceMutation.mutate(invoiceId);
      toast.success(`Invoice for ${patientName} has been archived.`);
      addNotification({
        title: 'Invoice archived',
        message: `Invoice for ${patientName} has been archived.`,
        type: 'success',
        userId: 'system',
        priority: 'medium',
        category: 'system',
      });
      await refetchInvoices();
      await refetchSummary();
    } catch (error: any) {
      toast.error(error?.message ?? 'Failed to archive invoice.');
    }
  };

  const handleDeleteInvoice = async (invoiceId: string, patientName: string) => {
    if (!window.confirm(`Permanently delete ${patientName}'s invoice? This cannot be undone.`)) return;
    try {
      await deleteInvoiceMutation.mutate(invoiceId);
      toast.success(`Invoice for ${patientName} has been deleted.`);
      addNotification({
        title: 'Invoice deleted',
        message: `Invoice for ${patientName} has been removed.`,
        type: 'info',
        userId: 'system',
        priority: 'medium',
        category: 'system',
      });
      await refetchInvoices();
      await refetchSummary();
    } catch (error: any) {
      toast.error(error?.message ?? 'Failed to delete invoice.');
    }
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setDetailInvoiceId(invoice.id);
  };

  const handleOpenInvoiceDocument = (invoice: Invoice) => {
    void downloadInvoicePdf(invoice);
  };

  const handleRefresh = async () => {
    try {
      await Promise.all([refetchInvoices(), refetchSummary()]);
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to refresh billing data');
    }
  };

  const paymentStatusPill = (invoice: Invoice): { label: string; className: string } => {
    const ps = invoice.paymentStatus ?? (invoice.status === 'paid' ? 'paid' : 'unpaid');
    if (ps === 'paid') return { label: 'Paid', className: 'status-badge status-paid' };
    if (ps === 'partial') return { label: 'Partial', className: 'status-badge bg-amber-100 text-amber-800' };
    if (invoice.status === 'overdue') return { label: 'Overdue', className: 'status-badge status-overdue' };
    return { label: 'Unpaid', className: 'status-badge status-pending' };
  };

  const exportInvoicesToCsv = () => {
    const headers = ['Invoice #', 'Patient', 'Service', 'Amount (UGX)', 'Date', 'Due Date', 'Status', 'Description'];
    const rows = filteredInvoices.map((inv) => [
      escapeCsv(inv.invoiceNumber || ''),
      escapeCsv(inv.patientName ?? ''),
      escapeCsv(inv.serviceName ?? ''),
      escapeCsv(inv.amount),
      escapeCsv(new Date(inv.date).toLocaleDateString()),
      escapeCsv(new Date(inv.dueDate).toLocaleDateString()),
      escapeCsv(inv.status),
      escapeCsv(inv.description ?? ''),
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const date = new Date().toISOString().slice(0, 10);
    downloadBlob(blob, `invoices-${date}.csv`);
    toast.success('Invoices exported to CSV.');
  };

  const exportSummaryToCsv = () => {
    if (!summary) {
      toast.info('No summary data to export.');
      return;
    }
    const periodLabel = reportPeriod === 'day' ? 'Today' : reportPeriod === 'week' ? 'This Week' : 'This Month';
    const rows = [
      ['Billing Summary', periodLabel],
      ['Revenue', formatUgx(summary.revenue)],
      ['Revenue (payments count)', String(summary.revenueCount)],
      ['Total Invoiced', formatUgx(summary.totalInvoiced)],
      ['Total Pending', formatUgx(summary.totalPending)],
      ['Pending count', String(summary.pendingCount)],
      ['Total Overdue', formatUgx(summary.totalOverdue)],
      ['Overdue count', String(summary.overdueCount)],
      ['Paid in period', formatUgx(summary.paidInPeriod)],
      ['Paid count', String(summary.paidCount)],
      ['Profit', formatUgx(summary.profit)],
    ];
    const csv = rows.map((r) => r.map(escapeCsv).join(',')).join('\r\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const date = new Date().toISOString().slice(0, 10);
    downloadBlob(blob, `billing-summary-${reportPeriod}-${date}.csv`);
    toast.success('Summary exported to CSV.');
  };

  const escapeHtml = (s: string) =>
    String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const exportInvoicesToPdf = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to export.');
      return;
    }
    const rows = filteredInvoices
      .map(
        (inv) => `
      <tr>
        <td>${escapeHtml(inv.invoiceNumber || '')}</td>
        <td>${escapeHtml(inv.patientName ?? '')}</td>
        <td>${escapeHtml(inv.serviceName ?? '')}</td>
        <td>${formatUgx(inv.amount)}</td>
        <td>${escapeHtml(new Date(inv.date).toLocaleDateString())}</td>
        <td>${escapeHtml(new Date(inv.dueDate).toLocaleDateString())}</td>
        <td>${escapeHtml(inv.status)}</td>
      </tr>`
      )
      .join('');
    const html = `
      <!DOCTYPE html>
      <html>
        <head><title>Invoices Export</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
            th { background: #f5f5f5; }
          </style>
        </head>
        <body>
          <h1>Invoices</h1>
          <p>Exported ${new Date().toLocaleString()} — ${filteredInvoices.length} record(s)</p>
          <table>
            <thead><tr>
              <th>Invoice #</th><th>Patient</th><th>Service</th><th>Amount</th><th>Date</th><th>Due Date</th><th>Status</th>
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>
          <p class="no-print" style="margin-top: 20px;">
            <button onclick="window.print()" style="padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer;">Print / Save as PDF</button>
          </p>
        </body>
      </html>`;
    printWindow.document.write(html);
    printWindow.document.close();
    toast.success('Export opened in new window. Use Print to save as PDF.');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing & Invoices</h1>
          <p className="mt-1 text-sm text-gray-600">Manage invoices and payment tracking</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setExportMenuOpen((o) => !o)}
              onBlur={() => setTimeout(() => setExportMenuOpen(false), 150)}
              className="btn-outline flex items-center gap-2"
              aria-haspopup="true"
              aria-expanded={exportMenuOpen}
            >
              <Download className="h-4 w-4" />
              Export
              <svg className="h-4 w-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {exportMenuOpen && (
              <div className="absolute right-0 mt-1 w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-lg z-20">
                <button
                  type="button"
                  onClick={() => { setExportMenuOpen(false); exportInvoicesToCsv(); }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left"
                >
                  <FileSpreadsheet className="h-4 w-4 text-green-600 shrink-0" />
                  Invoices to CSV
                </button>
                <button
                  type="button"
                  onClick={() => { setExportMenuOpen(false); exportSummaryToCsv(); }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left"
                >
                  <BarChart3 className="h-4 w-4 text-blue-600 shrink-0" />
                  Summary to CSV
                </button>
                <button
                  type="button"
                  onClick={() => { setExportMenuOpen(false); exportInvoicesToPdf(); }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left"
                >
                  <Printer className="h-4 w-4 text-gray-600 shrink-0" />
                  Print list (PDF)
                </button>
              </div>
            )}
          </div>
          <button type="button" onClick={() => void handleRefresh()} className="btn-outline flex items-center">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <button onClick={() => setIsAddModalOpen(true)} className="btn-primary flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            Create Invoice
          </button>
        </div>
      </div>

      {invoicesError && (
        <div className="card text-sm text-red-500 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" /> Unable to load invoices. Please try again later.
        </div>
      )}

      {/* Report period summary */}
      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-primary-600" />
            Billing Reports
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Period:</span>
            <select
              value={reportPeriod}
              onChange={(e) => setReportPeriod(e.target.value as 'day' | 'week' | 'month')}
              className="input-field py-1.5 text-sm"
            >
              <option value="day">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="p-3 rounded-lg bg-green-50 border border-green-100">
            <p className="text-xs font-medium text-gray-600">Revenue</p>
            <p className="text-lg font-bold text-green-700">{summary ? formatUgx(summary.revenue) : '—'}</p>
            <p className="text-xs text-gray-500">{summary?.revenueCount ?? 0} payments</p>
          </div>
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
            <p className="text-xs font-medium text-gray-600">Invoiced</p>
            <p className="text-lg font-bold text-blue-700">{summary ? formatUgx(summary.totalInvoiced) : '—'}</p>
          </div>
          <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-100">
            <p className="text-xs font-medium text-gray-600">Pending</p>
            <p className="text-lg font-bold text-yellow-700">{summary ? formatUgx(summary.totalPending) : '—'}</p>
            <p className="text-xs text-gray-500">{summary?.pendingCount ?? 0} invoices</p>
          </div>
          <div className="p-3 rounded-lg bg-red-50 border border-red-100">
            <p className="text-xs font-medium text-gray-600">Overdue</p>
            <p className="text-lg font-bold text-red-700">{summary ? formatUgx(summary.totalOverdue) : '—'}</p>
            <p className="text-xs text-gray-500">{summary?.overdueCount ?? 0} invoices</p>
          </div>
          <div className="p-3 rounded-lg bg-primary-50 border border-primary-100">
            <p className="text-xs font-medium text-gray-600">Profit</p>
            <p className="text-lg font-bold text-primary-700">{summary ? formatUgx(summary.profit) : '—'}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-lg bg-blue-100">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total (this list)</p>
              <p className="text-2xl font-semibold text-gray-900">{formatUgx(totalAmount)}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-lg bg-green-100">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Paid</p>
              <p className="text-2xl font-semibold text-gray-900">{formatUgx(paidAmount)}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-lg bg-yellow-100">
              <DollarSign className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-semibold text-gray-900">{formatUgx(pendingAmount)}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-lg bg-red-100">
              <DollarSign className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Overdue</p>
              <p className="text-2xl font-semibold text-gray-900">{formatUgx(overdueAmount)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'unpaid' | 'paid' | 'all')}
              className="input-field"
            >
              <option value="unpaid">Unpaid (Pending + Overdue)</option>
              <option value="paid">Paid only</option>
              <option value="all">All statuses</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={includeArchived}
                onChange={(e) => setIncludeArchived(e.target.checked)}
                className="rounded border-gray-300 text-primary-600"
              />
              Include archived
            </label>
          </div>
          <div>
            <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="input-field">
              <option value="all">All Time</option>
              <option value="last30">Last 30 Days</option>
              <option value="overdue">Overdue Only</option>
            </select>
          </div>
          <div>
            <select
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
              className="input-field"
            >
              <option value="all">All Payment Methods</option>
              {paymentMethods.map((method) => (
                <option key={method.id} value={method.name}>
                  {method.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loadingInvoices ? (
        <div className="card text-sm text-gray-500">Loading invoices...</div>
      ) : (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInvoices.map((invoice) => {
                  const pill = paymentStatusPill(invoice);
                  const balance = invoice.balanceDue ?? Math.max(0, invoice.amount - (invoice.amountPaid ?? 0));
                  const receiptPayment = resolvePrimaryReceiptPayment(invoice) ?? invoice.payments?.[0] ?? null;
                  return (
                  <tr
                    key={invoice.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleViewInvoice(invoice)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 text-gray-400 mr-2" />
                        <div className="text-sm font-medium text-gray-900">
                          {adminInvoiceReferenceWithInternal(invoice)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="h-4 w-4 text-gray-400 mr-2" />
                        <div className="text-sm text-gray-900">{invoice.patientName}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{invoice.serviceName}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">{invoice.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{formatUgx(invoice.amount)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${balance > 0 ? 'text-red-700' : 'text-gray-500'}`}>
                        {formatUgx(balance)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        <div className="text-sm text-gray-900">
                          {new Date(invoice.date).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        <div className="text-sm text-gray-900">
                          {new Date(invoice.dueDate).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={pill.className}>{pill.label}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={() => handleViewInvoice(invoice)}
                        className="text-primary-600 hover:text-primary-900 mr-4"
                      >
                        <Eye className="h-4 w-4 inline mr-1" />
                        View
                      </button>
                      {canIssueBillingDocuments && (
                        <button
                          type="button"
                          onClick={() => handleOpenInvoiceDocument(invoice)}
                          className="text-secondary-600 hover:text-secondary-900 mr-4"
                        >
                          <FileText className="h-4 w-4 inline mr-1" />
                          Invoice
                        </button>
                      )}
                      {canIssueBillingDocuments && receiptPayment && (
                        <button
                          type="button"
                          onClick={() => void downloadReceiptPdf(invoice, receiptPayment)}
                          className="text-emerald-700 hover:text-emerald-900 mr-4"
                        >
                          <Receipt className="h-4 w-4 inline mr-1" />
                          Receipt
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedInvoice(invoice);
                          setIsEditModalOpen(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 mr-4"
                      >
                        <Edit className="h-4 w-4 inline mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleArchiveInvoice(invoice.id, invoice.patientName)}
                        className="text-amber-600 hover:text-amber-800"
                        title="Archive invoice"
                      >
                        <Archive className="h-4 w-4 inline mr-1" />
                        Archive
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteInvoice(invoice.id, invoice.patientName)}
                          className="text-red-600 hover:text-red-800 ml-2"
                          title="Permanently delete (admin only)"
                        >
                          <Trash2 className="h-4 w-4 inline mr-1" />
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filteredInvoices.length === 0 && !loadingInvoices && (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <Search className="h-12 w-12" />
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No invoices found</h3>
          <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter criteria.</p>
        </div>
      )}

      <AddEditInvoiceModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddInvoice}
        mode="add"
        patients={patients}
        services={services}
        consultationProviders={consultationProviders}
      />

      <AddEditInvoiceModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedInvoice(null);
        }}
        onSave={handleEditInvoice}
        invoice={selectedInvoice}
        mode="edit"
        patients={patients}
        services={services}
        consultationProviders={consultationProviders}
      />

      <InvoiceDetailModal
        isOpen={detailInvoiceId !== null}
        onClose={() => {
          setDetailInvoiceId(null);
          setSelectedInvoice(null);
        }}
        invoiceId={detailInvoiceId}
        paymentMethods={paymentMethods}
        onEdit={(invoice) => {
          setDetailInvoiceId(null);
          setSelectedInvoice(invoice);
          setIsEditModalOpen(true);
        }}
        onChanged={(invoice) => {
          if (invoice && isFullyPaid(invoice) && statusFilter === 'unpaid') {
            setStatusFilter('paid');
            toast.info('Invoice is fully paid — switched to the Paid tab.');
            void refetchSummary();
            return;
          }
          void Promise.all([refetchInvoices(), refetchSummary()]);
        }}
        onArchived={() => void refetchInvoices()}
        onDeleted={() => void Promise.all([refetchInvoices(), refetchSummary()])}
      />
    </div>
  );
}
