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
  X,
  Printer,
  Archive,
  BarChart3,
  FileSpreadsheet,
  Receipt,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { Invoice } from '../types';
import AddEditInvoiceModal from '../components/AddEditInvoiceModal';
import { billingService, type InvoiceSavePayload } from '../services/billing';
import { paymentMethodService } from '../services/paymentMethods';
import { patientService } from '../services/patients';
import servicesService from '../services/services';
import { useApi, useApiMutation } from '../hooks/useApi';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import {
  buildInvoicePrintHtml,
  buildReceiptPrintHtml,
  openBillingPrintDocument,
} from '../utils/billingDocuments';

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
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
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

  const invoices = invoicesData?.invoices ?? [];
  const patients = patientsData?.patients ?? [];
  const services = servicesData?.services ?? [];
  const summary = summaryData ?? null;
  const paymentMethods = paymentMethodsData ?? [];

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

  const handleAddInvoice = async (invoiceData: InvoiceSavePayload) => {
    try {
      const patientName = patients.find((p) => p.id === invoiceData.patientId)?.name ?? 'Patient';
      const createdInvoice = await createInvoiceMutation.mutate(invoiceData);
      if (invoiceData.status === 'paid') {
        const method = invoiceData.paymentMethod?.trim();
        if (!method) throw new Error('Payment method is required for paid invoices.');
        await billingService.processPayment({
          invoiceId: createdInvoice.id,
          patientId: createdInvoice.patientId,
          amount: createdInvoice.amount,
          method,
          notes: invoiceData.description,
        });
      }
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
      await refetchInvoices();
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
      const becamePaid = selectedInvoice.status !== 'paid' && invoiceData.status === 'paid';
      if (becamePaid) {
        const method = invoiceData.paymentMethod?.trim();
        if (!method) throw new Error('Payment method is required for paid invoices.');
        await billingService.processPayment({
          invoiceId: updatedInvoice.id,
          patientId: updatedInvoice.patientId,
          amount: updatedInvoice.amount,
          method,
          notes: invoiceData.description,
        });
      }
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
      await refetchInvoices();
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
    setIsViewModalOpen(true);
  };

  const handleOpenInvoiceDocument = (invoice: Invoice) => {
    if (invoice.status === 'paid') {
      toast.info('This invoice is paid. Use Receipt for the payment document.');
      return;
    }
    const html = buildInvoicePrintHtml(invoice);
    if (!openBillingPrintDocument(html)) {
      toast.error('Please allow popups to print.');
      return;
    }
    toast.success('Invoice opened. Use Print to save as PDF.');
  };

  const handleOpenReceiptDocument = (invoice: Invoice) => {
    if (invoice.status !== 'paid') {
      toast.info('Receipt is available after the invoice is marked paid.');
      return;
    }
    const html = buildReceiptPrintHtml(invoice);
    if (!openBillingPrintDocument(html)) {
      toast.error('Please allow popups to print.');
      return;
    }
    toast.success('Receipt opened. Use Print to save as PDF.');
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 text-gray-400 mr-2" />
                        <div className="text-sm font-medium text-gray-900">
                          {invoice.invoiceNumber ?? ''}
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
                      <span
                        className={`status-badge ${
                          invoice.status === 'paid'
                            ? 'status-paid'
                            : invoice.status === 'pending'
                            ? 'status-pending'
                            : 'status-overdue'
                        }`}
                      >
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        onClick={() => handleViewInvoice(invoice)}
                        className="text-primary-600 hover:text-primary-900 mr-4"
                      >
                        <Eye className="h-4 w-4 inline mr-1" />
                        View
                      </button>
                      {canIssueBillingDocuments &&
                        (invoice.status === 'paid' ? (
                          <button
                            type="button"
                            onClick={() => handleOpenReceiptDocument(invoice)}
                            className="text-emerald-700 hover:text-emerald-900 mr-4"
                          >
                            <Receipt className="h-4 w-4 inline mr-1" />
                            Receipt
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenInvoiceDocument(invoice)}
                            className="text-secondary-600 hover:text-secondary-900 mr-4"
                          >
                            <FileText className="h-4 w-4 inline mr-1" />
                            Invoice
                          </button>
                        ))}
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
                ))}
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
        paymentMethods={paymentMethods}
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
        paymentMethods={paymentMethods}
      />

      {/* View Invoice Modal */}
      {isViewModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4 sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Invoice Details</h2>
              <p className="text-sm text-gray-500">
                {selectedInvoice.invoiceNumber ? `Invoice #${selectedInvoice.invoiceNumber}` : 'Invoice'}
              </p>
              </div>
              <div className="flex items-center space-x-2">
                {canIssueBillingDocuments &&
                  (selectedInvoice.status === 'paid' ? (
                    <button
                      type="button"
                      onClick={() => handleOpenReceiptDocument(selectedInvoice)}
                      className="btn-outline flex items-center"
                      title="Print receipt"
                    >
                      <Receipt className="h-4 w-4 mr-2" />
                      Receipt
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleOpenInvoiceDocument(selectedInvoice)}
                      className="btn-outline flex items-center"
                      title="Print invoice"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Invoice
                    </button>
                  ))}
                <button
                  type="button"
                  className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                  onClick={() => {
                    setIsViewModalOpen(false);
                    setSelectedInvoice(null);
                  }}
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="px-6 py-6 space-y-6">
              {/* Invoice Header */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Bill To</h3>
                  <p className="text-lg font-semibold text-gray-900">{selectedInvoice.patientName}</p>
                  <p className="text-sm text-gray-600">Patient ID: {selectedInvoice.patientId}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Invoice Information</h3>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">Date:</span> {new Date(selectedInvoice.date).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">Due Date:</span> {new Date(selectedInvoice.dueDate).toLocaleDateString()}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium text-gray-900">Status:</span>{' '}
                      <span
                        className={`status-badge ${
                          selectedInvoice.status === 'paid'
                            ? 'status-paid'
                            : selectedInvoice.status === 'pending'
                            ? 'status-pending'
                            : 'status-overdue'
                        }`}
                      >
                        {selectedInvoice.status}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-sm font-medium text-gray-500 mb-4">Charges</h3>
                <p className="text-sm text-gray-600 mb-3">{selectedInvoice.description}</p>
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 text-left text-gray-600">
                      <tr>
                        <th className="px-3 py-2 font-medium">Qty</th>
                        <th className="px-3 py-2 font-medium">Service / description</th>
                        <th className="px-3 py-2 font-medium text-right">Unit</th>
                        <th className="px-3 py-2 font-medium text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(selectedInvoice.lineItems?.length
                        ? selectedInvoice.lineItems
                        : [
                            {
                              id: 'legacy',
                              serviceId: selectedInvoice.serviceId ?? '',
                              serviceName: selectedInvoice.serviceName,
                              description: selectedInvoice.description,
                              quantity: 1,
                              unitPrice: selectedInvoice.amount,
                              lineAmount: selectedInvoice.amount,
                              sortOrder: 0,
                            },
                          ]
                      ).map((li) => (
                        <tr key={li.id}>
                          <td className="px-3 py-2 text-gray-900">{li.quantity}</td>
                          <td className="px-3 py-2 text-gray-900">
                            <div className="font-medium">{li.serviceName ?? '—'}</div>
                            {li.description && li.description !== li.serviceName && (
                              <div className="text-gray-600 text-xs mt-0.5">{li.description}</div>
                            )}
                          </td>
                          <td className="px-3 py-2 text-right text-gray-700">{formatUgx(li.unitPrice)}</td>
                          <td className="px-3 py-2 text-right font-medium text-gray-900">
                            {formatUgx(li.lineAmount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Total Amount</span>
                  <span className="text-2xl font-bold text-gray-900">{formatUgx(selectedInvoice.amount)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="border-t pt-4 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setIsViewModalOpen(false);
                    setSelectedInvoice(null);
                  }}
                  className="btn-outline"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setSelectedInvoice(selectedInvoice);
                    setIsViewModalOpen(false);
                    setIsEditModalOpen(true);
                  }}
                  className="btn-primary flex items-center"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
