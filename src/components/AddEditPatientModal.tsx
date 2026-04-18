import { useEffect, useMemo, useRef, useState } from 'react';
import { X, Upload, Image as ImageIcon, Calendar, ClipboardList } from 'lucide-react';
import { toast } from 'react-toastify';
import { Patient } from '../types';
import { apiService } from '../services/api';
import { API_CONFIG, API_ENDPOINTS, getAssetUrl } from '../config/api';
import patientService from '../services/patients';
import { buildPickerPatientList } from '../utils/patientPicker';

interface SpecialistOption {
  id: string;
  name: string;
  specialization?: string;
}

interface TherapistOption {
  id: string;
  name: string;
  specialization?: string;
}

export interface PatientFormValues {
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  city?: string;
  state?: string;
  zipCode?: string;
  condition: string;
  assignedSpecialistId?: string; // Receptionist assigns to either Specialist OR Therapist
  assignedTherapistId?: string;   // Receptionist assigns to either Specialist OR Therapist
  serviceIds?: string[]; // Selected services for the patient
  status: Patient['status'];
  avatar?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  allergies?: string;
  paymentType?: 'CASH' | 'INSURANCE';
  insuranceProvider?: string;
  insuranceNumber?: string;
  referralSource?: string;
}

/** Service option for selection (price hidden for receptionist) */
interface ServiceOption {
  id: string;
  name: string;
}

interface AddEditPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (values: PatientFormValues) => Promise<void>;
  onRefresh?: () => void | Promise<void>;
  patient?: Patient | null;
  mode: 'add' | 'edit';
  specialists: SpecialistOption[];
  therapists: TherapistOption[];
  services?: ServiceOption[];
  followUpSeedPatient?: Patient | null;
}

const DEFAULT_FORM: PatientFormValues = {
  name: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  condition: '',
  assignedSpecialistId: '',
  assignedTherapistId: '',
  serviceIds: [],
  status: 'active',
  avatar: '',
  emergencyContact: '',
  emergencyPhone: '',
  allergies: '',
  paymentType: 'CASH',
  insuranceProvider: '',
  insuranceNumber: '',
  referralSource: '',
};

function patientToFormValues(patient: Patient): PatientFormValues {
  const addressParts = patient.address?.split(', ') || [];
  const fullAddress = addressParts[0] || patient.address || '';
  const city = addressParts[1] || '';
  const stateZip = addressParts[2]?.split(' ') || [];
  const state = stateZip[0] || '';
  const zipCode = stateZip[1] || '';

  return {
    name: patient.name,
    email: patient.email ?? '',
    phone: patient.phone,
    dateOfBirth: patient.dateOfBirth
      ? new Date(patient.dateOfBirth).toISOString().split('T')[0]
      : '',
    address: fullAddress,
    city,
    state,
    zipCode,
    condition: patient.condition,
    assignedSpecialistId: (patient as any).assignedSpecialistId ?? (patient as any).assignedSpecialist?.id ?? '',
    assignedTherapistId: (patient as any).assignedTherapistId ?? (patient as any).assignedTherapist?.id ?? '',
    serviceIds: (patient as any).serviceIds ?? [],
    status: patient.status ?? 'active',
    avatar: patient.avatar ?? '',
    emergencyContact: patient.emergencyContact ?? '',
    emergencyPhone: patient.emergencyPhone ?? '',
    allergies: patient.allergies ?? '',
    paymentType: (patient as any).paymentType === 'INSURANCE' ? 'INSURANCE' : 'CASH',
    insuranceProvider: patient.insuranceProvider ?? '',
    insuranceNumber: patient.insuranceNumber ?? '',
    referralSource: patient.referralSource ?? '',
  };
}

