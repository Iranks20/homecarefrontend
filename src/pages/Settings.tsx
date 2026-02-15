import { useEffect, useMemo, useState } from 'react';
import { User, Bell, Shield, Database, Loader2, GraduationCap, Plus, Edit, Trash2, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useApi, useApiMutation } from '../hooks/useApi';
import { settingsService } from '../services/settings';
import { specializationService, type Specialization, type CreateSpecializationData } from '../services/specializations';
import { NotificationSettings, SystemSettings } from '../types';
import { toast } from 'react-toastify';

interface ProfileFormState {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  department?: string;
}

interface PasswordFormState {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const DEFAULT_PROFILE_FORM: ProfileFormState = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  department: '',
};

const DEFAULT_PASSWORD_FORM: PasswordFormState = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  emailNotifications: true,
  smsNotifications: false,
  pushNotifications: true,
  appointmentReminders: true,
  paymentReminders: true,
};

const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  siteName: 'Teamwork Homecare',
  siteEmail: 'support@homecare.com',
  sitePhone: '+1-555-0101',
  maintenanceMode: false,
  registrationEnabled: true,
  emailVerificationRequired: true,
  passwordMinLength: 8,
  sessionTimeout: 3600,
};

export default function Settings() {
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'security' | 'system' | 'specializations'>(
    'profile'
  );

  const { user, updateProfile, changePassword } = useAuth();
  const { addNotification } = useNotifications();

  const [profileForm, setProfileForm] = useState<ProfileFormState>(DEFAULT_PROFILE_FORM);
  const [passwordForm, setPasswordForm] = useState<PasswordFormState>(DEFAULT_PASSWORD_FORM);
  const [notificationForm, setNotificationForm] = useState<NotificationSettings>(
    DEFAULT_NOTIFICATION_SETTINGS
  );
  const [systemForm, setSystemForm] = useState<SystemSettings>(DEFAULT_SYSTEM_SETTINGS);

  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [notificationSaving, setNotificationSaving] = useState(false);
  const [systemSaving, setSystemSaving] = useState(false);

  const {
    data: notificationData,
    loading: notificationLoading,
    error: notificationError,
    refetch: refetchNotifications,
  } = useApi(() => settingsService.getNotificationSettings(), []);

  const {
    data: systemData,
    loading: systemLoading,
    error: systemError,
    refetch: refetchSystem,
  } = useApi(() => settingsService.getSystemSettings(), []);

  const updateNotificationMutation = useApiMutation(settingsService.updateNotificationSettings.bind(settingsService));
  const updateSystemMutation = useApiMutation(settingsService.updateSystemSettings.bind(settingsService));

  useEffect(() => {
    if (user) {
      const [firstName, ...rest] = user.name.split(' ');
      setProfileForm({
        firstName: firstName ?? '',
        lastName: rest.join(' '),
        email: user.email ?? '',
        phone: user.phone ?? '',
        department: user.department ?? '',
      });
    }
  }, [user]);

  useEffect(() => {
    if (notificationData?.notifications) {
      // Fallback if API returns wrapped response
      setNotificationForm({
        ...DEFAULT_NOTIFICATION_SETTINGS,
        ...notificationData.notifications,
      });
      return;
    }

    if (notificationData) {
      setNotificationForm({
        ...DEFAULT_NOTIFICATION_SETTINGS,
        ...notificationData,
      });
    }
  }, [notificationData]);

  useEffect(() => {
    if (systemData) {
      setSystemForm((prev) => ({
        ...prev,
        ...systemData,
      }));
    }
  }, [systemData]);

  const handleProfileChange = <K extends keyof ProfileFormState>(key: K, value: ProfileFormState[K]) => {
    setProfileForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleNotificationToggle = (key: keyof NotificationSettings) => {
    setNotificationForm((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSystemChange = <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => {
    setSystemForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleProfileSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;

    setProfileSaving(true);
    try {
      const updatedName = `${profileForm.firstName} ${profileForm.lastName}`.trim() || user.name;
      await updateProfile({
        name: updatedName,
        email: profileForm.email,
        phone: profileForm.phone,
        department: profileForm.department,
      });

      addNotification({
        title: 'Profile updated',
        message: 'Your profile information was saved successfully.',
        type: 'success',
        priority: 'medium',
        category: 'system',
        userId: user.id,
      });
    } catch (error: any) {
      addNotification({
        title: 'Profile update failed',
        message: error?.message || 'We could not update your profile. Please try again.',
        type: 'error',
        priority: 'high',
        category: 'system',
        userId: user?.id ?? '',
      });
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      addNotification({
        title: 'Password mismatch',
        message: 'Please make sure the new passwords match.',
        type: 'warning',
        priority: 'medium',
        category: 'system',
        userId: user?.id ?? '',
      });
      return;
    }

    setPasswordSaving(true);
    try {
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      addNotification({
        title: 'Password updated',
        message: 'Your password has been updated securely.',
        type: 'success',
        priority: 'medium',
        category: 'system',
        userId: user?.id ?? '',
      });
      setPasswordForm(DEFAULT_PASSWORD_FORM);
    } catch (error: any) {
      addNotification({
        title: 'Password update failed',
        message: error?.message || 'Unable to change password. Please verify your current password.',
        type: 'error',
        priority: 'high',
        category: 'system',
        userId: user?.id ?? '',
      });
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleNotificationSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setNotificationSaving(true);
    try {
      const updated = await updateNotificationMutation.mutate(notificationForm);
      setNotificationForm(updated);
      addNotification({
        title: 'Notification preferences saved',
        message: 'We will use your preferences for future alerts.',
        type: 'success',
        priority: 'medium',
        category: 'system',
        userId: user?.id ?? '',
      });
      await refetchNotifications();
    } catch (error: any) {
      addNotification({
        title: 'Unable to save preferences',
        message: error?.message || 'Please try again later.',
        type: 'error',
        priority: 'high',
        category: 'system',
        userId: user?.id ?? '',
      });
    } finally {
      setNotificationSaving(false);
    }
  };

  const handleSecuritySettingsSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setSystemSaving(true);
    try {
      const payload: Partial<SystemSettings> = {
        passwordMinLength: systemForm.passwordMinLength,
        sessionTimeout: systemForm.sessionTimeout,
        emailVerificationRequired: systemForm.emailVerificationRequired,
      };
      const updated = await updateSystemMutation.mutate(payload);
      setSystemForm((prev) => ({
        ...prev,
        ...updated,
      }));

      addNotification({
        title: 'Security policies updated',
        message: 'Password and session policies have been refreshed.',
        type: 'success',
        priority: 'medium',
        category: 'system',
        userId: user?.id ?? '',
      });
      await refetchSystem();
    } catch (error: any) {
      addNotification({
        title: 'Unable to update security settings',
        message: error?.message || 'Please try again later.',
        type: 'error',
        priority: 'high',
        category: 'system',
        userId: user?.id ?? '',
      });
    } finally {
      setSystemSaving(false);
    }
  };

  const handleSystemSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setSystemSaving(true);
    try {
      const payload: Partial<SystemSettings> = {
        siteName: systemForm.siteName,
        siteEmail: systemForm.siteEmail,
        sitePhone: systemForm.sitePhone,
        maintenanceMode: systemForm.maintenanceMode,
        registrationEnabled: systemForm.registrationEnabled,
      };
      const updated = await updateSystemMutation.mutate(payload);
      setSystemForm((prev) => ({
        ...prev,
        ...updated,
      }));

      addNotification({
        title: 'System settings saved',
        message: 'Core system preferences were updated successfully.',
        type: 'success',
        priority: 'medium',
        category: 'system',
        userId: user?.id ?? '',
      });
      await refetchSystem();
    } catch (error: any) {
      addNotification({
        title: 'Unable to save system settings',
        message: error?.message || 'Please try again later.',
        type: 'error',
        priority: 'high',
        category: 'system',
        userId: user?.id ?? '',
      });
    } finally {
      setSystemSaving(false);
    }
  };

  const systemLoadingState = systemLoading || updateSystemMutation.loading;
  const notificationLoadingState = notificationLoading || updateNotificationMutation.loading;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Manage your account and system preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {[
              { key: 'profile', label: 'Profile', icon: User },
              { key: 'notifications', label: 'Notifications', icon: Bell },
              { key: 'security', label: 'Security', icon: Shield },
              { key: 'system', label: 'System', icon: Database },
              { key: 'specializations', label: 'Specializations', icon: GraduationCap, adminOnly: true },
            ].filter(tab => !tab.adminOnly || user?.role === 'admin').map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                  activeTab === tab.key
                    ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-500'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-3" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="lg:col-span-3 space-y-6">
          {activeTab === 'profile' && (
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Settings</h2>
              <form className="space-y-6" onSubmit={handleProfileSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                    <input
                      type="text"
                      className="input-field"
                      value={profileForm.firstName}
                      onChange={(event) => handleProfileChange('firstName', event.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                    <input
                      type="text"
                      className="input-field"
                      value={profileForm.lastName}
                      onChange={(event) => handleProfileChange('lastName', event.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    className="input-field"
                    value={profileForm.email}
                    onChange={(event) => handleProfileChange('email', event.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input
                      type="tel"
                      className="input-field"
                      value={profileForm.phone ?? ''}
                      onChange={(event) => handleProfileChange('phone', event.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                    <input
                      type="text"
                      className="input-field"
                      value={profileForm.department ?? ''}
                      onChange={(event) => handleProfileChange('department', event.target.value)}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button className="btn-primary" disabled={profileSaving}>
                    {profileSaving ? <Loader2 className="h-4 w-4 mr-2 inline animate-spin" /> : null}
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Notification Preferences</h2>

              {notificationError && (
                <div className="p-4 mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md">
                  Unable to load your notification preferences right now.
                </div>
              )}

              <form className="space-y-6" onSubmit={handleNotificationSubmit}>
                {notificationLoadingState ? (
                  <div className="flex items-center justify-center py-8 text-gray-500">
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Loading preferences...
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">Email Notifications</h3>
                        <p className="text-sm text-gray-600">Receive notifications via email.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={!!notificationForm.emailNotifications}
                          onChange={() => handleNotificationToggle('emailNotifications')}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600" />
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">SMS Notifications</h3>
                        <p className="text-sm text-gray-600">Receive alerts via SMS.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={!!notificationForm.smsNotifications}
                          onChange={() => handleNotificationToggle('smsNotifications')}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600" />
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">Push Notifications</h3>
                        <p className="text-sm text-gray-600">Enable in-app push notifications.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={!!notificationForm.pushNotifications}
                          onChange={() => handleNotificationToggle('pushNotifications')}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600" />
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">Appointment Reminders</h3>
                        <p className="text-sm text-gray-600">Get reminded about upcoming appointments.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={!!notificationForm.appointmentReminders}
                          onChange={() => handleNotificationToggle('appointmentReminders')}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600" />
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">Payment Reminders</h3>
                        <p className="text-sm text-gray-600">Stay on top of invoice due dates.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={!!notificationForm.paymentReminders}
                          onChange={() => handleNotificationToggle('paymentReminders')}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600" />
                      </label>
                    </div>
                  </>
                )}

                <div className="flex justify-end">
                  <button className="btn-primary" disabled={notificationSaving || notificationLoadingState}>
                    {notificationSaving ? <Loader2 className="h-4 w-4 mr-2 inline animate-spin" /> : null}
                    Save Preferences
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Security Settings</h2>
                <form className="space-y-6" onSubmit={handlePasswordSubmit}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                    <input
                      type="password"
                      className="input-field"
                      value={passwordForm.currentPassword}
                      onChange={(event) =>
                        setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                    <input
                      type="password"
                      className="input-field"
                      value={passwordForm.newPassword}
                      onChange={(event) =>
                        setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                    <input
                      type="password"
                      className="input-field"
                      value={passwordForm.confirmPassword}
                      onChange={(event) =>
                        setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))
                      }
                      required
                    />
                  </div>

                  <div className="flex justify-end">
                    <button className="btn-primary" disabled={passwordSaving}>
                      {passwordSaving ? <Loader2 className="h-4 w-4 mr-2 inline animate-spin" /> : null}
                      Update Password
                    </button>
                  </div>
                </form>
              </div>

              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Password & Session Policies</h2>

                {systemError && (
                  <div className="p-4 mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md">
                    Unable to load security-related system settings.
                  </div>
                )}

                {systemLoadingState ? (
                  <div className="flex items-center justify-center py-8 text-gray-500">
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Loading security policies...
                  </div>
                ) : (
                  <form className="space-y-6" onSubmit={handleSecuritySettingsSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Password Minimum Length
                        </label>
                        <input
                          type="number"
                          min={4}
                          className="input-field"
                          value={systemForm.passwordMinLength ?? 8}
                          onChange={(event) =>
                            handleSystemChange('passwordMinLength', Number(event.target.value) || 8)
                          }
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Session Timeout (seconds)
                        </label>
                        <input
                          type="number"
                          min={300}
                          className="input-field"
                          value={systemForm.sessionTimeout ?? 3600}
                          onChange={(event) =>
                            handleSystemChange('sessionTimeout', Number(event.target.value) || 3600)
                          }
                          required
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">Require email verification</h3>
                        <p className="text-sm text-gray-600">Users must verify their email before accessing the system.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={!!systemForm.emailVerificationRequired}
                          onChange={() =>
                            handleSystemChange('emailVerificationRequired', !systemForm.emailVerificationRequired)
                          }
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600" />
                      </label>
                    </div>

                    <div className="flex justify-end">
                      <button className="btn-primary" disabled={systemSaving || systemLoadingState}>
                        {systemSaving ? <Loader2 className="h-4 w-4 mr-2 inline animate-spin" /> : null}
                        Save Security Policies
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">System Settings</h2>

              {systemError && (
                <div className="p-4 mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md">
                  Unable to load core system settings.
                </div>
              )}

              {systemLoadingState ? (
                <div className="flex items-center justify-center py-8 text-gray-500">
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Loading system settings...
                </div>
              ) : (
                <form className="space-y-6" onSubmit={handleSystemSubmit}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Site Name</label>
                    <input
                      type="text"
                      className="input-field"
                      value={systemForm.siteName ?? ''}
                      onChange={(event) => handleSystemChange('siteName', event.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Support Email</label>
                      <input
                        type="email"
                        className="input-field"
                        value={systemForm.siteEmail ?? ''}
                        onChange={(event) => handleSystemChange('siteEmail', event.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Support Phone</label>
                      <input
                        type="tel"
                        className="input-field"
                        value={systemForm.sitePhone ?? ''}
                        onChange={(event) => handleSystemChange('sitePhone', event.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">Maintenance Mode</h3>
                      <p className="text-sm text-gray-600">Temporarily disable non-admin access while maintenance is performed.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={!!systemForm.maintenanceMode}
                        onChange={() => handleSystemChange('maintenanceMode', !systemForm.maintenanceMode)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600" />
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">Allow New Registrations</h3>
                      <p className="text-sm text-gray-600">Control whether new users can sign up.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={!!systemForm.registrationEnabled}
                        onChange={() => handleSystemChange('registrationEnabled', !systemForm.registrationEnabled)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600" />
                    </label>
                  </div>

                  <div className="flex justify-end">
                    <button className="btn-primary" disabled={systemSaving || systemLoadingState}>
                      {systemSaving ? <Loader2 className="h-4 w-4 mr-2 inline animate-spin" /> : null}
                      Save Settings
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {activeTab === 'specializations' && user?.role === 'admin' && <SpecializationsTab />}
        </div>
      </div>
    </div>
  );
}

function SpecializationsTab() {
  const [typeFilter, setTypeFilter] = useState<'SPECIALIST' | 'THERAPIST' | 'all'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSpecialization, setEditingSpecialization] = useState<Specialization | null>(null);
  const [formData, setFormData] = useState<CreateSpecializationData>({
    name: '',
    type: 'SPECIALIST',
    description: '',
    isActive: true,
    displayOrder: 0,
  });

  const {
    data: specializations,
    loading,
    error,
    refetch,
  } = useApi(
    () => specializationService.getSpecializations({
      type: typeFilter !== 'all' ? typeFilter : undefined,
      includeInactive: true,
    }),
    [typeFilter]
  );

  const createMutation = useApiMutation(specializationService.createSpecialization.bind(specializationService));
  const updateMutation = useApiMutation(
    ({ id, data }: { id: string; data: Partial<CreateSpecializationData> }) =>
      specializationService.updateSpecialization(id, data)
  );
  const deleteMutation = useApiMutation(specializationService.deleteSpecialization.bind(specializationService));

  const filteredSpecializations = useMemo(() => {
    if (!specializations) return [];
    return typeFilter === 'all'
      ? specializations
      : specializations.filter((s) => s.type === typeFilter);
  }, [specializations, typeFilter]);

  const handleAdd = () => {
    setFormData({
      name: '',
      type: 'SPECIALIST',
      description: '',
      isActive: true,
      displayOrder: 0,
    });
    setEditingSpecialization(null);
    setIsAddModalOpen(true);
  };

  const handleEdit = (spec: Specialization) => {
    setFormData({
      name: spec.name,
      type: spec.type,
      description: spec.description || '',
      isActive: spec.isActive,
      displayOrder: spec.displayOrder,
    });
    setEditingSpecialization(spec);
    setIsAddModalOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingSpecialization) {
        await updateMutation.mutate({
          id: editingSpecialization.id,
          data: formData,
        });
        toast.success('Specialization updated successfully');
      } else {
        await createMutation.mutate(formData);
        toast.success('Specialization created successfully');
      }
      setIsAddModalOpen(false);
      setEditingSpecialization(null);
      await refetch();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to save specialization');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this specialization?')) return;
    try {
      await deleteMutation.mutate(id);
      toast.success('Specialization deleted successfully');
      await refetch();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete specialization');
    }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Specializations Management</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage specializations for Specialists and Therapists
          </p>
        </div>
        <button onClick={handleAdd} className="btn-primary inline-flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Add Specialization
        </button>
      </div>

      <div className="mb-4">
        <div className="flex gap-2">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              typeFilter === 'all'
                ? 'bg-primary-100 text-primary-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setTypeFilter('SPECIALIST')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              typeFilter === 'SPECIALIST'
                ? 'bg-primary-100 text-primary-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Specialists
          </button>
          <button
            onClick={() => setTypeFilter('THERAPIST')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              typeFilter === 'THERAPIST'
                ? 'bg-primary-100 text-primary-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Therapists
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8 text-gray-500">
          <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Loading specializations...
        </div>
      ) : error ? (
        <div className="p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md">
          Failed to load specializations
        </div>
      ) : (
        <div className="space-y-2">
          {filteredSpecializations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No specializations found. Click "Add Specialization" to create one.
            </div>
          ) : (
            filteredSpecializations.map((spec) => (
              <div
                key={spec.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-medium text-gray-900">{spec.name}</h3>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        spec.type === 'SPECIALIST'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {spec.type}
                    </span>
                    {!spec.isActive && (
                      <span className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-600">
                        Inactive
                      </span>
                    )}
                  </div>
                  {spec.description && (
                    <p className="text-sm text-gray-600 mt-1">{spec.description}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Order: {spec.displayOrder}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(spec)}
                    className="p-2 text-secondary-600 hover:bg-secondary-50 rounded"
                    title="Edit"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(spec.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingSpecialization ? 'Edit Specialization' : 'Add Specialization'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingSpecialization(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  placeholder="e.g., Physiotherapy"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'SPECIALIST' | 'THERAPIST' })}
                  className="input-field"
                  required
                >
                  <option value="SPECIALIST">Specialist</option>
                  <option value="THERAPIST">Therapist</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field"
                  rows={3}
                  placeholder="Optional description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Display Order</label>
                  <input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: Number(e.target.value) })}
                    className="input-field"
                    min="0"
                  />
                </div>
                <div className="flex items-center pt-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Active</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingSpecialization(null);
                  }}
                  className="btn-outline"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="btn-primary"
                  disabled={!formData.name || createMutation.loading || updateMutation.loading}
                >
                  {createMutation.loading || updateMutation.loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 inline animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

