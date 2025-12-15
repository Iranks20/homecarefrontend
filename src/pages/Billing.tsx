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
} from 'lucide-react';
import { toast } from 'react-toastify';
import { Invoice } from '../types';
import AddEditInvoiceModal from '../components/AddEditInvoiceModal';
import { billingService } from '../services/billing';
import { patientService } from '../services/patients';
import servicesService from '../services/services';
import { useApi, useApiMutation } from '../hooks/useApi';
import { useNotifications } from '../contexts/NotificationContext';

export default function Billing() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const { addNotification } = useNotifications();

  const {
    data: invoicesData,
    loading: loadingInvoices,
    error: invoicesError,
    refetch: refetchInvoices,
  } = useApi(() => billingService.getInvoices({ limit: 200 }), []);

  const { data: patientsData } = useApi(() => patientService.getPatients({ limit: 200 }), []);
  const { data: servicesData } = useApi(() => servicesService.getServices({ limit: 200 }), []);

  const invoices = invoicesData?.invoices ?? [];
  const patients = patientsData?.patients ?? [];
  const services = servicesData?.services ?? [];

  const createInvoiceMutation = useApiMutation(billingService.createInvoice.bind(billingService));
  const updateInvoiceMutation = useApiMutation(
    (params: { id: string; data: Partial<Invoice> }) => billingService.updateInvoice(params.id, params.data)
  );
  const deleteInvoiceMutation = useApiMutation(billingService.deleteInvoice.bind(billingService));

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const matchesSearch =
        (invoice.patientName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (invoice.serviceName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (invoice.id?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;

      let matchesDate = true;
      if (dateFilter !== 'all') {
        const invoiceDate = new Date(invoice.date);
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        if (dateFilter === 'last30') {
          matchesDate = invoiceDate >= thirtyDaysAgo;
        } else if (dateFilter === 'overdue') {
          matchesDate = invoice.status === 'overdue';
        }
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [invoices, searchTerm, statusFilter, dateFilter]);

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

  const handleAddInvoice = async (invoiceData: Omit<Invoice, 'id'>) => {
    try {
      await createInvoiceMutation.mutate(invoiceData);
      toast.success(`Invoice for ${invoiceData.patientName} has been created successfully.`);
      addNotification({
        title: 'Invoice created',
        message: `${invoiceData.patientName}'s invoice has been created.`,
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

  const handleEditInvoice = async (invoiceData: Omit<Invoice, 'id'>) => {
    if (!selectedInvoice) return;
    try {
      await updateInvoiceMutation.mutate({ id: selectedInvoice.id, data: invoiceData });
      toast.success(`Invoice for ${invoiceData.patientName} has been updated successfully.`);
      addNotification({
        title: 'Invoice updated',
        message: `${invoiceData.patientName}'s invoice has been updated.`,
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

  const handleDeleteInvoice = async (invoiceId: string, patientName: string) => {
    if (!window.confirm(`Are you sure you want to delete ${patientName}'s invoice?`)) {
      return;
    }
    try {
      await deleteInvoiceMutation.mutate(invoiceId);
      toast.success(`Invoice for ${patientName} has been deleted successfully.`);
      addNotification({
        title: 'Invoice deleted',
        message: `Invoice for ${patientName} has been removed.`,
        type: 'info',
        userId: 'system',
        priority: 'medium',
        category: 'system',
      });
      await refetchInvoices();
    } catch (error: any) {
      toast.error(error?.message ?? 'Failed to delete invoice. Please try again.');
      addNotification({
        title: 'Unable to delete invoice',
        message: error?.message ?? 'Please try again later.',
        type: 'error',
        userId: 'system',
        priority: 'high',
        category: 'system',
      });
    }
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsViewModalOpen(true);
  };

  const handlePrintInvoice = (invoice: Invoice) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to print invoices.');
      return;
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${invoice.id}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .header h1 {
              margin: 0;
              color: #333;
            }
            .invoice-info {
              display: flex;
              justify-content: space-between;
              margin-bottom: 30px;
            }
            .info-section {
              flex: 1;
            }
            .info-section h3 {
              margin-top: 0;
              color: #666;
            }
            .info-section p {
              margin: 5px 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            th, td {
              padding: 12px;
              text-align: left;
              border-bottom: 1px solid #ddd;
            }
            th {
              background-color: #f5f5f5;
              font-weight: bold;
            }
            .total {
              text-align: right;
              margin-top: 20px;
            }
            .total-amount {
              font-size: 24px;
              font-weight: bold;
              color: #333;
            }
            .status {
              display: inline-block;
              padding: 5px 15px;
              border-radius: 5px;
              font-weight: bold;
              text-transform: uppercase;
            }
            .status-paid { background-color: #d4edda; color: #155724; }
            .status-pending { background-color: #fff3cd; color: #856404; }
            .status-overdue { background-color: #f8d7da; color: #721c24; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>INVOICE</h1>
            <p>Invoice #${invoice.id}</p>
          </div>
          
          <div class="invoice-info">
            <div class="info-section">
              <h3>Bill To:</h3>
              <p><strong>${invoice.patientName || 'N/A'}</strong></p>
              <p>Invoice Date: ${new Date(invoice.date).toLocaleDateString()}</p>
              <p>Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}</p>
            </div>
            <div class="info-section">
              <h3>Status:</h3>
              <span class="status status-${invoice.status}">${invoice.status}</span>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Service</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${invoice.description || 'N/A'}</td>
                <td>${invoice.serviceName || 'N/A'}</td>
                <td>$${invoice.amount.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          
          <div class="total">
            <div class="total-amount">Total: $${invoice.amount.toFixed(2)}</div>
          </div>
          
          <div class="no-print" style="margin-top: 30px; text-align: center;">
            <button onclick="window.print()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
              Print Invoice
            </button>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    toast.success('Invoice opened in new window. Use your browser\'s print function to save as PDF.');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing & Invoices</h1>
          <p className="mt-1 text-sm text-gray-600">Manage invoices and payment tracking</p>
        </div>
        <div className="mt-4 sm:mt-0">
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

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-lg bg-blue-100">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Amount</p>
              <p className="text-2xl font-semibold text-gray-900">${totalAmount.toFixed(2)}</p>
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
              <p className="text-2xl font-semibold text-gray-900">${paidAmount.toFixed(2)}</p>
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
              <p className="text-2xl font-semibold text-gray-900">${pendingAmount.toFixed(2)}</p>
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
              <p className="text-2xl font-semibold text-gray-900">${overdueAmount.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field">
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
          <div>
            <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="input-field">
              <option value="all">All Time</option>
              <option value="last30">Last 30 Days</option>
              <option value="overdue">Overdue Only</option>
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
                        <div className="text-sm font-medium text-gray-900">{invoice.id}</div>
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
                      <div className="text-sm font-medium text-gray-900">${invoice.amount.toFixed(2)}</div>
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
                      <button 
                        onClick={() => handlePrintInvoice(invoice)}
                        className="text-secondary-600 hover:text-secondary-900 mr-4"
                      >
                        <Download className="h-4 w-4 inline mr-1" />
                        PDF
                      </button>
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
                        onClick={() => handleDeleteInvoice(invoice.id, invoice.patientName)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4 inline mr-1" />
                        Delete
                      </button>
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
      />

      {/* View Invoice Modal */}
      {isViewModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4 sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Invoice Details</h2>
                <p className="text-sm text-gray-500">Invoice #{selectedInvoice.id}</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePrintInvoice(selectedInvoice)}
                  className="btn-outline flex items-center"
                  title="Print/Download PDF"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </button>
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

              {/* Service Details */}
              <div className="border-t pt-6">
                <h3 className="text-sm font-medium text-gray-500 mb-4">Service Details</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">{selectedInvoice.serviceName}</p>
                      <p className="text-sm text-gray-600 mt-1">{selectedInvoice.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">${selectedInvoice.amount.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Total */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Total Amount</span>
                  <span className="text-2xl font-bold text-gray-900">${selectedInvoice.amount.toFixed(2)}</span>
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
