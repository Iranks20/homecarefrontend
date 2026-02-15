import { useState } from 'react';
import { User, Phone, MapPin, FileText, Save, Loader2 } from 'lucide-react';
import { useApiMutation } from '../hooks/useApi';
import { patientService, type PatientRegistrationData } from '../services/patients';
import { useNotifications } from '../contexts/NotificationContext';
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
              {createdPatient.email != null && createdPatient.email !== '' && (
                <p><strong>Email:</strong> {createdPatient.email}</p>
              )}
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
                Email Address
              </label>
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

