import { useEffect, useMemo, useRef, useState } from 'react';
import { User, Phone, MapPin, FileText, Save, Loader2, Calendar } from 'lucide-react';
import { useApiMutation } from '../hooks/useApi';
import { patientService, type PatientRegistrationData } from '../services/patients';
import { useNotifications } from '../contexts/NotificationContext';
import type { Patient } from '../types';
import { buildPickerPatientList } from '../utils/patientPicker';

function splitName(full: string): { firstName: string; lastName: string } {
  const t = full.trim();
  const parts = t.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

function splitStoredAddress(full: string): {
  address: string;
  city: string;
  state: string;
  zipCode: string;
} {
  const parts = full.split(',').map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 4) {
    const zipCode = parts[parts.length - 1] ?? '';
    const state = parts[parts.length - 2] ?? '';
    const city = parts[parts.length - 3] ?? '';
    const address = parts.slice(0, parts.length - 3).join(', ');
    return { address, city, state, zipCode };
  }
  if (parts.length === 2) {
    return { address: parts[0] ?? '', city: parts[1] ?? '', state: '', zipCode: '' };
  }
  return { address: full.trim(), city: '', state: '', zipCode: '' };
}

function dobInputValue(raw: string | undefined): string {
  if (!raw) return '';
  return raw.slice(0, 10);
}

function paymentToForm(p: Patient['paymentType'] | undefined): 'CASH' | 'INSURANCE' {
  if (p === 'INSURANCE' || String(p).toUpperCase() === 'INSURANCE') return 'INSURANCE';
  return 'CASH';
}

