import { useMemo, useState } from 'react';
import { Calendar, MapPin, Video, Home, CreditCard, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useApi, useApiMutation } from '../hooks/useApi';
import servicesService from '../services/services';
import { specialistService } from '../services/specialists';
import patientService from '../services/patients';
import { appointmentService, type CreateAppointmentData } from '../services/appointments';
import { useNotifications } from '../contexts/NotificationContext';

const availableTimes = ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'];

const SPECIALIZATION_BY_CATEGORY: Record<string, string[]> = {
  'Mental Health': ['clinical-psychologist'],
  Nutrition: ['nutritionist'],
  Nursing: ['critical-care-nurse', 'medical-doctor'],
  'Palliative Care': ['palliative-care-specialist'],
  'Maternal Care': ['senior-midwife'],
  Physiotherapy: ['medical-doctor'],
};

export default function BookAppointment() {
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedVisitType, setSelectedVisitType] = useState<'home' | 'clinic' | 'telemedicine'>('home');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedSpecialist, setSelectedSpecialist] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isBooking, setIsBooking] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  const {
    data: servicesData,
    loading: loadingServices,
    error: servicesError,
  } = useApi(() => servicesService.getServices({ isActive: true, limit: 200 }), []);

  const {
    data: specialistsData,
    loading: loadingSpecialists,
  } = useApi(() => specialistService.getSpecialists({ limit: 200, status: 'active' }), []);

  const {
    data: patientLookup,
    loading: loadingPatient,
  } = useApi(
    () =>
      user?.email
        ? patientService.getPatients({ query: user.email, limit: 1 })
        : Promise.resolve({ patients: [] }),
    [user?.email]
  );

  const createAppointmentMutation = useApiMutation(appointmentService.createAppointment.bind(appointmentService));

  const servicesList = servicesData?.services ?? [];
  const specialistsList = (specialistsData?.specialists ?? []).filter((specialist) => specialist.status === 'active');
  const patientRecord = patientLookup?.patients?.[0];

  const getSelectedServiceDetails = () =>
    servicesList.find((service) => service.id === selectedService) ?? null;

  const availableSpecialists = useMemo(() => {
    const service = getSelectedServiceDetails();
    if (!service) return specialistsList;

    const matchingSpecializations = SPECIALIZATION_BY_CATEGORY[service.category] ?? [];
    if (!matchingSpecializations.length) {
      return specialistsList;
    }

    return specialistsList.filter((specialist) =>
      matchingSpecializations.includes(specialist.specialization)
    );
  }, [selectedService, specialistsList]);

  const resetForm = () => {
    setSelectedService('');
    setSelectedVisitType('home');
    setSelectedDate('');
    setSelectedTime('');
    setSelectedSpecialist('');
    setAddress('');
    setNotes('');
  };

  const handleBooking = async () => {
    if (!patientRecord) {
      addNotification({
        title: 'Patient profile required',
        message: 'We could not locate a patient record for your account. Please contact support.',
        type: 'error',
        userId: user?.id ?? 'system',
        priority: 'high',
        category: 'system',
      });
      return;
    }

    const serviceDetails = getSelectedServiceDetails();
    if (!serviceDetails || !selectedDate || !selectedTime) {
      addNotification({
        title: 'Missing details',
        message: 'Please complete all required fields before booking.',
        type: 'warning',
        userId: user?.id ?? 'system',
        priority: 'medium',
        category: 'system',
      });
      return;
    }

    setIsBooking(true);

    try {
      const payload: CreateAppointmentData = {
        patientId: patientRecord.id,
        serviceId: serviceDetails.id,
        specialistId: selectedSpecialist || undefined,
        nurseId: undefined,
        date: selectedDate,
        time: selectedTime,
        duration: serviceDetails.duration,
        notes: [
          `Visit type: ${selectedVisitType}`,
          selectedVisitType === 'home' && address ? `Address: ${address}` : '',
          notes ? `Notes: ${notes}` : '',
        ]
          .filter(Boolean)
          .join(' | '),
      };

      await createAppointmentMutation.mutate(payload);

      addNotification({
        title: 'Appointment Confirmed',
        message: `${serviceDetails.name} booked for ${selectedDate} at ${selectedTime}.`,
        type: 'success',
        userId: user?.id ?? 'system',
        priority: 'medium',
        category: 'appointment',
      });

      setBookingComplete(true);
    } catch (err: any) {
      addNotification({
        title: 'Unable to book appointment',
        message: err?.message ?? 'Please try again later.',
        type: 'error',
        userId: user?.id ?? 'system',
        priority: 'high',
        category: 'system',
      });
    } finally {
      setIsBooking(false);
    }
  };

  if (bookingComplete) {
    const serviceDetails = getSelectedServiceDetails();
    const specialistName = specialistsList.find((s) => s.id === selectedSpecialist)?.name;
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Appointment Booked Successfully!</h2>
          <p className="text-gray-600 mb-6">
            Your appointment has been confirmed. You will receive a confirmation email shortly.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Appointment Details</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Service:</strong> {serviceDetails?.name}</p>
              <p><strong>Date:</strong> {selectedDate}</p>
              <p><strong>Time:</strong> {selectedTime}</p>
              <p><strong>Type:</strong> {selectedVisitType}</p>
              {specialistName && (
                <p><strong>Specialist:</strong> {specialistName}</p>
              )}
            </div>
          </div>
          <button
            onClick={() => {
              setBookingComplete(false);
              resetForm();
            }}
            className="btn-primary"
          >
            Book Another Appointment
          </button>
        </div>
      </div>
    );
  }

  if (loadingServices || loadingSpecialists || loadingPatient) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card text-center py-12 text-sm text-gray-500">Loading booking data…</div>
      </div>
    );
  }

  if (servicesError) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card text-center py-12 text-sm text-red-500">
          Unable to load services. Please try again later.
        </div>
      </div>
    );
  }

  if (!patientRecord) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No patient profile found</h2>
          <p className="text-gray-600">
            We couldn&apos;t locate a patient record for your account. Please contact support to create one before booking an appointment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Book an Appointment</h1>
        <p className="text-gray-600">Schedule your healthcare service with our qualified specialists</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Service Selection */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Select Service</h2>
          <div className="space-y-3">
            {servicesList.map((service) => (
              <button
                key={service.id}
                onClick={() => setSelectedService(service.id)}
                className={`w-full p-4 border-2 rounded-lg text-left transition-all duration-200 ${
                  selectedService === service.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-900">{service.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                    <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500">
                      <span>${(service.price ?? 0).toFixed(2)}</span>
                      <span>{service.duration} min</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Visit Type Selection */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Choose Visit Type</h2>
          <div className="space-y-3">
            <button
              onClick={() => setSelectedVisitType('home')}
              className={`w-full p-4 border-2 rounded-lg text-left transition-all duration-200 ${
                selectedVisitType === 'home'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <Home className="h-6 w-6 text-primary-500 mr-3" />
                <div>
                  <h3 className="font-medium text-gray-900">Home Visit</h3>
                  <p className="text-sm text-gray-600">Care provided at your location</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setSelectedVisitType('clinic')}
              className={`w-full p-4 border-2 rounded-lg text-left transition-all duration-200 ${
                selectedVisitType === 'clinic'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <MapPin className="h-6 w-6 text-primary-500 mr-3" />
                <div>
                  <h3 className="font-medium text-gray-900">Clinic Visit</h3>
                  <p className="text-sm text-gray-600">Visit our medical facility</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setSelectedVisitType('telemedicine')}
              className={`w-full p-4 border-2 rounded-lg text-left transition-all duration-200 ${
                selectedVisitType === 'telemedicine'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <Video className="h-6 w-6 text-primary-500 mr-3" />
                <div>
                  <h3 className="font-medium text-gray-900">Telemedicine</h3>
                  <p className="text-sm text-gray-600">Remote consultation via video call</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Specialist Selection */}
        {selectedService && (
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Choose Specialist</h2>
            <div className="space-y-3">
              {availableSpecialists.map((specialist) => (
                <button
                  key={specialist.id}
                  onClick={() => setSelectedSpecialist(specialist.id)}
                  className={`w-full p-4 border-2 rounded-lg text-left transition-all duration-200 ${
                    selectedSpecialist === specialist.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center mr-4">
                      <span className="text-primary-600 font-medium">
                        {specialist.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{specialist.name}</h3>
                      <p className="text-sm text-gray-600 capitalize">
                        {specialist.specialization.replace('-', ' ')}
                      </p>
                      <p className="text-sm text-gray-500">{specialist.experience} years experience</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Date & Time Selection */}
        {selectedService && (
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Select Date & Time</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="input-field"
              />
            </div>

            {selectedDate && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                <div className="grid grid-cols-3 gap-2">
                  {availableTimes.map((time) => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={`p-2 text-sm border rounded-lg transition-all duration-200 ${
                        selectedTime === time
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Address (for home visits) */}
        {selectedVisitType === 'home' && selectedService && (
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Address</h2>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter your full address..."
              className="input-field h-24 resize-none"
            />
          </div>
        )}

        {/* Notes */}
        {selectedService && (
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Additional Notes</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any specific requirements or notes..."
              className="input-field h-24 resize-none"
            />
          </div>
        )}
      </div>

      {/* Booking Summary & Payment */}
      {selectedService && selectedDate && selectedTime && (
        <div className="mt-8">
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Booking Summary</h2>
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Service Details</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Service:</strong> {getSelectedServiceDetails()?.name}</p>
                    <p><strong>Date:</strong> {selectedDate}</p>
                    <p><strong>Time:</strong> {selectedTime}</p>
                    <p><strong>Duration:</strong> {getSelectedServiceDetails()?.duration} minutes</p>
                    <p><strong>Type:</strong> {selectedVisitType}</p>
                    {selectedSpecialist && (
                      <p><strong>Specialist:</strong> {availableSpecialists.find((s) => s.id === selectedSpecialist)?.name}</p>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Payment</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Service Fee:</strong> ${(getSelectedServiceDetails()?.price ?? 0).toFixed(2)}</p>
                    <p><strong>Total:</strong> ${(getSelectedServiceDetails()?.price ?? 0).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center text-sm text-gray-600">
                <CreditCard className="h-4 w-4 mr-2" />
                <span>Payment will be processed after service completion</span>
              </div>
              <button
                onClick={handleBooking}
                disabled={isBooking}
                className="btn-primary flex items-center"
              >
                {isBooking ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Booking...
                  </>
                ) : (
                  <>
                    <Calendar className="h-4 w-4 mr-2" />
                    Book Appointment
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

