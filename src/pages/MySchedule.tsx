import { useMemo, useState } from 'react';
import { Calendar, Clock, User, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useApi } from '../hooks/useApi';
import { appointmentService } from '../services/appointments';

export default function MySchedule() {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const { user } = useAuth();
  const role = user?.role ?? 'nurse';

  const fetchAppointments = useMemo(
    () => async () => {
      if (!user) {
        return { appointments: [] };
      }

      switch (role) {
        case 'nurse':
          return appointmentService.getNurseAppointments(user.id, { limit: 200 });
        case 'specialist':
          return appointmentService.getSpecialistAppointments(user.id, { limit: 200 });
        default:
          return appointmentService.getAppointments({ limit: 200 });
      }
    },
    [role, user]
  );

  const {
    data: appointmentsData,
    loading,
    error,
  } = useApi(fetchAppointments, [fetchAppointments]);

  const appointments = appointmentsData?.appointments ?? [];

  const getAppointmentsForDate = (date: string) => {
    return appointments.filter((appointment) => appointment.date === date);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'in-progress':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'scheduled':
      case 'rescheduled':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled':
      case 'no-show':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'in-progress':
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
      case 'no-show':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getWeekDates = (startDate: string) => {
    const start = new Date(startDate);
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  const appointmentsForSelectedDate = getAppointmentsForDate(selectedDate);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Schedule</h1>
        <p className="text-gray-600">Manage your appointments and patient visits</p>
      </div>

      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">View</label>
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as 'day' | 'week')}
                className="input-field"
              >
                <option value="day">Day View</option>
                <option value="week">Week View</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="text-sm text-gray-600">
              <span className="font-medium">{appointmentsForSelectedDate.length}</span> appointments on this date
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="card text-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-spin" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Loading schedule</h3>
          <p className="text-gray-600">Fetching your latest appointments...</p>
        </div>
      )}

      {error && !loading && (
        <div className="card text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to load schedule</h3>
          <p className="text-gray-600">{error.message ?? 'Please try again later.'}</p>
        </div>
      )}

      {!loading && !error && (
        <>
          {viewMode === 'day' ? (
            <div>
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-900">{formatDate(selectedDate)}</h2>
              </div>

              {appointmentsForSelectedDate.length === 0 ? (
                <div className="card text-center py-12">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments scheduled</h3>
                  <p className="text-gray-600">You have no appointments scheduled for this date.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {appointmentsForSelectedDate
                    .sort((a, b) => a.time.localeCompare(b.time))
                    .map((appointment) => (
                      <div key={appointment.id} className="card">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center mb-3">
                              <div
                                className={`flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                                  appointment.status
                                )}`}
                              >
                                {getStatusIcon(appointment.status)}
                                <span className="ml-1 capitalize">{appointment.status}</span>
                              </div>
                              <div className="ml-4 flex items-center text-gray-500">
                                <Clock className="h-4 w-4 mr-1" />
                                <span className="text-sm">{formatTime(appointment.time)}</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <h3 className="font-semibold text-gray-900 mb-1">{appointment.serviceName}</h3>
                                <p className="text-sm text-gray-600 mb-2">
                                  Patient: {appointment.patientName || 'Unassigned'}
                                </p>
                                <div className="flex items-center text-sm text-gray-500">
                                  <User className="h-4 w-4 mr-1" />
                                  <span>ID: {appointment.patientId}</span>
                                </div>
                                {appointment.nurseName && (
                                  <p className="text-xs text-gray-500 mt-1">Nurse: {appointment.nurseName}</p>
                                )}
                                {appointment.specialistName && (
                                  <p className="text-xs text-gray-500">Specialist: {appointment.specialistName}</p>
                                )}
                              </div>

                              <div className="space-y-2">
                                <div className="text-sm text-gray-600">
                                  <strong>Duration:</strong> {appointment.duration} minutes
                                </div>
                                {appointment.notes && (
                                  <div className="text-xs text-gray-500">
                                    {appointment.notes}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Week of {formatDate(selectedDate)}</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getWeekDates(selectedDate).map((date) => {
                  const dayAppointments = getAppointmentsForDate(date);
                  return (
                    <div key={date} className="card">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">{formatDate(date)}</h3>
                          <p className="text-xs text-gray-500">{dayAppointments.length} appointments</p>
                        </div>
                        <Calendar className="h-5 w-5 text-gray-400" />
                      </div>

                      {dayAppointments.length === 0 ? (
                        <p className="text-sm text-gray-500">No appointments scheduled.</p>
                      ) : (
                        <div className="space-y-3">
                          {dayAppointments.map((appointment) => (
                            <div key={appointment.id} className="border border-gray-200 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-900">{appointment.serviceName}</span>
                                <span
                                  className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(
                                    appointment.status
                                  )}`}
                                >
                                  {appointment.status}
                                </span>
                              </div>
                              <div className="text-xs text-gray-600">
                                {formatTime(appointment.time)} • {appointment.patientName || 'Unassigned'}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

