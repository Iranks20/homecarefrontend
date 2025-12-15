import { useMemo, useState } from 'react';
import { Search, Filter, Plus, Eye, Edit, Phone, Mail, Clock, Star, Award, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { Specialist } from '../types';
import AddEditSpecialistModal from '../components/AddEditSpecialistModal';
import { useApi, useApiMutation } from '../hooks/useApi';
import { specialistService } from '../services/specialists';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';

export default function Specialists() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSpecialization, setFilterSpecialization] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSpecialist, setSelectedSpecialist] = useState<Specialist | null>(null);
  const { addNotification } = useNotifications();

  const {
    data: specialistsData,
    loading,
    error,
    refetch,
  } = useApi(() => specialistService.getSpecialists({ limit: 200 }), []);

  const specialistsList = specialistsData?.specialists ?? [];

  const filteredSpecialists = useMemo(() => {
    return specialistsList.filter((specialist) => {
      const matchesSearch =
        specialist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        specialist.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
        specialist.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSpecialization =
        filterSpecialization === 'all' || specialist.specialization === filterSpecialization;
      const matchesStatus = filterStatus === 'all' || specialist.status === filterStatus;

      return matchesSearch && matchesSpecialization && matchesStatus;
    });
  }, [specialistsList, searchTerm, filterSpecialization, filterStatus]);

  const createSpecialistMutation = useApiMutation(specialistService.createSpecialist.bind(specialistService));
  const updateSpecialistMutation = useApiMutation(
    (params: { id: string; data: Parameters<typeof specialistService.updateSpecialist>[1] }) =>
      specialistService.updateSpecialist(params.id, params.data)
  );
  const deleteSpecialistMutation = useApiMutation((id: string) => specialistService.deleteSpecialist(id));

  const handleAddSpecialist = async (specialistData: Parameters<typeof specialistService.createSpecialist>[0]) => {
    try {
      await createSpecialistMutation.mutate(specialistData);
      toast.success(`Specialist ${specialistData.name} has been added successfully`);
      addNotification({
        title: 'Specialist Added',
        message: `${specialistData.name} has been added to the roster.`,
        type: 'success',
        userId: 'system',
        priority: 'medium',
        category: 'specialist',
      });
      await refetch();
      setIsAddModalOpen(false);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to add specialist';
      toast.error(errorMessage);
      addNotification({
        title: 'Unable to add specialist',
        message: errorMessage,
        type: 'error',
        userId: 'system',
        priority: 'high',
        category: 'system',
      });
      throw err;
    }
  };

  const handleEditSpecialist = async (specialistData: Parameters<typeof specialistService.updateSpecialist>[1]) => {
    if (!selectedSpecialist) return;

    try {
      await updateSpecialistMutation.mutate({ id: selectedSpecialist.id, data: specialistData });
      toast.success(`Specialist ${specialistData.name ?? selectedSpecialist.name} has been updated successfully`);
      addNotification({
        title: 'Specialist Updated',
        message: `${specialistData.name ?? selectedSpecialist.name} has been updated.`,
        type: 'success',
        userId: 'system',
        priority: 'medium',
        category: 'specialist',
      });
      await refetch();
      setIsEditModalOpen(false);
      setSelectedSpecialist(null);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to update specialist';
      toast.error(errorMessage);
      addNotification({
        title: 'Unable to update specialist',
        message: errorMessage,
        type: 'error',
        userId: 'system',
        priority: 'high',
        category: 'system',
      });
      throw err;
    }
  };

  const handleDeleteSpecialist = async (specialistId: string, specialistName: string) => {
    if (!window.confirm(`Mark ${specialistName} as inactive?`)) {
      return;
    }

    try {
      await deleteSpecialistMutation.mutate(specialistId);
      toast.success(`Specialist ${specialistName} has been marked as inactive`);
      addNotification({
        title: 'Specialist Updated',
        message: `${specialistName} is now marked as inactive.`,
        type: 'info',
        userId: 'system',
        priority: 'medium',
        category: 'specialist',
      });
      await refetch();
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to update specialist';
      toast.error(errorMessage);
      addNotification({
        title: 'Unable to update specialist',
        message: errorMessage,
        type: 'error',
        userId: 'system',
        priority: 'high',
        category: 'system',
      });
    }
  };

  const openEditModal = (specialist: Specialist) => {
    setSelectedSpecialist(specialist);
    setIsEditModalOpen(true);
  };

  const getSpecializationColor = (specialization: string) => {
    switch (specialization) {
      case 'clinical-psychologist':
        return 'bg-purple-100 text-purple-800';
      case 'nutritionist':
        return 'bg-green-100 text-green-800';
      case 'critical-care-nurse':
        return 'bg-red-100 text-red-800';
      case 'medical-doctor':
        return 'bg-blue-100 text-blue-800';
      case 'geriatrician':
        return 'bg-indigo-100 text-indigo-800';
      case 'palliative-care-specialist':
        return 'bg-gray-100 text-gray-800';
      case 'senior-midwife':
        return 'bg-rose-100 text-rose-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'status-active';
      case 'inactive':
        return 'status-inactive';
      case 'on-leave':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'status-inactive';
    }
  };

  const formatSpecialization = (specialization: string) => {
    return specialization.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getAvailabilityText = (availability: any[]) => {
    const availableDays = availability?.filter(slot => slot.isAvailable).length || 0;
    return `${availableDays} days/week`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <Award className="h-6 w-6 text-primary-500" />
            <span>Specialists</span>
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage healthcare specialists and their availability.
          </p>
        </div>
        {isAdmin && (
          <div className="mt-4 sm:mt-0">
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="btn-primary flex items-center"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Specialist
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
                placeholder="Search specialists..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={filterSpecialization}
              onChange={(e) => setFilterSpecialization(e.target.value)}
              className="input-field"
            >
              <option value="all">All Specializations</option>
              <option value="clinical-psychologist">Clinical Psychologist</option>
              <option value="nutritionist">Nutritionist</option>
              <option value="critical-care-nurse">Critical Care Nurse</option>
              <option value="medical-doctor">Medical Doctor</option>
              <option value="geriatrician">Geriatrician</option>
              <option value="palliative-care-specialist">Palliative Care Specialist</option>
              <option value="senior-midwife">Senior Midwife</option>
            </select>
          </div>
          <div className="sm:w-48">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-field"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="on-leave">On Leave</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="card bg-red-50 border border-red-200 text-red-700">
          Unable to load specialists. Please refresh or try again later.
        </div>
      )}

      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Specialist
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Specialization
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Experience
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Hourly Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Availability
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
                    colSpan={8}
                    className="px-6 py-10 text-center text-sm text-gray-500"
                  >
                    Loading specialists...
                  </td>
                </tr>
              ) : filteredSpecialists.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-10 text-center text-sm text-gray-500"
                  >
                    No specialists match your filters yet.
                  </td>
                </tr>
              ) : (
                filteredSpecialists.map((specialist) => (
                  <tr key={specialist.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center">
                        {specialist.avatar ? (
                          <img
                            src={specialist.avatar.startsWith('http') 
                              ? specialist.avatar 
                              : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://51.20.98.153:3007'}${specialist.avatar.startsWith('/') ? specialist.avatar : '/' + specialist.avatar}`}
                            alt={specialist.name}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
                            {specialist.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                        )}
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {specialist.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {specialist.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getSpecializationColor(specialist.specialization)}`}
                      >
                        {formatSpecialization(specialist.specialization)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {specialist.phone ? (
                          <div className="flex items-center">
                            <Phone className="mr-2 h-4 w-4 text-gray-400" />
                            {specialist.phone}
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
                          {specialist.experience} years
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center">
                        <Star className="mr-2 h-4 w-4 text-gray-400" />
                        <div className="text-sm text-gray-900">
                          ${specialist.hourlyRate}/hr
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center">
                        <Clock className="mr-2 h-4 w-4 text-gray-400" />
                        <div className="text-sm text-gray-900">
                          {getAvailabilityText(specialist.availability)}
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`status-badge ${getStatusColor(specialist.status)}`}
                      >
                        {specialist.status.charAt(0).toUpperCase() + specialist.status.slice(1)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                      <div className="flex items-center space-x-3">
                        <button 
                          onClick={() => {
                            alert(`Specialist Details:\n\nName: ${specialist.name}\nEmail: ${specialist.email}\nPhone: ${specialist.phone || 'N/A'}\nSpecialization: ${formatSpecialization(specialist.specialization)}\nExperience: ${specialist.experience} years\nHourly Rate: $${specialist.hourlyRate}/hr\nLicense: ${specialist.licenseNumber}\nStatus: ${specialist.status}\nHire Date: ${new Date(specialist.hireDate).toLocaleDateString()}\nAvailability: ${getAvailabilityText(specialist.availability)}`);
                          }}
                          className="text-primary-600 hover:text-primary-900"
                          title="View specialist details"
                        >
                          <Eye className="mr-1 inline h-4 w-4" />
                          View
                        </button>
                        {isAdmin && (
                          <>
                            <button 
                              onClick={() => openEditModal(specialist)}
                              className="text-secondary-600 hover:text-secondary-900"
                            >
                              <Edit className="mr-1 inline h-4 w-4" />
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDeleteSpecialist(specialist.id, specialist.name)}
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <div className="text-2xl font-bold text-primary-600">
            {specialistsList.filter((s) => s.status === 'active').length}
          </div>
          <div className="text-sm text-gray-600">Active Specialists</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-600">
            {specialistsList.filter((s) => s.specialization === 'medical-doctor').length}
          </div>
          <div className="text-sm text-gray-600">Medical Doctors</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-blue-600">
            {specialistsList.filter((s) => s.specialization === 'clinical-psychologist').length}
          </div>
          <div className="text-sm text-gray-600">Psychologists</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-purple-600">
            {specialistsList.filter((s) => s.specialization === 'nutritionist').length}
          </div>
          <div className="text-sm text-gray-600">Nutritionists</div>
        </div>
      </div>

      {/* Add Specialist Modal */}
      <AddEditSpecialistModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddSpecialist}
        mode="add"
      />

      {/* Edit Specialist Modal */}
      <AddEditSpecialistModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedSpecialist(null);
        }}
        onSave={handleEditSpecialist}
        specialist={selectedSpecialist}
        mode="edit"
      />
    </div>
  );
}
