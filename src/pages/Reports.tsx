import { useMemo, useState } from 'react';
import {
  Download,
  Calendar,
  TrendingUp,
  Users,
  DollarSign,
  Activity,
  Loader2,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import { useApi } from '../hooks/useApi';
import { analyticsService } from '../services/analytics';
import { reportsService } from '../services/reports';
import { Invoice, Payment } from '../types';

function formatMonthLabel(dateValue: string | Date): { label: string; timestamp: number } {
  const date = new Date(dateValue);
  const label = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
  return { label, timestamp: date.getTime() };
}

function sumInvoicesByMonth(invoices: Invoice[] = []): Map<string, { outstanding: number; timestamp: number }> {
  const map = new Map<string, { outstanding: number; timestamp: number }>();
  invoices.forEach((invoice) => {
    const sourceDate = invoice.dueDate ?? invoice.date ?? invoice.createdAt ?? new Date().toISOString();
    const { label, timestamp } = formatMonthLabel(sourceDate);
    const entry = map.get(label) ?? { outstanding: 0, timestamp };
    entry.outstanding += invoice.amount;
    entry.timestamp = timestamp;
    map.set(label, entry);
  });
  return map;
}

function aggregatePaymentsByMonth(payments: Payment[] = []): Map<string, { revenue: number; timestamp: number }> {
  const map = new Map<string, { revenue: number; timestamp: number }>();
  payments.forEach((payment) => {
    const sourceDate = payment.date ?? payment.createdAt ?? new Date().toISOString();
    const { label, timestamp } = formatMonthLabel(sourceDate);
    const entry = map.get(label) ?? { revenue: 0, timestamp };
    entry.revenue += payment.amount;
    entry.timestamp = timestamp;
    map.set(label, entry);
  });
  return map;
}

type TrendEntry = { createdAt?: string; date?: string; _count?: number; _sum?: { amount?: number } };

function aggregateTrends(
  patients: TrendEntry[] = [],
  appointments: TrendEntry[] = [],
  revenue: TrendEntry[] = []
) {
  const map = new Map<
    string,
    { label: string; timestamp: number; patients: number; appointments: number; revenue: number }
  >();

  const addValue = (
    entries: TrendEntry[],
    updater: (
      entry: {
        label: string;
        timestamp: number;
        patients: number;
        appointments: number;
        revenue: number;
      },
      source: TrendEntry
    ) => void
  ) => {
    entries.forEach((item) => {
      const sourceDate = item.createdAt ?? item.date ?? new Date().toISOString();
      const { label, timestamp } = formatMonthLabel(sourceDate);
      const aggregate =
        map.get(label) ?? { label, timestamp, patients: 0, appointments: 0, revenue: 0 };
      updater(aggregate, item);
      aggregate.timestamp = timestamp;
      map.set(label, aggregate);
    });
  };

  addValue(patients, (aggregate, item) => {
    const count = typeof item._count === 'number' ? item._count : 1;
    aggregate.patients += count;
  });

  addValue(appointments, (aggregate, item) => {
    const count = typeof item._count === 'number' ? item._count : 1;
    aggregate.appointments += count;
  });

  addValue(revenue, (aggregate, item) => {
    const amount = item._sum?.amount ?? 0;
    aggregate.revenue += amount;
  });

  return Array.from(map.values())
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(-6);
}

const COLORS = ['#0D6EFD', '#20B486', '#6F42C1', '#FD7E14', '#DC3545', '#20C997'];

export default function Reports() {
  const [dateRange, setDateRange] = useState('last30');

  const {
    data: overview,
    loading: overviewLoading,
  } = useApi(() => analyticsService.getOverview(), []);

  const {
    data: trends,
    loading: trendsLoading,
  } = useApi(() => analyticsService.getTrends(), []);

  const {
    data: performance,
    loading: performanceLoading,
  } = useApi(() => analyticsService.getPerformance(), []);

  const {
    data: servicePopularity,
    loading: popularityLoading,
  } = useApi(() => analyticsService.getServicePopularity(), []);

  const {
    data: appointmentAnalytics,
    loading: appointmentLoading,
  } = useApi(() => analyticsService.getAppointmentAnalytics(), []);

  const {
    data: revenueReport,
    loading: revenueLoading,
  } = useApi(() => reportsService.getRevenueReport(), []);

  const {
    data: nurseUtilization,
    loading: nurseLoading,
  } = useApi(() => reportsService.getNurseUtilizationReport(), []);

  const {
    data: patientSatisfaction,
    loading: satisfactionLoading,
  } = useApi(() => reportsService.getPatientSatisfactionReport(), []);

  const loadingState =
    overviewLoading ||
    trendsLoading ||
    performanceLoading ||
    popularityLoading ||
    appointmentLoading ||
    revenueLoading ||
    nurseLoading ||
    satisfactionLoading;

  const monthlyAggregates = useMemo(() => {
    return aggregateTrends(
      trends?.patients ?? [],
      trends?.appointments ?? [],
      trends?.revenue ?? []
    );
  }, [trends]);

  const revenueSeries = useMemo(() => {
    const paymentMap = aggregatePaymentsByMonth(revenueReport?.payments);
    const invoiceMap = sumInvoicesByMonth(revenueReport?.pendingInvoices);

    const combined = new Map<string, { label: string; timestamp: number; revenue: number; outstanding: number }>();

    paymentMap.forEach((value, key) => {
      combined.set(key, {
        label: key,
        timestamp: value.timestamp,
        revenue: value.revenue,
        outstanding: 0,
      });
    });

    invoiceMap.forEach((value, key) => {
      const existing = combined.get(key);
      if (existing) {
        existing.outstanding = value.outstanding;
      } else {
        combined.set(key, {
          label: key,
          timestamp: value.timestamp,
          revenue: 0,
          outstanding: value.outstanding,
        });
      }
    });

    return Array.from(combined.values())
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-6);
  }, [revenueReport]);

  const serviceDistributionData = useMemo(() => {
    return (servicePopularity ?? []).map((entry: any, index: number) => {
      const count =
        typeof entry.count === 'number'
          ? entry.count
          : (entry.count as { serviceId?: number })?.serviceId ?? 0;
      return {
        name: entry.service?.name ?? `Service ${index + 1}`,
        value: count,
      };
    });
  }, [servicePopularity]);

  const appointmentStatusData = useMemo(() => {
    return (appointmentAnalytics?.byStatus ?? []).map((statusEntry: any) => {
      const status = (statusEntry.status ?? 'unknown').toString().toLowerCase();
      const label = status
        .split('-')
        .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');

      const count = typeof statusEntry._count === 'number'
        ? statusEntry._count
        : (statusEntry._count as Record<string, number>)?.status ?? 0;

      return {
        status: label,
        count,
      };
    });
  }, [appointmentAnalytics]);

  const topNurses = useMemo(() => {
    return (nurseUtilization ?? [])
      .filter((item) => item?.nurse)
      .sort((a, b) => (b.appointmentCount ?? 0) - (a.appointmentCount ?? 0))
      .slice(0, 3)
      .map((item) => ({
        name: item.nurse.name,
        appointments: item.appointmentCount,
        utilization: item.utilization,
      }));
  }, [nurseUtilization]);

  const mostRequestedServices = useMemo(() => {
    return (servicePopularity ?? [])
      .map((entry: any) => {
        const count =
          typeof entry.count === 'number'
            ? entry.count
            : (entry.count as { serviceId?: number })?.serviceId ?? 0;
        return {
          name: entry.service?.name ?? 'Service',
          requests: count,
        };
      })
      .sort((a: any, b: any) => b.requests - a.requests)
      .slice(0, 3);
  }, [servicePopularity]);

  const keyInsights = useMemo(() => {
    const insights: string[] = [];
    if (patientSatisfaction?.averageRating) {
      insights.push(`Average patient satisfaction is ${patientSatisfaction.averageRating.toFixed(1)}/5.`);
    }
    if (performance?.completedRate) {
      insights.push(`Appointment completion rate at ${performance.completedRate.toFixed(0)}%.`);
    }
    if (revenueReport?.totalRevenue) {
      insights.push(`Completed payments total $${revenueReport.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}.`);
    }
    return insights;
  }, [patientSatisfaction, performance, revenueReport]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="mt-1 text-sm text-gray-600">Comprehensive insights into your homecare operations</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-2">
          <select
            value={dateRange}
            onChange={(event) => setDateRange(event.target.value)}
            className="input-field"
          >
            <option value="last7">Last 7 Days</option>
            <option value="last30">Last 30 Days</option>
            <option value="last90">Last 90 Days</option>
            <option value="lastyear">Last Year</option>
          </select>
          <button className="btn-primary">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </button>
        </div>
      </div>

      {loadingState && (
        <div className="card flex items-center justify-center py-12 text-gray-500">
          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
          Loading analytics...
        </div>
      )}

      {!loadingState && (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="card">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-3 rounded-lg bg-blue-100">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Patients</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {overview?.totalPatients?.toLocaleString() ?? '0'}
                  </p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-3 rounded-lg bg-green-100">
                  <Activity className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Appointments</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {overview?.totalAppointments?.toLocaleString() ?? '0'}
                  </p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-3 rounded-lg bg-purple-100">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Nurses</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {overview?.totalNurses?.toLocaleString() ?? '0'}
                  </p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-3 rounded-lg bg-orange-100">
                  <DollarSign className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    ${overview?.totalRevenue?.toLocaleString() ?? '0'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Patients & Appointments Trend</h3>
                <TrendingUp className="h-5 w-5 text-primary-500" />
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyAggregates}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="patients"
                      stroke="#0D6EFD"
                      strokeWidth={2}
                      name="New Patients"
                    />
                    <Line
                      type="monotone"
                      dataKey="appointments"
                      stroke="#20B486"
                      strokeWidth={2}
                      name="Appointments"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Revenue vs Outstanding</h3>
                <DollarSign className="h-5 w-5 text-green-500" />
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueSeries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, '']} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stackId="1"
                      stroke="#20B486"
                      fill="#20B486"
                      fillOpacity={0.6}
                      name="Payments"
                    />
                    <Area
                      type="monotone"
                      dataKey="outstanding"
                      stackId="2"
                      stroke="#DC3545"
                      fill="#DC3545"
                      fillOpacity={0.6}
                      name="Pending Invoices"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Appointment Status Breakdown</h3>
                <Calendar className="h-5 w-5 text-blue-500" />
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={appointmentStatusData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="status" interval={0} angle={-20} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#0D6EFD" name="Appointments" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Service Distribution</h3>
                <Activity className="h-5 w-5 text-purple-500" />
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={serviceDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {serviceDistributionData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Top Performing Nurses</h3>
              <div className="space-y-3">
                {topNurses.map((nurse, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{nurse.name}</p>
                      <p className="text-xs text-gray-600">{nurse.appointments} appointments</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {nurse.utilization?.toFixed?.(0) ?? 0}%
                      </p>
                      <p className="text-xs text-gray-600">utilization</p>
                    </div>
                  </div>
                ))}
                {topNurses.length === 0 && (
                  <p className="text-sm text-gray-500">No nurse analytics available.</p>
                )}
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Most Requested Services</h3>
              <div className="space-y-3">
                {mostRequestedServices.map((service: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{service.name}</p>
                      <p className="text-xs text-gray-600">{service.requests} requests</p>
                    </div>
                  </div>
                ))}
                {mostRequestedServices.length === 0 && (
                  <p className="text-sm text-gray-500">No service popularity data available.</p>
                )}
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Key Insights</h3>
              <div className="space-y-3">
                {keyInsights.length > 0 ? (
                  keyInsights.map((insight, index) => (
                    <div
                      key={index}
                      className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800"
                    >
                      {insight}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No insights available yet.</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
