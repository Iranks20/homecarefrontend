import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Invoice, Patient, Service } from '../types';

interface AddEditInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (invoice: Omit<Invoice, 'id'>) => Promise<void>;
  invoice?: Invoice | null;
  mode: 'add' | 'edit';
  patients: Patient[];
  services: Service[];
}

const createDefaultForm = (invoice?: Invoice | null): Omit<Invoice, 'id'> => ({
  patientId: invoice?.patientId || '',
  patientName: invoice?.patientName || '',
  serviceId: invoice?.serviceId || '',
  serviceName: invoice?.serviceName || '',
  amount: invoice?.amount || 0,
  date: invoice?.date || new Date().toISOString().split('T')[0],
  dueDate:
    invoice?.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  status: invoice?.status || 'pending',
  description: invoice?.description || '',
});

export default function AddEditInvoiceModal({
  isOpen,
  onClose,
  onSave,
  invoice,
  mode,
  patients,
  services,
}: AddEditInvoiceModalProps) {
  const [formData, setFormData] = useState<Omit<Invoice, 'id'>>(createDefaultForm(invoice));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setIsSubmitting(false);
    setError(null);
    setFormData(createDefaultForm(invoice));
  }, [invoice, mode, isOpen]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'amount' ? Number(value) : value,
    }));
  };

  const handlePatientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const patientId = e.target.value;
    const selectedPatient = patients.find((p) => p.id === patientId);
    setFormData((prev) => ({
      ...prev,
      patientId,
      patientName: selectedPatient?.name ?? '',
    }));
  };

  const handleServiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const serviceId = e.target.value;
    const selectedService = services.find((service) => service.id === serviceId);
    setFormData((prev) => ({
      ...prev,
      serviceId,
      serviceName: selectedService?.name ?? '',
      amount: selectedService?.price ?? prev.amount,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await onSave({ ...formData, amount: Number(formData.amount) });
      setIsSubmitting(false);
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err?.message ?? 'Unable to save invoice. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === 'add' ? 'Create New Invoice' : 'Edit Invoice'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Patient *</label>
            <select name="patientId" value={formData.patientId} onChange={handlePatientChange} required className="input-field">
              <option value="">Select a patient</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.name} - {patient.condition}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Service *</label>
            <select name="serviceId" value={formData.serviceId} onChange={handleServiceChange} required className="input-field">
              <option value="">Select a service</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name} - ${service.price}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Amount ($) *</label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              required
              min="0"
              step="0.01"
              className="input-field"
              placeholder="Enter invoice amount"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Invoice Date *</label>
              <input type="date" name="date" value={formData.date} onChange={handleInputChange} required className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Due Date *</label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleInputChange}
                required
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
            <select name="status" value={formData.status} onChange={handleInputChange} required className="input-field">
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              rows={4}
              className="input-field"
              placeholder="Enter invoice description and details"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button type="button" onClick={onClose} className="btn-outline">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : mode === 'add' ? 'Create Invoice' : 'Update Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
