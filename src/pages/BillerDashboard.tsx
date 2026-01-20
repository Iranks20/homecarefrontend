import { useMemo, useState } from 'react';
import {
  DollarSign,
  Users,
  CreditCard,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Search,
  Eye,
  FileText,
} from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { patientService } from '../services/patients';
import servicesService from '../services/services';
import { billingService } from '../services/billing';
import { Patient, Service, Invoice } from '../types';
import { Link } from 'react-router-dom';

interface PatientBill {
  patient: Patient;
  services: Service[];
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  invoices: Invoice[];
}

export default function BillerDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'paid' | 'overdue'>('all');

  const { data: patientsData, loading: loadingPatients } = useApi(
    () => patientService.getPatients({ limit: 500 }),
    []
  );

  const { data: servicesData, loading: loadingServices } = useApi(
    () => servicesService.getServices({ limit: 500 }),
    []
  );

  const { data: invoicesData, loading: loadingInvoices } = useApi(
    () => billingService.getInvoices({ limit: 500 }),
    []
  );

  const patients = patientsData?.patients ?? [];
  const services = servicesData?.services ?? [];
  const invoices = invoicesData?.invoices ?? [];

  // Calculate patient bills based on their selected services
  const patientBills: PatientBill[] = useMemo(() => {
    return patients
      .filter((patient) => {
        const hasServices = (patient as any).serviceIds && (patient as any).serviceIds.length > 0;
        return hasServices;
      })
      .map((patient) => {
        const serviceIds = (patient as any).serviceIds || [];
        const patientServices = services.filter((service) => serviceIds.includes(service.id));
        
        // Get invoices for this patient
        const patientInvoices = invoices.filter((invoice) => invoice.patientId === patient.id);
        
        // Calculate amounts
        const totalAmount = patientServices.reduce((sum, service) => sum + (service.price || 0), 0);
        const paidAmount = patientInvoices
          .filter((inv) => inv.status === 'paid')
          .reduce((sum, inv) => sum + inv.amount, 0);
        const pendingAmount = totalAmount - paidAmount;

        return {
          patient,
          services: patientServices,
          totalAmount,
          paidAmount,
          pendingAmount,
          invoices: patientInvoices,
        };
      });
  }, [patients, services, invoices]);

  // Filter bills based on search and status
  const filteredBills = useMemo(() => {
    return patientBills.filter((bill) => {
      const matchesSearch =
        bill.patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.patient.phone.toLowerCase().includes(searchTerm.toLowerCase());

      let matchesStatus = true;
      if (statusFilter === 'pending') {
        matchesStatus = bill.pendingAmount > 0;
      } else if (statusFilter === 'paid') {
        matchesStatus = bill.pendingAmount === 0 && bill.totalAmount > 0;
      } else if (statusFilter === 'overdue') {
        matchesStatus = bill.invoices.some((inv) => inv.status === 'overdue');
      }

      return matchesSearch && matchesStatus;
    });
  }, [patientBills, searchTerm, statusFilter]);

  // Calculate summary statistics
  const stats = useMemo(() => {
    const totalPatients = patientBills.length;
    const totalRevenue = patientBills.reduce((sum, bill) => sum + bill.totalAmount, 0);
    const totalPaid = patientBills.reduce((sum, bill) => sum + bill.paidAmount, 0);
    const totalPending = patientBills.reduce((sum, bill) => sum + bill.pendingAmount, 0);
    const overdueCount = patientBills.filter((bill) =>
      bill.invoices.some((inv) => inv.status === 'overdue')
    ).length;

    return {
      totalPatients,
      totalRevenue,
      totalPaid,
      totalPending,
      overdueCount,
    };
  }, [patientBills]);

  const loading = loadingPatients || loadingServices || loadingInvoices;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Biller Dashboard</h1>
        <p className="text-sm text-gray-600 mt-1">
          Manage patient bills and payments based on selected services
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Patients</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalPatients}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                ${stats.totalRevenue.toFixed(2)}
              </p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Paid Amount</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                ${stats.totalPaid.toFixed(2)}
              </p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Amount</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">
                ${stats.totalPending.toFixed(2)}
              </p>
            </div>
            <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Overdue Bills</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{stats.overdueCount}</p>
            </div>
            <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search patients by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="md:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>
      </div>

      {/* Patient Bills Table */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Patient Bills</h2>
          <p className="text-sm text-gray-600 mt-1">
            {filteredBills.length} {filteredBills.length === 1 ? 'patient' : 'patients'} found
          </p>
        </div>

        {filteredBills.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">No patient bills found</p>
            <p className="text-sm text-gray-500 mt-1">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'Patients with selected services will appear here'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Services
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paid
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pending
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBills.map((bill) => {
                  const isOverdue = bill.invoices.some((inv) => inv.status === 'overdue');
                  const isPaid = bill.pendingAmount === 0 && bill.totalAmount > 0;
                  const isPending = bill.pendingAmount > 0 && !isOverdue;

                  return (
                    <tr key={bill.patient.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {bill.patient.name}
                          </div>
                          <div className="text-sm text-gray-500">{bill.patient.email}</div>
                          <div className="text-xs text-gray-400">{bill.patient.phone}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {bill.services.length} {bill.services.length === 1 ? 'service' : 'services'}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {bill.services.slice(0, 2).map((s) => s.name).join(', ')}
                          {bill.services.length > 2 && ` +${bill.services.length - 2} more`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          ${bill.totalAmount.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-green-600 font-medium">
                          ${bill.paidAmount.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-yellow-600 font-medium">
                          ${bill.pendingAmount.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            isOverdue
                              ? 'bg-red-100 text-red-800'
                              : isPaid
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {isOverdue ? 'Overdue' : isPaid ? 'Paid' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          to={`/patients/${bill.patient.id}`}
                          className="text-primary-600 hover:text-primary-900 mr-4"
                        >
                          <Eye className="h-5 w-5 inline" />
                        </Link>
                        <Link
                          to="/billing"
                          className="text-primary-600 hover:text-primary-900"
                          onClick={() => {
                            // Could add state to filter billing page by patient
                          }}
                        >
                          <CreditCard className="h-5 w-5 inline" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
