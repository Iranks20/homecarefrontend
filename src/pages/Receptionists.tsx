import { useMemo, useState } from 'react';
import { Search, Plus, Edit, Phone, Trash2, ClipboardList } from 'lucide-react';
import { toast } from 'react-toastify';
import { User } from '../types';
import AddEditReceptionistModal from '../components/AddEditReceptionistModal';
import { useApi, useApiMutation } from '../hooks/useApi';
import { userService } from '../services/users';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import { getAssetUrl } from '../config/api';

export default function Receptionists() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedReceptionist, setSelectedReceptionist] = useState<User | null>(null);
  const { addNotification } = useNotifications();

  const {
    data: receptionistsData,
    loading,
    error,
    refetch,
  } = useApi(() => userService.getUsers({ role: 'receptionist', limit: 200 }), []);

  const receptionistsList = receptionistsData?.users ?? [];

  const filteredReceptionists = useMemo(() => {
    return receptionistsList.filter((receptionist) => {
      const matchesSearch =
        receptionist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        receptionist.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (receptionist.phone && receptionist.phone.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'active' && receptionist.isActive) ||
        (filterStatus === 'inactive' && !receptionist.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [receptionistsList, searchTerm, filterStatus]);

  const createReceptionistMutation = useApiMutation(userService.createUser.bind(userService));
  const updateReceptionistMutation = useApiMutation(
    (params: { id: string; data: Parameters<typeof userService.updateUser>[1] }) =>
      userService.updateUser(params.id, params.data)
  );
  const deleteReceptionistMutation = useApiMutation((id: string) => userService.deleteUser(id));

  const handleAddReceptionist = async (data: {
    name: string;
    email: string;
    password?: string;
    phone?: string;
    department?: string;
    isActive?: boolean;
    role: User['role'];
  }) => {
    try {
      const dataWithRole: Parameters<typeof userService.createUser>[0] = { ...data, role: 'receptionist' as const };
      await createReceptionistMutation.mutate(dataWithRole);
      toast.success(`Receptionist ${data.name} has been added successfully`);
      addNotification({
        title: 'Receptionist Added',
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
        'Failed to add receptionist';
      toast.error(errorMessage);
      addNotification({
        title: 'Unable to add receptionist',
        message: errorMessage,
        type: 'error',
        userId: 'system',
        priority: 'high',
        category: 'system',
      });
      throw err;
    }
  };

  const handleEditReceptionist = async (data: Parameters<typeof userService.updateUser>[1]) => {
    if (!selectedReceptionist) return;

    try {
      await updateReceptionistMutation.mutate({ id: selectedReceptionist.id, data });
      toast.success(`Receptionist ${data.name ?? selectedReceptionist.name} has been updated successfully`);
      addNotification({
        title: 'Receptionist Updated',
        message: `${data.name ?? selectedReceptionist.name} has been updated.`,
        type: 'success',
        userId: 'system',
        priority: 'medium',
        category: 'system',
      });
      await refetch();
      setIsEditModalOpen(false);
      setSelectedReceptionist(null);
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { message?: string }; message?: string }; message?: string })?.response?.data
          ?.message ||
        (err as { message?: string })?.message ||
        'Failed to update receptionist';
      toast.error(errorMessage);
      addNotification({
        title: 'Unable to update receptionist',
        message: errorMessage,
        type: 'error',
        userId: 'system',
        priority: 'high',
        category: 'system',
      });
      throw err;
    }
  };

  const handleDeleteReceptionist = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to deactivate ${name}?`)) {
      return;
    }

    try {
      await deleteReceptionistMutation.mutate(id);
      toast.success(`Receptionist ${name} has been deactivated`);
      addNotification({
        title: 'Receptionist Deactivated',
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
        'Failed to deactivate receptionist';
      toast.error(errorMessage);
      addNotification({
        title: 'Unable to deactivate receptionist',
        message: errorMessage,
        type: 'error',
        userId: 'system',
        priority: 'high',
        category: 'system',
      });
    }
  };

  const openEditModal = (receptionist: User) => {
    setSelectedReceptionist(receptionist);
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
            <ClipboardList className="h-6 w-6 text-primary-500" />
            <span>Receptionists</span>
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage front-desk and patient registration staff.
          </p>
        </div>
        {isAdmin && (
          <div className="mt-4 sm:mt-0">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="btn-primary flex items-center"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Receptionist
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
                placeholder="Search receptionists..."
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
          Unable to load receptionists. Please refresh or try again later.
        </div>
      )}

      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Receptionist
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
                    Loading receptionists...
                  </td>
                </tr>
              ) : filteredReceptionists.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500">
                    No receptionists match your filters yet.
                  </td>
                </tr>
              ) : (
                filteredReceptionists.map((receptionist) => (
                  <tr key={receptionist.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center">
                        {receptionist.avatar ? (
                          <img
                            src={
                              receptionist.avatar.startsWith('http')
                                ? receptionist.avatar
                                : getAssetUrl(receptionist.avatar)
                            }
                            alt={receptionist.name}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
                            {receptionist.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                        )}
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{receptionist.name}</div>
                          <div className="text-sm text-gray-500">{receptionist.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {receptionist.phone ? (
                          <div className="flex items-center">
                            <Phone className="mr-2 h-4 w-4 text-gray-400" />
                            {receptionist.phone}
                          </div>
                        ) : (
                          <span className="text-gray-400">No phone</span>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {receptionist.department || <span className="text-gray-400">No department</span>}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`status-badge ${getStatusColor(receptionist.isActive)}`}>
                        {receptionist.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                      <div className="flex items-center space-x-3">
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => openEditModal(receptionist)}
                              className="text-secondary-600 hover:text-secondary-900"
                            >
                              <Edit className="mr-1 inline h-4 w-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteReceptionist(receptionist.id, receptionist.name)}
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
            {receptionistsList.filter((r) => r.isActive).length}
          </div>
          <div className="text-sm text-gray-600">Active Receptionists</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-gray-600">{receptionistsList.length}</div>
          <div className="text-sm text-gray-600">Total Receptionists</div>
        </div>
      </div>

      <AddEditReceptionistModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddReceptionist}
        mode="add"
      />

      <AddEditReceptionistModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedReceptionist(null);
        }}
        onSave={handleEditReceptionist}
        receptionist={selectedReceptionist}
        mode="edit"
      />
    </div>
  );
}
