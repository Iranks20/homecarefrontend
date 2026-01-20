import React from 'react';
import { X, User, Mail, Phone, Award, Briefcase, DollarSign, Calendar, Clock, FileText } from 'lucide-react';
import { Specialist } from '../types';

interface ViewSpecialistModalProps {
  isOpen: boolean;
  onClose: () => void;
  specialist: Specialist | null;
}

const formatSpecialization = (specialization: string) => {
  return specialization.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

const getSpecializationColor = (specialization: string) => {
  switch (specialization) {
    case 'clinical-psychologist':
      return 'bg-purple-100 text-purple-800';
    case 'nutritionist':
      return 'bg-green-100 text-green-800';
    case 'critical-care-nurse':
      return 'bg-red-100 text-red-800';
    case 'medical-doctor':
      return 'bg-blue-100 text-blue-800';
    case 'geriatrician':
      return 'bg-indigo-100 text-indigo-800';
    case 'palliative-care-specialist':
      return 'bg-gray-100 text-gray-800';
    case 'senior-midwife':
      return 'bg-rose-100 text-rose-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'inactive':
      return 'bg-gray-100 text-gray-800';
    case 'on-leave':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function ViewSpecialistModal({
  isOpen,
  onClose,
  specialist,
}: ViewSpecialistModalProps) {
  if (!isOpen || !specialist) return null;

  const getAvailabilityText = (availability: any[]) => {
    const availableDays = availability?.filter(slot => slot.isAvailable).length || 0;
    return `${availableDays} days/week`;
  };

  const avatarUrl = specialist.avatar
    ? specialist.avatar.startsWith('http')
      ? specialist.avatar
      : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://51.20.55.20:3007'}${specialist.avatar.startsWith('/') ? specialist.avatar : '/' + specialist.avatar}`
    : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Specialist Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Profile Header */}
          <div className="flex items-start space-x-4 pb-6 border-b border-gray-200">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={specialist.name}
                className="h-20 w-20 rounded-full object-cover border-2 border-gray-200"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-100 text-xl font-semibold text-primary-700">
                {specialist.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
            )}
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-900">{specialist.name}</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getSpecializationColor(specialist.specialization)}`}
                >
                  {formatSpecialization(specialist.specialization)}
                </span>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(specialist.status)}`}
                >
                  {specialist.status.charAt(0).toUpperCase() + specialist.status.slice(1)}
                </span>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3">
              <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-semibold text-gray-900">{specialist.email}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-semibold text-gray-900">{specialist.phone || '—'}</p>
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div className="rounded-lg bg-gray-50 p-4">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Professional Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start space-x-3">
                <Award className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">License Number</p>
                  <p className="font-semibold text-gray-900">{specialist.licenseNumber || '—'}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Briefcase className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Experience</p>
                  <p className="font-semibold text-gray-900">{specialist.experience} years</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <DollarSign className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Hourly Rate</p>
                  <p className="font-semibold text-gray-900">${specialist.hourlyRate}/hr</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Hire Date</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(specialist.hireDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Availability</p>
                  <p className="font-semibold text-gray-900">
                    {getAvailabilityText(specialist.availability)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Certifications */}
          {specialist.certifications && specialist.certifications.length > 0 && (
            <div className="rounded-lg border border-gray-200 p-4">
              <div className="mb-4 flex items-center gap-2">
                <Award className="h-5 w-5 text-gray-400" />
                <h4 className="text-lg font-semibold text-gray-900">Certifications</h4>
              </div>
              <ul className="space-y-2">
                {specialist.certifications.map((cert, index) => (
                  <li key={index} className="flex items-center text-gray-700">
                    <span className="mr-2 text-primary-600">•</span>
                    {cert}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Bio */}
          {specialist.bio && (
            <div className="rounded-lg bg-blue-50 p-4">
              <div className="mb-2 flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <h4 className="text-lg font-semibold text-blue-900">Bio</h4>
              </div>
              <p className="text-sm text-blue-800 whitespace-pre-wrap">{specialist.bio}</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
          <button onClick={onClose} className="btn-primary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
