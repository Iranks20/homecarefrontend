import { useMemo, useState } from 'react';
import { Search, Plus, Eye, Edit, Phone, Mail, Trash2, CreditCard } from 'lucide-react';
import { toast } from 'react-toastify';
import { User } from '../types';
import AddEditBillerModal from '../components/AddEditBillerModal';
import ViewBillerModal from '../components/ViewBillerModal';
import { useApi, useApiMutation } from '../hooks/useApi';
import { userService } from '../services/users';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import { getAssetUrl } from '../config/api';

export default function Billers() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedBiller, setSelectedBiller] = useState<User | null>(null);
  const { addNotification } = useNotifications();

  const openViewModal = (biller: User) => {
    setSelectedBiller(biller);
    setIsViewModalOpen(true);
  };

  const {
    data: billersData,
    loading,
    error,
    refetch,
  } = useApi(() => userService.getUsers({ role: 'biller', limit: 200 }), []);

  const billersList = billersData?.users ?? [];

  const filteredBillers = useMemo(() => {
    return billersList.filter((biller) => {
      const matchesSearch =
        biller.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        biller.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (biller.phone && biller.phone.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = 
        filterStatus === 'all' || 
        (filterStatus === 'active' && biller.isActive) ||
        (filterStatus === 'inactive' && !biller.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [billersList, searchTerm, filterStatus]);

  const createBillerMutation = useApiMutation(userService.createUser.bind(userService));
  const updateBillerMutation = useApiMutation(
    (params: { id: string; data: Parameters<typeof userService.updateUser>[1] }) =>
      userService.updateUser(params.id, params.data)
  );
  const deleteBillerMutation = useApiMutation((id: string) => userService.deleteUser(id));

  const handleAddBiller = async (billerData: { name: string; email: string; password?: string; phone?: string; department?: string; isActive?: boolean; role: User['role'] }) => {
    try {
      // Ensure role is set to biller
      const dataWithRole: Parameters<typeof userService.createUser>[0] = { ...billerData, role: 'biller' as const };
      await createBillerMutation.mutate(dataWithRole);
      toast.success(`Biller ${billerData.name} has been added successfully`);
      addNotification({
        title: 'Biller Added',
        message: `${billerData.name} has been added to the system.`,
        type: 'success',
        userId: 'system',
        priority: 'medium',
        category: 'system',
      });
      await refetch();
      setIsAddModalOpen(false);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to add biller';
      toast.error(errorMessage);
      addNotification({
        title: 'Unable to add biller',
        message: errorMessage,
        type: 'error',
        userId: 'system',
        priority: 'high',
        category: 'system',
      });
      throw err;
    }
  };

  const handleEditBiller = async (billerData: Parameters<typeof userService.updateUser>[1]) => {
    if (!selectedBiller) return;

    try {
      await updateBillerMutation.mutate({ id: selectedBiller.id, data: billerData });
      toast.success(`Biller ${billerData.name ?? selectedBiller.name} has been updated successfully`);
      addNotification({
        title: 'Biller Updated',
        message: `${billerData.name ?? selectedBiller.name} has been updated.`,
        type: 'success',
        userId: 'system',
        priority: 'medium',
        category: 'system',
      });
      await refetch();
      setIsEditModalOpen(false);
      setSelectedBiller(null);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to update biller';
      toast.error(errorMessage);
      addNotification({
        title: 'Unable to update biller',
        message: errorMessage,
        type: 'error',
        userId: 'system',
        priority: 'high',
        category: 'system',
      });
      throw err;
    }
  };

  const handleDeleteBiller = async (billerId: string, billerName: string) => {
    if (!window.confirm(`Are you sure you want to deactivate ${billerName}?`)) {
      return;
    }

    try {
      await deleteBillerMutation.mutate(billerId);
      toast.success(`Biller ${billerName} has been deactivated`);
      addNotification({
        title: 'Biller Deactivated',
        message: `${billerName} is now deactivated.`,
        type: 'info',
        userId: 'system',
        priority: 'medium',
        category: 'system',
      });
      await refetch();
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to deactivate biller';
      toast.error(errorMessage);
      addNotification({
        title: 'Unable to deactivate biller',
        message: errorMessage,
        type: 'error',
        userId: 'system',
        priority: 'high',
        category: 'system',
      });
    }
  };

  const openEditModal = (biller: User) => {
    setSelectedBiller(biller);
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
            <CreditCard className="h-6 w-6 text-primary-500" />
            <span>Billers</span>
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage finance and billing staff.
          </p>
        </div>
        {isAdmin && (
          <div className="mt-4 sm:mt-0">
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="btn-primary flex items-center"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Biller
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
                placeholder="Search billers..."
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
          Unable to load billers. Please refresh or try again later.
        </div>
      )}

      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Biller
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
                  <td
                    colSpan={5}
                    className="px-6 py-10 text-center text-sm text-gray-500"
                  >
                    Loading billers...
                  </td>
                </tr>
              ) : filteredBillers.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-10 text-center text-sm text-gray-500"
                  >
                    No billers match your filters yet.
                  </td>
                </tr>
              ) : (
                filteredBillers.map((biller) => (
                  <tr key={biller.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center">
                        {biller.avatar ? (
                          <img
                            src={biller.avatar.startsWith('http') ? biller.avatar : getAssetUrl(biller.avatar)}
                            alt={biller.name}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
                            {biller.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                        )}
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {biller.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {biller.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {biller.phone ? (
                          <div className="flex items-center">
                            <Phone className="mr-2 h-4 w-4 text-gray-400" />
                            {biller.phone}
                          </div>
                        ) : (
                          <span className="text-gray-400">No phone</span>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {biller.department || <span className="text-gray-400">No department</span>}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`status-badge ${getStatusColor(biller.isActive)}`}
                      >
                        {biller.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => openViewModal(biller)}
                          className="text-primary-600 hover:text-primary-900"
                          title="View biller details"
                        >
                          <Eye className="mr-1 inline h-4 w-4" />
                          View details
                        </button>
                        {isAdmin && (
                          <>
                            <button 
                              onClick={() => openEditModal(biller)}
                              className="text-secondary-600 hover:text-secondary-900"
                            >
                              <Edit className="mr-1 inline h-4 w-4" />
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDeleteBiller(biller.id, biller.name)}
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card text-center">
          <div className="text-2xl font-bold text-primary-600">
            {billersList.filter((b) => b.isActive).length}
          </div>
          <div className="text-sm text-gray-600">Active Billers</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-gray-600">
            {billersList.length}
          </div>
          <div className="text-sm text-gray-600">Total Billers</div>
        </div>
      </div>

      {/* Add Biller Modal */}
      <AddEditBillerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddBiller}
        mode="add"
      />

      {/* Edit Biller Modal */}
      <AddEditBillerModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedBiller(null);
        }}
        onSave={handleEditBiller}
        biller={selectedBiller}
        mode="edit"
      />

      {/* View Biller Details Modal */}
      <ViewBillerModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedBiller(null);
        }}
        biller={selectedBiller}
      />
    </div>
  );
}
