import { useEffect, useMemo, useState, type ComponentType } from 'react';
import { Navigate } from 'react-router-dom';
import {
  Users,
  UserCheck,
  Calendar,
  CreditCard,
  TrendingUp,
  Bell,
  Clock,
  Award,
  Heart,
  FileText,
  Star,
  Target,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { analyticsService } from '../services/analytics';
import { appointmentService } from '../services/appointments';
import { phoneReminderService } from '../services/phoneReminders';
import { healthRecordService } from '../services/healthRecords';
import { physiotherapyService } from '../services/physiotherapy';
import { trainingService } from '../services/training';
import { examService } from '../services/exam';
import { notificationService } from '../services/notifications';

type Stat = {
  name: string;
  value: string | number;
  icon: ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
};

type SectionItem = {
  id: string;
  primary: string;
  secondary?: string;
  meta?: string;
  statusLabel?: string;
  statusTone?: 'success' | 'warning' | 'error' | 'info';
};

type Section = {
  title: string;
  icon: ComponentType<{ className?: string }>;
  items: SectionItem[];
  emptyText?: string;
};

interface DashboardState {
  stats: Stat[];
  sections: Section[];
}

const STATUS_TONE_CLASSES: Record<NonNullable<SectionItem['statusTone']>, string> = {
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  error: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800',
};

export default function Dashboard() {
  const { user } = useAuth();
  const role = user?.role?.toLowerCase() ?? 'admin';
  const [state, setState] = useState<DashboardState>({ stats: [], sections: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect biller to their dedicated dashboard
  if (role === 'biller') {
    return <Navigate to="/biller-dashboard" replace />;
  }

  useEffect(() => {
    let ignore = false;

    async function load() {
      if (!user) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const today = new Date().toISOString().split('T')[0];

        // Patient role not supported in current system

        // Biller is redirected to their dedicated dashboard (handled above)
        if (role === 'biller') {
          if (!ignore) {
            setState({ stats: [], sections: [] });
            setLoading(false);
          }
          return;
        }

        if (role === 'nurse') {
          const [appointmentsResponse, notificationsResponse, trainingResponse, certificatesResponse] = await Promise.all([
            appointmentService.getNurseAppointments(user.id, { limit: 50 }),
            notificationService.getNotifications({ limit: 10 }),
            trainingService.getClasses({ limit: 5 }),
            examService.getMyCertificates(),
          ]);

          const appointments = appointmentsResponse.appointments;
          const todaysAppointments = appointments.filter((appointment) => appointment.date === today);
          const assignedPatients = new Set(appointments.map((appointment) => appointment.patientId));
          const nurseNotifications = notificationsResponse.data ?? [];
          const myCertificates = certificatesResponse ?? [];
          const approvedCertificates = myCertificates.filter((certificate) => certificate.status === 'APPROVED');

          const stats: Stat[] = [
            {
              name: "Today's Appointments",
              value: todaysAppointments.length,
            icon: Calendar,
            color: 'text-blue-600',
              bgColor: 'bg-blue-100',
          },
          {
            name: 'Patients Assigned',
              value: assignedPatients.size,
            icon: UserCheck,
            color: 'text-green-600',
              bgColor: 'bg-green-100',
          },
          {
              name: 'Upcoming Visits',
              value: appointments.filter((appointment) => appointment.date >= today).length,
              icon: Clock,
            color: 'text-purple-600',
              bgColor: 'bg-purple-100',
          },
          {
              name: 'Training Sessions',
              value: trainingResponse.classes.length,
            icon: Award,
            color: 'text-orange-600',
              bgColor: 'bg-orange-100',
            },
          {
              name: 'Certificates Earned',
              value: approvedCertificates.length,
            icon: Award,
            color: 'text-indigo-600',
              bgColor: 'bg-indigo-100',
            },
          ];

          const sections: Section[] = [
            {
              title: "Today's Schedule",
              icon: Clock,
              items: todaysAppointments.slice(0, 5).map((appointment) => ({
                id: appointment.id,
                primary: appointment.serviceName,
                secondary: `${appointment.time} • ${appointment.patientName}`,
                meta: appointment.status,
                statusLabel: appointment.status,
                statusTone:
                  appointment.status === 'confirmed'
                    ? 'success'
                    : appointment.status === 'cancelled'
                    ? 'error'
                    : 'warning',
              })),
              emptyText: 'No appointments scheduled today.',
            },
            {
              title: 'Latest Notifications',
              icon: Bell,
              items: nurseNotifications.slice(0, 5).map((notification) => ({
                id: notification.id,
                primary: notification.title,
                secondary: notification.message,
                meta: new Date(notification.date ?? Date.now()).toLocaleString(),
                statusLabel: notification.type,
                statusTone: 'info',
              })),
              emptyText: 'No notifications.',
            },
            {
              title: 'Training Opportunities',
              icon: Award,
              items: trainingResponse.classes.map((trainingClass) => ({
                id: trainingClass.id,
                primary: trainingClass.title,
                secondary: new Date(trainingClass.date).toLocaleDateString(),
                meta: trainingClass.instructor,
              })),
              emptyText: 'No upcoming classes.',
            },
            {
              title: 'Professional Certificates',
              icon: Award,
              items: myCertificates.slice(0, 5).map((certificate) => ({
                id: certificate.id,
                primary: certificate.examTitle ?? 'Training Exam',
                secondary: `Issued ${new Date(certificate.issuedAt).toLocaleDateString()}`,
                meta: certificate.certificateNumber,
                statusLabel: certificate.status === 'APPROVED' ? 'Approved' : 'Pending Approval',
                statusTone: certificate.status === 'APPROVED' ? 'success' : 'warning',
              })),
              emptyText: 'No certificates yet. Complete exams to earn certificates.',
            },
          ];

          if (!ignore) {
            setState({ stats, sections });
          }
          return;
        }

        // Receptionist role
        if (role === 'receptionist') {
          const [dashboardAnalytics, upcomingAppointmentsResponse, notificationsResponse] = await Promise.allSettled([
            analyticsService.getDashboardAnalytics(),
            appointmentService.getAppointments({ limit: 10 }),
            notificationService.getNotifications({ limit: 5 }),
          ]);

          const analytics = dashboardAnalytics.status === 'fulfilled' ? dashboardAnalytics.value : { totalPatients: 0, totalAppointments: 0, todayAppointments: 0, pendingInvoices: 0, upcomingAppointments: [] };
          const appointments = upcomingAppointmentsResponse.status === 'fulfilled' ? upcomingAppointmentsResponse.value : { appointments: [] };
          const notifications = notificationsResponse.status === 'fulfilled' ? notificationsResponse.value : { data: [] };

          const stats: Stat[] = [
            {
              name: 'Total Patients',
              value: analytics.totalPatients ?? analytics.activePatients ?? 0,
              icon: Users,
              color: 'text-blue-600',
              bgColor: 'bg-blue-100',
            },
            {
              name: 'Active Patients',
              value: analytics.activePatients ?? analytics.totalPatients ?? 0,
              icon: UserCheck,
              color: 'text-indigo-600',
              bgColor: 'bg-indigo-100',
            },
            {
              name: 'Today\'s Appointments',
              value: analytics.todayAppointments ?? 0,
              icon: Calendar,
              color: 'text-purple-600',
              bgColor: 'bg-purple-100',
            },
            {
              name: 'Total Appointments',
              value: analytics.totalAppointments ?? 0,
              icon: Clock,
              color: 'text-green-600',
              bgColor: 'bg-green-100',
            },
            {
              name: 'Pending Invoices',
              value: analytics.pendingInvoices ?? 0,
              icon: CreditCard,
              color: 'text-orange-600',
              bgColor: 'bg-orange-100',
            },
          ];

          const sections: Section[] = [
            {
              title: 'Upcoming Appointments',
              icon: Clock,
              items: (analytics.upcomingAppointments ?? []).slice(0, 5).map((appointment: any) => ({
                id: appointment.id,
                primary: appointment.service?.name ?? 'Appointment',
                secondary: `${appointment.patient?.name ?? 'Unknown'} • ${new Date(appointment.date).toLocaleDateString()}`,
                meta: appointment.status,
                statusLabel: appointment.status,
                statusTone: appointment.status === 'CANCELLED' ? 'error' : appointment.status === 'CONFIRMED' ? 'success' : 'warning',
              })),
              emptyText: 'No upcoming appointments.',
            },
            {
              title: 'Recent Appointments',
              icon: Calendar,
              items: appointments.appointments.slice(0, 5).map((appointment: any) => ({
                id: appointment.id,
                primary: appointment.serviceName ?? 'Appointment',
                secondary: `${appointment.patientName ?? 'Unknown'} • ${appointment.date ?? ''} ${appointment.time ?? ''}`,
                meta: appointment.status,
                statusLabel: appointment.status,
                statusTone: appointment.status === 'cancelled' ? 'error' : appointment.status === 'confirmed' ? 'success' : 'warning',
              })),
              emptyText: 'No recent appointments.',
            },
            {
              title: 'Announcements',
              icon: Bell,
              items: (notifications.data ?? []).slice(0, 5).map((notification: any) => ({
                id: notification.id,
                primary: notification.title,
                secondary: notification.message,
                meta: new Date(notification.date ?? Date.now()).toLocaleString(),
              })),
              emptyText: 'No announcements available.',
            },
          ];

          if (!ignore) {
            setState({ stats, sections });
          }
          return;
        }

        // Doctor role
        if (role === 'doctor') {
          const [dashboardAnalytics, notificationsResponse] = await Promise.allSettled([
            analyticsService.getDashboardAnalytics(),
            notificationService.getNotifications({ limit: 5 }),
          ]);

          const analytics = dashboardAnalytics.status === 'fulfilled' ? dashboardAnalytics.value : { assignedPatients: 0, totalAppointments: 0, todayAppointments: 0, pendingReferrals: 0, recentPatients: [] };
          const notifications = notificationsResponse.status === 'fulfilled' ? notificationsResponse.value : { data: [] };

          const stats: Stat[] = [
            {
              name: 'Assigned Patients',
              value: analytics.assignedPatients ?? 0,
              icon: Users,
              color: 'text-blue-600',
              bgColor: 'bg-blue-100',
            },
            {
              name: 'Today\'s Appointments',
              value: analytics.todayAppointments ?? 0,
              icon: Calendar,
              color: 'text-purple-600',
              bgColor: 'bg-purple-100',
            },
            {
              name: 'Total Appointments',
              value: analytics.totalAppointments ?? 0,
              icon: Clock,
              color: 'text-green-600',
              bgColor: 'bg-green-100',
            },
            {
              name: 'Pending Referrals',
              value: analytics.pendingReferrals ?? 0,
              icon: FileText,
              color: 'text-orange-600',
              bgColor: 'bg-orange-100',
            },
          ];

          const sections: Section[] = [
            {
              title: 'Recent Patients',
              icon: Users,
              items: (analytics.recentPatients ?? []).slice(0, 5).map((patient: any) => ({
                id: patient.id,
                primary: patient.name,
                secondary: patient.condition ?? 'No condition specified',
                meta: patient.status,
                statusLabel: patient.status,
                statusTone: patient.status === 'ACTIVE' ? 'success' : 'info',
              })),
              emptyText: 'No patients assigned.',
            },
            {
              title: 'Announcements',
              icon: Bell,
              items: (notifications.data ?? []).slice(0, 5).map((notification: any) => ({
                id: notification.id,
                primary: notification.title,
                secondary: notification.message,
                meta: new Date(notification.date ?? Date.now()).toLocaleString(),
              })),
              emptyText: 'No announcements available.',
            },
          ];

          if (!ignore) {
            setState({ stats, sections });
          }
          return;
        }

        // Specialist role
        if (role === 'specialist') {
          const [dashboardAnalytics, notificationsResponse] = await Promise.allSettled([
            analyticsService.getDashboardAnalytics(),
            notificationService.getNotifications({ limit: 5 }),
          ]);

          const analytics = dashboardAnalytics.status === 'fulfilled' ? dashboardAnalytics.value : { assignedPatients: 0, totalAppointments: 0, todayAppointments: 0, readyForDischarge: 0, recentPatients: [] };
          const notifications = notificationsResponse.status === 'fulfilled' ? notificationsResponse.value : { data: [] };

          const stats: Stat[] = [
            {
              name: 'Assigned Patients',
              value: analytics.assignedPatients ?? 0,
              icon: Users,
              color: 'text-blue-600',
              bgColor: 'bg-blue-100',
            },
            {
              name: 'Today\'s Appointments',
              value: analytics.todayAppointments ?? 0,
              icon: Calendar,
              color: 'text-purple-600',
              bgColor: 'bg-purple-100',
            },
            {
              name: 'Total Appointments',
              value: analytics.totalAppointments ?? 0,
              icon: Clock,
              color: 'text-green-600',
              bgColor: 'bg-green-100',
            },
            {
              name: 'Ready for Discharge',
              value: analytics.readyForDischarge ?? 0,
              icon: Target,
              color: 'text-orange-600',
              bgColor: 'bg-orange-100',
            },
          ];

          const sections: Section[] = [
            {
              title: 'Recent Patients',
              icon: Users,
              items: (analytics.recentPatients ?? []).slice(0, 5).map((patient: any) => ({
                id: patient.id,
                primary: patient.name,
                secondary: patient.condition ?? 'No condition specified',
                meta: patient.status,
                statusLabel: patient.status,
                statusTone: patient.status === 'ACTIVE' ? 'success' : 'info',
              })),
              emptyText: 'No patients referred.',
            },
            {
              title: 'Announcements',
              icon: Bell,
              items: (notifications.data ?? []).slice(0, 5).map((notification: any) => ({
                id: notification.id,
                primary: notification.title,
                secondary: notification.message,
                meta: new Date(notification.date ?? Date.now()).toLocaleString(),
              })),
              emptyText: 'No announcements available.',
            },
          ];

          if (!ignore) {
            setState({ stats, sections });
          }
          return;
        }

        // Admin (default)
        const [dashboardAnalytics, upcomingAppointmentsResponse, remindersResponse, notificationsResponse] = await Promise.allSettled([
          analyticsService.getDashboardAnalytics(),
          appointmentService.getAppointments({ limit: 10 }),
          phoneReminderService.getReminders({ limit: 10 }),
          notificationService.getNotifications({ limit: 5 }),
        ]);

        // Handle results with fallbacks for failed requests
        const analytics = dashboardAnalytics.status === 'fulfilled' ? dashboardAnalytics.value : { totalPatients: 0, totalAppointments: 0, totalNurses: 0, totalRevenue: 0, recentAppointments: [] };
        const appointments = upcomingAppointmentsResponse.status === 'fulfilled' ? upcomingAppointmentsResponse.value : { appointments: [] };
        const reminders = remindersResponse.status === 'fulfilled' ? remindersResponse.value : { reminders: [] };
        const notifications = notificationsResponse.status === 'fulfilled' ? notificationsResponse.value : { data: [] };
        
        const adminNotifications = notifications.data ?? [];

        const stats: Stat[] = [
          {
            name: 'Total Patients',
            value: analytics.totalPatients ?? 0,
            icon: Users,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100',
          },
          {
            name: 'Total Appointments',
            value: analytics.totalAppointments ?? 0,
            icon: Calendar,
            color: 'text-purple-600',
            bgColor: 'bg-purple-100',
          },
          {
            name: 'Active Nurses',
            value: analytics.totalNurses ?? 0,
            icon: UserCheck,
            color: 'text-green-600',
            bgColor: 'bg-green-100',
          },
          {
            name: 'Total Revenue',
            value: `$${(analytics.totalRevenue ?? 0).toLocaleString()}`,
            icon: CreditCard,
            color: 'text-orange-600',
            bgColor: 'bg-orange-100',
          },
        ];

        const sections: Section[] = [
          {
            title: 'Recent Appointments',
            icon: Calendar,
            items: (analytics.recentAppointments ?? []).slice(0, 5).map((appointment: any) => ({
              id: appointment.id,
              primary: appointment.service?.name ?? 'Appointment',
              secondary: `${appointment.patient?.name ?? 'Unknown patient'} • ${new Date(appointment.date).toLocaleDateString()}`,
              meta: appointment.status,
              statusLabel: appointment.status,
              statusTone: appointment.status === 'CANCELLED' ? 'error' : 'info',
            })),
            emptyText: 'No recent appointments.',
          },
          {
            title: 'Upcoming Appointments',
            icon: Clock,
            items: appointments.appointments.slice(0, 5).map((appointment) => ({
              id: appointment.id,
              primary: appointment.serviceName,
              secondary: `${appointment.patientName} • ${appointment.date} ${appointment.time}`,
              meta: appointment.status,
              statusLabel: appointment.status,
              statusTone:
                appointment.status === 'cancelled'
                  ? 'error'
                  : appointment.status === 'confirmed'
                  ? 'success'
                  : 'warning',
            })),
            emptyText: 'No upcoming appointments.',
          },
          {
            title: 'Latest Reminders',
            icon: Bell,
            items: reminders.reminders.slice(0, 5).map((reminder) => ({
              id: reminder.id,
              primary: reminder.title,
              secondary: `${reminder.patientName} • ${new Date(reminder.scheduledTime).toLocaleString()}`,
              meta: reminder.status,
              statusLabel: reminder.priority,
              statusTone:
                reminder.priority === 'urgent'
                  ? 'error'
                  : reminder.priority === 'high'
                  ? 'warning'
                  : 'info',
            })),
            emptyText: 'No reminders scheduled.',
          },
          {
            title: 'Announcements',
            icon: TrendingUp,
            items: adminNotifications.slice(0, 5).map((notification) => ({
              id: notification.id,
              primary: notification.title,
              secondary: notification.message,
              meta: new Date(notification.date ?? Date.now()).toLocaleString(),
            })),
            emptyText: 'No announcements available.',
          },
        ];

        if (!ignore) {
          setState({ stats, sections });
        }
      } catch (err: any) {
        if (!ignore) {
          setError(err?.message ?? 'Something went wrong while loading the dashboard.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [role, user]);

  const header = useMemo(() => {
    switch (role) {
      case 'nurse':
        return {
          title: 'Nurse Dashboard',
          subtitle: 'Manage your patients and schedule',
        };
      case 'receptionist':
        return {
          title: 'Receptionist Dashboard',
          subtitle: 'Manage patients, appointments, and billing',
        };
      case 'doctor':
        return {
          title: 'Doctor Dashboard',
          subtitle: 'Review patients and manage referrals',
        };
      case 'specialist':
        return {
          title: 'Specialist Dashboard',
          subtitle: 'Treat patients and prepare for discharge',
        };
      case 'biller':
        return {
          title: 'Biller Dashboard',
          subtitle: 'Manage patient bills and payments',
        };
      default:
        return {
          title: 'Admin Dashboard',
          subtitle: 'Monitor system performance and operations',
        };
    }
  }, [role]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{header.title}</h1>
          <p className="mt-1 text-sm text-gray-600">{header.subtitle}</p>
        </div>
        <div className="card text-sm text-gray-500">Loading dashboard data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{header.title}</h1>
          <p className="mt-1 text-sm text-gray-600">{header.subtitle}</p>
        </div>
        <div className="card text-sm text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{header.title}</h1>
        <p className="mt-1 text-sm text-gray-600">{header.subtitle}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {state.stats.map((stat) => (
          <div key={stat.name} className="card">
            <div className="flex items-center">
              <div className={`flex-shrink-0 p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Sections */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {state.sections.map((section) => (
          <div key={section.title} className="lg:col-span-1">
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">{section.title}</h3>
                <section.icon className="h-5 w-5 text-primary-500" />
              </div>
              {section.items.length === 0 ? (
                <p className="text-sm text-gray-500">{section.emptyText ?? 'No data available.'}</p>
              ) : (
                <div className="space-y-3">
                  {section.items.map((item) => (
                    <div key={item.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.primary}</p>
                        {item.secondary && (
                          <p className="text-xs text-gray-600 truncate">{item.secondary}</p>
                        )}
                        {item.meta && (
                          <p className="text-xs text-gray-500 truncate">{item.meta}</p>
                        )}
                      </div>
                      {item.statusLabel && item.statusTone && (
                        <span className={`ml-3 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          STATUS_TONE_CLASSES[item.statusTone]
                        }`}>
                          {item.statusLabel}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            </div>
          ))}
      </div>
    </div>
  );
}
