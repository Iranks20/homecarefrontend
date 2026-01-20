import { useState } from 'react';
import { User, Phone, MapPin, FileText, Save, Loader2 } from 'lucide-react';
import { useApiMutation, useApi } from '../hooks/useApi';
import { patientService, type PatientRegistrationData } from '../services/patients';
import { useNotifications } from '../contexts/NotificationContext';
import servicesService from '../services/services';
import type { Patient } from '../types';

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
    serviceIds: [] as string[]
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [createdPatient, setCreatedPatient] = useState<Patient | null>(null);
  const { addNotification } = useNotifications();
  const createPatientMutation = useApiMutation(patientService.createPatient.bind(patientService));

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      // Clear insurance fields if payment type changes to CASH
      if (name === 'paymentType' && value === 'CASH') {
        newData.insuranceProvider = '';
        newData.insuranceNumber = '';
      }
      return newData;
    });
  };

  const handleServiceToggle = (serviceId: string) => {
    setFormData(prev => {
      const currentIds = prev.serviceIds || [];
      const isSelected = currentIds.includes(serviceId);
      return {
        ...prev,
        serviceIds: isSelected
          ? currentIds.filter(id => id !== serviceId)
          : [...currentIds, serviceId]
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = buildPatientPayload();
      const patient = await createPatientMutation.mutate(payload);
      setCreatedPatient(patient);
      setSubmitted(true);

      addNotification({
        title: 'Patient registered',
        message: `${patient.name} has been added to the system.`,
        type: 'success',
        priority: 'medium',
        category: 'system',
        userId: '',
      });
    } catch (error: any) {
      addNotification({
        title: 'Registration failed',
        message: error?.message || 'We could not register the patient. Please try again.',
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
      paymentType: 'CASH' as 'CASH' | 'INSURANCE',
      insuranceProvider: '',
      insuranceNumber: '',
      referralSource: '',
      serviceIds: []
    });
    setIsSubmitting(false);
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
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Patient Registered Successfully!</h2>
          <p className="text-gray-600 mb-6">
            The patient record has been created. They will receive onboarding instructions shortly.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-gray-900 mb-2">Patient Details</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Name:</strong> {createdPatient.name}</p>
              <p><strong>Email:</strong> {createdPatient.email}</p>
              <p><strong>Phone:</strong> {createdPatient.phone}</p>
              <p><strong>Patient ID:</strong> {createdPatient.id}</p>
            </div>
          </div>
          <button onClick={resetForm} className="btn-primary">
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
        <p className="text-gray-600">Register new patients in the healthcare system</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Personal Information */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <User className="h-5 w-5 mr-2" />
            Personal Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name *
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                required
                className="input-field"
                placeholder="Enter first name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name *
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                required
                className="input-field"
                placeholder="Enter last name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="input-field"
                placeholder="Enter email address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </label>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date of Birth *
              </label>
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

        {/* Address Information */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <MapPin className="h-5 w-5 mr-2" />
            Address Information
          </h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Street Address *
              </label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City *
                </label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State *
                </label>
                <select
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  required
                  className="input-field"
                >
                  <option value="">Select state</option>
                  <option value="IL">Illinois</option>
                  <option value="CA">California</option>
                  <option value="NY">New York</option>
                  <option value="TX">Texas</option>
                  <option value="FL">Florida</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ZIP Code *
                </label>
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

        {/* Next of Kin Contact */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <Phone className="h-5 w-5 mr-2" />
            Next of Kin Contact
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Next of Kin Name *
              </label>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Next of Kin Phone *
              </label>
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

        {/* Medical Information */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Medical Information
          </h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Allergies
              </label>
              <textarea
                name="allergies"
                value={formData.allergies}
                onChange={handleInputChange}
                className="input-field h-24 resize-none"
                placeholder="List any known allergies"
              />
            </div>
          </div>
        </div>

        {/* Payment & Insurance Information */}
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
              <select
                name="paymentType"
                value={formData.paymentType}
                onChange={handleInputChange}
                className="input-field"
                required
              >
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Referral Source
              </label>
              <select
                name="referralSource"
                value={formData.referralSource}
                onChange={handleInputChange}
                className="input-field"
              >
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

        {/* Services Selection */}
        <div className="card">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-blue-600" />
              Service Selection
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Select one or more services for this patient. Invoices will be created automatically for selected services.
            </p>
          </div>

          {loadingServices ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Loading services...</p>
            </div>
          ) : servicesList && servicesList.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {servicesList.map((service) => {
                  const isSelected = formData.serviceIds?.includes(service.id) || false;
                  return (
                    <div
                      key={service.id}
                      onClick={() => handleServiceToggle(service.id)}
                      className={`
                        relative border-2 rounded-lg p-4 cursor-pointer transition-all duration-200
                        ${isSelected
                          ? 'border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-200'
                          : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
                        }
                      `}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleServiceToggle(service.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <h3 className="text-sm font-semibold text-gray-900 truncate">
                              {service.name}
                            </h3>
                          </div>
                          {service.category && (
                            <p className="text-xs text-gray-500 mb-2 capitalize">
                              {service.category.toLowerCase().replace('_', ' ')}
                            </p>
                          )}
                          {service.description && (
                            <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                              {service.description}
                            </p>
                          )}
                        </div>
                      </div>
                      {isSelected && (
                        <div className="absolute top-2 right-2">
                          <div className="h-6 w-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

            </>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">No services available</p>
              <p className="text-xs text-gray-500 mt-1">Please add services to the system first</p>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button type="submit" className="btn-primary flex items-center" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            {isSubmitting ? 'Submitting...' : 'Register Patient'}
          </button>
        </div>
      </form>
    </div>
  );
}

