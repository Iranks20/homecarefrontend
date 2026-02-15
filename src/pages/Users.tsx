import { useMemo, useState, useEffect } from 'react';
import { Shield, UserPlus, Search, Filter, Loader2, CheckCircle, XCircle, Edit, Trash2, Stethoscope } from 'lucide-react';
import { toast } from 'react-toastify';
import { useSearchParams } from 'react-router-dom';
import { useApi, useApiMutation } from '../hooks/useApi';
import { userService, type CreateUserPayload, type UpdateUserPayload } from '../services/users';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import AddEditUserModal from '../components/AddEditUserModal';
import type { User } from '../types';

export default function Users() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const roleFromUrl = searchParams.get('role');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | User['role']>(
    roleFromUrl ? (roleFromUrl.toLowerCase() as User['role']) : 'all'
  );
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Update role filter when URL changes
  useEffect(() => {
    if (roleFromUrl) {
      setRoleFilter(roleFromUrl.toLowerCase() as User['role']);
    }
  }, [roleFromUrl]);

  // Only admins can manage users (doctors, specialists, nurses)
  const isAdmin = user?.role === 'admin';
  const isViewingRestrictedRole = roleFilter === 'specialist' || roleFilter === 'nurse';
  const canManage = isAdmin || !isViewingRestrictedRole;

  const { addNotification } = useNotifications();

  const {
    data,
    loading,
    error,
    refetch,
  } = useApi(() => userService.getUsers({ 
    role: roleFilter !== 'all' ? roleFilter.toUpperCase() : undefined,
    limit: 50 
  }), [roleFilter]);

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

  const users = data?.users ?? [];

  const filteredUsers = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    return users.filter((user) => {
      const matchesSearch =
        !search ||
        user.name.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search) ||
        user.role.toLowerCase().includes(search);

      const matchesRole = roleFilter === 'all' || user.role === roleFilter;

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && user.isActive !== false) ||
        (statusFilter === 'inactive' && user.isActive === false);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  const handleCreateUser = async (input: {
    username?: string;
    name: string;
    email: string;
    password?: string;
    role?: User['role'];
    phone?: string;
    department?: string;
    doctorSpecialization?: string;
    isActive?: boolean;
    avatar?: string;
  }) => {
    if (!input.role) {
      throw new Error('Role is required');
    }
    const payload: CreateUserPayload = {
      username: input.username ?? input.email?.trim().split('@')[0] ?? input.name.replace(/\s+/g, '').toLowerCase() ?? 'user',
      name: input.name,
      email: input.email,
      password: input.password,
      role: input.role,
      phone: input.phone,
      department: input.department,
    };
    try {
      await createUserMutation.mutate(payload);
      toast.success(`User ${payload.name} has been created successfully`);
      addNotification({
        title: 'User created',
        message: `${payload.name} has been provisioned.`,
        type: 'success',
        priority: 'medium',
        category: 'system',
        userId: '',
      });
      await refetch();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to create user');
      throw error;
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowEditModal(true);
  };

  const handleUpdateUser = async (input: {
    name: string;
    email: string;
    password?: string;
    role?: User['role'];
    phone?: string;
    department?: string;
    doctorSpecialization?: string;
    isActive?: boolean;
    avatar?: string;
  }) => {
    if (!editingUser) return;
    
    try {
      const updatePayload: UpdateUserPayload = {
        name: input.name,
        email: input.email,
        phone: input.phone,
        department: input.department,
      };
      
      // Only include password if it was provided
      if (input.password && input.password.trim()) {
        updatePayload.password = input.password;
      }

      await updateUserMutation.mutate({ id: editingUser.id, payload: updatePayload });
      toast.success(`User ${input.name} has been updated successfully`);
      addNotification({
        title: 'User updated',
        message: `${input.name}'s information has been updated.`,
        type: 'success',
        priority: 'medium',
        category: 'system',
        userId: '',
      });
      setShowEditModal(false);
      setEditingUser(null);
      await refetch();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update user');
      throw error;
    }
  };

  const handleDeleteClick = (user: User) => {
    setDeleteConfirmUser(user);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmUser) return;

    try {
      await deleteUserMutation.mutate(deleteConfirmUser.id);
      toast.success(`User ${deleteConfirmUser.name} has been permanently deleted`);
      addNotification({
        title: 'User deleted',
        message: `${deleteConfirmUser.name} has been permanently removed from the system.`,
        type: 'success',
        priority: 'medium',
        category: 'system',
        userId: '',
      });
      setDeleteConfirmUser(null);
      await refetch();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete user');
    }
  };

  const handleToggleStatus = async (user: User, isActive: boolean) => {
    await updateStatusMutation.mutate({ id: user.id, isActive });
    addNotification({
      title: 'User status updated',
      message: `${user.name} is now ${isActive ? 'active' : 'inactive'}.`,
      type: 'success',
      priority: 'medium',
      category: 'system',
      userId: '',
    });
    await refetch();
  };

  const roleOptions = [
    { value: 'all', label: 'All Roles' },
    { value: 'admin', label: 'Administrator' },
    { value: 'receptionist', label: 'Receptionist' },
    { value: 'doctor', label: 'Doctor' },
    { value: 'specialist', label: 'Specialist' },
    { value: 'nurse', label: 'Nurse' },
  ];

  const getPageTitle = () => {
    const filter = roleFilter as User['role'] | 'all';
    if (filter === 'specialist') return 'Specialists';
    if (filter === 'nurse') return 'Nurses';
    if (filter === 'receptionist') return 'Receptionists';
    if (filter === 'admin') return 'Administrators';
    if (filter === 'therapist') return 'Therapists';
    if (filter === 'biller') return 'Billers';
    return 'User Management';
  };

  const getPageDescription = () => {
    const filter = roleFilter as User['role'] | 'all';
    if (filter === 'specialist') return 'Manage specialists and their specializations.';
    if (filter === 'nurse') return 'Manage nurses and their assignments.';
    if (filter === 'receptionist') return 'Manage receptionist staff.';
    if (filter === 'admin') return 'Manage system administrators.';
    if (filter === 'therapist') return 'Manage therapists and their specializations.';
    if (filter === 'biller') return 'Manage billing staff.';
    return 'Provision and manage staff and patient access.';
  };

  const getPageIcon = () => {
    const filter = roleFilter as User['role'] | 'all';
    if (filter === 'specialist') return Stethoscope;
    return Shield;
  };

  const PageIcon = getPageIcon();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <PageIcon className="h-6 w-6 text-primary-500" />
            <span>{getPageTitle()}</span>
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {getPageDescription()}
          </p>
        </div>
        {canManage && (
        <button className="btn-primary flex items-center" onClick={() => setShowAddModal(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add User
        </button>
        )}
      </div>

      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="input-field pl-10"
            />
          </div>
          <div className="flex items-center space-x-3">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              className="input-field"
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value as typeof roleFilter)}
            >
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              className="input-field"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
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
          Unable to load users. Please refresh or try again later.
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Loading users...
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No users match your current filters.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold">
                          {user.name
                            .split(' ')
                            .map((part) => part[0])
                            .join('')
                            .slice(0, 2)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-xs text-gray-500 capitalize">{user.role.replace(/-/g, ' ')}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                      {user.role.replace(/-/g, ' ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.department ?? '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {user.isActive !== false ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {canManage ? (
                      <div className="flex items-center space-x-2">
                        <button
                          className="text-blue-600 hover:text-blue-800 flex items-center text-xs disabled:opacity-50"
                          onClick={() => handleEditUser(user)}
                          disabled={updateUserMutation.loading}
                          title="Edit user"
                        >
                          <Edit className="h-4 w-4 mr-1" /> Edit
                        </button>
                        <button
                          className="text-green-600 hover:text-green-800 flex items-center text-xs disabled:opacity-50"
                          onClick={() => handleToggleStatus(user, true)}
                          disabled={updateStatusMutation.loading || user.isActive !== false}
                          title="Activate user"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" /> Activate
                        </button>
                        <button
                          className="text-yellow-600 hover:text-yellow-800 flex items-center text-xs disabled:opacity-50"
                          onClick={() => handleToggleStatus(user, false)}
                          disabled={updateStatusMutation.loading || user.isActive === false}
                          title="Deactivate user"
                        >
                          <XCircle className="h-4 w-4 mr-1" /> Deactivate
                        </button>
                        <button
                          className="text-red-600 hover:text-red-800 flex items-center text-xs disabled:opacity-50"
                          onClick={() => handleDeleteClick(user)}
                          disabled={deleteUserMutation.loading}
                          title="Delete user permanently"
                        >
                          <Trash2 className="h-4 w-4 mr-1" /> Delete
                        </button>
                      </div>
                      ) : (
                        <span className="text-gray-400 text-xs">View only</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddEditUserModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleCreateUser}
        isSaving={createUserMutation.loading}
      />

      <AddEditUserModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingUser(null);
        }}
        onSave={handleUpdateUser}
        isSaving={updateUserMutation.loading}
        user={editingUser}
      />

      {/* Delete Confirmation Dialog */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black bg-opacity-40"
            onClick={() => setDeleteConfirmUser(null)}
          />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-red-100 text-red-600 rounded-lg h-10 w-10 flex items-center justify-center">
                  <Trash2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete User</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone</p>
                </div>
              </div>
              <button
                onClick={() => setDeleteConfirmUser(null)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-700">
                Are you sure you want to permanently delete <strong>{deleteConfirmUser.name}</strong>?
              </p>
              <p className="text-sm text-red-600 mt-2">
                This will permanently remove the user and all associated data from the system.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                className="btn-outline"
                onClick={() => setDeleteConfirmUser(null)}
                disabled={deleteUserMutation.loading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary bg-red-600 hover:bg-red-700 text-white"
                onClick={handleDeleteConfirm}
                disabled={deleteUserMutation.loading}
              >
                {deleteUserMutation.loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Permanently
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

