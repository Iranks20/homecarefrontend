import { useMemo, useState } from 'react';
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, Edit3 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useApi, useApiMutation } from '../hooks/useApi';
import patientService from '../services/patients';
import { appointmentService } from '../services/appointments';
import { useNotifications } from '../contexts/NotificationContext';
import { Appointment } from '../types';

type FilterKey = 'all' | 'upcoming' | 'completed' | 'cancelled';

const UPCOMING_STATUSES: Appointment['status'][] = [
  'scheduled',
  'confirmed',
  'in-progress',
  'rescheduled',
];

export default function MyAppointments() {
  const [filter, setFilter] = useState<FilterKey>('all');
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  const {
    data: patientLookup,
    loading: loadingPatient,
  } = useApi(
    () =>
      user?.email
        ? patientService.getPatients({ query: user.email, limit: 1 })
        : Promise.resolve({ patients: [] }),
    [user?.email]
  );

  const patientRecord = patientLookup?.patients?.[0] ?? null;

  const {
    data: appointmentsData,
    loading: loadingAppointments,
    error,
    refetch,
  } = useApi(
    () =>
      patientRecord
        ? appointmentService.getPatientAppointments(patientRecord.id, { limit: 100 })
        : Promise.resolve({ appointments: [] }),
    [patientRecord?.id]
  );

  const cancelAppointmentMutation = useApiMutation(
    (params: { id: string; reason?: string }) =>
      appointmentService.cancelAppointment(params.id, params.reason)
  );

  const appointments = appointmentsData?.appointments ?? [];

  const filteredAppointments = useMemo(() => {
    switch (filter) {
      case 'upcoming':
        return appointments.filter((appointment) => UPCOMING_STATUSES.includes(appointment.status));
      case 'completed':
        return appointments.filter((appointment) => appointment.status === 'completed');
      case 'cancelled':
        return appointments.filter((appointment) => appointment.status === 'cancelled' || appointment.status === 'no-show');
      default:
        return appointments;
    }
  }, [appointments, filter]);

  const getStatusIcon = (status: Appointment['status']) => {
    switch (status) {
      case 'confirmed':
      case 'in-progress':
      case 'scheduled':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'cancelled':
      case 'no-show':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: Appointment['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
      case 'no-show':
        return 'bg-red-100 text-red-800';
      case 'confirmed':
      case 'in-progress':
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800';
      case 'rescheduled':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const formatTime = (timeString: string) =>
    new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

  const handleCancelAppointment = async (appointment: Appointment) => {
    if (!window.confirm(`Cancel appointment for ${appointment.patientName} on ${formatDate(appointment.date)}?`)) {
      return;
    }

    try {
      await cancelAppointmentMutation.mutate({ id: appointment.id, reason: 'Cancelled by patient' });
      addNotification({
        title: 'Appointment Cancelled',
        message: `${appointment.serviceName} has been cancelled.`,
        type: 'info',
        userId: user?.id ?? 'system',
        priority: 'medium',
        category: 'appointment',
      });
      await refetch();
    } catch (err: any) {
      addNotification({
        title: 'Unable to cancel appointment',
        message: err?.message ?? 'Please try again later.',
        type: 'error',
        userId: user?.id ?? 'system',
        priority: 'high',
        category: 'system',
      });
    }
  };

  if (loadingPatient || loadingAppointments) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="card text-center py-12 text-sm text-gray-500">Loading appointments…</div>
      </div>
    );
  }

  if (!patientRecord) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="card text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No patient profile found</h2>
          <p className="text-gray-600">
            We couldn&apos;t locate a patient record associated with your account. Please contact support to continue.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="card text-center py-12 text-sm text-red-500">
          Unable to load your appointments. Please try again later.
        </div>
      </div>
    );
  }
 
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Appointments</h1>
        <p className="text-gray-600">Manage your scheduled healthcare appointments</p>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              {
                key: 'all',
                label: 'All Appointments',
                count: appointments.length,
              },
              {
                key: 'upcoming',
                label: 'Upcoming',
                count: appointments.filter((appointment) => UPCOMING_STATUSES.includes(appointment.status)).length,
              },
              {
                key: 'completed',
                label: 'Completed',
                count: appointments.filter((appointment) => appointment.status === 'completed').length,
              },
              {
                key: 'cancelled',
                label: 'Cancelled',
                count: appointments.filter((appointment) =>
                  ['cancelled', 'no-show'].includes(appointment.status)
                ).length,
              },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  filter === tab.key
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                  filter === tab.key
                    ? 'bg-primary-100 text-primary-600'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Appointments List */}
      <div className="space-y-4">
        {filteredAppointments.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments found</h3>
            <p className="text-gray-600">You don&apos;t have any appointments matching your current filter.</p>
          </div>
        ) : (
          filteredAppointments.map((appointment) => (
            <div key={appointment.id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-3">
                    {getStatusIcon(appointment.status)}
                    <span
                      className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}
                    >
                      {appointment.status.replace('-', ' ').replace(/ \w/g, (c) => c.toUpperCase())}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">{appointment.serviceName}</h3>
                      <p className="text-sm text-gray-600">
                        {appointment.specialistName && `Specialist: ${appointment.specialistName}`}
                      </p>
                      <p className="text-sm text-gray-600">
                        {appointment.nurseName && `Nurse: ${appointment.nurseName}`}
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center text-sm text-gray-600 mb-1">
                        <Calendar className="h-4 w-4 mr-2" />
                        {formatDate(appointment.date)}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="h-4 w-4 mr-2" />
                        {formatTime(appointment.time)}
                      </div>
                    </div>

                    <div>
                      <div className="text-sm text-gray-600 mb-1">
                        <strong>Duration:</strong> {appointment.duration} minutes
                      </div>
                      {appointment.notes && (
                        <div className="text-sm text-gray-600 truncate">
                          <strong>Notes:</strong> {appointment.notes}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="ml-4 flex flex-col space-y-2">
                  {UPCOMING_STATUSES.includes(appointment.status) && (
                    <>
                      <button className="btn-outline text-sm py-1 px-3" disabled>
                        <Edit3 className="h-3 w-3 mr-1" />
                        Reschedule
                      </button>
                      <button
                        className="text-red-600 hover:text-red-700 text-sm py-1 px-3 border border-red-300 rounded hover:bg-red-50"
                        onClick={() => handleCancelAppointment(appointment)}
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 flex justify-center">
        <button className="btn-primary">
          <Calendar className="h-4 w-4 mr-2" />
          Book New Appointment
        </button>
      </div>
    </div>
  );
}

