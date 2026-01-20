import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  Phone,
  Award,
  Calendar,
  BookOpen,
  TrendingUp,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { useApi } from '../hooks/useApi';
import nurseService from '../services/nurses';
import { appointmentService } from '../services/appointments';
import { trainingService } from '../services/training';
import type { Nurse, Appointment, TrainingClass, Exam } from '../types';

interface NurseProfileData {
  nurse: Nurse;
  appointments: Appointment[];
  classes: TrainingClass[];
  exams: Exam[];
}

export default function NurseProfile() {
  const { id } = useParams<{ id: string }>();

  const { data, loading, error, refetch } = useApi<NurseProfileData | null>(
    async () => {
      if (!id) {
        return null;
      }

      const [nurse, appointmentResponse, classesResponse, examsResponse] = await Promise.all([
        nurseService.getNurse(id),
        appointmentService.getNurseAppointments(id, { limit: 200 }),
        trainingService.getClasses({ limit: 25 }),
        trainingService.getExams({ limit: 10 }),
      ]);

      return {
        nurse,
        appointments: appointmentResponse.appointments,
        classes: classesResponse.classes,
        exams: examsResponse.exams,
      };
    },
    [id]
  );

  const nurse = data?.nurse;

  const today = new Date().toISOString().split('T')[0];

  const todaysAppointments = useMemo(
    () => (data?.appointments ?? []).filter((appointment) => appointment.date === today),
    [data?.appointments, today]
  );

  const upcomingAppointments = useMemo(
    () =>
      (data?.appointments ?? [])
        .filter((appointment) => appointment.date >= today)
        .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
        .slice(0, 5),
    [data?.appointments, today]
  );

  const upcomingTrainings = useMemo(() => {
    if (!nurse) {
      return [];
    }
    const classes = data?.classes ?? [];
    const nurseSpecific = classes.filter(
      (trainingClass) =>
        trainingClass.instructor?.toLowerCase() === nurse.name.toLowerCase() ||
        trainingClass.category?.toLowerCase().includes(nurse.specialization.toLowerCase())
    );
    const fallback = classes
      .slice()
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const list = nurseSpecific.length ? nurseSpecific : fallback;
    return list.slice(0, 3);
  }, [data?.classes, nurse]);

  if (!id) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Nurse not found</h3>
        <p className="mt-1 text-sm text-gray-500">The requested nurse profile could not be found.</p>
        <Link to="/nurses" className="mt-4 btn-primary inline-block">
          Back to Nurses
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Loading nurse profile...</h3>
      </div>
    );
  }

  if (error || !nurse) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Unable to load nurse profile</h3>
        <p className="mt-1 text-sm text-gray-500">{error?.message ?? 'Please try again later.'}</p>
        <button onClick={refetch} className="mt-4 btn-primary">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link to="/nurses" className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{nurse.name}</h1>
          <p className="text-sm text-gray-600">Nurse Profile</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className="card">
            <div className="text-center">
              {nurse.avatar && (
                <img 
                  src={nurse.avatar.startsWith('http') 
                    ? nurse.avatar 
                    : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://51.20.55.20:3007'}${nurse.avatar.startsWith('/') ? nurse.avatar : '/' + nurse.avatar}`} 
                  alt={nurse.name} 
                  className="h-24 w-24 rounded-full object-cover mx-auto mb-4" 
                />
              )}
              <h3 className="text-xl font-semibold text-gray-900">{nurse.name}</h3>
              <p className="text-gray-600">{nurse.specialization}</p>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-2 ${
                  nurse.status === 'active'
                    ? 'status-active'
                    : nurse.status === 'on-leave'
                    ? 'status-pending'
                    : 'status-inactive'
                }`}
              >
                {nurse.status.replace('-', ' ')}
              </span>
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex items-center text-sm text-gray-600">
                <Mail className="h-4 w-4 mr-3" />
                {nurse.email}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Phone className="h-4 w-4 mr-3" />
                {nurse.phone}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Award className="h-4 w-4 mr-3" />
                License: {nurse.licenseNumber}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="h-4 w-4 mr-3" />
                Hired: {new Date(nurse.hireDate).toLocaleDateString()}
              </div>
            </div>

            <div className="mt-6">
              <button className="w-full btn-primary" disabled>
                Edit Profile
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Certification Progress</h3>
              <TrendingUp className="h-5 w-5 text-primary-500" />
            </div>

            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Overall Progress</span>
                <span className="font-medium">{nurse.certificationProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-primary-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${nurse.certificationProgress}%` }}
                ></div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Current Certifications</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {nurse.certifications.length ? (
                  nurse.certifications.map((certification, index) => (
                    <div key={index} className="flex items-center p-3 bg-green-50 rounded-lg">
                      <Award className="h-5 w-5 text-green-600 mr-3" />
                      <span className="text-sm font-medium text-gray-900">{certification}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No certifications on file.</p>
                )}
              </div>
            </div>

            <div className="mt-6 flex items-center gap-2">
              <button className="btn-secondary" disabled>
                <BookOpen className="h-4 w-4 mr-2" />
                Take Exam
              </button>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Upcoming Schedule</h3>
              <Clock className="h-5 w-5 text-secondary-500" />
            </div>

            {upcomingAppointments.length ? (
              <div className="space-y-3">
                {upcomingAppointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">{appointment.serviceName}</h4>
                      <p className="text-xs text-gray-600 mt-1">
                        {appointment.patientName} • {new Date(appointment.date).toLocaleDateString()} at {appointment.time}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        appointment.status === 'confirmed'
                          ? 'bg-green-100 text-green-800'
                          : appointment.status === 'scheduled'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {appointment.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No upcoming appointments scheduled.</p>
            )}
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Upcoming Training</h3>
              <Clock className="h-5 w-5 text-secondary-500" />
            </div>

            {upcomingTrainings.length ? (
              <div className="space-y-3">
                {upcomingTrainings.map((trainingClass) => (
                  <div key={trainingClass.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">{trainingClass.title}</h4>
                      <p className="text-xs text-gray-600 mt-1">{trainingClass.description}</p>
                      <div className="flex items-center mt-2 text-xs text-gray-500">
                        <Calendar className="h-3 w-3 mr-1" />
                        {trainingClass.date ? new Date(trainingClass.date).toLocaleDateString() : 'Date TBD'}
                      </div>
                    </div>
                    <div className="ml-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                        {trainingClass.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No upcoming training sessions found.</p>
            )}

            <div className="mt-4">
              <Link to="/training" className="btn-outline">
                View Training Portal
              </Link>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Metrics</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{nurse.experience}</div>
                <div className="text-sm text-gray-600">Years Experience</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{todaysAppointments.length}</div>
                <div className="text-sm text-gray-600">Visits Today</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{data?.appointments.length ?? 0}</div>
                <div className="text-sm text-gray-600">Total Visits Scheduled</div>
              </div>
            </div>
          </div>

          {data?.exams.length ? (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Upcoming Exams</h3>
                <BookOpen className="h-5 w-5 text-primary-500" />
              </div>
              <div className="space-y-3">
                {data.exams.slice(0, 3).map((exam) => (
                  <div key={exam.id} className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900">{exam.title}</h4>
                    <p className="text-xs text-gray-600 mt-1">Passing Score: {exam.passingScore}% • Questions: {exam.questions.length}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

