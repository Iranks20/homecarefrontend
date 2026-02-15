import { useMemo, useState } from 'react';
import { Search, Plus, Edit, Phone, Trash2, TestTube } from 'lucide-react';
import { toast } from 'react-toastify';
import { User } from '../types';
import AddEditLabAttendantModal from '../components/AddEditLabAttendantModal';
import { useApi, useApiMutation } from '../hooks/useApi';
import { userService } from '../services/users';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import { getAssetUrl } from '../config/api';

export default function LabAttendants() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedLabAttendant, setSelectedLabAttendant] = useState<User | null>(null);
  const { addNotification } = useNotifications();

  const {
    data: labAttendantsData,
    loading,
    error,
    refetch,
  } = useApi(() => userService.getUsers({ role: 'lab_attendant', limit: 200 }), []);

  const labAttendantsList = labAttendantsData?.users ?? [];

  const filteredLabAttendants = useMemo(() => {
    return labAttendantsList.filter((attendant) => {
      const matchesSearch =
        attendant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        attendant.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (attendant.phone && attendant.phone.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'active' && attendant.isActive) ||
        (filterStatus === 'inactive' && !attendant.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [labAttendantsList, searchTerm, filterStatus]);

  const createLabAttendantMutation = useApiMutation(userService.createUser.bind(userService));
  const updateLabAttendantMutation = useApiMutation(
    (params: { id: string; data: Parameters<typeof userService.updateUser>[1] }) =>
      userService.updateUser(params.id, params.data)
  );
  const deleteLabAttendantMutation = useApiMutation((id: string) => userService.deleteUser(id));

  const handleAddLabAttendant = async (data: {
    username: string;
    name: string;
    email?: string;
    password?: string;
    phone?: string;
    department?: string;
    isActive?: boolean;
    role?: User['role'];
  }) => {
    try {
      const dataWithRole: Parameters<typeof userService.createUser>[0] = {
        ...data,
        username: (data.username ?? data.email?.trim().split('@')[0] ?? data.name.replace(/\s+/g, '').toLowerCase()) || 'lab_attendant',
        role: 'lab_attendant' as const,
      };
      await createLabAttendantMutation.mutate(dataWithRole);
      toast.success(`Lab attendant ${data.name} has been added successfully`);
      addNotification({
        title: 'Lab Attendant Added',
        message: `${data.name} has been added to the system.`,
        type: 'success',
        userId: 'system',
        priority: 'medium',
        category: 'system',
      });
      await refetch();
      setIsAddModalOpen(false);
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { message?: string }; message?: string }; message?: string })?.response?.data
          ?.message ||
        (err as { message?: string })?.message ||
        'Failed to add lab attendant';
      toast.error(errorMessage);
      addNotification({
        title: 'Unable to add lab attendant',
        message: errorMessage,
        type: 'error',
        userId: 'system',
        priority: 'high',
        category: 'system',
      });
      throw err;
    }
  };

  const handleEditLabAttendant = async (data: Parameters<typeof userService.updateUser>[1]) => {
    if (!selectedLabAttendant) return;
    try {
      await updateLabAttendantMutation.mutate({ id: selectedLabAttendant.id, data });
      toast.success(`Lab attendant ${data.name ?? selectedLabAttendant.name} has been updated successfully`);
      addNotification({
        title: 'Lab Attendant Updated',
        message: `${data.name ?? selectedLabAttendant.name} has been updated.`,
        type: 'success',
        userId: 'system',
        priority: 'medium',
        category: 'system',
      });
      await refetch();
      setIsEditModalOpen(false);
      setSelectedLabAttendant(null);
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { message?: string }; message?: string }; message?: string })?.response?.data
          ?.message ||
        (err as { message?: string })?.message ||
        'Failed to update lab attendant';
      toast.error(errorMessage);
      addNotification({
        title: 'Unable to update lab attendant',
        message: errorMessage,
        type: 'error',
        userId: 'system',
        priority: 'high',
        category: 'system',
      });
      throw err;
    }
  };

  const handleDeleteLabAttendant = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to deactivate ${name}?`)) return;
    try {
      await deleteLabAttendantMutation.mutate(id);
      toast.success(`Lab attendant ${name} has been deactivated`);
      addNotification({
        title: 'Lab Attendant Deactivated',
        message: `${name} is now deactivated.`,
        type: 'info',
        userId: 'system',
        priority: 'medium',
        category: 'system',
      });
      await refetch();
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { message?: string }; message?: string }; message?: string })?.response?.data
          ?.message ||
        (err as { message?: string })?.message ||
        'Failed to deactivate lab attendant';
      toast.error(errorMessage);
      addNotification({
        title: 'Unable to deactivate lab attendant',
        message: errorMessage,
        type: 'error',
        userId: 'system',
        priority: 'high',
        category: 'system',
      });
    }
  };

  const openEditModal = (attendant: User) => {
    setSelectedLabAttendant(attendant);
    setIsEditModalOpen(true);
  };

  const getStatusColor = (isActive: boolean | undefined) => {
    return isActive ? 'status-active' : 'status-inactive';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <TestTube className="h-6 w-6 text-primary-500" />
            <span>Lab Attendants</span>
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage lab staff who handle investigations and record lab details.
          </p>
        </div>
        {isAdmin && (
          <div className="mt-4 sm:mt-0">
            <button onClick={() => setIsAddModalOpen(true)} className="btn-primary flex items-center">
              <Plus className="mr-2 h-4 w-4" />
              Add Lab Attendant
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
                placeholder="Search lab attendants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
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
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="card bg-red-50 border border-red-200 text-red-700">
          Unable to load lab attendants. Please refresh or try again later.
        </div>
      )}

      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Lab Attendant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Department
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
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500">
                    Loading lab attendants...
                  </td>
                </tr>
              ) : filteredLabAttendants.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500">
                    No lab attendants match your filters yet.
                  </td>
                </tr>
              ) : (
                filteredLabAttendants.map((attendant) => (
                  <tr key={attendant.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center">
                        {attendant.avatar ? (
                          <img
                            src={
                              attendant.avatar.startsWith('http')
                                ? attendant.avatar
                                : getAssetUrl(attendant.avatar)
                            }
                            alt={attendant.name}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
                            {attendant.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                        )}
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{attendant.name}</div>
                          <div className="text-sm text-gray-500">{attendant.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {attendant.phone ? (
                          <div className="flex items-center">
                            <Phone className="mr-2 h-4 w-4 text-gray-400" />
                            {attendant.phone}
                          </div>
                        ) : (
                          <span className="text-gray-400">No phone</span>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {attendant.department || <span className="text-gray-400">No department</span>}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`status-badge ${getStatusColor(attendant.isActive)}`}>
                        {attendant.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                      <div className="flex items-center space-x-3">
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => openEditModal(attendant)}
                              className="text-secondary-600 hover:text-secondary-900"
                            >
                              <Edit className="mr-1 inline h-4 w-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteLabAttendant(attendant.id, attendant.name)}
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card text-center">
          <div className="text-2xl font-bold text-primary-600">
            {labAttendantsList.filter((r) => r.isActive).length}
          </div>
          <div className="text-sm text-gray-600">Active Lab Attendants</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-gray-600">{labAttendantsList.length}</div>
          <div className="text-sm text-gray-600">Total Lab Attendants</div>
        </div>
      </div>

      <AddEditLabAttendantModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddLabAttendant}
        mode="add"
      />

      <AddEditLabAttendantModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedLabAttendant(null);
        }}
        onSave={handleEditLabAttendant}
        labAttendant={selectedLabAttendant}
        mode="edit"
      />
    </div>
  );
}
