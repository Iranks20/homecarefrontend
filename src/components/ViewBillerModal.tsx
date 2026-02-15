import React from 'react';
import { X, User, Mail, Phone, Briefcase, CreditCard, Calendar } from 'lucide-react';
import { User as UserType } from '../types';
import { getAssetUrl } from '../config/api';

interface ViewBillerModalProps {
  isOpen: boolean;
  onClose: () => void;
  biller: UserType | null;
}

const getStatusColor = (isActive: boolean) =>
  isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';

export default function ViewBillerModal({
  isOpen,
  onClose,
  biller,
}: ViewBillerModalProps) {
  if (!isOpen || !biller) return null;

  const avatarUrl = biller.avatar
    ? biller.avatar.startsWith('http')
      ? biller.avatar
      : getAssetUrl(biller.avatar)
    : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Biller Details</h2>
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
                alt={biller.name}
                className="h-20 w-20 rounded-full object-cover border-2 border-gray-200"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-100 text-xl font-semibold text-primary-700">
                {biller.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
            )}
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-900">{biller.name}</h3>
              <div className="mt-2">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                    biller.isActive ?? true
                  )}`}
                >
                  {biller.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          {/* Contact & Info */}
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Mail className="h-5 w-5 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-900">{biller.email}</p>
              </div>
            </div>
            {biller.username && (
              <div className="flex items-start space-x-3">
                <User className="h-5 w-5 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-gray-500">Username</p>
                  <p className="font-medium text-gray-900">{biller.username}</p>
                </div>
              </div>
            )}
            <div className="flex items-start space-x-3">
              <Phone className="h-5 w-5 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium text-gray-900">{biller.phone || '—'}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Briefcase className="h-5 w-5 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-gray-500">Department</p>
                <p className="font-medium text-gray-900">
                  {biller.department || '—'}
                </p>
              </div>
            </div>
            {biller.employeeId && (
              <div className="flex items-start space-x-3">
                <CreditCard className="h-5 w-5 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-gray-500">Employee ID</p>
                  <p className="font-medium text-gray-900">{biller.employeeId}</p>
                </div>
              </div>
            )}
            {biller.createdAt && (
              <div className="flex items-start space-x-3">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-gray-500">Joined</p>
                  <p className="font-medium text-gray-900">
                    {new Date(biller.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end border-t border-gray-200 px-6 py-4">
          <button onClick={onClose} className="btn-primary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