export default function AddEditPatientModal({
  isOpen,
  onClose,
  onSave,
  onRefresh,
  patient,
  mode,
  specialists,
  therapists,
  services = [],
  followUpSeedPatient = null,
}: AddEditPatientModalProps) {
  const [formData, setFormData] = useState<PatientFormValues>(DEFAULT_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [linkedPatientId, setLinkedPatientId] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [prefetchedPatients, setPrefetchedPatients] = useState<Patient[]>([]);
  const [prefetchLoading, setPrefetchLoading] = useState(false);
  const [namePickerFocused, setNamePickerFocused] = useState(false);
  const nameBlurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [visitDate, setVisitDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [visitReason, setVisitReason] = useState('');
  const [visitAttending, setVisitAttending] = useState('');
  const [visitDiagnosis, setVisitDiagnosis] = useState('');
  const [followUpShellDismissed, setFollowUpShellDismissed] = useState(false);

  const isFollowUpVisitUI = mode === 'add' && !!followUpSeedPatient && !followUpShellDismissed;

  useEffect(() => {
    if (!isOpen) {
      setFormData(DEFAULT_FORM);
      setIsSubmitting(false);
      setError(null);
      setAvatarFile(null);
      setAvatarPreview(null);
      setLinkedPatientId(null);
      setSearchResults([]);
      setPrefetchedPatients([]);
      setPrefetchLoading(false);
      setNamePickerFocused(false);
      setFollowUpShellDismissed(false);
      setVisitDate(new Date().toISOString().slice(0, 10));
      setVisitReason('');
      setVisitAttending('');
      setVisitDiagnosis('');
      return;
    }

    if (patient && mode === 'edit') {
      setFormData(patientToFormValues(patient));
      if (patient.avatar) {
        const avatarUrl = patient.avatar.startsWith('http') ? patient.avatar : getAssetUrl(patient.avatar);
        setAvatarPreview(avatarUrl);
      } else {
        setAvatarPreview(null);
      }
    } else if (mode === 'add' && followUpSeedPatient) {
      setFollowUpShellDismissed(false);
      setFormData(patientToFormValues(followUpSeedPatient));
      setLinkedPatientId(followUpSeedPatient.id);
      setSearchResults([]);
      setVisitDate(new Date().toISOString().slice(0, 10));
      setVisitReason('');
      setVisitAttending('');
      setVisitDiagnosis('');
      if (followUpSeedPatient.avatar) {
        const avatarUrl = followUpSeedPatient.avatar.startsWith('http')
          ? followUpSeedPatient.avatar
          : getAssetUrl(followUpSeedPatient.avatar);
        setAvatarPreview(avatarUrl);
      } else {
        setAvatarPreview(null);
      }
      setAvatarFile(null);
    } else {
      setLinkedPatientId(null);
      setSearchResults([]);
      setFormData({
        ...DEFAULT_FORM,
        dateOfBirth: '',
        status: 'active',
      });
    }
  }, [isOpen, patient, mode, followUpSeedPatient]);

  useEffect(() => {
    if (!isOpen || mode !== 'add' || linkedPatientId) {
      return;
    }
    let cancelled = false;
    setPrefetchLoading(true);
    void patientService
      .getPatients({ limit: 40, page: 1 })
      .then(({ patients }) => {
        if (!cancelled) setPrefetchedPatients(patients);
      })
      .catch(() => {
        if (!cancelled) setPrefetchedPatients([]);
      })
      .finally(() => {
        if (!cancelled) setPrefetchLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, mode, linkedPatientId]);

  useEffect(() => {
    if (!isOpen || mode !== 'add' || linkedPatientId) {
      return;
    }
    const q = formData.name.trim();
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const list = await patientService.searchPatients(q, { limit: 25 });
        if (!cancelled) setSearchResults(list);
      } catch {
        if (!cancelled) setSearchResults([]);
      } finally {
        if (!cancelled) setSearchLoading(false);
      }
    }, 280);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [isOpen, mode, linkedPatientId, formData.name]);

  const pickerPatients = useMemo(
    () => buildPickerPatientList(prefetchedPatients, searchResults, formData.name),
    [prefetchedPatients, searchResults, formData.name]
  );

  const clearNameBlurTimer = () => {
    if (nameBlurTimer.current) {
      clearTimeout(nameBlurTimer.current);
      nameBlurTimer.current = null;
    }
  };

  const handleNameFieldFocus = () => {
    clearNameBlurTimer();
    setNamePickerFocused(true);
  };

  const handleNameFieldBlur = () => {
    clearNameBlurTimer();
    nameBlurTimer.current = setTimeout(() => setNamePickerFocused(false), 200);
  };

  if (!isOpen) {
    return null;
  }

  const clearLinkedPatient = () => {
    setLinkedPatientId(null);
    clearNameBlurTimer();
    setNamePickerFocused(false);
    setVisitReason('');
    setVisitAttending('');
    setVisitDiagnosis('');
    setVisitDate(new Date().toISOString().slice(0, 10));
    if (followUpSeedPatient) {
      setFollowUpShellDismissed(true);
      setFormData({ ...DEFAULT_FORM, dateOfBirth: '', status: 'active' });
      setAvatarPreview(null);
      setAvatarFile(null);
    }
  };

  const applyLoadedPatient = (p: Patient) => {
    setFormData(patientToFormValues(p));
    setLinkedPatientId(p.id);
    setSearchResults([]);
    clearNameBlurTimer();
    setNamePickerFocused(false);
    setVisitDate(new Date().toISOString().slice(0, 10));
    setVisitReason('');
    setVisitAttending('');
    setVisitDiagnosis('');
    if (p.avatar) {
      const avatarUrl = p.avatar.startsWith('http') ? p.avatar : getAssetUrl(p.avatar);
      setAvatarPreview(avatarUrl);
    } else {
      setAvatarPreview(null);
    }
    setAvatarFile(null);
  };

  const handleSelectExistingPatient = async (id: string) => {
    try {
      const p = await patientService.getPatient(id);
      applyLoadedPatient(p);
    } catch (err: any) {
      setError(err?.message ?? 'Could not load patient. Try again.');
    }
  };

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };
      // Clear insurance fields if payment type changes to CASH
      if (name === 'paymentType' && value === 'CASH') {
        newData.insuranceProvider = '';
        newData.insuranceNumber = '';
      }
      return newData;
    });
  };

  const toggleServiceId = (serviceId: string) => {
    setFormData((prev) => {
      const ids = prev.serviceIds ?? [];
      const next = ids.includes(serviceId)
        ? ids.filter((id) => id !== serviceId)
        : [...ids, serviceId];
      return { ...prev, serviceIds: next };
    });
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image size must be less than 10MB');
      return;
    }

    setAvatarFile(file);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload the file
    setIsUploadingAvatar(true);
    try {
      const response = await apiService.uploadFile<{ url: string; fileId: string; filename: string }>(
        API_ENDPOINTS.UPLOAD.IMAGE,
        file
      );
      if (response.success && response.data) {
        // The response.data is the FileUploadResult object with url property
        const uploadResult = response.data as { url: string; fileId: string; filename: string; originalName?: string; mimetype?: string; size?: number };
        const avatarUrl = uploadResult.url || (response.data as any).url;
        
        if (avatarUrl) {
          // Store the path as returned from backend (e.g., /uploads/filename.jpg)
          const avatarPath = avatarUrl.startsWith('http') 
            ? avatarUrl.replace(/^https?:\/\/[^\/]+/, '') // Extract path from full URL
            : avatarUrl.startsWith('/') 
              ? avatarUrl 
              : '/' + avatarUrl;
          
          setFormData((prev) => ({
            ...prev,
            avatar: avatarPath,
          }));
          
          // Update preview with full URL for display
          const baseUrl = API_CONFIG.API_ORIGIN;
          const previewUrl = `${baseUrl}${avatarPath}`;
          setAvatarPreview(previewUrl);
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to upload image');
      setAvatarFile(null);
      setAvatarPreview(null);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const fullAddress = [formData.address, formData.city, formData.state, formData.zipCode]
        .filter(Boolean)
        .join(', ');

      const submitData: PatientFormValues = {
        ...formData,
        address: fullAddress || formData.address,
      };

      if (mode === 'add' && linkedPatientId) {
        const reason = visitReason.trim();
        if (!visitDate || !reason) {
          setError('Enter the visit date and reason for this follow-up.');
          setIsSubmitting(false);
          return;
        }
        const condition = submitData.condition?.trim() || 'Evaluation pending';
        await patientService.updatePatient(linkedPatientId, {
          ...submitData,
          condition,
        });
        const caseNotes = [`Visit date: ${visitDate}`, `Reason: ${reason}`].join('\n');
        const newCase = await patientService.createPatientCase(linkedPatientId, {
          type: 'FOLLOW_UP',
          notes: caseNotes,
          diagnosis: visitDiagnosis.trim() || undefined,
          attending: visitAttending.trim() || undefined,
        });
        const detailsParts = [
          `Registered follow-up on ${visitDate}.`,
          reason,
          visitAttending.trim() ? `Attending: ${visitAttending.trim()}.` : '',
        ].filter(Boolean);
        await patientService.logPatientCaseVisit(linkedPatientId, newCase.id, {
          details: detailsParts.join(' '),
        });
        toast.success(
          followUpSeedPatient && !followUpShellDismissed
            ? `Visit recorded for ${submitData.name}${newCase.caseNumber ? ` — ${newCase.caseNumber}` : ''}`
            : `Follow-up saved for ${submitData.name}${newCase.caseNumber ? ` (${newCase.caseNumber})` : ''}`
        );
        await onRefresh?.();
        onClose();
        return;
      }

      await onSave(submitData);
      onClose();
    } catch (err: any) {
      setError(err?.message ?? 'Unable to save patient. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 sticky top-0 z-10 bg-white">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {isFollowUpVisitUI
                ? 'Record follow-up visit'
                : mode === 'add'
                  ? 'Register New Patient'
                  : 'Update Patient Details'}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {isFollowUpVisitUI
                ? 'Encounter details first — then adjust chart demographics only if something changed.'
                : mode === 'add'
                  ? linkedPatientId
                    ? 'Update their record and record this follow-up visit.'
                    : 'Search by name or complete the form for a new patient.'
                  : 'Edit patient profile and assignment details'}
            </p>
          </div>
          <button
            type="button"
            className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {isFollowUpVisitUI && linkedPatientId && (
            <>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Patient</p>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-gray-900">{formData.name}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {formData.phone}
                      {formData.dateOfBirth ? ` · DOB ${formData.dateOfBirth}` : ''}
                    </p>
                    <p className="text-xs text-gray-500 mt-2 font-mono">ID {linkedPatientId}</p>
                  </div>
                  <button
                    type="button"
                    onClick={clearLinkedPatient}
                    className="text-sm text-primary-600 hover:text-primary-800 underline shrink-0 self-start"
                  >
                    Wrong person — new registration
                  </button>
                </div>
              </div>

              <section className="rounded-lg border border-gray-200 p-4 sm:p-5">
                <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-gray-400" />
                  Encounter / visit
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Saved as a follow-up case with a dated visit log for reporting.
                </p>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Visit date *</label>
                    <input
                      type="date"
                      value={visitDate}
                      onChange={(e) => setVisitDate(e.target.value)}
                      className="input-field mt-1"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Attending (optional)</label>
                    <input
                      type="text"
                      value={visitAttending}
                      onChange={(e) => setVisitAttending(e.target.value)}
                      className="input-field mt-1"
                      placeholder="Staff or clinician name"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Reason / chief complaint *</label>
                    <textarea
                      value={visitReason}
                      onChange={(e) => setVisitReason(e.target.value)}
                      className="input-field mt-1 min-h-[88px]"
                      placeholder="Why is the patient here today?"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Working diagnosis (optional)</label>
                    <input
                      type="text"
                      value={visitDiagnosis}
                      onChange={(e) => setVisitDiagnosis(e.target.value)}
                      className="input-field mt-1"
                      placeholder="If applicable"
                    />
                  </div>
                </div>
              </section>
            </>
          )}

          <section>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {isFollowUpVisitUI ? 'Chart & demographics' : 'Personal Information'}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {isFollowUpVisitUI
                ? 'Optional: correct name, contacts, or DOB if they changed since last visit.'
                : mode === 'add'
                  ? 'Focus the name field to see recent patients, then type to narrow results (first + last name works best).'
                  : 'Required information about the patient'}
            </p>

            {mode === 'add' && linkedPatientId && !isFollowUpVisitUI && (
              <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 flex flex-wrap items-center justify-between gap-2">
                <span>Existing patient selected — update details if needed, then complete follow-up below.</span>
                <button type="button" onClick={clearLinkedPatient} className="text-emerald-800 underline font-medium">
                  New patient instead
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Full Name<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  onFocus={mode === 'add' ? handleNameFieldFocus : undefined}
                  onBlur={mode === 'add' ? handleNameFieldBlur : undefined}
                  required
                  className="input-field mt-1"
                  placeholder="Jane Doe"
                  autoComplete="name"
                />
                {mode === 'add' && !linkedPatientId && namePickerFocused && (
                  <div className="mt-2 rounded-md border border-gray-200 bg-gray-50 shadow-sm overflow-hidden">
                    <div className="px-3 py-2 text-xs font-medium text-gray-600 bg-gray-100 border-b border-gray-200 flex items-center justify-between gap-2">
                      <span>
                        {formData.name.trim().length < 2
                          ? 'Recent patients (newest first)'
                          : searchLoading
                            ? 'Searching…'
                            : 'Best matches'}
                      </span>
                      {formData.name.trim().length >= 2 && searchLoading && (
                        <span className="text-gray-400">Updating list…</span>
                      )}
                    </div>
                    {prefetchLoading && pickerPatients.length === 0 ? (
                      <div className="px-3 py-4 text-sm text-gray-500">Loading patient list…</div>
                    ) : pickerPatients.length === 0 ? (
                      <div className="px-3 py-4 text-sm text-gray-500">
                        {formData.name.trim().length >= 2
                          ? 'No directory matches. You can still continue as a new patient.'
                          : 'No patients loaded yet.'}
                      </div>
                    ) : (
                      <ul className="max-h-56 overflow-auto" onMouseDown={(e) => e.preventDefault()}>
                        {pickerPatients.map((p) => (
                          <li key={p.id} className="border-b border-gray-100 last:border-0">
                            <button
                              type="button"
                              className="w-full px-4 py-3 text-left text-sm hover:bg-white"
                              onClick={() => void handleSelectExistingPatient(p.id)}
                            >
                              <div className="font-medium text-gray-900">{p.name}</div>
                              <div className="text-gray-600 text-xs">
                                {p.phone}
                                {p.dateOfBirth
                                  ? ` · DOB ${new Date(p.dateOfBirth).toISOString().slice(0, 10)}`
                                  : ''}
                              </div>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input-field mt-1"
                  placeholder="jane@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Phone Number<span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="input-field mt-1"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Date of Birth<span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  required
                  className="input-field mt-1"
                />
              </div>
            </div>

            {mode === 'add' && linkedPatientId && !isFollowUpVisitUI && (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50/90 px-4 py-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-amber-800" />
                  Follow-up visit
                </h4>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Visit date *</label>
                    <input
                      type="date"
                      value={visitDate}
                      onChange={(e) => setVisitDate(e.target.value)}
                      className="input-field mt-1"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Attending (optional)</label>
                    <input
                      type="text"
                      value={visitAttending}
                      onChange={(e) => setVisitAttending(e.target.value)}
                      className="input-field mt-1"
                      placeholder="Staff or clinician name"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Reason / chief complaint *</label>
                    <textarea
                      value={visitReason}
                      onChange={(e) => setVisitReason(e.target.value)}
                      className="input-field mt-1 min-h-[80px]"
                      placeholder="Why is the patient here today?"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Working diagnosis (optional)</label>
                    <input
                      type="text"
                      value={visitDiagnosis}
                      onChange={(e) => setVisitDiagnosis(e.target.value)}
                      className="input-field mt-1"
                      placeholder="If applicable"
                    />
                  </div>
                </div>
              </div>
            )}
          </section>

          <section>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Address Information</h3>
            <p className="text-sm text-gray-500 mb-4">
              {isFollowUpVisitUI ? 'Update only if the address changed.' : "Patient's residential address"}
            </p>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Street Address<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  className="input-field mt-1"
                  placeholder="123 Main Street"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="input-field mt-1"
                    placeholder="City"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">State</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="input-field mt-1"
                    placeholder="State"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">ZIP Code</label>
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleChange}
                    className="input-field mt-1"
                    placeholder="12345"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Next of Kin Contact */}
          <section>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Next of Kin Contact</h3>
            <p className="text-sm text-gray-500 mb-4">Next of kin contact information</p>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Next of Kin Name</label>
                <input
                  type="text"
                  name="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={handleChange}
                  className="input-field mt-1"
                  placeholder="Contact name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Next of Kin Phone</label>
                <input
                  type="tel"
                  name="emergencyPhone"
                  value={formData.emergencyPhone}
                  onChange={handleChange}
                  className="input-field mt-1"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Payment & Insurance Information</h3>
            <p className="text-sm text-gray-500 mb-4">
              {isFollowUpVisitUI ? 'Adjust if coverage or payer changed.' : 'Payment method and insurance details'}
            </p>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Payment Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="paymentType"
                  value={formData.paymentType || 'CASH'}
                  onChange={handleChange}
                  className="input-field mt-1"
                  required
                >
                  <option value="CASH">Cash</option>
                  <option value="INSURANCE">Insurance</option>
                </select>
              </div>

              {formData.paymentType === 'INSURANCE' && (
                <>
              <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Insurance Provider <span className="text-red-500">*</span>
                    </label>
                <input
                  type="text"
                  name="insuranceProvider"
                  value={formData.insuranceProvider}
                  onChange={handleChange}
                  className="input-field mt-1"
                  placeholder="Insurance company name"
                      required={formData.paymentType === 'INSURANCE'}
                />
              </div>
              <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Insurance Number <span className="text-red-500">*</span>
                    </label>
                <input
                  type="text"
                  name="insuranceNumber"
                  value={formData.insuranceNumber}
                  onChange={handleChange}
                  className="input-field mt-1"
                  placeholder="Policy number"
                      required={formData.paymentType === 'INSURANCE'}
                />
              </div>
                </>
              )}
            </div>
          </section>

          <section>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Assignment & Care Details</h3>
            <p className="text-sm text-gray-500 mb-4">
              {isFollowUpVisitUI
                ? 'Change assignments only when routing for this episode should change. Consultation fee invoices may generate when consultants are assigned.'
                : 'Optionally assign patient to a specialist and/or therapist. Consultation fee invoices are created automatically when assigned.'}
            </p>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Assigned Specialist <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <select
                  name="assignedSpecialistId"
                  value={formData.assignedSpecialistId ?? ''}
                  onChange={handleChange}
                  className="input-field mt-1"
                >
                  <option value="">Select specialist</option>
                  {specialists && specialists.length > 0 ? (
                    specialists.map((specialist) => (
                    <option key={specialist.id} value={specialist.id}>
                      {specialist.name}{specialist.specialization ? ` (${specialist.specialization})` : ''}
                    </option>
                    ))
                  ) : (
                    <option value="" disabled>No specialists available</option>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Assigned Therapist <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <select
                  name="assignedTherapistId"
                  value={formData.assignedTherapistId ?? ''}
                  onChange={handleChange}
                  className="input-field mt-1"
                >
                  <option value="">Select therapist</option>
                  {therapists && therapists.length > 0 ? (
                    therapists.map((therapist) => (
                    <option key={therapist.id} value={therapist.id}>
                      {therapist.name}{therapist.specialization ? ` (${therapist.specialization})` : ''}
                    </option>
                    ))
                  ) : (
                    <option value="" disabled>No therapists available</option>
                  )}
                </select>
              </div>
            </div>

            {/* Services (optional) - same list as /services; receptionist does not see prices */}
            {services.length > 0 && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Services <span className="text-gray-500 font-normal">(optional)</span>
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Select services for this patient. Billing is managed by the biller.
                </p>
                <div className="flex flex-wrap gap-3">
                  {services.map((svc) => (
                    <label
                      key={svc.id}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={(formData.serviceIds ?? []).includes(svc.id)}
                        onChange={() => toggleServiceId(svc.id)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-900">{svc.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mt-4">
              {mode === 'edit' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Status<span className="text-red-500">*</span>
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    required
                    className="input-field mt-1"
                  >
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="discharged">Discharged</option>
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700">Referral Source</label>
                <input
                  type="text"
                  name="referralSource"
                  value={formData.referralSource}
                  onChange={handleChange}
                  className="input-field mt-1"
                  placeholder="How did patient find us?"
                />
              </div>
            </div>

            {/* Patient Photo */}
            <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Patient Photo
                </label>
                <div className="flex items-center gap-4">
                  {avatarPreview ? (
                    <div className="relative">
                      <img
                        src={avatarPreview}
                        alt="Avatar preview"
                        className="h-20 w-20 rounded-full object-cover border-2 border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setAvatarFile(null);
                          setAvatarPreview(null);
                          setFormData((prev) => ({ ...prev, avatar: '' }));
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        disabled={isUploadingAvatar}
                        className="hidden"
                      />
                      <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                        <Upload className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-700">
                          {isUploadingAvatar ? 'Uploading...' : 'Upload Photo'}
                        </span>
                      </div>
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      JPG, PNG or GIF (max 10MB)
                    </p>
                </div>
              </div>
            </div>
          </section>

          <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-6 sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="btn-outline"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting
                ? 'Saving...'
                : mode === 'add'
                  ? linkedPatientId
                    ? isFollowUpVisitUI
                      ? 'Save visit & update chart'
                      : 'Save & record follow-up'
                    : 'Register Patient'
                  : 'Update Patient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
