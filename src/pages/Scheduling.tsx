import { useMemo, useState } from 'react';
import { Calendar, Clock, User, Plus, Filter, Edit, Trash2 } from 'lucide-react';
import { Appointment } from '../types';
import AddEditAppointmentModal, { AppointmentFormValues } from '../components/AddEditAppointmentModal';
import { useApi, useApiMutation } from '../hooks/useApi';
import { appointmentService } from '../services/appointments';
import patientService from '../services/patients';
import { nurseService } from '../services/nurses';
import servicesService from '../services/services';
import { specialistService } from '../services/specialists';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';

function getMonthRange(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

export default function Scheduling() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [filterNurse, setFilterNurse] = useState('all');
  const [filterSpecialist, setFilterSpecialist] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const { addNotification } = useNotifications();

  // Only Admin, Doctor, and Specialist can create appointments
  const canCreateAppointments = user?.role === 'admin' || user?.role === 'doctor' || user?.role === 'specialist';
  const isReceptionist = user?.role === 'receptionist';

  const monthRange = useMemo(() => getMonthRange(selectedDate), [selectedDate]);

  const {
    data: appointmentsData,
    loading: loadingAppointments,
    error: appointmentsError,
    refetch: refetchAppointments,
  } = useApi(() =>
    appointmentService.getAppointments({
      nurseId: filterNurse !== 'all' ? filterNurse : undefined,
      dateFrom: monthRange.start,
      dateTo: monthRange.end,
      limit: 200,
    }),
    [filterNurse, monthRange.start, monthRange.end]
  );

  const {
    data: patientsData,
    loading: loadingPatients,
  } = useApi(() => patientService.getPatients({ limit: 200 }), []);

  const {
    data: nursesData,
    loading: loadingNurses,
  } = useApi(() => nurseService.getNurses({ page: 1, limit: 200 }), []);

  const {
    data: servicesData,
    loading: loadingServices,
  } = useApi(() => servicesService.getServices({ limit: 200 }), []);

  const {
    data: specialistsData,
    loading: loadingSpecialists,
  } = useApi(() => specialistService.getSpecialists({ limit: 200 }), []);

  const createAppointmentMutation = useApiMutation(appointmentService.createAppointment.bind(appointmentService));
  const updateAppointmentMutation = useApiMutation(
    (params: { id: string; data: Partial<AppointmentFormValues> }) =>
      appointmentService.updateAppointment(params.id, params.data)
  );
  const deleteAppointmentMutation = useApiMutation((id: string) => appointmentService.deleteAppointment(id));

  const appointmentsList = useMemo(() => {
    const list = appointmentsData?.appointments ?? [];
    return list.sort(
      (a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime()
    );
  }, [appointmentsData]);

  const filteredAppointments = useMemo(() => {
    if (filterNurse === 'all' && filterSpecialist === 'all') {
      return appointmentsList;
    }
    return appointmentsList.filter((appointment) => {
      const matchesNurse = filterNurse === 'all' || appointment.nurseId === filterNurse;
      const matchesSpecialist =
        filterSpecialist === 'all' || appointment.specialistId === filterSpecialist;
      return matchesNurse && matchesSpecialist;
    });
  }, [appointmentsList, filterNurse, filterSpecialist]);

  const currentMonthAppointments = filteredAppointments.filter((apt) => {
    const aptDate = new Date(apt.date);
    return aptDate.getMonth() === selectedDate.getMonth() && aptDate.getFullYear() === selectedDate.getFullYear();
  });

  const appointmentsByDate = currentMonthAppointments.reduce((acc, apt) => {
    const date = apt.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(apt);
    return acc;
  }, {} as Record<string, Appointment[]>);

  const patientsList = patientsData?.patients ?? [];
  const nursesList = nursesData?.nurses ?? [];
  const servicesList = servicesData?.services ?? [];
  const specialistsList = specialistsData?.specialists ?? [];

  const handleAddAppointment = async (appointmentValues: AppointmentFormValues) => {
    try {
      await createAppointmentMutation.mutate(appointmentValues);
      addNotification({
        title: 'Appointment Scheduled',
        message: 'The appointment has been scheduled successfully.',
        type: 'success',
        userId: 'system',
        priority: 'medium',
        category: 'schedule',
      });
      await refetchAppointments();
    setIsAddModalOpen(false);
    } catch (error: any) {
      addNotification({
        title: 'Unable to Schedule Appointment',
        message: error?.message ?? 'Please review the details and try again.',
        type: 'error',
        userId: 'system',
        priority: 'high',
        category: 'system',
      });
      throw error;
    }
  };

  const handleEditAppointment = async (appointmentValues: AppointmentFormValues) => {
    if (!selectedAppointment) {
      return;
    }

    try {
      await updateAppointmentMutation.mutate({
        id: selectedAppointment.id,
        data: appointmentValues,
      });
      addNotification({
        title: 'Appointment Updated',
        message: 'The appointment details have been updated.',
        type: 'success',
        userId: 'system',
        priority: 'medium',
        category: 'schedule',
      });
      await refetchAppointments();
      setIsEditModalOpen(false);
      setSelectedAppointment(null);
    } catch (error: any) {
      addNotification({
        title: 'Unable to Update Appointment',
        message: error?.message ?? 'Please review the details and try again.',
        type: 'error',
        userId: 'system',
        priority: 'high',
        category: 'system',
      });
      throw error;
    }
  };

  const handleDeleteAppointment = async (appointmentId: string) => {
    const appointment = appointmentsList.find((item) => item.id === appointmentId);
    if (!appointment) {
      return;
    }

    const confirmationMessage = `Cancel appointment for ${appointment.patientName} on ${new Date(
      `${appointment.date}T${appointment.time}`
    ).toLocaleString()}?`;

    if (!window.confirm(confirmationMessage)) {
      return;
    }

    try {
      await deleteAppointmentMutation.mutate(appointmentId);
      addNotification({
        title: 'Appointment Cancelled',
        message: `${appointment.patientName}'s appointment has been removed from the schedule.`,
        type: 'info',
        userId: 'system',
        priority: 'medium',
        category: 'schedule',
      });
      await refetchAppointments();
    } catch (error: any) {
      addNotification({
        title: 'Unable to Cancel Appointment',
        message: error?.message ?? 'Please try again later.',
        type: 'error',
        userId: 'system',
        priority: 'high',
        category: 'system',
      });
    }
  };

  const openEditModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsEditModalOpen(true);
  };

  const generateCalendarDays = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days: Date[] = [];
    const current = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  const calendarDays = useMemo(() => generateCalendarDays(), [selectedDate]);

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = Number(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Scheduling</h1>
          <p className="mt-1 text-sm text-gray-600">Manage appointments and schedules</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-2">
          <button className="btn-outline flex items-center" disabled>
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </button>
          {canCreateAppointments && (
          <button onClick={() => setIsAddModalOpen(true)} className="btn-primary flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            New Appointment
          </button>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                const newDate = new Date(selectedDate);
                newDate.setMonth(newDate.getMonth() - 1);
                setSelectedDate(newDate);
              }}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              aria-label="Previous month"
            >
              ←
            </button>
            <h2 className="text-lg font-semibold text-gray-900 min-w-0">
              {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <button
              onClick={() => {
                const newDate = new Date(selectedDate);
                newDate.setMonth(newDate.getMonth() + 1);
                setSelectedDate(newDate);
              }}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              aria-label="Next month"
            >
              →
            </button>
          </div>
          
          <div className="flex space-x-2">
            {(['month', 'week', 'day'] as const).map((viewType) => (
              <button
                key={viewType}
                onClick={() => setView(viewType)}
                className={`px-3 py-1 rounded-lg text-sm font-medium ${
                  view === viewType ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {viewType.charAt(0).toUpperCase() + viewType.slice(1)}
              </button>
            ))}
          </div>

          <div className="sm:ml-auto flex flex-col sm:flex-row gap-3">
            <select
              value={filterNurse}
              onChange={(e) => setFilterNurse(e.target.value)}
              className="input-field"
            >
              <option value="all">All Nurses</option>
              {nursesList.map((nurse) => (
                <option key={nurse.id} value={nurse.id}>
                  {nurse.name}
                </option>
              ))}
            </select>
            <select
              value={filterSpecialist}
              onChange={(e) => setFilterSpecialist(e.target.value)}
              className="input-field"
            >
              <option value="all">All Specialists</option>
              {specialistsList.map((specialist) => (
                <option key={specialist.id} value={specialist.id}>
                  {specialist.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="card">
        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 text-center">
              {day}
            </div>
          ))}
          
          {calendarDays.map((day, index) => {
            const isCurrentMonth = day.getMonth() === selectedDate.getMonth();
            const isToday = day.toDateString() === new Date().toDateString();
            const dayKey = day.toISOString().split('T')[0];
            const dayAppointments = appointmentsByDate[dayKey] || [];
            
            return (
              <div
                key={index}
                className={`min-h-[120px] px-3 py-2 bg-white flex flex-col border border-gray-100 ${
                  !isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''
                } ${isToday ? 'ring-2 ring-primary-500' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${isToday ? 'text-primary-600' : 'text-gray-900'}`}>
                  {day.getDate()}
                  </span>
                  <span className="text-xs text-gray-400">{dayAppointments.length} appointments</span>
                </div>
                <div className="mt-2 space-y-1">
                  {dayAppointments.slice(0, 3).map((appointment) => (
                    <button
                      key={appointment.id}
                      onClick={() => canCreateAppointments && openEditModal(appointment)}
                      className={`w-full text-left text-xs p-2 rounded-lg bg-primary-50 text-primary-700 ${
                        canCreateAppointments ? 'hover:bg-primary-100 cursor-pointer' : 'cursor-default opacity-75'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{formatTime(appointment.time)}</span>
                        <span className="text-[10px] uppercase">{appointment.status}</span>
                      </div>
                      <div className="truncate flex items-center text-[11px] text-gray-600">
                        <User className="h-3 w-3 mr-1" />
                        {appointment.patientName}
                    </div>
                    </button>
                  ))}
                  {dayAppointments.length > 3 && (
                    <div className="text-xs text-gray-500">+{dayAppointments.length - 3} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Appointment List */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-primary-500" />
            Upcoming Appointments
          </h2>
          <div className="flex space-x-2 text-sm text-gray-500">
            <span className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-primary-500 mr-2" />Scheduled
            </span>
            <span className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-green-500 mr-2" />Completed
            </span>
          </div>
        </div>
        
        {loadingAppointments ? (
          <div className="py-12 text-center text-sm text-gray-500">Loading appointments...</div>
        ) : appointmentsError ? (
          <div className="py-12 text-center text-sm text-red-500">
            Unable to load appointments. Please try again later.
          </div>
        ) : currentMonthAppointments.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 mx-auto text-gray-300" />
            <p className="mt-4 text-sm text-gray-500">No appointments scheduled for this period.</p>
          </div>
        ) : (
        <div className="space-y-3">
            {currentMonthAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-primary-200 transition"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary-50 rounded-lg">
                      <Clock className="h-5 w-5 text-primary-500" />
                  </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">{appointment.patientName}</h3>
                      <div className="flex flex-wrap items-center text-xs text-gray-500 gap-2">
                        <span>{new Date(`${appointment.date}T${appointment.time}`).toLocaleString()}</span>
                        <span>•</span>
                        <span>{appointment.serviceName}</span>
                        {appointment.nurseName && <span>• Nurse {appointment.nurseName}</span>}
                        {appointment.specialistName && <span>• Specialist {appointment.specialistName}</span>}
                  </div>
                </div>
              </div>
              
                  <div className="flex items-center space-x-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        appointment.status === 'completed'
                          ? 'bg-green-50 text-green-700'
                          : appointment.status === 'cancelled'
                          ? 'bg-red-50 text-red-700'
                          : 'bg-primary-50 text-primary-700'
                      }`}
                    >
                      {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                </span>
                  {canCreateAppointments && (
                    <>
                  <button 
                      onClick={() => openEditModal(appointment)}
                      className="p-2 text-gray-400 hover:text-primary-500"
                      aria-label="Edit appointment"
                  >
                      <Edit className="h-4 w-4" />
                  </button>
                  <button 
                      onClick={() => handleDeleteAppointment(appointment.id)}
                      className="p-2 text-gray-400 hover:text-red-500"
                      aria-label="Delete appointment"
                  >
                      <Trash2 className="h-4 w-4" />
                  </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
          </div>
        )}
      </div>

      <AddEditAppointmentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddAppointment}
        mode="add"
        patients={patientsList}
        nurses={nursesList}
        services={servicesList}
        loading={{
          patients: loadingPatients,
          nurses: loadingNurses,
          specialists: loadingSpecialists,
          services: loadingServices,
        }}
        specialists={specialistsList}
      />

      <AddEditAppointmentModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedAppointment(null);
        }}
        onSave={handleEditAppointment}
        appointment={selectedAppointment ?? undefined}
        mode="edit"
        patients={patientsList}
        nurses={nursesList}
        services={servicesList}
        loading={{
          patients: loadingPatients,
          nurses: loadingNurses,
          specialists: loadingSpecialists,
          services: loadingServices,
        }}
        specialists={specialistsList}
      />
    </div>
  );
}
