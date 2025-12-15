import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { TrainingClass } from '../types';

interface AddEditTrainingClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (trainingClass: Omit<TrainingClass, 'id'>) => Promise<void>;
  trainingClass?: TrainingClass | null;
  mode: 'add' | 'edit';
}

export default function AddEditTrainingClassModal({ isOpen, onClose, onSave, trainingClass, mode }: AddEditTrainingClassModalProps) {
  const [formData, setFormData] = useState<Omit<TrainingClass, 'id'>>({
    title: '',
    description: '',
    instructor: '',
    date: new Date().toISOString().split('T')[0],
    duration: 2,
    maxParticipants: 20,
    enrolledCount: 0,
    status: 'upcoming',
    category: '',
    location: '',
  });
  const [startTime, setStartTime] = useState('09:00');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setError(null);
    setIsSubmitting(false);

    if (trainingClass && mode === 'edit') {
      const classDate = trainingClass.date ? new Date(trainingClass.date) : new Date();
      const dateStr = classDate.toISOString().split('T')[0];
      const timeStr = classDate.toTimeString().slice(0, 5);
      
      setFormData({
        title: trainingClass.title,
        description: trainingClass.description,
        instructor: trainingClass.instructor,
        date: dateStr,
        duration: trainingClass.duration,
        maxParticipants: trainingClass.maxParticipants,
        enrolledCount: trainingClass.enrolledCount ?? 0,
        status: trainingClass.status,
        category: trainingClass.category,
        location: trainingClass.location,
      });
      setStartTime(timeStr);
    } else {
      setFormData({
        title: '',
        description: '',
        instructor: '',
        date: new Date().toISOString().split('T')[0],
        duration: 2,
        maxParticipants: 20,
        enrolledCount: 0,
        status: 'upcoming',
        category: '',
        location: '',
      });
      setStartTime('09:00');
    }
  }, [trainingClass, mode, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (['duration', 'maxParticipants', 'enrolledCount'].includes(name)) {
      setFormData(prev => ({ ...prev, [name]: Number(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Combine date and time into a single datetime string
      const [hours, minutes] = startTime.split(':');
      const dateTime = new Date(formData.date);
      dateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      
      await onSave({
        ...formData,
        date: dateTime.toISOString(),
      });
      setIsSubmitting(false);
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err?.message ?? 'Unable to save training class. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === 'add' ? 'Schedule New Training Class' : 'Edit Training Class'}
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
            <div className="p-3 rounded bg-red-50 text-sm text-red-700 border border-red-200">
              {error}
            </div>
          )}
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Class Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="input-field"
                placeholder="Enter class title"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={3}
                className="input-field"
                placeholder="Enter class description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Instructor *
              </label>
              <input
                type="text"
                name="instructor"
                value={formData.instructor}
                onChange={handleInputChange}
                required
                className="input-field"
                placeholder="Enter instructor name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
                className="input-field"
              >
                <option value="">Select category</option>
                <option value="Clinical Psychology">Clinical Psychology</option>
                <option value="Nutrition">Nutrition</option>
                <option value="Critical Care">Critical Care</option>
                <option value="BLS/ALS">BLS/ALS</option>
                <option value="Geriatrics">Geriatrics</option>
                <option value="Palliative Care">Palliative Care</option>
                <option value="Maternal & Newborn Care">Maternal & Newborn Care</option>
                <option value="General Nursing">General Nursing</option>
                <option value="Physiotherapy">Physiotherapy</option>
                <option value="Communication">Communication</option>
                <option value="Safety">Safety</option>
              </select>
            </div>

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
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Time *
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (hours) *
              </label>
              <input
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                required
                min="0.5"
                max="8"
                step="0.5"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Participants *
              </label>
              <input
                type="number"
                name="maxParticipants"
                value={formData.maxParticipants}
                onChange={handleInputChange}
                required
                min="1"
                max="100"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enrolled Count
              </label>
              <input
                type="number"
                name="enrolledCount"
                value={formData.enrolledCount}
                onChange={handleInputChange}
                min="0"
                max={formData.maxParticipants}
                className="input-field"
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
              >
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location *
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                required
                className="input-field"
                placeholder="Enter class location"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="btn-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? 'Saving...'
                : mode === 'add'
                ? 'Schedule Class'
                : 'Update Class'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
