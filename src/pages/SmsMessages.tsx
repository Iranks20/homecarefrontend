import { useEffect, useMemo, useState } from 'react';
import {
  MessageSquare,
  Send,
  Users as UsersIcon,
  Search,
  Phone,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Plus,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  CalendarClock,
} from 'lucide-react';
import { useApi, useApiMutation } from '../hooks/useApi';
import {
  smsService,
  type DirectoryRecipient,
  type DirectoryRecipientType,
  type SmsCategory,
  type SmsMessage,
  type SmsRecipientInput,
  type SmsTemplate,
  type AppointmentSmsReminder,
  type AppointmentSmsReminderStatus,
  type AppointmentReminderTiming,
  type SmsAutomationSettings,
  type BirthdaySmsDelivery,
  type BirthdaySmsDeliveryStatus,
} from '../services/sms';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';

const CATEGORY_OPTIONS: { value: SmsCategory; label: string }[] = [
  { value: 'general', label: 'General' },
  { value: 'appointment', label: 'Appointment' },
  { value: 'prescription', label: 'Prescription' },
  { value: 'birthday', label: 'Birthday' },
  { value: 'payment', label: 'Payment' },
];

const PHONE_SPLIT_REGEX = /[\s,;\n]+/;
const MAX_SMS_LENGTH = 480;
const DIRECTORY_PAGE_SIZE = 25;

const TYPE_FILTERS: { value: DirectoryRecipientType | 'all'; label: string }[] = [
  { value: 'all', label: 'All users' },
  { value: 'patient', label: 'Patients' },
  { value: 'specialist', label: 'Specialists' },
  { value: 'therapist', label: 'Therapists' },
  { value: 'nurse', label: 'Nurses' },
  { value: 'receptionist', label: 'Receptionists' },
  { value: 'biller', label: 'Billers' },
  { value: 'lab_attendant', label: 'Lab attendants' },
  { value: 'admin', label: 'Admins' },
];

const TYPE_BADGE: Record<DirectoryRecipientType, { label: string; class: string }> = {
  patient: { label: 'Patient', class: 'bg-blue-50 text-blue-700' },
  nurse: { label: 'Nurse', class: 'bg-pink-50 text-pink-700' },
  specialist: { label: 'Specialist', class: 'bg-indigo-50 text-indigo-700' },
  therapist: { label: 'Therapist', class: 'bg-emerald-50 text-emerald-700' },
  receptionist: { label: 'Receptionist', class: 'bg-amber-50 text-amber-700' },
  biller: { label: 'Biller', class: 'bg-teal-50 text-teal-700' },
  admin: { label: 'Admin', class: 'bg-slate-100 text-slate-700' },
  lab_attendant: { label: 'Lab attendant', class: 'bg-cyan-50 text-cyan-700' },
};

const recipientKey = (entry: { type: DirectoryRecipientType; id: string }) => `${entry.type}:${entry.id}`;

const formatDateTime = (iso: string) => {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
};

const statusBadge = (status: SmsMessage['status']) => {
  switch (status) {
    case 'sent':
      return { label: 'Sent', class: 'bg-green-100 text-green-700' };
    case 'partial':
      return { label: 'Partial', class: 'bg-yellow-100 text-yellow-700' };
    case 'failed':
      return { label: 'Failed', class: 'bg-red-100 text-red-700' };
    case 'queued':
    default:
      return { label: 'Queued', class: 'bg-gray-100 text-gray-700' };
  }
};

const reminderStatusBadge = (status: AppointmentSmsReminderStatus) => {
  switch (status) {
    case 'SENT':
      return { label: 'Sent', class: 'bg-green-100 text-green-700' };
    case 'PARTIAL':
      return { label: 'Partial', class: 'bg-yellow-100 text-yellow-700' };
    case 'FAILED':
      return { label: 'Failed', class: 'bg-red-100 text-red-700' };
    case 'CANCELLED':
      return { label: 'Cancelled', class: 'bg-gray-100 text-gray-600' };
    case 'SKIPPED':
      return { label: 'Skipped', class: 'bg-gray-100 text-gray-600' };
    case 'SCHEDULED':
    default:
      return { label: 'Scheduled', class: 'bg-blue-100 text-blue-700' };
  }
};

