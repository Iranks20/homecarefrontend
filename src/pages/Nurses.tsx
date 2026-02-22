import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, Edit, Eye, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { Nurse } from '../types';
import AddEditNurseModal, { type NurseFormValues } from '../components/AddEditNurseModal';
import nurseService from '../services/nurses';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import { getAssetUrl } from '../config/api';

export default function Nurses() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [nursesList, setNursesList] = useState<Nurse[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedNurse, setSelectedNurse] = useState<Nurse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addNotification } = useNotifications();

  const loadNurses = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { nurses } = await nurseService.getNurses({
        page: 1,
        limit: 50,
      });
      setNursesList(nurses);
    } catch (err: any) {
      console.error('Failed to load nurses', err);
      setError(err?.message ?? 'Unable to load nurses right now.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNurses();
  }, []);

  const filteredNurses = useMemo(() => {
    return nursesList.filter((nurse) => {
      const matchesSearch =
        nurse.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         nurse.specialization.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === 'all' || nurse.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  }, [nursesList, searchTerm, statusFilter]);

  const handleAddNurse = async (values: NurseFormValues) => {
    try {
      await nurseService.createNurse(values);
      toast.success(`Nurse ${values.name} has been added successfully`);
    addNotification({
        title: 'Nurse added',
        message: `${values.name} has been added to the team.`,
      type: 'success',
      priority: 'medium',
        userId: 'system',
        category: 'system',
      });
      await loadNurses();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add nurse';
      toast.error(errorMessage);
      addNotification({
        title: 'Unable to add nurse',
        message: errorMessage,
        type: 'error',
        priority: 'high',
        userId: 'system',
        category: 'system',
      });
      throw err;
    }
  };

  const handleEditNurse = async (values: NurseFormValues) => {
    if (!selectedNurse) {
      return;
    }
    try {
      await nurseService.updateNurse(selectedNurse.id, values);
      toast.success(`Nurse ${values.name} has been updated successfully`);
      addNotification({
        title: 'Nurse updated',
        message: `${values.name}'s profile has been updated.`,
        type: 'success',
        priority: 'medium',
        userId: 'system',
        category: 'system',
      });
      await loadNurses();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update nurse';
      toast.error(errorMessage);
      addNotification({
        title: 'Unable to update nurse',
        message: errorMessage,
        type: 'error',
        priority: 'high',
        userId: 'system',
        category: 'system',
      });
      throw err;
    } finally {
      setSelectedNurse(null);
    }
  };

  const handleDeleteNurse = async (nurseId: string) => {
    const nurse = nursesList.find((item) => item.id === nurseId);
    const confirmation = nurse
      ? `Deactivate ${nurse.name}? They will be marked inactive.`
      : 'Deactivate this nurse?';
    if (!window.confirm(confirmation)) {
      return;
    }

    try {
      await nurseService.deleteNurse(nurseId);
      toast.success(nurse ? `Nurse ${nurse.name} has been deactivated` : 'Nurse has been deactivated');
      addNotification({
        title: 'Nurse deactivated',
        message: nurse
          ? `${nurse.name} is now marked as inactive.`
          : 'Nurse has been marked inactive.',
        type: 'info',
        priority: 'medium',
        userId: 'system',
        category: 'system',
      });
      await loadNurses();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to deactivate nurse';
      toast.error(errorMessage);
      addNotification({
        title: 'Unable to deactivate nurse',
        message: errorMessage,
        type: 'error',
        priority: 'high',
        userId: 'system',
        category: 'system',
      });
    }
  };

  const openEditModal = (nurse: Nurse) => {
    setSelectedNurse(nurse);
    setIsEditModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nurses</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage nursing staff assignments and certifications.
          </p>
        </div>
        {isAdmin && (
        <div className="mt-4 sm:mt-0">
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="btn-primary flex items-center"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Nurse
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
                placeholder="Search nurses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
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

      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Nurse
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Specialization
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  License Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Experience
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
                    colSpan={6}
                    className="px-6 py-10 text-center text-sm text-gray-500"
                  >
                    Loading nurses...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-10 text-center text-sm text-red-500"
                  >
                    {error}
                  </td>
                </tr>
              ) : filteredNurses.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-10 text-center text-sm text-gray-500"
                  >
                    No nurses match your filters yet.
                  </td>
                </tr>
              ) : (
                filteredNurses.map((nurse) => (
                  <tr key={nurse.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center">
                        {nurse.avatar ? (
                          <img
                            src={nurse.avatar.startsWith('http') ? nurse.avatar : getAssetUrl(nurse.avatar)}
                            alt={nurse.name}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary-100 text-sm font-semibold text-secondary-700">
                            {nurse.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                        )}
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {nurse.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {nurse.email ?? <span className="text-gray-400 italic">Not provided</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {nurse.specialization}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center">
                        <Award className="mr-2 h-4 w-4 text-gray-400" />
                        <div className="text-sm text-gray-900">
                          {nurse.licenseNumber || <span className="text-gray-400 italic">Not provided</span>}
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {nurse.experience} {nurse.experience === 1 ? 'year' : 'years'}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`status-badge ${
                          nurse.status === 'active'
                            ? 'status-active'
                            : nurse.status === 'on-leave'
                            ? 'status-pending'
                            : 'status-inactive'
                        }`}
                      >
                        {nurse.status.replace('-', ' ')}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                      <div className="flex items-center space-x-3">
                        <Link
                          to={`/nurses/${nurse.id}`}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <Eye className="mr-1 inline h-4 w-4" />
                          View
                        </Link>
                        {isAdmin && (
                          <>
                        <button 
                          onClick={() => openEditModal(nurse)}
                          className="text-secondary-600 hover:text-secondary-900"
                        >
                          <Edit className="mr-1 inline h-4 w-4" />
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteNurse(nurse.id)}
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

      <AddEditNurseModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddNurse}
        mode="add"
      />

      <AddEditNurseModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedNurse(null);
        }}
        onSave={handleEditNurse}
        nurse={selectedNurse ?? undefined}
        mode="edit"
      />
    </div>
  );
}
