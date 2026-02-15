import { useMemo, useState } from 'react';
import { Search, Plus, Eye, Edit, Trash2, Stethoscope, Phone, Award } from 'lucide-react';
import { User } from '../types';
import AddEditUserModal from '../components/AddEditUserModal';
import { useApi, useApiMutation } from '../hooks/useApi';
import { userService, type CreateUserPayload, type UpdateUserPayload } from '../services/users';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import { getAssetUrl } from '../config/api';

export default function Doctors() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<User | null>(null);
  const { addNotification } = useNotifications();

  const {
    data,
    loading,
    error,
    refetch,
  } = useApi(() => userService.getUsers({ 
    role: 'DOCTOR',
    limit: 200 
  }), []);

  const doctors = data?.users ?? [];

  const createUserMutation = useApiMutation(userService.createUser.bind(userService));
  const updateUserMutation = useApiMutation(
    ({ id, payload }: { id: string; payload: UpdateUserPayload }) =>
      userService.updateUser(id, payload)
  );
  const updateStatusMutation = useApiMutation(
    ({ id, isActive }: { id: string; isActive: boolean }) =>
      userService.updateUserStatus(id, isActive)
  );
  const deleteUserMutation = useApiMutation(userService.deleteUser.bind(userService));

  const filteredDoctors = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    return doctors.filter((doctor) => {
      const matchesSearch =
        !search ||
        doctor.name.toLowerCase().includes(search) ||
        doctor.email?.toLowerCase().includes(search) ||
        (doctor as any).doctorSpecialization?.toLowerCase().includes(search) ||
        doctor.licenseNumber?.toLowerCase().includes(search);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && doctor.isActive !== false) ||
        (statusFilter === 'inactive' && doctor.isActive === false);

      return matchesSearch && matchesStatus;
    });
  }, [doctors, searchTerm, statusFilter]);

  const handleCreateDoctor = async (payload: any) => {
    try {
      // Ensure role is set to doctor
      const createPayload = { ...payload, role: 'doctor' };
      await createUserMutation.mutate(createPayload);
      toast.success(`Doctor ${payload.name} has been created successfully`);
      addNotification({
        title: 'Doctor created',
        message: `${payload.name} has been added to the team.`,
        type: 'success',
        priority: 'medium',
        category: 'system',
        userId: 'system',
      });
      setIsAddModalOpen(false);
      await refetch();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to create doctor';
      toast.error(errorMessage);
      addNotification({
        title: 'Unable to create doctor',
        message: errorMessage,
        type: 'error',
        priority: 'high',
        category: 'system',
        userId: 'system',
      });
      throw error;
    }
  };

  const handleEditDoctor = async (payload: any) => {
    if (!selectedDoctor) return;
    try {
      // Remove role from payload if present (not allowed in updates)
      const { role, ...updatePayload } = payload;
      await updateUserMutation.mutate({ id: selectedDoctor.id, payload: updatePayload });
      toast.success(`Doctor ${updatePayload.name || selectedDoctor.name} has been updated successfully`);
      addNotification({
        title: 'Doctor updated',
        message: `${updatePayload.name || selectedDoctor.name}'s profile has been updated.`,
        type: 'success',
        priority: 'medium',
        category: 'system',
        userId: 'system',
      });
      setIsEditModalOpen(false);
      setSelectedDoctor(null);
      await refetch();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to update doctor';
      toast.error(errorMessage);
      addNotification({
        title: 'Unable to update doctor',
        message: errorMessage,
        type: 'error',
        priority: 'high',
        category: 'system',
        userId: 'system',
      });
      throw error;
    }
  };

  const handleDeleteDoctor = async (doctorId: string, doctorName: string) => {
    if (!window.confirm(`Are you sure you want to deactivate ${doctorName}? They will be marked inactive.`)) {
      return;
    }
    try {
      await deleteUserMutation.mutate(doctorId);
      toast.success(`Doctor ${doctorName} has been deactivated successfully`);
      addNotification({
        title: 'Doctor deactivated',
        message: `${doctorName} is now marked as inactive.`,
        type: 'info',
        priority: 'medium',
        category: 'system',
        userId: 'system',
      });
      await refetch();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to deactivate doctor');
      addNotification({
        title: 'Unable to deactivate doctor',
        message: error?.message ?? 'Please try again later.',
        type: 'error',
        priority: 'high',
        category: 'system',
        userId: 'system',
      });
    }
  };

  const handleToggleStatus = async (doctor: User) => {
    const newStatus = !doctor.isActive;
    try {
      await updateStatusMutation.mutate({ id: doctor.id, isActive: newStatus });
      toast.success(`Doctor ${doctor.name} has been ${newStatus ? 'activated' : 'deactivated'}`);
      addNotification({
        title: `Doctor ${newStatus ? 'activated' : 'deactivated'}`,
        message: `${doctor.name} is now ${newStatus ? 'active' : 'inactive'}.`,
        type: 'success',
        priority: 'medium',
        category: 'system',
        userId: 'system',
      });
      await refetch();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update doctor status');
      addNotification({
        title: 'Unable to update doctor status',
        message: error?.message ?? 'Please try again later.',
        type: 'error',
        priority: 'high',
        category: 'system',
        userId: 'system',
      });
    }
  };

  const getSpecializationColor = (specialization?: string) => {
    switch (specialization) {
      case 'neurologist':
        return 'bg-purple-100 text-purple-800';
      case 'orthopedist':
        return 'bg-blue-100 text-blue-800';
      case 'physiotherapist':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatSpecialization = (specialization?: string) => {
    if (!specialization) return 'Not specified';
    return specialization.charAt(0).toUpperCase() + specialization.slice(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <Stethoscope className="h-6 w-6 text-primary-500" />
            <span>Doctors</span>
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage doctors and their specializations.
          </p>
        </div>
        {isAdmin && (
          <div className="mt-4 sm:mt-0">
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="btn-primary flex items-center"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Doctor
            </button>
          </div>
        )}
      </div>

      <div className="card">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search doctors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="input-field"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="card bg-red-50 border border-red-200 text-red-700">
          Unable to load doctors. Please refresh or try again later.
        </div>
      )}

      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Doctor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Specialization
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  License Number
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
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-10 text-center text-sm text-gray-500"
                  >
                    Loading doctors...
                  </td>
                </tr>
              ) : filteredDoctors.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-10 text-center text-sm text-gray-500"
                  >
                    No doctors match your filters yet.
                  </td>
                </tr>
              ) : (
                filteredDoctors.map((doctor) => (
                  <tr key={doctor.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center">
                        {doctor.avatar ? (
                          <img
                            src={doctor.avatar.startsWith('http') ? doctor.avatar : getAssetUrl(doctor.avatar)}
                            alt={doctor.name}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
                            {doctor.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                        )}
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {doctor.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {doctor.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getSpecializationColor((doctor as any).doctorSpecialization)}`}
                      >
                        {formatSpecialization((doctor as any).doctorSpecialization)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {doctor.phone ? (
                          <div className="flex items-center">
                            <Phone className="mr-2 h-4 w-4 text-gray-400" />
                            {doctor.phone}
                          </div>
                        ) : (
                          <span className="text-gray-400">No phone</span>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center">
                        <Award className="mr-2 h-4 w-4 text-gray-400" />
                        <div className="text-sm text-gray-900">
                          {doctor.licenseNumber || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`status-badge ${
                          doctor.isActive !== false
                            ? 'status-active'
                            : 'status-inactive'
                        }`}
                      >
                        {doctor.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                      <div className="flex items-center space-x-3">
                        <button 
                          onClick={() => {
                            // For now, show doctor info in an alert. Can be enhanced to show a modal later
                            alert(`Doctor Details:\n\nName: ${doctor.name}\nEmail: ${doctor.email}\nPhone: ${doctor.phone || 'N/A'}\nSpecialization: ${formatSpecialization((doctor as any).doctorSpecialization)}\nLicense: ${doctor.licenseNumber || 'N/A'}\nStatus: ${doctor.isActive !== false ? 'Active' : 'Inactive'}`);
                          }}
                          className="text-primary-600 hover:text-primary-900"
                          title="View doctor details"
                        >
                          <Eye className="mr-1 inline h-4 w-4" />
                          View
                        </button>
                        {isAdmin && (
                          <>
                            <button 
                              onClick={() => {
                                setSelectedDoctor(doctor);
                                setIsEditModalOpen(true);
                              }}
                              className="text-secondary-600 hover:text-secondary-900"
                            >
                              <Edit className="mr-1 inline h-4 w-4" />
                              Edit
                            </button>
                            <button 
                              onClick={() => handleToggleStatus(doctor)}
                              className={`${
                                doctor.isActive !== false
                                  ? 'text-yellow-600 hover:text-yellow-900'
                                  : 'text-green-600 hover:text-green-900'
                              }`}
                            >
                              {doctor.isActive !== false ? 'Deactivate' : 'Activate'}
                            </button>
                            <button 
                              onClick={() => handleDeleteDoctor(doctor.id, doctor.name)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="mr-1 inline h-4 w-4" />
                              Delete
                            </button>
                          </>
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

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card text-center">
          <div className="text-2xl font-bold text-primary-600">
            {doctors.filter((d) => d.isActive !== false).length}
          </div>
          <div className="text-sm text-gray-600">Active Doctors</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-blue-600">
            {doctors.filter((d) => (d as any).doctorSpecialization === 'neurologist').length}
          </div>
          <div className="text-sm text-gray-600">Neurologists</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-600">
            {doctors.filter((d) => (d as any).doctorSpecialization === 'orthopedist').length}
          </div>
          <div className="text-sm text-gray-600">Orthopedists</div>
        </div>
      </div>

      {/* Add Doctor Modal */}
      <AddEditUserModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={async (payload) => {
          // Force role to 'doctor' when creating from Doctors page
          await handleCreateDoctor({ ...payload, role: 'doctor' });
        }}
        isSaving={createUserMutation.loading}
        user={null}
        title="Add Doctor"
        description="Add a new doctor to the system. They will receive login credentials via email."
        hideRoleSelector={true}
        defaultRole="specialist"
        showSpecialization={true}
      />

      {/* Edit Doctor Modal */}
      <AddEditUserModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedDoctor(null);
        }}
        onSave={handleEditDoctor}
        isSaving={updateUserMutation.loading}
        user={selectedDoctor}
        title="Edit Doctor"
        description="Update doctor information and password."
        hideRoleSelector={true}
        showSpecialization={true}
      />
    </div>
  );
}

