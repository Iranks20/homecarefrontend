import { useState, useEffect, useMemo } from 'react';
import { X, Save, Package, DollarSign, Tag, Plus, Trash2 } from 'lucide-react';
import { Service } from '../types';

interface ServiceFormValues {
  name: string;
  description: string;
  category: string;
  price: number;
  duration: number;
  features: string[];
  image?: string;
}

interface AddEditServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (service: ServiceFormValues) => Promise<void>;
  service?: Service | null;
  mode: 'add' | 'edit';
  categories?: string[];
}

const DEFAULT_CATEGORIES = [
  'Nursing',
  'Physiotherapy',
  'Palliative Care',
  'Nutrition',
  'Mental Health',
  'Maternal Care',
];

export default function AddEditServiceModal({
  isOpen,
  onClose,
  onSave,
  service,
  mode,
  categories,
}: AddEditServiceModalProps) {
  const [formData, setFormData] = useState<ServiceFormValues>({
    name: '',
    description: '',
    category: '',
    price: 0,
    duration: 60,
    features: [],
    image: '',
  });
  const [newFeature, setNewFeature] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categoryOptions = useMemo(() => {
    const merged = new Set<string>(DEFAULT_CATEGORIES);
    categories?.forEach((cat) => {
      if (cat) {
        merged.add(cat);
      }
    });
    return Array.from(merged);
  }, [categories]);

  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (mode === 'edit' && service) {
      setFormData({
        name: service.name,
        description: service.description,
        category: service.category,
        price: service.price,
        duration: service.duration,
        features: service.features,
        image: service.image || '',
      });
    } else if (mode === 'add') {
      setFormData({
        name: '',
        description: '',
        category: '',
        price: 0,
        duration: 60,
        features: [],
        image: '',
      });
    }
  }, [mode, service, isOpen]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'price' || name === 'duration' ? Number(value) || 0 : value,
    }));
  };

  const handleAddFeature = () => {
    const trimmed = newFeature.trim();
    if (trimmed && !formData.features.includes(trimmed)) {
      setFormData((prev) => ({
        ...prev,
        features: [...prev.features, trimmed],
      }));
      setNewFeature('');
    }
  };

  const handleRemoveFeature = (feature: string) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((f) => f !== feature),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await onSave({
        ...formData,
        features: formData.features.map((feature) => feature.trim()).filter(Boolean),
        price: Number(formData.price) || 0,
        duration: Number(formData.duration) || 0,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message ?? 'Unable to save service. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === 'add' ? 'Add New Service' : 'Edit Service'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Package className="h-5 w-5 mr-2 text-primary-600" />
              Basic Information
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="input-field"
                  placeholder="Enter service name"
                  disabled={isSubmitting}
                />
              </div>

              <div>
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
                  placeholder="Enter service description"
                  disabled={isSubmitting}
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
                  disabled={isSubmitting}
                >
                  <option value="">Select category</option>
                  {categoryOptions.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Pricing & Duration */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-primary-600" />
              Pricing & Duration
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price (UGX) *
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="1"
                  className="input-field"
                  placeholder="Enter price in UGX"
                  disabled={isSubmitting}
                />
              </div>

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
                  min="15"
                  step="15"
                  className="input-field"
                  placeholder="Enter duration"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Tag className="h-5 w-5 mr-2 text-primary-600" />
              Service Features
            </h3>
            
            <div className="flex">
              <input
                type="text"
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                className="input-field flex-1"
                placeholder="Add a new feature"
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={handleAddFeature}
                className="ml-3 btn-outline whitespace-nowrap"
                disabled={isSubmitting}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Feature
              </button>
            </div>

            {formData.features.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.features.map((feature) => (
                  <span
                    key={feature}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700"
                  >
                    {feature}
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(feature)}
                      className="ml-2 text-gray-400 hover:text-gray-600"
                      disabled={isSubmitting}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Image URL */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Package className="h-5 w-5 mr-2 text-primary-600" />
              Service Image
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image URL
              </label>
              <input
                type="url"
                name="image"
                value={formData.image}
                onChange={handleInputChange}
                className="input-field"
                placeholder="https://example.com/service-image.jpg"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
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
              className="btn-primary flex items-center"
              disabled={isSubmitting}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting
                ? 'Saving...'
                : mode === 'add'
                ? 'Add Service'
                : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
