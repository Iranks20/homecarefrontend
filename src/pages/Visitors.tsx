import { useMemo, useState } from 'react';
import { BookUser, Edit, Phone, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import AddEditVisitorModal from '../components/AddEditVisitorModal';
import { useApi, useApiMutation } from '../hooks/useApi';
import { useAuth } from '../contexts/AuthContext';
import visitorService, { type Visitor, type VisitorPayload } from '../services/visitors';

function formatDate(value?: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function Visitors() {
  const { user } = useAuth();
  const canManage =
    user?.role === 'admin' || user?.role === 'receptionist' || user?.role === 'biller';

  const [searchTerm, setSearchTerm] = useState('');
  const [includeInactive, setIncludeInactive] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingVisitor, setEditingVisitor] = useState<Visitor | null>(null);

  const {
    data,
    loading,
    error,
    refetch,
  } = useApi(
    () =>
      canManage
        ? visitorService.getVisitors({
            limit: 200,
            includeInactive,
          })
        : Promise.resolve({ visitors: [] }),
    [canManage, includeInactive]
  );

  const createMutation = useApiMutation(visitorService.createVisitor.bind(visitorService));
  const updateMutation = useApiMutation((args: { id: string; data: Partial<VisitorPayload> }) =>
    visitorService.updateVisitor(args.id, args.data)
  );
  const deleteMutation = useApiMutation(visitorService.deleteVisitor.bind(visitorService));

  const visitors = data?.visitors ?? [];

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return visitors;
    return visitors.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        v.phone.toLowerCase().includes(q) ||
        (v.email ?? '').toLowerCase().includes(q) ||
        (v.company ?? '').toLowerCase().includes(q) ||
        (v.purpose ?? '').toLowerCase().includes(q)
    );
  }, [visitors, searchTerm]);

  const handleCreate = async (payload: VisitorPayload) => {
    await createMutation.mutate(payload);
    toast.success('Visitor registered');
    await refetch();
  };

  const handleUpdate = async (payload: VisitorPayload) => {
    if (!editingVisitor) return;
    await updateMutation.mutate({ id: editingVisitor.id, data: payload });
    toast.success('Visitor updated');
    setEditingVisitor(null);
    await refetch();
  };

  const handleDeactivate = async (visitor: Visitor) => {
    if (!window.confirm(`Remove ${visitor.name} from the active visitation book?`)) return;
    try {
      await deleteMutation.mutate(visitor.id);
      toast.success('Visitor deactivated');
      await refetch();
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to deactivate visitor');
    }
  };

  if (!canManage) {
    return <div className="card text-sm text-gray-500">You do not have access to the visitation book.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Visitation book</h1>
          <p className="mt-1 text-sm text-gray-600">
            Register walk-in visitors for marketing follow-up and SMS campaigns.
          </p>
        </div>
        <button type="button" onClick={() => setIsAddOpen(true)} className="btn-primary inline-flex items-center">
          <Plus className="mr-2 h-4 w-4" />
          Register visitor
        </button>
      </div>

      {error && (
        <div className="card text-sm text-red-600">Unable to load visitors. Please try again.</div>
      )}

      <div className="card">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, phone, company..."
              className="input-field pl-9"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
              className="rounded border-gray-300 text-primary-600"
            />
            Include inactive
          </label>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">Loading visitors...</p>
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center">
            <BookUser className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-2 text-sm font-medium text-gray-900">No visitors found</p>
            <p className="text-sm text-gray-500">Register the first walk-in visitor to start the book.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-2 text-left">Visitor</th>
                  <th className="px-4 py-2 text-left">Contact</th>
                  <th className="px-4 py-2 text-left">Company / purpose</th>
                  <th className="px-4 py-2 text-left">Visited</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((visitor) => (
                  <tr key={visitor.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{visitor.name}</p>
                      {visitor.notes && (
                        <p className="mt-0.5 max-w-xs truncate text-xs text-gray-500">{visitor.notes}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      <div className="flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5 text-gray-400" />
                        {visitor.phone}
                      </div>
                      {visitor.email && <p className="text-xs text-gray-500">{visitor.email}</p>}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      <p>{visitor.company || '—'}</p>
                      <p className="text-xs text-gray-500">{visitor.purpose || '—'}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(visitor.visitedAt)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          visitor.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {visitor.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingVisitor(visitor)}
                          className="inline-flex items-center rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-100"
                        >
                          <Edit className="mr-1 h-3.5 w-3.5" />
                          Edit
                        </button>
                        {visitor.isActive && (
                          <button
                            type="button"
                            onClick={() => void handleDeactivate(visitor)}
                            className="inline-flex items-center rounded-md border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="mr-1 h-3.5 w-3.5" />
                            Remove
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AddEditVisitorModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSave={handleCreate}
        mode="add"
      />

      <AddEditVisitorModal
        isOpen={editingVisitor !== null}
        onClose={() => setEditingVisitor(null)}
        onSave={handleUpdate}
        visitor={editingVisitor}
        mode="edit"
      />
    </div>
  );
}
