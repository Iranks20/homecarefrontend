import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Edit, Eye, Plus, Search, Trash2, User } from 'lucide-react';
import { toast } from 'react-toastify';
import { Patient } from '../types';
import AddEditPatientModal, { type PatientFormValues } from '../components/AddEditPatientModal';
import patientService from '../services/patients';
import { nurseService } from '../services/nurses';
import { userService } from '../services/users';
import { useNotifications } from '../contexts/NotificationContext';

export default function Patients() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [conditionFilter, setConditionFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientsList, setPatientsList] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nurses, setNurses] = useState<{ id: string; name: string }[]>([]);
  const [doctors, setDoctors] = useState<{ id: string; name: string; specialization?: string }[]>([]);
  const [specialists, setSpecialists] = useState<{ id: string; name: string; specialization?: string }[]>([]);
  const { addNotification } = useNotifications();

  const nurseMap = useMemo(() => {
    const map = new Map<string, string>();
    nurses.forEach((nurse) => map.set(nurse.id, nurse.name));
    return map;
  }, [nurses]);

  const doctorMap = useMemo(() => {
    const map = new Map<string, string>();
    doctors.forEach((doctor) => map.set(doctor.id, doctor.name));
    return map;
  }, [doctors]);

  const loadNurses = async () => {
    try {
      // Load nurses from User table (not Nurse table) since Patient.assignedNurseId references User
      const { users } = await userService.getMedicalStaff({
        role: 'NURSE',
        limit: 500,
      });
      setNurses(users.map((nurse) => ({ id: nurse.id, name: nurse.name })));
    } catch (err) {
      console.error('Failed to load nurses', err);
    }
  };

  const loadDoctors = async () => {
    try {
      const { users } = await userService.getMedicalStaff({
        role: 'DOCTOR',
        limit: 500,
      });
      setDoctors(users.map((doctor) => ({ 
        id: doctor.id, 
        name: doctor.name,
        specialization: doctor.doctorSpecialization
      })));
    } catch (err) {
      console.error('Failed to load doctors', err);
    }
  };

  const loadSpecialists = async () => {
    try {
      const { users } = await userService.getMedicalStaff({
        role: 'SPECIALIST',
        limit: 500,
      });
      setSpecialists(users.map((specialist) => ({ 
        id: specialist.id, 
        name: specialist.name,
        specialization: specialist.specialistType
      })));
    } catch (err) {
      console.error('Failed to load specialists', err);
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

  useEffect(() => {
    loadNurses();
    loadDoctors();
    loadSpecialists();
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

      const matchesSearch =
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.condition.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (nurseName?.includes(searchTerm.toLowerCase()) ?? false);

      const matchesStatus =
        statusFilter === 'all' || patient.status === statusFilter;

      const matchesCondition =
        conditionFilter === 'all' ||
                           patient.condition.toLowerCase().includes(conditionFilter.toLowerCase());

    return matchesSearch && matchesStatus && matchesCondition;
  });
  }, [patientsList, searchTerm, statusFilter, conditionFilter, nurseMap]);

  const conditions = useMemo(
    () => [...new Set(patientsList.map((patient) => patient.condition))],
    [patientsList]
  );

  const handleAddPatient = async (values: PatientFormValues) => {
    try {
      await patientService.createPatient(values);
      toast.success(`Patient ${values.name} has been created successfully`);
      addNotification({
        title: 'Patient created',
        message: `${values.name} has been added.`,
        type: 'success',
        priority: 'medium',
        userId: 'system',
        category: 'system',
      });
      await loadPatients();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create patient';
      toast.error(errorMessage);
      addNotification({
        title: 'Unable to create patient',
        message: errorMessage,
        type: 'error',
        priority: 'high',
        userId: 'system',
        category: 'system',
      });
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
      await loadPatients();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to archive patient';
      toast.error(errorMessage);
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
        <div className="mt-4 sm:mt-0">
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="btn-primary flex items-center"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Patient
          </button>
        </div>
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
            <select
              value={conditionFilter}
              onChange={(e) => setConditionFilter(e.target.value)}
              className="input-field"
            >
              <option value="all">All Conditions</option>
              {conditions.map((condition) => (
                <option key={condition} value={condition}>
                  {condition}
                </option>
              ))}
            </select>
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
                  Condition
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Assigned Doctor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Assigned Nurse
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
                        src={patient.avatar.startsWith('http') 
                          ? patient.avatar 
                          : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://51.20.98.153:3007'}${patient.avatar.startsWith('/') ? patient.avatar : '/' + patient.avatar}`}
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
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {patient.condition}
                    </div>
                  </td>
                    <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center">
                        <User className="mr-2 h-4 w-4 text-gray-400" />
                        <div className="text-sm text-gray-900">
                          {patient.assignedDoctorId
                            ? doctorMap.get(patient.assignedDoctorId) ?? patient.assignedDoctorName ?? 'Unassigned'
                            : 'Unassigned'}
                        </div>
                    </div>
                  </td>
                    <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center">
                        <User className="mr-2 h-4 w-4 text-gray-400" />
                        <div className="text-sm text-gray-900">
                          {patient.assignedNurseId
                            ? nurseMap.get(patient.assignedNurseId) ?? patient.assignedNurseName ?? 'Unassigned'
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
                        className="text-primary-600 hover:text-primary-900"
                      >
                          <Eye className="mr-1 inline h-4 w-4" />
                        View
                      </Link>
                      <button 
                        onClick={() => openEditModal(patient)}
                        className="text-secondary-600 hover:text-secondary-900"
                      >
                          <Edit className="mr-1 inline h-4 w-4" />
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeletePatient(patient.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                          <Trash2 className="mr-1 inline h-4 w-4" />
                          Archive
                      </button>
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
        nurses={nurses}
        doctors={doctors}
        specialists={specialists}
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
        nurses={nurses}
        doctors={doctors}
        specialists={specialists}
      />
    </div>
  );
}
