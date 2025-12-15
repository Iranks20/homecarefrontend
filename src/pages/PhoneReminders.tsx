import { useMemo, useState, useEffect } from 'react';
import {
  Phone,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Search,
  Calendar,
  User,
  Bell,
} from 'lucide-react';
import { PhoneReminder, Patient } from '../types';
import { useApi, useApiMutation } from '../hooks/useApi';
import { phoneReminderService, type CreatePhoneReminderData } from '../services/phoneReminders';
import { settingsService } from '../services/settings';
import patientService from '../services/patients';
import { useNotifications } from '../contexts/NotificationContext';

interface ReminderFormState extends Omit<CreatePhoneReminderData, 'scheduledTime'> {
  scheduledTime: string;
}

const DEFAULT_REMINDER_FORM: ReminderFormState = {
  patientId: '',
  patientName: '',
  patientPhone: '',
  type: 'appointment',
  title: '',
  message: '',
  scheduledTime: new Date().toISOString().slice(0, 16),
  method: 'sms',
  priority: 'medium',
  maxAttempts: 3,
};

export default function PhoneReminders() {
  const [activeTab, setActiveTab] = useState<'reminders' | 'settings'>('reminders');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formState, setFormState] = useState<ReminderFormState>(DEFAULT_REMINDER_FORM);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const { addNotification } = useNotifications();

  const {
    data: remindersData,
    loading: loadingReminders,
    error: remindersError,
    refetch: refetchReminders,
  } = useApi(() => phoneReminderService.getReminders({ limit: 200 }), []);

  const {
    data: reminderSettingsData,
    loading: loadingSettings,
    error: settingsError,
    refetch: refetchSettings,
  } = useApi(() => settingsService.getReminderSettings(), []);

  const sendReminderMutation = useApiMutation(phoneReminderService.sendReminder.bind(phoneReminderService));
  const cancelReminderMutation = useApiMutation(phoneReminderService.cancelReminder.bind(phoneReminderService));
  const createReminderMutation = useApiMutation(phoneReminderService.createReminder.bind(phoneReminderService));
  const updateReminderSettingsMutation = useApiMutation(settingsService.updateReminderSettings.bind(settingsService));

  const reminders = useMemo(() => remindersData?.reminders ?? [], [remindersData]);
  const settings = reminderSettingsData;

  // Load patients when modal opens
  useEffect(() => {
    if (showCreateModal) {
      const loadPatients = async () => {
        setLoadingPatients(true);
        try {
          const { patients: patientsList } = await patientService.getPatients({
            limit: 200,
            status: 'active', // Only show active patients
          });
          setPatients(patientsList);
        } catch (err) {
          console.error('Failed to load patients', err);
        } finally {
          setLoadingPatients(false);
        }
      };
      loadPatients();
    }
  }, [showCreateModal]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'sms':
        return <MessageSquare className="h-4 w-4" />;
      case 'call':
        return <Phone className="h-4 w-4" />;
      case 'both':
        return (
          <div className="flex space-x-1">
            <MessageSquare className="h-3 w-3" />
            <Phone className="h-3 w-3" />
          </div>
        );
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const filteredReminders = reminders.filter((reminder) => {
    const matchesStatus = filterStatus === 'all' || reminder.status === filterStatus;
    const matchesType = filterType === 'all' || reminder.type === filterType;
    const matchesSearch =
      reminder.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reminder.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesType && matchesSearch;
  });

  const handleResendReminder = async (reminder: PhoneReminder) => {
    try {
      await sendReminderMutation.mutate(reminder.id);
      addNotification({
        title: 'Reminder Sent',
        message: `Reminder "${reminder.title}" has been queued again.`,
        type: 'success',
        userId: 'system',
        priority: 'medium',
        category: 'general',
      });
      await refetchReminders();
    } catch (error: any) {
      addNotification({
        title: 'Unable to send reminder',
        message: error?.message ?? 'Please try again later.',
        type: 'error',
        userId: 'system',
        priority: 'high',
        category: 'system',
      });
    }
  };

  const handleCancelReminder = async (reminder: PhoneReminder) => {
    if (!window.confirm(`Cancel reminder "${reminder.title}" for ${reminder.patientName}?`)) {
      return;
    }

    try {
      await cancelReminderMutation.mutate(reminder.id);
      addNotification({
        title: 'Reminder Cancelled',
        message: `${reminder.title} has been cancelled.`,
        type: 'info',
        userId: 'system',
        priority: 'medium',
        category: 'general',
      });
      await refetchReminders();
    } catch (error: any) {
      addNotification({
        title: 'Unable to cancel reminder',
        message: error?.message ?? 'Please try again later.',
        type: 'error',
        userId: 'system',
        priority: 'high',
        category: 'system',
      });
    }
  };

  const handleCreateReminder = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const payload: CreatePhoneReminderData = {
        ...formState,
        scheduledTime: new Date(formState.scheduledTime).toISOString(),
      };
      await createReminderMutation.mutate(payload);
      addNotification({
        title: 'Reminder Scheduled',
        message: `Reminder "${payload.title}" has been created successfully.`,
        type: 'success',
        userId: 'system',
        priority: 'medium',
        category: 'general',
      });
      setShowCreateModal(false);
      setFormState(DEFAULT_REMINDER_FORM);
      await refetchReminders();
    } catch (error: any) {
      addNotification({
        title: 'Unable to create reminder',
        message: error?.message ?? 'Please try again later.',
        type: 'error',
        userId: 'system',
        priority: 'high',
        category: 'system',
      });
    }
  };

  type ReminderChannelKey = 'appointmentReminders' | 'medicationReminders' | 'healthCheckReminders';

  const handleToggleSetting = async (
    key: ReminderChannelKey,
    value: boolean
  ) => {
    if (!settings || !settings[key]) return;

    try {
      await updateReminderSettingsMutation.mutate({
        [key]: {
          ...settings[key],
          enabled: value,
        },
      });
      await refetchSettings();
      addNotification({
        title: 'Reminder settings updated',
        message: 'Changes saved successfully.',
        type: 'success',
        userId: 'system',
        priority: 'medium',
        category: 'system',
      });
    } catch (error: any) {
      addNotification({
        title: 'Unable to update settings',
        message: error?.message ?? 'Please try again later.',
        type: 'error',
        userId: 'system',
        priority: 'high',
        category: 'system',
      });
    }
  };

  const renderReminders = () => (
    <div className="space-y-6">
      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search reminders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input-field"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="sent">Sent</option>
            <option value="delivered">Delivered</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="input-field"
          >
            <option value="all">All Types</option>
            <option value="appointment">Appointment</option>
            <option value="medication">Medication</option>
            <option value="health-check">Health Check</option>
            <option value="follow-up">Follow-up</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          className="btn-primary flex items-center"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Reminder
        </button>
      </div>

      {loadingReminders && (
        <div className="card text-sm text-gray-500">Loading reminders...</div>
      )}

      {remindersError && (
        <div className="card text-sm text-red-500">Unable to load reminders. Please try again later.</div>
      )}

      {!loadingReminders && !remindersError && filteredReminders.length === 0 && (
        <div className="card text-center py-12 text-sm text-gray-500">
          No reminders match your filters.
        </div>
      )}

      {/* Reminders List */}
      <div className="space-y-4">
        {filteredReminders.map((reminder) => (
          <div key={reminder.id} className="card">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  {getStatusIcon(reminder.status)}
                  <h3 className="font-semibold text-lg">{reminder.title}</h3>
                  <span className={`status-badge ${getStatusColor(reminder.status)}`}>
                    {reminder.status}
                  </span>
                  <span className={`status-badge ${getPriorityColor(reminder.priority)}`}>
                    {reminder.priority}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="h-4 w-4" />
                    <span>{reminder.patientName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4" />
                    <span>{reminder.patientPhone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDateTime(reminder.scheduledTime)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    {getMethodIcon(reminder.method)}
                    <span className="capitalize">{reminder.method}</span>
                  </div>
                </div>

                <p className="text-gray-700 mb-3">{reminder.message}</p>

                {reminder.response && (
                  <div className="bg-gray-50 p-3 rounded-lg mb-3">
                    <p className="text-sm text-gray-600">
                      <strong>Response:</strong> {reminder.response}
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>Attempts: {reminder.attempts}/{reminder.maxAttempts}</span>
                  {reminder.lastAttempt && (
                    <span>Last attempt: {formatDateTime(reminder.lastAttempt)}</span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2 ml-4">
                {reminder.status === 'failed' && (
                  <button
                    onClick={() => handleResendReminder(reminder)}
                    className="btn-primary text-sm"
                  >
                    Resend
                  </button>
                )}
                {reminder.status === 'pending' && (
                  <button
                    onClick={() => handleCancelReminder(reminder)}
                    className="btn-outline text-sm text-red-600 hover:text-red-800"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Reminder Settings</h2>
        <button className="btn-primary" disabled>
          <Plus className="h-4 w-4 mr-2" />
          Add Settings
        </button>
      </div>

      {settingsError && (
        <div className="card text-sm text-red-500">Unable to load reminder settings. Please try again later.</div>
      )}

      {loadingSettings && (
        <div className="card text-sm text-gray-500">Loading reminder settings...</div>
      )}

      {!loadingSettings && !settingsError && settings && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="font-semibold text-lg mb-4">Appointment Reminders</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Enabled</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.appointmentReminders?.enabled ?? false}
                    onChange={(e) => handleToggleSetting('appointmentReminders', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Advance Time</span>
                <span className="text-sm font-medium">{settings.appointmentReminders?.advanceTime ?? 0} minutes</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Phone Number</span>
                <span className="text-sm font-medium">{settings.appointmentReminders?.phoneNumber ?? 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Methods</span>
                <div className="flex gap-1">
                  {(settings.appointmentReminders?.methods ?? []).map((method: string) => (
                    <span key={method} className="status-badge bg-blue-100 text-blue-800 text-xs">
                      {method.toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-lg mb-4">Medication Reminders</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Enabled</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.medicationReminders?.enabled ?? false}
                    onChange={(e) => handleToggleSetting('medicationReminders', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Advance Time</span>
                <span className="text-sm font-medium">{settings.medicationReminders?.advanceTime ?? 0} minutes</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Phone Number</span>
                <span className="text-sm font-medium">{settings.medicationReminders?.phoneNumber ?? 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Methods</span>
                <div className="flex gap-1">
                  {(settings.medicationReminders?.methods ?? []).map((method: string) => (
                    <span key={method} className="status-badge bg-green-100 text-green-800 text-xs">
                      {method.toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-lg mb-4">Health Check Reminders</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Enabled</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.healthCheckReminders?.enabled ?? false}
                    onChange={(e) => handleToggleSetting('healthCheckReminders', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Frequency</span>
                <span className="text-sm font-medium capitalize">{settings.healthCheckReminders?.frequency ?? 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Time</span>
                <span className="text-sm font-medium">{settings.healthCheckReminders?.time ?? 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Methods</span>
                <div className="flex gap-1">
                  {(settings.healthCheckReminders?.methods ?? []).map((method: string) => (
                    <span key={method} className="status-badge bg-purple-100 text-purple-800 text-xs">
                      {method.toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {settings.emergencyContacts?.length ? (
            <div className="card">
              <h3 className="font-semibold text-lg mb-4">Emergency Contacts</h3>
              <div className="space-y-2">
                {settings.emergencyContacts.map((contact: { name: string; relationship: string; phone: string }, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div>
                      <span className="font-medium text-sm">{contact.name}</span>
                      <span className="text-xs text-gray-500 ml-2">({contact.relationship})</span>
                    </div>
                    <span className="text-sm font-medium">{contact.phone}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Phone Reminders</h1>
        <p className="text-gray-600">Manage appointment and medication reminders via phone calls and SMS</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('reminders')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'reminders'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Reminders ({reminders.length})
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'settings'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Settings
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'reminders' ? (
        renderReminders()
      ) : (
        renderSettings()
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Create Reminder</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setFormState(DEFAULT_REMINDER_FORM);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateReminder} className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Patient</label>
                {loadingPatients ? (
                  <div className="input-field text-gray-500">Loading patients...</div>
                ) : (
                  <select
                    value={formState.patientId}
                    onChange={(e) => {
                      const selectedPatient = patients.find(p => p.id === e.target.value);
                      setFormState((prev) => ({
                        ...prev,
                        patientId: e.target.value,
                        patientName: selectedPatient?.name || '',
                        patientPhone: selectedPatient?.phone || '',
                      }));
                    }}
                    className="input-field"
                    required
                  >
                    <option value="">Select a patient</option>
                    {patients.map((patient) => (
                      <option key={patient.id} value={patient.id}>
                        {patient.name} {patient.email ? `(${patient.email})` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="tel"
                    value={formState.patientPhone}
                    onChange={(e) => setFormState((prev) => ({ ...prev, patientPhone: e.target.value }))}
                    className="input-field"
                    placeholder="Auto-filled from patient selection"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Type</label>
                  <select
                    value={formState.type}
                    onChange={(e) => setFormState((prev) => ({ ...prev, type: e.target.value as ReminderFormState['type'] }))}
                    className="input-field"
                    required
                  >
                    <option value="appointment">Appointment</option>
                    <option value="medication">Medication</option>
                    <option value="health-check">Health Check</option>
                    <option value="follow-up">Follow-up</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  value={formState.title}
                  onChange={(e) => setFormState((prev) => ({ ...prev, title: e.target.value }))}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Message</label>
                <textarea
                  value={formState.message}
                  onChange={(e) => setFormState((prev) => ({ ...prev, message: e.target.value }))}
                  className="input-field"
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Scheduled Time</label>
                  <input
                    type="datetime-local"
                    value={formState.scheduledTime}
                    onChange={(e) => setFormState((prev) => ({ ...prev, scheduledTime: e.target.value }))}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Method</label>
                  <select
                    value={formState.method}
                    onChange={(e) => setFormState((prev) => ({ ...prev, method: e.target.value as ReminderFormState['method'] }))}
                    className="input-field"
                    required
                  >
                    <option value="sms">SMS</option>
                    <option value="call">Call</option>
                    <option value="both">Both</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Priority</label>
                  <select
                    value={formState.priority}
                    onChange={(e) => setFormState((prev) => ({ ...prev, priority: e.target.value as ReminderFormState['priority'] }))}
                    className="input-field"
                    required
                  >
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Max Attempts</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={formState.maxAttempts ?? 3}
                    onChange={(e) => setFormState((prev) => ({ ...prev, maxAttempts: Number(e.target.value) }))}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormState(DEFAULT_REMINDER_FORM);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={createReminderMutation.loading}>
                  {createReminderMutation.loading ? 'Creating...' : 'Create Reminder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
