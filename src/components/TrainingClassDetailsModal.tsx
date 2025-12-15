import React from 'react';
import { X, Calendar, Clock, Users, MapPin, BookOpen, User } from 'lucide-react';
import { TrainingClass } from '../types';

interface TrainingClassDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  trainingClass: TrainingClass | null;
}

export default function TrainingClassDetailsModal({
  isOpen,
  onClose,
  trainingClass,
}: TrainingClassDetailsModalProps) {
  if (!isOpen || !trainingClass) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'ongoing':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const enrollmentPercentage = trainingClass.maxParticipants > 0
    ? Math.round((trainingClass.enrolledCount / trainingClass.maxParticipants) * 100)
    : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Class Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Header Section */}
          <div>
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-2xl font-bold text-gray-900">{trainingClass.title}</h3>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                  trainingClass.status
                )}`}
              >
                {trainingClass.status.charAt(0).toUpperCase() + trainingClass.status.slice(1)}
              </span>
            </div>
            <p className="text-gray-600 mt-2">{trainingClass.description}</p>
          </div>

          {/* Category Badge */}
          <div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-secondary-100 text-secondary-800">
              <BookOpen className="h-4 w-4 mr-2" />
              {trainingClass.category}
            </span>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Instructor</p>
                <p className="text-base text-gray-900 mt-1">{trainingClass.instructor}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Date</p>
                <p className="text-base text-gray-900 mt-1">
                  {trainingClass.date
                    ? new Date(trainingClass.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'Date TBD'}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <Clock className="h-5 w-5 text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Duration</p>
                <p className="text-base text-gray-900 mt-1">{trainingClass.duration} hours</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <MapPin className="h-5 w-5 text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Location</p>
                <p className="text-base text-gray-900 mt-1">{trainingClass.location}</p>
              </div>
            </div>
          </div>

          {/* Enrollment Section */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700">Enrollment</p>
              <p className="text-sm text-gray-600">
                {trainingClass.enrolledCount} / {trainingClass.maxParticipants} participants
              </p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full ${
                  enrollmentPercentage >= 100
                    ? 'bg-red-500'
                    : enrollmentPercentage >= 80
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(enrollmentPercentage, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {enrollmentPercentage}% capacity filled
              {enrollmentPercentage >= 100 && ' - Class is full'}
            </p>
          </div>

          {/* Additional Info */}
          <div className="border-t pt-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Additional Information</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <p>
                <strong>Class ID:</strong> {trainingClass.id}
              </p>
              <p>
                <strong>Status:</strong>{' '}
                {trainingClass.status === 'upcoming' && 'This class is scheduled and open for enrollment.'}
                {trainingClass.status === 'ongoing' && 'This class is currently in progress.'}
                {trainingClass.status === 'completed' && 'This class has been completed.'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
          <button onClick={onClose} className="btn-outline">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

