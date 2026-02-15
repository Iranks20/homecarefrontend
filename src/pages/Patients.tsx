import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Edit, Eye, Plus, Search, Trash2, User } from 'lucide-react';
import { toast } from 'react-toastify';
import { Patient, Service } from '../types';
import AddEditPatientModal, { type PatientFormValues } from '../components/AddEditPatientModal';
import patientService from '../services/patients';
import { nurseService } from '../services/nurses';
import { userService } from '../services/users';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import servicesService from '../services/services';
import { useApi } from '../hooks/useApi';
import { getAssetUrl } from '../config/api';

export default function Patients() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientsList, setPatientsList] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [specialists, setSpecialists] = useState<{ id: string; name: string; specialization?: string }[]>([]);
  const [therapists, setTherapists] = useState<{ id: string; name: string; specialization?: string }[]>([]);
  const [nurses, setNurses] = useState<{ id: string; name: string }[]>([]);
  
  // Get current user for role-based access control
  const { user } = useAuth();
  
  // Get notifications hook - must be called unconditionally (hooks cannot be in try-catch)
  // The NotificationProvider in App.tsx ensures this context is available
  const { addNotification } = useNotifications();

  // Check if user can add patients (only admin and receptionist)
  const canAddPatient = user?.role === 'admin' || user?.role === 'receptionist';
  // Admin and receptionist can edit patient details; only admin can archive
  const canEditPatient = user?.role === 'admin' || user?.role === 'receptionist';
  const canArchivePatient = user?.role === 'admin';

  // Load services for displaying patient services
  const {
    data: servicesData,
    loading: loadingServices,
  } = useApi(() => servicesService.getServices({ limit: 500 }), []);
  
  const servicesList = servicesData?.services ?? [];
  
  const serviceMap = useMemo(() => {
    const map = new Map<string, Service>();
    servicesList.forEach((service) => map.set(service.id, service));
    return map;
  }, [servicesList]);

  const specialistMap = useMemo(() => {
    const map = new Map<string, string>();
    specialists.forEach((specialist) => map.set(specialist.id, specialist.name));
    return map;
  }, [specialists]);

  const therapistMap = useMemo(() => {
    const map = new Map<string, string>();
    therapists.forEach((therapist) => map.set(therapist.id, therapist.name));
    return map;
  }, [therapists]);

  const nurseMap = useMemo(() => {
    const map = new Map<string, string>();
    nurses.forEach((nurse) => map.set(nurse.id, nurse.name));
    return map;
  }, [nurses]);

  const getPatientServices = (patient: Patient): Service[] => {
    if (!(patient as any).serviceIds || (patient as any).serviceIds.length === 0) return [];
    return (patient as any).serviceIds
      .map((serviceId: string) => serviceMap.get(serviceId))
      .filter((service: Service | undefined): service is Service => service !== undefined);
  };

  const loadTherapists = async () => {
    try {
      const { users } = await userService.getMedicalStaff({
        role: 'SPECIALIST',
        limit: 500,
      });
      setTherapists(users.map((therapist) => {
        // Format specialization for display (e.g., PHYSIOTHERAPY -> Physiotherapy)
        const formatSpecialization = (spec?: string | null) => {
          if (!spec) return undefined;
          return spec
            .split('_')
            .map(word => word.charAt(0) + word.slice(1).toLowerCase())
            .join(' ');
        };
        return { 
          id: therapist.id, 
          name: therapist.name,
          specialization: formatSpecialization((therapist as any).therapistSpecialization)
        };
      }));
    } catch (err: any) {
      console.error('Failed to load therapists', err);
      // If API fails, try to load all users and filter
      try {
        const { users: allUsers } = await userService.getUsers({
          limit: 500,
        });
        const therapistUsers = allUsers.filter(u => u.role === 'therapist');
        setTherapists(therapistUsers.map((therapist) => {
          const formatSpecialization = (spec?: string | null) => {
            if (!spec) return undefined;
            return spec
              .split('_')
              .map(word => word.charAt(0) + word.slice(1).toLowerCase())
              .join(' ');
          };
          return { 
            id: therapist.id, 
            name: therapist.name,
            specialization: formatSpecialization((therapist as any).therapistSpecialization)
          };
        }));
      } catch (fallbackErr) {
        console.error('Fallback load failed', fallbackErr);
        setTherapists([]);
      }
    }
  };

  const loadSpecialists = async () => {
    try {
      const { users } = await userService.getMedicalStaff({
        role: 'SPECIALIST',
        limit: 500,
      });
      setSpecialists(users.map((specialist) => {
        // Format specialization for display (e.g., NEUROLOGIST -> Neurologist)
        const formatSpecialization = (spec?: string | null) => {
          if (!spec) return undefined;
          return spec
            .split('_')
            .map(word => word.charAt(0) + word.slice(1).toLowerCase())
            .join(' ');
        };
        return { 
          id: specialist.id, 
          name: specialist.name,
          specialization: formatSpecialization((specialist as any).specialistSpecialization)
        };
      }));
    } catch (err: any) {
      console.error('Failed to load specialists', err);
      // If API fails, try to load all users and filter
      try {
        const { users: allUsers } = await userService.getUsers({
          limit: 500,
        });
        const specialistUsers = allUsers.filter(u => u.role === 'specialist');
        setSpecialists(specialistUsers.map((specialist) => {
          const formatSpecialization = (spec?: string | null) => {
            if (!spec) return undefined;
            return spec
              .split('_')
              .map(word => word.charAt(0) + word.slice(1).toLowerCase())
              .join(' ');
          };
          return { 
            id: specialist.id, 
            name: specialist.name,
            specialization: formatSpecialization((specialist as any).specialistSpecialization)
          };
        }));
      } catch (fallbackErr) {
        console.error('Fallback load failed', fallbackErr);
        setSpecialists([]);
      }
    }
  };

  const loadPatients = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { patients } = await patientService.getPatients({
        query: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      setPatientsList(patients);
    } catch (err: any) {
      console.error('Failed to load patients', err);
      setError(err?.message ?? 'Unable to load patient records.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadNurses = async () => {
    try {
      const { users } = await userService.getMedicalStaff({
        role: 'NURSE',
        limit: 500,
      });
      setNurses(users.map((nurse) => ({ 
        id: nurse.id, 
        name: nurse.name
      })));
    } catch (err: any) {
      console.error('Failed to load nurses', err);
      // If API fails, try to load all users and filter
      try {
        const { users: allUsers } = await userService.getUsers({
          limit: 500,
        });
        const nurseUsers = allUsers.filter(u => u.role === 'nurse');
        setNurses(nurseUsers.map((nurse) => ({ 
          id: nurse.id, 
          name: nurse.name
        })));
      } catch (fallbackErr) {
        console.error('Fallback load failed', fallbackErr);
        setNurses([]);
      }
    }
  };

  useEffect(() => {
    loadSpecialists();
    loadTherapists();
    loadNurses();
  }, []);

  useEffect(() => {
    loadPatients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, searchTerm]);

  const filteredPatients = useMemo(() => {
    return patientsList.filter((patient) => {
      const nurseName = patient.assignedNurseId
        ? nurseMap.get(patient.assignedNurseId)?.toLowerCase()
        : patient.assignedNurseName?.toLowerCase();

      const specialistName = (patient as any).assignedSpecialistId
        ? specialistMap.get((patient as any).assignedSpecialistId)?.toLowerCase()
        : (patient as any).assignedSpecialistName?.toLowerCase();
      
      const therapistName = (patient as any).assignedTherapistId
        ? therapistMap.get((patient as any).assignedTherapistId)?.toLowerCase()
        : (patient as any).assignedTherapistName?.toLowerCase();

      const matchesSearch =
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (specialistName?.includes(searchTerm.toLowerCase()) ?? false) ||
        (therapistName?.includes(searchTerm.toLowerCase()) ?? false) ||
        (getPatientServices(patient).some(service => 
          service.name.toLowerCase().includes(searchTerm.toLowerCase())
        ));

      const matchesStatus =
        statusFilter === 'all' || patient.status === statusFilter;

      return matchesSearch && matchesStatus;
  });
  }, [patientsList, searchTerm, statusFilter, specialistMap, therapistMap, serviceMap]);

  const handleAddPatient = async (values: PatientFormValues) => {
    try {
      await patientService.createPatient(values);
      toast.success(`Patient ${values.name} has been created successfully`);
      if (addNotification) {
        addNotification({
          title: 'Patient created',
          message: `${values.name} has been added.`,
          type: 'success',
          priority: 'medium',
          userId: 'system',
          category: 'system',
        });
      }
      await loadPatients();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create patient';
      toast.error(errorMessage);
      if (addNotification) {
        addNotification({
          title: 'Unable to create patient',
          message: errorMessage,
          type: 'error',
          priority: 'high',
          userId: 'system',
          category: 'system',
        });
      }
      throw err;
    }
  };

  const handleEditPatient = async (values: PatientFormValues) => {
    if (!selectedPatient) {
      return;
    }

    try {
      await patientService.updatePatient(selectedPatient.id, values);
      toast.success(`Patient ${values.name} has been updated successfully`);
      addNotification({
        title: 'Patient updated',
        message: `${values.name} has been updated.`,
        type: 'success',
        priority: 'medium',
        userId: 'system',
        category: 'system',
      });
      await loadPatients();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update patient';
      toast.error(errorMessage);
      addNotification({
        title: 'Unable to update patient',
        message: errorMessage,
        type: 'error',
        priority: 'high',
        userId: 'system',
        category: 'system',
      });
      throw err;
    } finally {
      setSelectedPatient(null);
    }
  };

  const handleDeletePatient = async (patientId: string) => {
    const patient = patientsList.find((item) => item.id === patientId);
    const prompt = patient
      ? `Archive ${patient.name}? They will no longer appear in active lists.`
      : 'Archive this patient?';
    if (!window.confirm(prompt)) {
      return;
    }

    try {
      await patientService.deletePatient(patientId);
      toast.success(patient ? `Patient ${patient.name} has been archived` : 'Patient archived successfully');
      if (addNotification) {
        addNotification({
          title: 'Patient archived',
          message: patient
            ? `${patient.name} has been marked as discharged.`
            : 'Patient archived successfully.',
          type: 'info',
          priority: 'medium',
          userId: 'system',
          category: 'system',
        });
      }
      await loadPatients();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to archive patient';
      toast.error(errorMessage);
      if (addNotification) {
        addNotification({
          title: 'Archive failed',
          message:
            err instanceof Error ? err.message : 'Unable to archive patient.',
          type: 'error',
          priority: 'high',
          userId: 'system',
          category: 'system',
        });
      }
    }
  };

  const openEditModal = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsEditModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patients</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage patient information and live care details.
          </p>
        </div>
        {canAddPatient && (
          <div className="mt-4 sm:mt-0">
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="btn-primary flex items-center"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Patient
            </button>
          </div>
        )}
      </div>

      <div className="card">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="discharged">Discharged</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          <div>
            {/* Condition filter removed - services column replaces condition */}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Services
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Assigned Specialist
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Assigned Therapist
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Admission Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-10 text-center text-sm text-gray-500"
                  >
                    Loading patients...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-10 text-center text-sm text-red-500"
                  >
                    {error}
                  </td>
                </tr>
              ) : filteredPatients.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-10 text-center text-sm text-gray-500"
                  >
                    No patients match your filters yet.
                  </td>
                </tr>
              ) : (
                filteredPatients.map((patient) => (
                <tr key={patient.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center">
                        {patient.avatar ? (
                      <img
                        src={patient.avatar.startsWith('http') ? patient.avatar : getAssetUrl(patient.avatar)}
                        alt={patient.name}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-600">
                            {patient.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                        )}
                      <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {patient.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {patient.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {loadingServices ? (
                        <div className="text-sm text-gray-500">Loading...</div>
                      ) : (() => {
                        const patientServices = getPatientServices(patient);
                        if (patientServices.length === 0) {
                          return <div className="text-sm text-gray-400">No services</div>;
                        }
                        return (
                          <div className="flex flex-wrap gap-1">
                            {patientServices.slice(0, 2).map((service) => (
                              <span
                                key={service.id}
                                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
                              >
                                {service.name}
                              </span>
                            ))}
                            {patientServices.length > 2 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                +{patientServices.length - 2} more
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center">
                        <User className="mr-2 h-4 w-4 text-gray-400" />
                        <div className="text-sm text-gray-900">
                          {(patient as any).assignedSpecialistId
                            ? specialistMap.get((patient as any).assignedSpecialistId) ?? (patient as any).assignedSpecialistName ?? 'Unassigned'
                            : 'Unassigned'}
                        </div>
                    </div>
                  </td>
                    <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center">
                        <User className="mr-2 h-4 w-4 text-gray-400" />
                        <div className="text-sm text-gray-900">
                          {(patient as any).assignedTherapistId
                            ? therapistMap.get((patient as any).assignedTherapistId) ?? (patient as any).assignedTherapistName ?? 'Unassigned'
                            : 'Unassigned'}
                        </div>
                    </div>
                  </td>
                    <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center">
                        <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                      <div className="text-sm text-gray-900">
                          {patient.admissionDate
                            ? new Date(patient.admissionDate).toLocaleDateString()
                            : '—'}
                      </div>
                    </div>
                  </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`status-badge ${
                          patient.status === 'active'
                            ? 'status-active'
                            : patient.status === 'discharged'
                            ? 'status-inactive'
                            : 'status-pending'
                        }`}
                      >
                      {patient.status}
                    </span>
                  </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                      <div className="flex items-center space-x-3">
                        <Link
                          to={`/patients/${patient.id}`}
                          className="text-primary-600 hover:text-primary-900 inline-flex items-center"
                        >
                          <Eye className="mr-1 h-4 w-4" />
                          View
                        </Link>
                        {canEditPatient && (
                          <button 
                            onClick={() => openEditModal(patient)}
                            className="text-secondary-600 hover:text-secondary-900 inline-flex items-center"
                            type="button"
                          >
                            <Edit className="mr-1 h-4 w-4" />
                            Edit
                          </button>
                        )}
                        {canArchivePatient && (
                          <button 
                            onClick={() => handleDeletePatient(patient.id)}
                            className="text-red-600 hover:text-red-900 inline-flex items-center"
                            type="button"
                          >
                            <Trash2 className="mr-1 h-4 w-4" />
                            Archive
                          </button>
                        )}
                      </div>
                    </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddEditPatientModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddPatient}
        mode="add"
        specialists={specialists}
        therapists={therapists}
        services={servicesList.map((s) => ({ id: s.id, name: s.name }))}
      />

      <AddEditPatientModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedPatient(null);
        }}
        onSave={handleEditPatient}
        patient={selectedPatient ?? undefined}
        mode="edit"
        specialists={specialists}
        therapists={therapists}
        services={servicesList.map((s) => ({ id: s.id, name: s.name }))}
      />
    </div>
  );
}