export default function PatientRegistration() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    emergencyContact: '',
    emergencyPhone: '',
    allergies: '',
    paymentType: 'CASH' as 'CASH' | 'INSURANCE',
    insuranceProvider: '',
    insuranceNumber: '',
    referralSource: '',
    serviceIds: [] as string[],
  });

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
  const [recordedCaseNumber, setRecordedCaseNumber] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [createdPatient, setCreatedPatient] = useState<Patient | null>(null);
  const [wasFollowUp, setWasFollowUp] = useState(false);
  const { addNotification } = useNotifications();
  const createPatientMutation = useApiMutation(patientService.createPatient.bind(patientService));

  useEffect(() => {
    if (submitted) return;
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
  }, [submitted]);

  useEffect(() => {
    if (linkedPatientId) {
      setSearchResults([]);
      return;
    }
    const q = `${formData.firstName} ${formData.lastName}`.trim();
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
  }, [formData.firstName, formData.lastName, linkedPatientId]);

  const nameSearchQuery = `${formData.firstName} ${formData.lastName}`.trim();
  const pickerPatients = useMemo(
    () => buildPickerPatientList(prefetchedPatients, searchResults, nameSearchQuery),
    [prefetchedPatients, searchResults, nameSearchQuery]
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };
      if (name === 'paymentType' && value === 'CASH') {
        newData.insuranceProvider = '';
        newData.insuranceNumber = '';
      }
      return newData;
    });
  };

  const buildPatientPayload = (): PatientRegistrationData => {
    const name = `${formData.firstName} ${formData.lastName}`.trim();
    const fullAddress = [formData.address, formData.city, formData.state, formData.zipCode]
      .filter(Boolean)
      .join(', ');

    return {
      name: name || formData.firstName || formData.email,
      email: formData.email,
      phone: formData.phone,
      dateOfBirth: formData.dateOfBirth,
      address: fullAddress,
      city: formData.city,
      state: formData.state,
      zipCode: formData.zipCode,
      condition: 'Evaluation pending',
      emergencyContact: formData.emergencyContact,
      emergencyPhone: formData.emergencyPhone,
      allergies: formData.allergies || undefined,
      paymentType: formData.paymentType,
      insuranceProvider: formData.paymentType === 'INSURANCE' ? formData.insuranceProvider : undefined,
      insuranceNumber: formData.paymentType === 'INSURANCE' ? formData.insuranceNumber : undefined,
      referralSource: formData.referralSource,
      serviceIds: formData.serviceIds,
      status: 'pending',
      metadata: {
        referralSource: formData.referralSource,
      },
    };
  };

  const applyPatientToForm = (p: Patient) => {
    const { firstName, lastName } = splitName(p.name);
    const addr = splitStoredAddress(p.address ?? '');
    setFormData({
      firstName,
      lastName,
      email: p.email ?? '',
      phone: p.phone ?? '',
      dateOfBirth: dobInputValue(p.dateOfBirth),
      address: addr.address,
      city: addr.city,
      state: addr.state,
      zipCode: addr.zipCode,
      emergencyContact: p.emergencyContact ?? '',
      emergencyPhone: p.emergencyPhone ?? '',
      allergies: p.allergies ?? '',
      paymentType: paymentToForm(p.paymentType),
      insuranceProvider: p.insuranceProvider ?? '',
      insuranceNumber: p.insuranceNumber ?? '',
      referralSource: p.referralSource ?? '',
      serviceIds: p.serviceIds ?? [],
    });
    setLinkedPatientId(p.id);
    setSearchResults([]);
    clearNameBlurTimer();
    setNamePickerFocused(false);
    setVisitDate(new Date().toISOString().slice(0, 10));
    setVisitReason('');
    setVisitAttending('');
    setVisitDiagnosis('');
    setRecordedCaseNumber(null);
  };

  const handleSelectExisting = async (id: string) => {
    try {
      const p = await patientService.getPatient(id);
      applyPatientToForm(p);
    } catch {
      addNotification({
        title: 'Could not load patient',
        message: 'Try again or continue as a new registration.',
        type: 'error',
        priority: 'high',
        category: 'system',
        userId: '',
      });
    }
  };

  const clearLinkedPatient = () => {
    setLinkedPatientId(null);
    clearNameBlurTimer();
    setNamePickerFocused(false);
    setVisitReason('');
    setVisitAttending('');
    setVisitDiagnosis('');
    setRecordedCaseNumber(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (linkedPatientId) {
      const reason = visitReason.trim();
      if (!visitDate || !reason) {
        addNotification({
          title: 'Follow-up details required',
          message: 'Enter the visit date and reason for this follow-up.',
          type: 'warning',
          priority: 'medium',
          category: 'system',
          userId: '',
        });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload = buildPatientPayload();
      if (linkedPatientId) {
        const updated = await patientService.updatePatient(linkedPatientId, payload);
        const caseNotes = [`Visit date: ${visitDate}`, `Reason: ${visitReason.trim()}`].join('\n');
        const newCase = await patientService.createPatientCase(linkedPatientId, {
          type: 'FOLLOW_UP',
          notes: caseNotes,
          diagnosis: visitDiagnosis.trim() || undefined,
          attending: visitAttending.trim() || undefined,
        });
        const detailsParts = [
          `Registered follow-up on ${visitDate}.`,
          visitReason.trim(),
          visitAttending.trim() ? `Attending: ${visitAttending.trim()}.` : '',
        ].filter(Boolean);
        await patientService.logPatientCaseVisit(linkedPatientId, newCase.id, {
          details: detailsParts.join(' '),
        });
        setCreatedPatient(updated);
        setRecordedCaseNumber(newCase.caseNumber ?? null);
        setWasFollowUp(true);
        setSubmitted(true);
        addNotification({
          title: 'Follow-up recorded',
          message: `${updated.name}: profile updated and a follow-up case was opened.`,
          type: 'success',
          priority: 'medium',
          category: 'system',
          userId: '',
        });
      } else {
        const patient = await createPatientMutation.mutate(payload);
        setCreatedPatient(patient);
        setWasFollowUp(false);
        setRecordedCaseNumber(null);
        setSubmitted(true);
        addNotification({
          title: 'Patient registered',
          message: `${patient.name} has been added to the system.`,
          type: 'success',
          priority: 'medium',
          category: 'system',
          userId: '',
        });
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'We could not complete this action. Please try again.';
      addNotification({
        title: linkedPatientId ? 'Follow-up failed' : 'Registration failed',
        message,
        type: 'error',
        priority: 'high',
        category: 'system',
        userId: '',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSubmitted(false);
    setCreatedPatient(null);
    setWasFollowUp(false);
    setRecordedCaseNumber(null);
    clearLinkedPatient();
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      emergencyContact: '',
      emergencyPhone: '',
      allergies: '',
      paymentType: 'CASH',
      insuranceProvider: '',
      insuranceNumber: '',
      referralSource: '',
      serviceIds: [],
    });
    setVisitDate(new Date().toISOString().slice(0, 10));
    setIsSubmitting(false);
    setSearchResults([]);
    clearNameBlurTimer();
    setNamePickerFocused(false);
  };

  if (submitted && createdPatient) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {wasFollowUp ? 'Follow-up visit saved' : 'Patient Registered Successfully!'}
          </h2>
          <p className="text-gray-600 mb-6">
            {wasFollowUp
              ? 'The existing patient record was updated and this visit was logged as a follow-up case.'
              : 'The patient record has been created. They will receive onboarding instructions shortly.'}
          </p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-gray-900 mb-2">Patient Details</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>
                <strong>Name:</strong> {createdPatient.name}
              </p>
              {createdPatient.email != null && createdPatient.email !== '' && (
                <p>
                  <strong>Email:</strong> {createdPatient.email}
                </p>
              )}
              <p>
                <strong>Phone:</strong> {createdPatient.phone}
              </p>
              <p>
                <strong>Patient ID:</strong> {createdPatient.id}
              </p>
              {wasFollowUp && recordedCaseNumber && (
                <p>
                  <strong>Case:</strong> {recordedCaseNumber}
                </p>
              )}
            </div>
          </div>
          <button type="button" onClick={resetForm} className="btn-primary">
            Register Another Patient
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Patient Registration</h1>
        <p className="text-gray-600">
          Focus first or last name to see recent patients, then type to narrow matches. Use both names for the most accurate directory search.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <User className="h-5 w-5 mr-2" />
            Personal Information
          </h2>

          {linkedPatientId && (
            <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 flex flex-wrap items-center justify-between gap-2">
              <span>
                Using existing patient record. Update any details below, then add this follow-up visit.
              </span>
              <button type="button" onClick={clearLinkedPatient} className="text-emerald-800 underline font-medium">
                Register someone new instead
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                onFocus={handleNameFieldFocus}
                onBlur={handleNameFieldBlur}
                required
                className="input-field"
                placeholder="Enter first name"
                autoComplete="given-name"
              />
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                onFocus={handleNameFieldFocus}
                onBlur={handleNameFieldBlur}
                required
                className="input-field"
                placeholder="Enter last name"
                autoComplete="family-name"
              />
            </div>

            <div className="md:col-span-2">
              {!linkedPatientId && namePickerFocused && (
                <div className="rounded-md border border-gray-200 bg-gray-50 shadow-sm overflow-hidden">
                  <div className="px-3 py-2 text-xs font-medium text-gray-600 bg-gray-100 border-b border-gray-200 flex items-center justify-between gap-2">
                    <span>
                      {nameSearchQuery.length < 2
                        ? 'Recent patients (newest first)'
                        : searchLoading
                          ? 'Searching…'
                          : 'Best matches'}
                    </span>
                    {nameSearchQuery.length >= 2 && searchLoading && (
                      <span className="text-gray-400">Updating list…</span>
                    )}
                  </div>
                  {prefetchLoading && pickerPatients.length === 0 ? (
                    <div className="px-3 py-4 text-sm text-gray-500">Loading patient list…</div>
                  ) : pickerPatients.length === 0 ? (
                    <div className="px-3 py-4 text-sm text-gray-500">
                      {nameSearchQuery.length >= 2
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
                            onClick={() => void handleSelectExisting(p.id)}
                          >
                            <div className="font-medium text-gray-900">{p.name}</div>
                            <div className="text-gray-600 text-sm">
                              {p.phone}
                              {p.dateOfBirth ? ` · DOB ${dobInputValue(p.dateOfBirth)}` : ''}
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {linkedPatientId && (
              <div className="md:col-span-2 card border-amber-100 bg-amber-50/80">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-amber-700" />
                  Follow-up visit
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Visit date *</label>
                    <input
                      type="date"
                      value={visitDate}
                      onChange={(e) => setVisitDate(e.target.value)}
                      className="input-field"
                      required={!!linkedPatientId}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Attending (optional)</label>
                    <input
                      type="text"
                      value={visitAttending}
                      onChange={(e) => setVisitAttending(e.target.value)}
                      className="input-field"
                      placeholder="Staff or clinician name"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Reason / chief complaint *</label>
                    <textarea
                      value={visitReason}
                      onChange={(e) => setVisitReason(e.target.value)}
                      className="input-field min-h-[88px]"
                      placeholder="Why is the patient here today?"
                      required={!!linkedPatientId}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Working diagnosis (optional)</label>
                    <input
                      type="text"
                      value={visitDiagnosis}
                      onChange={(e) => setVisitDiagnosis(e.target.value)}
                      className="input-field"
                      placeholder="If applicable"
                    />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="input-field"
                placeholder="Enter email address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
                className="input-field"
                placeholder="Enter phone number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth *</label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                required
                className="input-field"
              />
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <MapPin className="h-5 w-5 mr-2" />
            Address Information
          </h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Street Address *</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                required
                className="input-field"
                placeholder="Enter street address"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                  className="input-field"
                  placeholder="Enter city"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">State *</label>
                <select name="state" value={formData.state} onChange={handleInputChange} required className="input-field">
                  <option value="">Select state</option>
                  <option value="IL">Illinois</option>
                  <option value="CA">California</option>
                  <option value="NY">New York</option>
                  <option value="TX">Texas</option>
                  <option value="FL">Florida</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code *</label>
                <input
                  type="text"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleInputChange}
                  required
                  className="input-field"
                  placeholder="Enter ZIP code"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <Phone className="h-5 w-5 mr-2" />
            Next of Kin Contact
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Next of Kin Name *</label>
              <input
                type="text"
                name="emergencyContact"
                value={formData.emergencyContact}
                onChange={handleInputChange}
                required
                className="input-field"
                placeholder="Enter next of kin name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Next of Kin Phone *</label>
              <input
                type="tel"
                name="emergencyPhone"
                value={formData.emergencyPhone}
                onChange={handleInputChange}
                required
                className="input-field"
                placeholder="Enter next of kin phone"
              />
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Payment & Insurance Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Type <span className="text-red-500">*</span>
              </label>
              <select name="paymentType" value={formData.paymentType} onChange={handleInputChange} className="input-field" required>
                <option value="CASH">Cash</option>
                <option value="INSURANCE">Insurance</option>
              </select>
            </div>

            {formData.paymentType === 'INSURANCE' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Insurance Provider <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="insuranceProvider"
                    value={formData.insuranceProvider}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Enter insurance provider"
                    required={formData.paymentType === 'INSURANCE'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Insurance Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="insuranceNumber"
                    value={formData.insuranceNumber}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Enter insurance number"
                    required={formData.paymentType === 'INSURANCE'}
                  />
                </div>
              </>
            )}

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Referral Source</label>
              <select name="referralSource" value={formData.referralSource} onChange={handleInputChange} className="input-field">
                <option value="">Select referral source</option>
                <option value="doctor">Doctor</option>
                <option value="hospital">Hospital</option>
                <option value="family">Family</option>
                <option value="friend">Friend</option>
                <option value="online">Online</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" className="btn-primary flex items-center" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            {isSubmitting
              ? 'Submitting...'
              : linkedPatientId
                ? 'Save patient & record follow-up'
                : 'Register Patient'}
          </button>
        </div>
      </form>
    </div>
  );
}
