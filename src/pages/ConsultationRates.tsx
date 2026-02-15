import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { DollarSign, Stethoscope, Heart, Save, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { User } from '../types';
import { useApi, useApiMutation } from '../hooks/useApi';
import { userService } from '../services/users';
import { useAuth } from '../contexts/AuthContext';

export default function ConsultationRates() {
  const { user } = useAuth();
  const canManage = user?.role === 'biller' || user?.role === 'admin';
  const [savingId, setSavingId] = useState<string | null>(null);

  if (!canManage) {
    return <Navigate to="/dashboard" replace />;
  }

  const { data: specialistsData, loading: loadingSpecialists, refetch: refetchSpecialists } = useApi(
    () => userService.getUsers({ role: 'specialist', limit: 200 }),
    []
  );
  const { data: therapistsData, loading: loadingTherapists, refetch: refetchTherapists } = useApi(
    () => userService.getUsers({ role: 'therapist', limit: 200 }),
    []
  );

  const specialists = specialistsData?.users ?? [];
  const therapists = therapistsData?.users ?? [];

  const updateFeeMutation = useApiMutation(
    (params: { id: string; consultationFee: number | null }) =>
      userService.updateUser(params.id, { consultationFee: params.consultationFee })
  );

  const handleSaveFee = async (user: User, value: string) => {
    const num = value.trim() === '' ? null : Math.max(0, Math.floor(Number(value)));
    if (value.trim() !== '' && (Number.isNaN(num) || num < 0)) {
      toast.error('Please enter a valid number (0 or greater)');
      return;
    }
    setSavingId(user.id);
    try {
      await updateFeeMutation.mutate({ id: user.id, consultationFee: num });
      toast.success(`Consultation fee for ${user.name} updated`);
      await Promise.all([refetchSpecialists(), refetchTherapists()]);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to update fee';
      toast.error(msg);
    } finally {
      setSavingId(null);
    }
  };

  const loading = loadingSpecialists || loadingTherapists;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Consultation rates</h1>
        <p className="text-sm text-gray-600 mt-1">
          Set consultation fees (UGX) for specialists and therapists. These appear on the biller dashboard when a patient is assigned.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
        </div>
      ) : (
        <>
          {/* Specialists */}
          <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-gray-900">Specialists</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {specialists.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-500">No specialists found.</div>
              ) : (
                specialists.map((user) => (
                  <ConsultationRateRow
                    key={user.id}
                    user={user}
                    saving={savingId === user.id}
                    onSave={handleSaveFee}
                  />
                ))
              )}
            </div>
          </div>

          {/* Therapists */}
          <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-gray-900">Therapists</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {therapists.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-500">No therapists found.</div>
              ) : (
                therapists.map((user) => (
                  <ConsultationRateRow
                    key={user.id}
                    user={user}
                    saving={savingId === user.id}
                    onSave={handleSaveFee}
                  />
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ConsultationRateRow({
  user,
  saving,
  onSave,
}: {
  user: User;
  saving: boolean;
  onSave: (user: User, value: string) => void;
}) {
  const currentDisplay = user.consultationFee != null ? String(user.consultationFee) : '';
  const [inputValue, setInputValue] = useState(currentDisplay);

  useEffect(() => {
    setInputValue(user.consultationFee != null ? String(user.consultationFee) : '');
  }, [user.id, user.consultationFee]);

  const isDirty = inputValue !== currentDisplay;

  return (
    <div className="px-6 py-4 flex flex-wrap items-center gap-4">
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-gray-900">{user.name}</div>
        {user.specialistSpecialization || user.therapistSpecialization ? (
          <div className="text-xs text-gray-500">
            {user.specialistSpecialization || user.therapistSpecialization}
          </div>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center rounded-lg border border-gray-300 bg-gray-50 px-3 py-1.5">
          <DollarSign className="h-4 w-4 text-gray-400 mr-1" />
          <input
            type="number"
            min={0}
            step={1}
            placeholder="0"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-28 bg-transparent border-0 p-0 text-sm text-gray-900 focus:ring-0"
          />
          <span className="text-xs text-gray-500 ml-1">UGX</span>
        </div>
        <button
          type="button"
          disabled={saving || !isDirty}
          onClick={() => onSave(user, inputValue)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:pointer-events-none"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save
        </button>
      </div>
    </div>
  );
}
