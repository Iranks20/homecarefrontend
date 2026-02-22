import { useMemo, useState, useEffect } from 'react';
import { Search, Plus, Eye, Edit, Trash2, Stethoscope, Phone, Award } from 'lucide-react';
import AddEditTherapistModal from '../components/AddEditTherapistModal';
import { useApi, useApiMutation } from '../hooks/useApi';
import { therapistService, type Therapist, type CreateTherapistData } from '../services/therapists';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

export default function Therapists() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTherapist, setSelectedTherapist] = useState<Therapist | null>(null);
  const { addNotification } = useNotifications();

  const {
    data,
    loading,
    error,
    refetch,
  } = useApi(() => therapistService.getTherapists({ 
    limit: 200 
  }), []);

  const therapists = data?.therapists ?? [];

  const createTherapistMutation = useApiMutation(therapistService.createTherapist.bind(therapistService));
  const updateTherapistMutation = useApiMutation(
    ({ id, payload }: { id: string; payload: Partial<CreateTherapistData> }) =>
      therapistService.updateTherapist(id, payload)
  );
  const deleteTherapistMutation = useApiMutation(therapistService.deleteTherapist.bind(therapistService));

  const filteredTherapists = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    return therapists.filter((therapist) => {
      const matchesSearch =
        !search ||
        therapist.name.toLowerCase().includes(search) ||
        therapist.email?.toLowerCase().includes(search) ||
        therapist.specialization.toLowerCase().includes(search) ||
        therapist.licenseNumber?.toLowerCase().includes(search);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && therapist.status === 'active') ||
        (statusFilter === 'inactive' && therapist.status === 'inactive');

      return matchesSearch && matchesStatus;
    });
  }, [therapists, searchTerm, statusFilter]);

  const handleCreateTherapist = async (payload: any) => {
    try {
      const createPayload: CreateTherapistData = {
        username: payload.username ?? payload.email?.trim().split('@')[0] ?? payload.name?.replace(/\s+/g, '').toLowerCase() ?? 'therapist',
        name: payload.name,
        email: payload.email,
        password: payload.password,
        phone: payload.phone,
        specialization: payload.specialization,
        licenseNumber: payload.licenseNumber,
        experience: payload.experience,
        certifications: payload.certifications || [],
        hourlyRate: payload.hourlyRate,
        bio: payload.bio || '',
        hireDate: payload.hireDate,
        avatar: payload.avatar || '',
      };
      await createTherapistMutation.mutate(createPayload);
      toast.success(`Therapist ${payload.name} has been created successfully`);
      addNotification({
        title: 'Therapist created',
        message: `${payload.name} has been added to the team.`,
        type: 'success',
        priority: 'medium',
        category: 'system',
        userId: 'system',
      });
      setIsAddModalOpen(false);
      await refetch();
    } catch (error: any) {
      toast.error(error?.message ?? 'Failed to create therapist');
    }
  };

  const handleEditTherapist = async (payload: any) => {
    if (!selectedTherapist) return;
    try {
      const updatePayload: Partial<CreateTherapistData> = {
        name: payload.name,
        phone: payload.phone,
        specialization: payload.specialization,
        licenseNumber: payload.licenseNumber,
        experience: payload.experience,
        certifications: payload.certifications || [],
        hourlyRate: payload.hourlyRate,
        bio: payload.bio || '',
        hireDate: payload.hireDate,
        avatar: payload.avatar || '',
      };
      await updateTherapistMutation.mutate({ 
        id: selectedTherapist.id, 
        payload: updatePayload
      });
      toast.success(`Therapist ${payload.name} has been updated`);
      addNotification({
        title: 'Therapist updated',
        message: `${payload.name} details have been updated.`,
        type: 'info',
        priority: 'medium',
        category: 'system',
        userId: 'system',
      });
      setIsEditModalOpen(false);
      setSelectedTherapist(null);
      await refetch();
    } catch (error: any) {
      toast.error(error?.message ?? 'Failed to update therapist');
    }
  };

  const handleDeleteTherapist = async (therapistId: string) => {
    if (!window.confirm('Are you sure you want to remove this therapist?')) return;
    try {
      await deleteTherapistMutation.mutate(therapistId);
      toast.success('Therapist removed');
      await refetch();
    } catch (error: any) {
      toast.error(error?.message ?? 'Failed to remove therapist');
    }
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Therapists</h1>
            <p className="text-sm text-gray-500">Manage therapists and their availability.</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Therapist
            </button>
          )}
        </div>

        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search therapists..."
              className="input-field pl-10"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              className="input-field"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Specialization</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                {isAdmin && (
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="px-6 py-8 text-center text-sm text-gray-500">
                    Loading therapists...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="px-6 py-8 text-center text-sm text-red-500">
                    {error instanceof Error ? error.message : String(error)}
                  </td>
                </tr>
              ) : filteredTherapists.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="px-6 py-8 text-center text-sm text-gray-500">
                    No therapists found.
                  </td>
                </tr>
              ) : (
                filteredTherapists.map((therapist) => (
                  <tr key={therapist.id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                          <Stethoscope className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{therapist.name}</div>
                          <div className="text-xs text-gray-500">{therapist.licenseNumber ?? '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">{therapist.email ?? <span className="text-gray-400 italic">Not provided</span>}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 capitalize">
                      {therapist.specialization ?? '—'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">{therapist.phone ?? '—'}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                          therapist.status === 'active'
                            ? 'bg-green-50 text-green-700'
                            : therapist.status === 'inactive'
                            ? 'bg-gray-100 text-gray-600'
                            : 'bg-yellow-50 text-yellow-700'
                        }`}
                      >
                        <span
                          className={`mr-2 inline-block h-2 w-2 rounded-full ${
                            therapist.status === 'active' ? 'bg-green-500' : 
                            therapist.status === 'inactive' ? 'bg-gray-400' : 'bg-yellow-500'
                          }`}
                        />
                        {therapist.status === 'active' ? 'Active' : 
                         therapist.status === 'inactive' ? 'Inactive' : 'On Leave'}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium space-x-2">
                        <button
                          onClick={() => {
                            setSelectedTherapist(therapist);
                            setIsEditModalOpen(true);
                          }}
                          className="text-secondary-600 hover:text-secondary-900 inline-flex items-center"
                        >
                          <Edit className="mr-1 h-4 w-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteTherapist(therapist.id)}
                          className="text-red-600 hover:text-red-900 inline-flex items-center"
                        >
                          <Trash2 className="mr-1 h-4 w-4" />
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isAdmin && (
        <AddEditTherapistModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSave={handleCreateTherapist}
          mode="add"
          isSaving={createTherapistMutation.loading}
        />
      )}

      {isAdmin && selectedTherapist && (
        <AddEditTherapistModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedTherapist(null);
          }}
          onSave={handleEditTherapist}
          therapist={selectedTherapist as any}
          mode="edit"
          isSaving={updateTherapistMutation.loading}
        />
      )}
    </div>
  );
}
