import { useMemo, useState } from 'react';
import { Search, Eye, Clock, DollarSign, Users, Star, X, Plus, Edit, Trash2 } from 'lucide-react';
import { Service } from '../types';
import AddEditServiceModal from '../components/AddEditServiceModal';
import { useApi, useApiMutation } from '../hooks/useApi';
import servicesService from '../services/services';
import { useNotifications } from '../contexts/NotificationContext';

function formatDuration(minutes: number): string {
  if (!minutes) return '0 min';
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (hours && remaining) {
    return `${hours}h ${remaining}m`;
  }
  if (hours) {
    return `${hours}h`;
  }
  return `${remaining}m`;
}

export default function Services() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const { addNotification } = useNotifications();

  const {
    data: servicesData,
    loading,
    error,
    refetch,
  } = useApi(() => servicesService.getServices({ limit: 200 }), []);

  const servicesList = servicesData?.services ?? [];

  const categories = useMemo(
    () => Array.from(new Set(servicesList.map((service) => service.category))).sort(),
    [servicesList]
  );

  const filteredServices = useMemo(() => {
    return servicesList.filter((service) => {
      const matchesSearch =
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || service.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });
  }, [servicesList, searchTerm, categoryFilter]);

  const createServiceMutation = useApiMutation(servicesService.createService.bind(servicesService));
  const updateServiceMutation = useApiMutation(
    (params: { id: string; data: Parameters<typeof servicesService.updateService>[1] }) =>
      servicesService.updateService(params.id, params.data)
  );
  const deleteServiceMutation = useApiMutation((id: string) => servicesService.deleteService(id));

  const handleAddService = async (serviceData: Parameters<typeof servicesService.createService>[0]) => {
    try {
      await createServiceMutation.mutate(serviceData);
      addNotification({
        title: 'Service Created',
        message: `${serviceData.name} has been added successfully.`,
        type: 'success',
        userId: 'system',
        priority: 'medium',
        category: 'service',
      });
      await refetch();
      setIsAddModalOpen(false);
    } catch (err: any) {
      addNotification({
        title: 'Unable to create service',
        message: err?.message ?? 'Please try again later.',
        type: 'error',
        userId: 'system',
        priority: 'high',
        category: 'system',
      });
      throw err;
    }
  };

  const handleEditService = async (serviceData: Parameters<typeof servicesService.updateService>[1]) => {
    if (!editingService) return;

    try {
      await updateServiceMutation.mutate({ id: editingService.id, data: serviceData });
      addNotification({
        title: 'Service Updated',
        message: `${serviceData.name ?? editingService.name} has been updated.`,
        type: 'success',
        userId: 'system',
        priority: 'medium',
        category: 'service',
      });
      await refetch();
      setIsEditModalOpen(false);
      setEditingService(null);
    } catch (err: any) {
      addNotification({
        title: 'Unable to update service',
        message: err?.message ?? 'Please try again later.',
        type: 'error',
        userId: 'system',
        priority: 'high',
        category: 'system',
      });
      throw err;
    }
  };

  const handleDeleteService = async (serviceId: string, serviceName: string) => {
    if (!window.confirm(`Are you sure you want to archive ${serviceName}?`)) {
      return;
    }

    try {
      await deleteServiceMutation.mutate(serviceId);
      addNotification({
        title: 'Service Archived',
        message: `${serviceName} is no longer available for new appointments.`,
        type: 'info',
        userId: 'system',
        priority: 'medium',
        category: 'service',
      });
      await refetch();
    } catch (err: any) {
      addNotification({
        title: 'Unable to archive service',
        message: err?.message ?? 'Please try again later.',
        type: 'error',
        userId: 'system',
        priority: 'high',
        category: 'system',
      });
    }
  };

  const openEditModal = (service: Service) => {
    setEditingService(service);
    setIsEditModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Services & Packages</h1>
          <p className="mt-1 text-sm text-gray-600">
            Explore our comprehensive homecare services
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="btn-primary flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Service
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="input-field"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      {loading && (
        <div className="card text-center py-12 text-sm text-gray-500">Loading services...</div>
      )}

      {error && !loading && (
        <div className="card text-center py-12 text-sm text-red-500">
          Unable to load services. Please try again later.
        </div>
      )}

      {!loading && !error && (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredServices.map((service) => (
          <div key={service.id} className="card hover:shadow-lg transition-shadow duration-200">
            {/* Image section commented out */}
            {/* <div className="aspect-w-16 aspect-h-9 mb-4">
              <img
                src={service.image}
                alt={service.name}
                className="w-full h-48 object-cover rounded-lg"
              />
            </div> */}
            
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <h3 className="text-lg font-medium text-gray-900">{service.name}</h3>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secondary-100 text-secondary-800">
                  {service.category}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 line-clamp-2">{service.description}</p>
              
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-1" />
                  ${service.price.toFixed(2)}
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {formatDuration(service.duration)}
                </div>
              </div>
              
              <div className="flex items-center text-sm text-gray-600">
                <Users className="h-4 w-4 mr-1" />
                {service.features.length} features included
              </div>
            </div>
            
            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={() => setSelectedService(service)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 btn-outline py-1.5 px-3 text-sm"
              >
                <Eye className="h-3.5 w-3.5 shrink-0" />
                <span>View Details</span>
              </button>
              <button
                onClick={() => openEditModal(service)}
                className="inline-flex items-center justify-center btn-secondary py-1.5 px-2.5 text-sm min-w-[2.25rem]"
              >
                <Edit className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => handleDeleteService(service.id, service.name)}
                className="inline-flex items-center justify-center btn-outline text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300 py-1.5 px-2.5 text-sm min-w-[2.25rem]"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Service Detail Modal */}
      {selectedService && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setSelectedService(null)}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">{selectedService.name}</h3>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secondary-100 text-secondary-800 mt-1">
                      {selectedService.category}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedService(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                
                {/* Image section commented out */}
                {/* <div className="aspect-w-16 aspect-h-9 mb-4">
                  <img
                    src={selectedService.image}
                    alt={selectedService.name}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div> */}
                
                <p className="text-sm text-gray-600 mb-4">{selectedService.description}</p>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <DollarSign className="h-4 w-4 mr-2" />
                    ${selectedService.price.toFixed(2)}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-2" />
                    {formatDuration(selectedService.duration)}
                  </div>
                </div>
                
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Features Included:</h4>
                  <ul className="space-y-1">
                    {selectedService.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm text-gray-600">
                        <Star className="h-3 w-3 text-yellow-500 mr-2" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button className="w-full btn-primary sm:ml-3 sm:w-auto">
                  Book This Service
                </button>
                <button
                  onClick={() => setSelectedService(null)}
                  className="mt-3 w-full btn-outline sm:mt-0 sm:w-auto"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {filteredServices.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <Search className="h-12 w-12" />
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No services found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search or filter criteria.
          </p>
        </div>
      )}

      {/* Service Categories Overview */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Service Categories</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((category) => {
            const categoryServices = servicesList.filter((s) => s.category === category);
            const avgPrice = Math.round(
              categoryServices.reduce((sum, s) => sum + s.price, 0) / categoryServices.length
            );
            
            return (
              <div key={category} className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900">{category}</h4>
                <p className="text-sm text-gray-600 mt-1">
                  {categoryServices.length} services
                </p>
                <p className="text-sm text-gray-600">
                  From ${avgPrice}/hour
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Service Modal */}
      <AddEditServiceModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddService}
        mode="add"
        categories={categories}
      />

      {/* Edit Service Modal */}
      <AddEditServiceModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingService(null);
        }}
        onSave={handleEditService}
        service={editingService}
        mode="edit"
        categories={categories}
      />
    </div>
  );
}
