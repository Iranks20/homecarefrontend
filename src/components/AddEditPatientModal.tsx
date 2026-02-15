import { useEffect, useState } from 'react';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { Patient } from '../types';
import { apiService } from '../services/api';
import { API_CONFIG, API_ENDPOINTS, getAssetUrl } from '../config/api';

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
  patient?: Patient | null;
  mode: 'add' | 'edit';
  specialists: SpecialistOption[];
  therapists: TherapistOption[];
  /** Services for optional selection (prices not shown to receptionist) */
  services?: ServiceOption[];
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

export default function AddEditPatientModal({
  isOpen,
  onClose,
  onSave,
  patient,
  mode,
  specialists,
  therapists,
  services = [],
}: AddEditPatientModalProps) {
  const [formData, setFormData] = useState<PatientFormValues>(DEFAULT_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setFormData(DEFAULT_FORM);
      setIsSubmitting(false);
      setError(null);
      setAvatarFile(null);
      setAvatarPreview(null);
      return;
    }

    if (patient && mode === 'edit') {
      // Parse address if it contains city, state, zip
      const addressParts = patient.address?.split(', ') || [];
      const fullAddress = addressParts[0] || patient.address || '';
      const city = addressParts[1] || '';
      const stateZip = addressParts[2]?.split(' ') || [];
      const state = stateZip[0] || '';
      const zipCode = stateZip[1] || '';

      setFormData({
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
        assignedSpecialistId: (patient as any).assignedSpecialistId ?? '',
        assignedTherapistId: (patient as any).assignedTherapistId ?? '',
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
      });
      // Set avatar preview with full URL if it's a relative path
      if (patient.avatar) {
        const avatarUrl = patient.avatar.startsWith('http') ? patient.avatar : getAssetUrl(patient.avatar);
        setAvatarPreview(avatarUrl);
      } else {
        setAvatarPreview(null);
      }
    } else {
      setFormData({
        ...DEFAULT_FORM,
        dateOfBirth: '',
        status: 'active',
      });
    }
  }, [isOpen, patient, mode]);

  if (!isOpen) {
    return null;
  }

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
      // Build full address from components
      const fullAddress = [formData.address, formData.city, formData.state, formData.zipCode]
        .filter(Boolean)
        .join(', ');

      const submitData: PatientFormValues = {
        ...formData,
        address: fullAddress || formData.address,
      };

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
        <div className="flex items-center justify-between border-b px-6 py-4 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {mode === 'add' ? 'Register New Patient' : 'Update Patient Details'}
            </h2>
            <p className="text-sm text-gray-500">
              {mode === 'add'
                ? 'Complete patient registration form'
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

          {/* Personal Information */}
          <section>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Personal Information</h3>
            <p className="text-sm text-gray-500 mb-4">Required information about the patient</p>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Full Name<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="input-field mt-1"
                  placeholder="Jane Doe"
                />
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
          </section>

          {/* Address Information */}
          <section>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Address Information</h3>
            <p className="text-sm text-gray-500 mb-4">Patient's residential address</p>

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

          {/* Payment & Insurance Information */}
          <section>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Payment & Insurance Information</h3>
            <p className="text-sm text-gray-500 mb-4">Payment method and insurance details</p>

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

          {/* Assignment & Care Details */}
          <section>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Assignment & Care Details</h3>
            <p className="text-sm text-gray-500 mb-4">Assign patient to one or more care providers (Specialist and/or Therapist)</p>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Assigned Specialist
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
                  Assigned Therapist
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

          <div className="flex items-center justify-end gap-3 border-t pt-6 sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="btn-outline"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? 'Saving...'
                : mode === 'add'
                ? 'Register Patient'
                : 'Update Patient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