const formatAppointmentDate = (iso: string, time: string) => {
  try {
    const date = new Date(iso).toLocaleDateString(undefined, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    return `${date} at ${time}`;
  } catch {
    return `${iso} at ${time}`;
  }
};

const providerTypeLabel = (type?: string) => {
  if (!type) return 'Provider';
  return type.charAt(0).toUpperCase() + type.slice(1);
};

const reminderTimingLabel = (timing: AppointmentReminderTiming) =>
  timing === 'TWENTY_FOUR_HOURS_BEFORE'
    ? '24 hours before appointment'
    : 'Midday day before';

const birthdayRecipientLabel = (type: BirthdaySmsDelivery['recipientType']) => {
  switch (type) {
    case 'SPECIALIST':
      return 'Specialist';
    case 'THERAPIST':
      return 'Therapist';
    case 'NURSE':
      return 'Nurse';
    case 'USER':
      return 'Staff user';
    case 'PATIENT':
    default:
      return 'Patient';
  }
};

const birthdayStatusBadge = (status: BirthdaySmsDeliveryStatus) => {
  switch (status) {
    case 'SENT':
      return { label: 'Sent', class: 'bg-green-100 text-green-700' };
    case 'FAILED':
      return { label: 'Failed', class: 'bg-red-100 text-red-700' };
    case 'SKIPPED':
      return { label: 'Skipped', class: 'bg-gray-100 text-gray-600' };
    case 'SCHEDULED':
    default:
      return { label: 'Scheduled', class: 'bg-blue-100 text-blue-700' };
  }
};

const categoryBadge = (category: SmsCategory) => {
  switch (category) {
    case 'appointment':
      return 'bg-blue-50 text-blue-700';
    case 'prescription':
      return 'bg-purple-50 text-purple-700';
    case 'birthday':
      return 'bg-pink-50 text-pink-700';
    case 'payment':
      return 'bg-amber-50 text-amber-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

export default function SmsMessages() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [activeTab, setActiveTab] = useState<'compose' | 'history' | 'templates' | 'appointment-reminders'>(
    'compose'
  );

  const [category, setCategory] = useState<SmsCategory>('general');
  const [message, setMessage] = useState('');
  const [selectedRecipients, setSelectedRecipients] = useState<Record<string, DirectoryRecipient>>({});
  const [manualPhones, setManualPhones] = useState('');
  const [directorySearch, setDirectorySearch] = useState('');
  const [directoryType, setDirectoryType] = useState<DirectoryRecipientType | 'all'>('all');
  const [directoryPage, setDirectoryPage] = useState(1);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [lastSendResult, setLastSendResult] = useState<SmsMessage | null>(null);

  const isAuthorized = ['admin', 'receptionist', 'biller'].includes(user?.role ?? '');

  useEffect(() => {
    setDirectoryPage(1);
  }, [directoryType, directorySearch]);

  const {
    data: directoryData,
    loading: loadingDirectory,
    error: directoryError,
  } = useApi(
    () =>
      smsService.getDirectory({
        type: directoryType,
        search: directorySearch.trim() || undefined,
        page: directoryPage,
        limit: DIRECTORY_PAGE_SIZE,
      }),
    [directoryType, directorySearch, directoryPage]
  );

  const {
    data: templates,
    loading: loadingTemplates,
    refetch: refetchTemplates,
  } = useApi(() => smsService.listTemplates(), []);

  const {
    data: messageHistory,
    loading: loadingHistory,
    error: historyError,
    refetch: refetchHistory,
  } = useApi(() => smsService.list({ limit: 100 }), []);

  const {
    data: upcomingRemindersData,
    loading: loadingUpcomingReminders,
    error: upcomingRemindersError,
    refetch: refetchUpcomingReminders,
  } = useApi(() => smsService.listAppointmentReminders({ view: 'upcoming', limit: 50 }), []);

  const {
    data: deliveredRemindersData,
    loading: loadingDeliveredReminders,
    error: deliveredRemindersError,
    refetch: refetchDeliveredReminders,
  } = useApi(() => smsService.listAppointmentReminders({ view: 'delivered', limit: 50 }), []);

  const {
    data: automationSettings,
    loading: loadingAutomation,
    refetch: refetchAutomation,
  } = useApi(() => smsService.getAutomationSettings(), []);

  const {
    data: upcomingBirthdaysData,
    loading: loadingUpcomingBirthdays,
    refetch: refetchUpcomingBirthdays,
  } = useApi(() => smsService.listBirthdayDeliveries({ view: 'upcoming', limit: 50 }), []);

  const {
    data: deliveredBirthdaysData,
    loading: loadingDeliveredBirthdays,
    refetch: refetchDeliveredBirthdays,
  } = useApi(() => smsService.listBirthdayDeliveries({ view: 'delivered', limit: 50 }), []);

  const [automationForm, setAutomationForm] = useState<SmsAutomationSettings | null>(null);
  const [savingAutomation, setSavingAutomation] = useState(false);

  useEffect(() => {
    if (automationSettings) {
      setAutomationForm(automationSettings);
    }
  }, [automationSettings]);

  const sendMutation = useApiMutation(smsService.send.bind(smsService));
  const createTemplateMutation = useApiMutation(smsService.createTemplate.bind(smsService));
  const deleteTemplateMutation = useApiMutation(smsService.deleteTemplate.bind(smsService));

  const directoryEntries: DirectoryRecipient[] = useMemo(() => directoryData?.data ?? [], [directoryData]);
  const directoryPagination = directoryData?.pagination;
  const messages: SmsMessage[] = useMemo(() => messageHistory?.messages ?? [], [messageHistory]);
  const templateList: SmsTemplate[] = templates ?? [];
  const upcomingReminders: AppointmentSmsReminder[] = useMemo(
    () => upcomingRemindersData?.reminders ?? [],
    [upcomingRemindersData]
  );
  const deliveredReminders: AppointmentSmsReminder[] = useMemo(
    () => deliveredRemindersData?.reminders ?? [],
    [deliveredRemindersData]
  );
  const upcomingBirthdays: BirthdaySmsDelivery[] = useMemo(
    () => upcomingBirthdaysData?.deliveries ?? [],
    [upcomingBirthdaysData]
  );
  const deliveredBirthdays: BirthdaySmsDelivery[] = useMemo(
    () => deliveredBirthdaysData?.deliveries ?? [],
    [deliveredBirthdaysData]
  );

  const handleSaveAutomation = async () => {
    if (!automationForm) return;
    setSavingAutomation(true);
    try {
      await smsService.updateAutomationSettings(automationForm);
      addNotification({
        title: 'SMS automation updated',
        message: 'Automatic SMS rules were saved.',
        type: 'success',
        userId: 'system',
        priority: 'medium',
        category: 'system',
      });
      await refetchAutomation();
      await refetchUpcomingReminders();
      await refetchUpcomingBirthdays();
    } catch (err: unknown) {
      addNotification({
        title: 'Unable to save automation settings',
        message: err instanceof Error ? err.message : 'Please try again.',
        type: 'error',
        userId: 'system',
        priority: 'high',
        category: 'system',
      });
    } finally {
      setSavingAutomation(false);
    }
  };

  const totalRecipients = useMemo(() => {
    const manual = manualPhones
      .split(PHONE_SPLIT_REGEX)
      .map((s) => s.trim())
      .filter(Boolean);
    return Object.keys(selectedRecipients).length + manual.length;
  }, [manualPhones, selectedRecipients]);

  const resetForm = () => {
    setMessage('');
    setSelectedRecipients({});
    setManualPhones('');
    setCategory('general');
  };

  const toggleRecipient = (entry: DirectoryRecipient) => {
    setSelectedRecipients((prev) => {
      const key = recipientKey(entry);
      const next = { ...prev };
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = entry;
      }
      return next;
    });
  };

  const selectAllVisible = () => {
    setSelectedRecipients((prev) => {
      const next = { ...prev };
      directoryEntries.forEach((entry) => {
        if (entry.phone) {
          next[recipientKey(entry)] = entry;
        }
      });
      return next;
    });
  };

  const clearSelection = () => setSelectedRecipients({});

  const removeSelected = (key: string) => {
    setSelectedRecipients((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const applyTemplate = (template: SmsTemplate) => {
    setCategory(template.category);
    setMessage(template.message);
    addNotification({
      title: 'Template applied',
      message: `Loaded "${template.name}".`,
      type: 'info',
      userId: 'system',
      priority: 'low',
      category: 'general',
    });
    setActiveTab('compose');
  };

  const handleSend = async () => {
    if (!message.trim()) {
      addNotification({
        title: 'Message required',
        message: 'Please write the SMS body before sending.',
        type: 'warning',
        userId: 'system',
        priority: 'medium',
        category: 'general',
      });
      return;
    }

    const manualRecipients: SmsRecipientInput[] = manualPhones
      .split(PHONE_SPLIT_REGEX)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((phone) => ({ phone }));

    const selectedList = Object.values(selectedRecipients);
    const patientIds = selectedList.filter((r) => r.type === 'patient').map((r) => r.id);
    const directoryRecipients: SmsRecipientInput[] = selectedList
      .filter((r) => r.type !== 'patient' && r.phone)
      .map((r) => ({ phone: r.phone, name: r.name }));

    const combinedRecipients = [...directoryRecipients, ...manualRecipients];

    if (patientIds.length === 0 && combinedRecipients.length === 0) {
      addNotification({
        title: 'No recipients',
        message: 'Pick at least one recipient or enter a phone number.',
        type: 'warning',
        userId: 'system',
        priority: 'medium',
        category: 'general',
      });
      return;
    }

    try {
      const payload: Parameters<typeof smsService.send>[0] = {
        message: message.trim(),
        category,
      };
      if (patientIds.length > 0) payload.patientIds = patientIds;
      if (combinedRecipients.length > 0) payload.recipients = combinedRecipients;
      const result = await sendMutation.mutate(payload);

      if (result) {
        setLastSendResult(result);
        const firstFailure = result.results.find((r) => !r.ok);
        if (result.status === 'sent') {
          addNotification({
            title: 'SMS delivered',
            message: `All ${result.successCount} message(s) sent successfully.`,
            type: 'success',
            userId: 'system',
            priority: 'medium',
            category: 'general',
          });
          resetForm();
        } else if (result.status === 'partial') {
          addNotification({
            title: `Partial delivery: ${result.successCount}/${result.recipientCount} sent`,
            message: firstFailure
              ? `Some recipients failed: ${firstFailure.message || firstFailure.status}`
              : 'Some recipients failed. Check History for per-recipient details.',
            type: 'warning',
            userId: 'system',
            priority: 'high',
            category: 'general',
          });
        } else {
          addNotification({
            title: 'SMS failed',
            message: firstFailure
              ? firstFailure.message || firstFailure.status
              : 'No messages were delivered.',
            type: 'error',
            userId: 'system',
            priority: 'high',
            category: 'system',
          });
        }
      }

      await refetchHistory();
    } catch (error: any) {
      addNotification({
        title: 'Unable to send SMS',
        message: error?.message ?? 'Please try again later.',
        type: 'error',
        userId: 'system',
        priority: 'high',
        category: 'system',
      });
    }
  };

  if (!isAuthorized) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6 text-sm text-yellow-800">
          You do not have permission to access SMS messaging.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SMS Messages</h1>
          <p className="mt-1 text-sm text-gray-600">
            Send bulk SMS, manage templates, and configure automatic appointment and birthday messages.
          </p>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-6">
          {([
            { id: 'compose', label: 'Compose' },
            {
              id: 'appointment-reminders',
              label: `Appointment reminders (${upcomingReminders.length})`,
            },
            { id: 'history', label: `History (${messages.length})` },
            { id: 'templates', label: `Templates (${templateList.length})` },
          ] as const).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 border-b-2 text-sm font-medium ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'compose' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary-500" />
                  Message
                </h2>
                <div className="flex gap-2 items-center text-sm">
                  <label className="text-gray-600">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as SmsCategory)}
                    className="input-field py-1.5 text-sm"
                  >
                    {CATEGORY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                maxLength={MAX_SMS_LENGTH}
                placeholder="Write the SMS body. Use {{name}} to personalize per recipient."
                className="input-field"
              />
              <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                <span>
                  Personalize per recipient with <code className="px-1 bg-gray-100 rounded">{'{{name}}'}</code>.
                </span>
                <span>
                  {message.length} / {MAX_SMS_LENGTH} chars •
                  {' '}
                  {Math.max(1, Math.ceil(message.length / 160))} SMS pages
                </span>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <UsersIcon className="h-5 w-5 text-primary-500" />
                  Recipients
                </h3>
                <div className="text-sm text-gray-600">{totalRecipients} selected</div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Additional phone numbers (optional)
                  </label>
                  <textarea
                    value={manualPhones}
                    onChange={(e) => setManualPhones(e.target.value)}
                    rows={2}
                    placeholder="e.g. 0772000111, 256700111222"
                    className="input-field"
                  />
                  <p className="text-xs text-gray-500 mt-1">Separate multiple numbers with commas, spaces, or new lines.</p>
                </div>

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <select
                    value={directoryType}
                    onChange={(e) => setDirectoryType(e.target.value as DirectoryRecipientType | 'all')}
                    className="input-field md:w-52"
                  >
                    {TYPE_FILTERS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={directorySearch}
                      onChange={(e) => setDirectorySearch(e.target.value)}
                      placeholder="Search by name, phone, email"
                      className="input-field pl-10"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={selectAllVisible} className="btn-outline text-sm whitespace-nowrap">
                      Select page
                    </button>
                    <button type="button" onClick={clearSelection} className="btn-outline text-sm whitespace-nowrap">
                      Clear
                    </button>
                  </div>
                </div>

                {Object.keys(selectedRecipients).length > 0 && (
                  <div className="rounded-lg border border-primary-200 bg-primary-50/40 p-2">
                    <div className="text-xs text-gray-600 mb-2">
                      {Object.keys(selectedRecipients).length} recipient(s) selected
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                      {Object.entries(selectedRecipients).map(([key, recipient]) => {
                        const badge = TYPE_BADGE[recipient.type];
                        return (
                          <span
                            key={key}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${badge.class}`}
                          >
                            <span className="font-medium truncate max-w-[140px]">{recipient.name}</span>
                            <button
                              type="button"
                              onClick={() => removeSelected(key)}
                              className="hover:bg-white/70 rounded-full"
                              aria-label={`Remove ${recipient.name}`}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
                  {loadingDirectory ? (
                    <div className="p-4 text-sm text-gray-500">Loading users...</div>
                  ) : directoryError ? (
                    <div className="p-4 text-sm text-red-600">Unable to load users.</div>
                  ) : directoryEntries.length === 0 ? (
                    <div className="p-4 text-sm text-gray-500">No users match your filters.</div>
                  ) : (
                    directoryEntries.map((entry) => {
                      const key = recipientKey(entry);
                      const selected = Boolean(selectedRecipients[key]);
                      const badge = TYPE_BADGE[entry.type];
                      const disabled = !entry.phone;
                      return (
                        <label
                          key={key}
                          className={`flex items-center gap-3 p-3 text-sm ${
                            disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                          } ${selected ? 'bg-primary-50' : 'hover:bg-gray-50'}`}
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => !disabled && toggleRecipient(entry)}
                            disabled={disabled}
                            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900 truncate">{entry.name}</span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${badge.class}`}>
                                {badge.label}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              {entry.phone || 'No phone on file'}
                              {entry.subtitle ? ` • ${entry.subtitle}` : ''}
                              {entry.email ? ` • ${entry.email}` : ''}
                            </div>
                          </div>
                          {disabled && (
                            <span className="text-[11px] text-amber-600 flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" /> missing phone
                            </span>
                          )}
                        </label>
                      );
                    })
                  )}
                </div>

                {directoryPagination && directoryPagination.total > 0 && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-gray-600">
                    <span>
                      Showing
                      {' '}
                      <strong>
                        {(directoryPagination.page - 1) * directoryPagination.limit + 1}
                        {'-'}
                        {Math.min(directoryPagination.page * directoryPagination.limit, directoryPagination.total)}
                      </strong>
                      {' of '}
                      <strong>{directoryPagination.total}</strong>
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setDirectoryPage((p) => Math.max(1, p - 1))}
                        disabled={loadingDirectory || directoryPage <= 1}
                        className="btn-outline px-2 py-1 text-xs flex items-center gap-1 disabled:opacity-50"
                      >
                        <ChevronLeft className="h-3 w-3" /> Prev
                      </button>
                      <span>
                        Page {directoryPagination.page} / {directoryPagination.totalPages}
                      </span>
                      <button
                        type="button"
                        onClick={() => setDirectoryPage((p) => p + 1)}
                        disabled={loadingDirectory || directoryPage >= directoryPagination.totalPages}
                        className="btn-outline px-2 py-1 text-xs flex items-center gap-1 disabled:opacity-50"
                      >
                        Next <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="card">
              <h3 className="text-base font-semibold text-gray-900 mb-3">Preview & Send</h3>
              <div className="rounded-md bg-gray-50 p-3 text-sm text-gray-700 whitespace-pre-wrap min-h-[80px]">
                {message
                  ? message.replace(/\{\{\s*name\s*\}\}/gi, 'Recipient')
                  : 'Your message preview will appear here.'}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-md bg-gray-50 p-2 text-center">
                  <div className="text-xs text-gray-500">Recipients</div>
                  <div className="text-lg font-semibold text-gray-900">{totalRecipients}</div>
                </div>
                <div className="rounded-md bg-gray-50 p-2 text-center">
                  <div className="text-xs text-gray-500">SMS pages</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {Math.max(1, Math.ceil(message.length / 160))}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSend}
                disabled={sendMutation.loading || totalRecipients === 0 || !message.trim()}
                className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
              >
                <Send className="h-4 w-4" />
                {sendMutation.loading ? 'Sending...' : 'Send now'}
              </button>

              {lastSendResult && (
                <div
                  className={`mt-4 rounded-lg border p-3 text-sm ${
                    lastSendResult.status === 'sent'
                      ? 'border-green-200 bg-green-50 text-green-800'
                      : lastSendResult.status === 'partial'
                      ? 'border-yellow-200 bg-yellow-50 text-yellow-800'
                      : 'border-red-200 bg-red-50 text-red-800'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {lastSendResult.status === 'sent' ? (
                      <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    ) : lastSendResult.status === 'partial' ? (
                      <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">
                        {lastSendResult.status === 'sent' && 'All messages delivered'}
                        {lastSendResult.status === 'partial' &&
                          `${lastSendResult.successCount} of ${lastSendResult.recipientCount} delivered`}
                        {lastSendResult.status === 'failed' && 'None delivered'}
                      </div>
                      {lastSendResult.results.length > 0 && (
                        <ul className="mt-2 space-y-1 text-xs">
                          {lastSendResult.results.map((entry, idx) => (
                            <li
                              key={`${entry.phone}-${idx}`}
                              className="flex items-start gap-1.5"
                            >
                              {entry.ok ? (
                                <CheckCircle2 className="h-3 w-3 mt-0.5 text-green-600 flex-shrink-0" />
                              ) : (
                                <XCircle className="h-3 w-3 mt-0.5 text-red-600 flex-shrink-0" />
                              )}
                              <div className="min-w-0 flex-1">
                                <span className="font-medium">
                                  {entry.name ?? entry.phone}
                                </span>
                                <span className="text-gray-600"> · {entry.phone}</span>
                                <div className="text-gray-700">
                                  {entry.ok ? 'Sent' : `Failed: ${entry.message || entry.status}`}
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                      <button
                        type="button"
                        onClick={() => setLastSendResult(null)}
                        className="mt-2 text-xs underline opacity-70 hover:opacity-100"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="card">
              <h3 className="text-base font-semibold text-gray-900 mb-2">Quick templates</h3>
              {loadingTemplates ? (
                <div className="text-sm text-gray-500">Loading...</div>
              ) : (
                <div className="space-y-2">
                  {templateList.slice(0, 6).map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => applyTemplate(template)}
                      className="w-full text-left rounded-md border border-gray-200 hover:border-primary-200 hover:bg-primary-50/40 p-3 transition"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">{template.name}</span>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full ${categoryBadge(template.category)}`}>
                          {template.category}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1 line-clamp-2">{template.message}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'appointment-reminders' && (
        <div className="space-y-8">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-primary-500" />
              SMS automation settings
            </h2>
            {loadingAutomation && !automationForm && (
              <p className="text-sm text-gray-500">Loading settings...</p>
            )}
            {automationForm && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Default appointment reminder timing
                  </label>
                  <select
                    value={automationForm.appointmentReminderTiming}
                    onChange={(e) =>
                      setAutomationForm((prev) =>
                        prev
                          ? {
                              ...prev,
                              appointmentReminderTiming: e.target.value as AppointmentReminderTiming,
                            }
                          : prev
                      )
                    }
                    className="input-field"
                  >
                    <option value="MID_DAY_BEFORE">Midday on the day before the appointment</option>
                    <option value="TWENTY_FOUR_HOURS_BEFORE">24 hours before the appointment time</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Midday send hour (UTC)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={23}
                    value={automationForm.midDayReminderHourUtc}
                    onChange={(e) =>
                      setAutomationForm((prev) =>
                        prev
                          ? { ...prev, midDayReminderHourUtc: Number(e.target.value) }
                          : prev
                      )
                    }
                    className="input-field"
                  />
                </div>
                <div className="md:col-span-2 flex items-center gap-2">
                  <input
                    id="birthdaySmsEnabled"
                    type="checkbox"
                    checked={automationForm.birthdaySmsEnabled}
                    onChange={(e) =>
                      setAutomationForm((prev) =>
                        prev ? { ...prev, birthdaySmsEnabled: e.target.checked } : prev
                      )
                    }
                    className="h-4 w-4 rounded border-gray-300 text-primary-600"
                  />
                  <label htmlFor="birthdaySmsEnabled" className="text-sm text-gray-700">
                    Automatically send happy birthday SMS to patients, specialists, therapists, nurses, and
                    other staff on their birthday (requires date of birth on their profile)
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Birthday SMS send hour (UTC)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={23}
                    value={automationForm.birthdaySendHourUtc}
                    onChange={(e) =>
                      setAutomationForm((prev) =>
                        prev ? { ...prev, birthdaySendHourUtc: Number(e.target.value) } : prev
                      )
                    }
                    className="input-field"
                    disabled={!automationForm.birthdaySmsEnabled}
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleSaveAutomation}
                    disabled={savingAutomation}
                    className="btn-primary"
                  >
                    {savingAutomation ? 'Saving...' : 'Save automation settings'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-4 text-sm text-blue-900">
            <p className="font-medium">Appointment reminders</p>
            <p className="mt-1 text-blue-800/90">
              When scheduling, you can enable reminders for the patient and assigned provider. Each appointment
              uses either midday the day before or exactly 24 hours before the appointment time.
            </p>
            <button
              type="button"
              onClick={() => {
                refetchUpcomingReminders();
                refetchDeliveredReminders();
                refetchUpcomingBirthdays();
                refetchDeliveredBirthdays();
              }}
              className="mt-3 text-sm font-medium text-primary-700 hover:text-primary-900"
            >
              Refresh all lists
            </button>
          </div>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Soon to be sent</h2>
            {upcomingRemindersError && (
              <div className="card text-sm text-red-600 mb-3">Unable to load upcoming reminders.</div>
            )}
            {loadingUpcomingReminders && (
              <div className="card text-sm text-gray-500">Loading upcoming reminders...</div>
            )}
            {!loadingUpcomingReminders && upcomingReminders.length === 0 && !upcomingRemindersError && (
              <div className="card text-center text-sm text-gray-500 py-10">
                No appointment reminders are queued right now.
              </div>
            )}
            {upcomingReminders.length > 0 && (
              <div className="card overflow-x-auto p-0">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-left text-xs font-medium text-gray-600 uppercase">
                    <tr>
                      <th className="px-4 py-3">Send at</th>
                      <th className="px-4 py-3">Appointment</th>
                      <th className="px-4 py-3">Patient</th>
                      <th className="px-4 py-3">Provider</th>
                      <th className="px-4 py-3">Timing</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {upcomingReminders.map((row) => {
                      const badge = reminderStatusBadge(row.status);
                      return (
                        <tr key={row.id} className="hover:bg-gray-50/80">
                          <td className="px-4 py-3 whitespace-nowrap">{formatDateTime(row.scheduledAt)}</td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900">
                              {formatAppointmentDate(row.appointmentDate, row.appointmentTime)}
                            </div>
                            {row.serviceName && (
                              <div className="text-xs text-gray-500">{row.serviceName}</div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div>{row.patientName}</div>
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {row.patientPhone || '—'}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {row.providerName ? (
                              <>
                                <div>
                                  {row.providerName}
                                  <span className="text-xs text-gray-500 ml-1">
                                    ({providerTypeLabel(row.providerType)})
                                  </span>
                                </div>
                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {row.providerPhone || '—'}
                                </div>
                              </>
                            ) : (
                              <span className="text-gray-400">Not assigned</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                            {reminderTimingLabel(row.reminderTiming)}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${badge.class}`}>
                              {badge.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Birthday messages — soon to be sent</h2>
            {loadingUpcomingBirthdays && (
              <div className="card text-sm text-gray-500">Loading upcoming birthday messages...</div>
            )}
            {!loadingUpcomingBirthdays && upcomingBirthdays.length === 0 && (
              <div className="card text-center text-sm text-gray-500 py-8">
                No birthday messages queued for today.
              </div>
            )}
            {upcomingBirthdays.length > 0 && (
              <div className="card overflow-x-auto p-0">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-left text-xs font-medium text-gray-600 uppercase">
                    <tr>
                      <th className="px-4 py-3">Send at</th>
                      <th className="px-4 py-3">Recipient</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Phone</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {upcomingBirthdays.map((row) => {
                      const badge = birthdayStatusBadge(row.status);
                      return (
                        <tr key={row.id} className="hover:bg-gray-50/80">
                          <td className="px-4 py-3 whitespace-nowrap">{formatDateTime(row.scheduledAt)}</td>
                          <td className="px-4 py-3">{row.recipientName}</td>
                          <td className="px-4 py-3 text-xs text-gray-600">
                            {birthdayRecipientLabel(row.recipientType)}
                          </td>
                          <td className="px-4 py-3">{row.phone || '—'}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${badge.class}`}>
                              {badge.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Birthday messages — already sent</h2>
            {loadingDeliveredBirthdays && (
              <div className="card text-sm text-gray-500">Loading sent birthday messages...</div>
            )}
            {!loadingDeliveredBirthdays && deliveredBirthdays.length === 0 && (
              <div className="card text-center text-sm text-gray-500 py-8">
                No birthday messages have been sent yet this year.
              </div>
            )}
            {deliveredBirthdays.length > 0 && (
              <div className="card overflow-x-auto p-0">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-left text-xs font-medium text-gray-600 uppercase">
                    <tr>
                      <th className="px-4 py-3">Recipient</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Phone</th>
                      <th className="px-4 py-3">Sent at</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {deliveredBirthdays.map((row) => {
                      const badge = birthdayStatusBadge(row.status);
                      return (
                        <tr key={row.id} className="hover:bg-gray-50/80">
                          <td className="px-4 py-3">{row.recipientName}</td>
                          <td className="px-4 py-3 text-xs text-gray-600">
                            {birthdayRecipientLabel(row.recipientType)}
                          </td>
                          <td className="px-4 py-3">{row.phone || '—'}</td>
                          <td className="px-4 py-3">
                            {row.sentAt ? formatDateTime(row.sentAt) : '—'}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${badge.class}`}>
                              {badge.label}
                            </span>
                            {row.errorMessage && (
                              <p className="text-xs text-red-600 mt-1">{row.errorMessage}</p>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Appointment reminders — already sent</h2>
            {deliveredRemindersError && (
              <div className="card text-sm text-red-600 mb-3">Unable to load sent reminders.</div>
            )}
            {loadingDeliveredReminders && (
              <div className="card text-sm text-gray-500">Loading sent reminders...</div>
            )}
            {!loadingDeliveredReminders && deliveredReminders.length === 0 && !deliveredRemindersError && (
              <div className="card text-center text-sm text-gray-500 py-10">
                No appointment reminders have been sent yet.
              </div>
            )}
            {deliveredReminders.length > 0 && (
              <div className="card overflow-x-auto p-0">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-left text-xs font-medium text-gray-600 uppercase">
                    <tr>
                      <th className="px-4 py-3">Appointment</th>
                      <th className="px-4 py-3">Patient SMS</th>
                      <th className="px-4 py-3">Provider SMS</th>
                      <th className="px-4 py-3">Overall</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {deliveredReminders.map((row) => {
                      const badge = reminderStatusBadge(row.status);
                      return (
                        <tr key={row.id} className="hover:bg-gray-50/80">
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900">
                              {formatAppointmentDate(row.appointmentDate, row.appointmentTime)}
                            </div>
                            {row.serviceName && (
                              <div className="text-xs text-gray-500">{row.serviceName}</div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {row.patientSentAt ? (
                              <div className="flex items-start gap-2 text-green-700">
                                <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                <div>
                                  <div>{row.patientName}</div>
                                  <div className="text-xs text-gray-500">
                                    {formatDateTime(row.patientSentAt)}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-start gap-2 text-red-600">
                                <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                <div>
                                  <div>Not sent</div>
                                  {row.patientSendError && (
                                    <div className="text-xs">{row.patientSendError}</div>
                                  )}
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {row.providerName ? (
                              row.providerSentAt ? (
                                <div className="flex items-start gap-2 text-green-700">
                                  <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <div>
                                      {row.providerName} ({providerTypeLabel(row.providerType)})
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {formatDateTime(row.providerSentAt)}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-start gap-2 text-red-600">
                                  <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <div>Not sent</div>
                                    {row.providerSendError && (
                                      <div className="text-xs">{row.providerSendError}</div>
                                    )}
                                  </div>
                                </div>
                              )
                            ) : (
                              <span className="text-gray-400">No provider</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${badge.class}`}>
                              {badge.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-4">
          {historyError && (
            <div className="card text-sm text-red-600">Unable to load SMS history.</div>
          )}
          {loadingHistory && <div className="card text-sm text-gray-500">Loading history...</div>}
          {!loadingHistory && messages.length === 0 && !historyError && (
            <div className="card text-center text-sm text-gray-500 py-12">No SMS messages sent yet.</div>
          )}
          {messages.map((entry) => {
            const badge = statusBadge(entry.status);
            return (
              <div key={entry.id} className="card">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${badge.class}`}>{badge.label}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${categoryBadge(entry.category)}`}>
                        {entry.category}
                      </span>
                      <span className="text-xs text-gray-500">{formatDateTime(entry.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{entry.message}</p>
                    {entry.sentByName && (
                      <p className="text-xs text-gray-500 mt-2">Sent by {entry.sentByName}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-sm">
                    <div className="rounded-md bg-gray-50 px-3 py-2">
                      <div className="text-xs text-gray-500">Total</div>
                      <div className="font-semibold">{entry.recipientCount}</div>
                    </div>
                    <div className="rounded-md bg-green-50 px-3 py-2">
                      <div className="text-xs text-green-600">Delivered</div>
                      <div className="font-semibold text-green-700">{entry.successCount}</div>
                    </div>
                    <div className="rounded-md bg-red-50 px-3 py-2">
                      <div className="text-xs text-red-600">Failed</div>
                      <div className="font-semibold text-red-700">{entry.failureCount}</div>
                    </div>
                  </div>
                </div>

                {entry.results?.length > 0 && (
                  <details className="mt-3 group">
                    <summary className="cursor-pointer text-xs text-primary-600 hover:underline">
                      View {entry.results.length} recipient(s)
                    </summary>
                    <div className="mt-2 divide-y divide-gray-100 rounded-md border border-gray-100">
                      {entry.results.map((result, idx) => (
                        <div
                          key={`${entry.id}-${idx}`}
                          className="flex items-center justify-between px-3 py-2 text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {result.ok ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                            )}
                            <span className="truncate font-medium text-gray-700">
                              {result.name ?? 'Recipient'}
                            </span>
                            <span className="text-gray-500 flex items-center gap-1">
                              <Phone className="h-3 w-3" /> {result.phone}
                            </span>
                          </div>
                          <span className="text-gray-500 truncate ml-2">{result.status}</span>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              System templates are always available. Add custom templates for recurring messages.
            </p>
            <button
              type="button"
              onClick={() => setShowTemplateModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="h-4 w-4" /> New template
            </button>
          </div>

          {loadingTemplates ? (
            <div className="card text-sm text-gray-500">Loading templates...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templateList.map((template) => (
                <div key={template.id} className="card">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-gray-900">{template.name}</span>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full ${categoryBadge(template.category)}`}>
                          {template.category}
                        </span>
                        {template.isSystem && (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                            system
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{template.message}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => applyTemplate(template)}
                        className="btn-outline text-xs"
                      >
                        Use
                      </button>
                      {!template.isSystem && (
                        <button
                          type="button"
                          onClick={async () => {
                            if (!window.confirm(`Delete template "${template.name}"?`)) return;
                            try {
                              await deleteTemplateMutation.mutate(template.id);
                              await refetchTemplates();
                            } catch (error: any) {
                              addNotification({
                                title: 'Unable to delete template',
                                message: error?.message ?? 'Try again later.',
                                type: 'error',
                                userId: 'system',
                                priority: 'medium',
                                category: 'system',
                              });
                            }
                          }}
                          className="text-xs text-red-600 hover:text-red-700 inline-flex items-center gap-1"
                        >
                          <Trash2 className="h-3 w-3" /> Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showTemplateModal && (
        <NewTemplateModal
          onClose={() => setShowTemplateModal(false)}
          onCreate={async (data) => {
            await createTemplateMutation.mutate(data);
            await refetchTemplates();
            setShowTemplateModal(false);
            addNotification({
              title: 'Template saved',
              message: `"${data.name}" is ready to use.`,
              type: 'success',
              userId: 'system',
              priority: 'medium',
              category: 'general',
            });
          }}
          submitting={createTemplateMutation.loading}
        />
      )}
    </div>
  );
}

interface TemplateFormData {
  name: string;
  category: SmsCategory;
  message: string;
}

function NewTemplateModal({
  onClose,
  onCreate,
  submitting,
}: {
  onClose: () => void;
  onCreate: (data: TemplateFormData) => Promise<void>;
  submitting: boolean;
}) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<SmsCategory>('general');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
  }, [name, message]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !message.trim()) {
      setError('Both name and message are required.');
      return;
    }
    try {
      await onCreate({ name: name.trim(), category, message: message.trim() });
    } catch (err: any) {
      setError(err?.message ?? 'Failed to create template.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">New SMS template</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as SmsCategory)}
              className="input-field"
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className="input-field"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Tip: use <code className="bg-gray-100 px-1 rounded">{'{{name}}'}</code> to personalize per recipient.
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-outline">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
