import React, { useState, useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
import { Appointment, Nurse, Patient, Service, Specialist } from '../types';

export type AppointmentFormValues = {
  patientId: string;
  nurseId?: string;
  specialistId?: string;
  serviceId: string;
  date: string;
  time: string;
  duration: number;
  status: Appointment['status'];
  notes?: string;
};

interface ReferenceLoadingState {
  patients?: boolean;
  nurses?: boolean;
  specialists?: boolean;
  services?: boolean;
}

interface AddEditAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (appointment: AppointmentFormValues) => Promise<void>;
  appointment?: Appointment | null;
  mode: 'add' | 'edit';
  patients: Patient[];
  nurses: Nurse[];
  services: Service[];
  specialists: Specialist[];
  loading?: ReferenceLoadingState;
}

const STATUS_OPTIONS: { value: Appointment['status']; label: string }[] = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'rescheduled', label: 'Rescheduled' },
  { value: 'no-show', label: 'No Show' },
];

export default function AddEditAppointmentModal({
  isOpen,
  onClose,
  onSave,
  appointment,
  mode,
  patients,
  nurses,
  services,
  specialists,
  loading,
}: AddEditAppointmentModalProps) {
  const [formData, setFormData] = useState<AppointmentFormValues>(
    appointment
      ? {
          patientId: appointment.patientId,
          nurseId: appointment.nurseId || undefined,
          serviceId: appointment.serviceId,
          specialistId: appointment.specialistId || undefined,
          date: appointment.date,
          time: appointment.time,
          duration: appointment.duration,
          status: appointment.status,
          notes: appointment.notes ?? '',
        }
      : {
          patientId: '',
          nurseId: '',
          serviceId: '',
          specialistId: '',
          date: new Date().toISOString().split('T')[0],
          time: '',
          duration: 60,
          status: 'scheduled',
          notes: '',
        }
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setIsSubmitting(false);
      setError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (appointment && mode === 'edit') {
      setFormData({
        patientId: appointment.patientId,
        nurseId: appointment.nurseId || undefined,
        serviceId: appointment.serviceId,
        specialistId: appointment.specialistId || undefined,
        date: appointment.date,
        time: appointment.time,
        duration: appointment.duration,
        status: appointment.status,
        notes: appointment.notes ?? '',
      });
    } else if (mode === 'add') {
      setFormData((prev) => ({
        ...prev,
        patientId: '',
        nurseId: '',
        serviceId: '',
        specialistId: '',
        date: new Date().toISOString().split('T')[0],
        time: '',
        duration: 60,
        status: 'scheduled',
        notes: '',
      }));
    }
  }, [appointment, mode]);

  const isReferenceLoading = useMemo(
    () => Boolean(loading?.patients || loading?.nurses || loading?.services || loading?.specialists),
    [loading]
  );

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === 'duration'
          ? Number(value)
          : value,
    }));
  };

  const handleSpecialistChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    setFormData((prev) => ({
      ...prev,
      specialistId: value || undefined,
    }));
  };

  const handleServiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const serviceId = e.target.value;
    const selectedService = services.find((service) => service.id === serviceId);
    setFormData((prev) => ({
      ...prev,
      serviceId,
      duration: selectedService?.duration ?? prev.duration,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await onSave({
        ...formData,
        nurseId: formData.nurseId || undefined,
        specialistId: formData.specialistId || undefined,
        notes: formData.notes?.trim() ? formData.notes.trim() : undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message ?? 'Unable to save appointment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === 'add' ? 'Schedule New Appointment' : 'Edit Appointment'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Patient Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Patient *
            </label>
            <select
              name="patientId"
              value={formData.patientId}
              onChange={handleInputChange}
              required
              className="input-field"
              disabled={isReferenceLoading || isSubmitting}
            >
              <option value="">Select a patient</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.name}{' '}
                  {patient.condition ? `- ${patient.condition}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Nurse Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assigned Nurse
              </label>
              <select
                name="nurseId"
                value={formData.nurseId ?? ''}
                onChange={handleInputChange}
                className="input-field"
                disabled={isReferenceLoading || isSubmitting}
              >
                <option value="">Select a nurse</option>
                {nurses.map((nurse) => (
                  <option key={nurse.id} value={nurse.id}>
                    {nurse.name} - {nurse.specialization}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assigned Specialist
              </label>
              <select
                name="specialistId"
                value={formData.specialistId ?? ''}
                onChange={handleSpecialistChange}
                className="input-field"
                disabled={isReferenceLoading || isSubmitting}
              >
                <option value="">Select a specialist</option>
                {specialists.map((specialist) => (
                  <option key={specialist.id} value={specialist.id}>
                    {specialist.name} - {specialist.specialization.replace(/-/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Service Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Service *
            </label>
            <select
              name="serviceId"
              value={formData.serviceId}
              onChange={handleServiceChange}
              required
              className="input-field"
              disabled={isReferenceLoading || isSubmitting}
            >
              <option value="">Select a service</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name} - ${(service.price ?? 0).toFixed(2)} ({Math.round(service.duration / 60)}h)
                </option>
              ))}
            </select>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date *
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                required
                className="input-field"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time *
              </label>
              <input
                type="time"
                name="time"
                value={formData.time}
                onChange={handleInputChange}
                required
                className="input-field"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Duration and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (minutes) *
              </label>
              <input
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                required
                min={15}
                max={480}
                step={15}
                className="input-field"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status *
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                required
                className="input-field"
                disabled={isSubmitting}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes ?? ''}
              onChange={handleInputChange}
              rows={4}
              className="input-field"
              placeholder="Enter any additional notes for this appointment"
              disabled={isSubmitting}
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
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
              disabled={isSubmitting || isReferenceLoading}
            >
              {isSubmitting
                ? 'Saving...'
                : mode === 'add'
                ? 'Schedule Appointment'
                : 'Update Appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
