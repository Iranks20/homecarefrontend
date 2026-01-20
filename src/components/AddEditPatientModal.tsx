import { useEffect, useState } from 'react';
import { X, Upload, Image as ImageIcon, FileText } from 'lucide-react';
import { Patient, Service } from '../types';
import { apiService } from '../services/api';
import { API_ENDPOINTS } from '../config/api';
import servicesService from '../services/services';
import { useApi } from '../hooks/useApi';

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

interface AddEditPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (values: PatientFormValues) => Promise<void>;
  patient?: Patient | null;
  mode: 'add' | 'edit';
  specialists: SpecialistOption[];
  therapists: TherapistOption[];
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
}: AddEditPatientModalProps) {
  const [formData, setFormData] = useState<PatientFormValues>(DEFAULT_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Load services for selection
  const {
    data: servicesData,
    loading: loadingServices,
  } = useApi(() => servicesService.getServices({ isActive: true, limit: 200 }), []);

  const servicesList = servicesData?.services ?? [];

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
        email: patient.email,
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
        const avatarUrl = patient.avatar.startsWith('http') 
          ? patient.avatar 
          : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://51.20.55.20:3007'}${patient.avatar.startsWith('/') ? patient.avatar : '/' + patient.avatar}`;
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
      // If assigning to Specialist, clear Therapist assignment (mutually exclusive)
      if (name === 'assignedSpecialistId' && value) {
        newData.assignedTherapistId = '';
      }
      // If assigning to Therapist, clear Specialist assignment (mutually exclusive)
      if (name === 'assignedTherapistId' && value) {
        newData.assignedSpecialistId = '';
      }
      return newData;
    });
  };

  const handleServiceToggle = (serviceId: string) => {
    setFormData((prev) => {
      const currentIds = prev.serviceIds || [];
      const isSelected = currentIds.includes(serviceId);
      return {
      ...prev,
        serviceIds: isSelected
          ? currentIds.filter(id => id !== serviceId)
          : [...currentIds, serviceId],
      };
    });
  };

  const getTotalAmount = () => {
    if (!formData.serviceIds || formData.serviceIds.length === 0) return 0;
    return formData.serviceIds.reduce((total, serviceId) => {
      const service = servicesList.find(s => s.id === serviceId);
      return total + (service?.price || 0);
    }, 0);
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
          const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://51.20.55.20:3007';
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
                  Email Address<span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
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

          {/* Medical Information */}
          <section>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Medical Information</h3>
            <p className="text-sm text-gray-500 mb-4">Primary condition and medical history</p>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Primary Condition<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="condition"
                  value={formData.condition}
                  onChange={handleChange}
                  required
                  className="input-field mt-1"
                  placeholder="e.g., Cardiac rehabilitation, Post-surgical recovery"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Allergies</label>
                <input
                  type="text"
                  name="allergies"
                  value={formData.allergies}
                  onChange={handleChange}
                  className="input-field mt-1"
                  placeholder="Known allergies (medications, food, etc.)"
                />
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
            <p className="text-sm text-gray-500 mb-4">Assign patient to care providers (select either Specialist or Therapist)</p>

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
                  disabled={!!formData.assignedTherapistId}
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
                {formData.assignedTherapistId && (
                  <p className="text-xs text-gray-500 mt-1">Clear Therapist assignment first</p>
                )}
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
                  disabled={!!formData.assignedSpecialistId}
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
                {formData.assignedSpecialistId && (
                  <p className="text-xs text-gray-500 mt-1">Clear Specialist assignment first</p>
                )}
              </div>
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
            
            {/* Services Selection */}
            <div className="mt-4">
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Services
                </label>
                <p className="text-xs text-gray-500">
                  Select one or more services. Invoices will be created automatically for selected services.
                </p>
              </div>

              {loadingServices ? (
                <div className="text-center py-6 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p className="text-xs text-gray-500">Loading services...</p>
                </div>
              ) : servicesList && servicesList.length > 0 ? (
                <>
                  <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {servicesList.map((service) => {
                        const isSelected = formData.serviceIds?.includes(service.id) || false;
                        return (
                          <div
                            key={service.id}
                            onClick={() => handleServiceToggle(service.id)}
                            className={`
                              relative border-2 rounded-lg p-3 cursor-pointer transition-all duration-200
                              ${isSelected
                                ? 'border-blue-500 bg-blue-50 shadow-sm'
                                : 'border-gray-200 bg-white hover:border-blue-300'
                              }
                            `}
                          >
                            <div className="flex items-start gap-2">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleServiceToggle(service.id)}
                                onClick={(e) => e.stopPropagation()}
                                className="h-4 w-4 mt-0.5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <h4 className="text-sm font-semibold text-gray-900 truncate">
                                    {service.name}
                                  </h4>
                                </div>
                                {service.category && (
                                  <p className="text-xs text-gray-500 capitalize">
                                    {service.category.toLowerCase().replace('_', ' ')}
                                  </p>
                                )}
                              </div>
                            </div>
                            {isSelected && (
                              <div className="absolute top-2 right-2">
                                <div className="h-5 w-5 bg-blue-500 rounded-full flex items-center justify-center">
                                  <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </>
              ) : (
                <div className="text-center py-6 bg-gray-50 rounded-lg border border-gray-200">
                  <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-xs font-medium text-gray-700">No services available</p>
                  <p className="text-xs text-gray-500 mt-1">Please add services to the system first</p>
                </div>
              )}
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
