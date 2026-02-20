import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import NotificationCenter from './NotificationCenter';
import { useAuth } from '../contexts/AuthContext';
import { getLogoUrl } from '../utils/logo';
import { 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  Calendar, 
  BookOpen, 
  CreditCard, 
  BarChart3, 
  Search, 
  Menu, 
  X,
  LogOut,
  Stethoscope,
  Activity,
  FileText,
  MessageSquare,
  Star,
  Package,
  Settings,
  AlertTriangle,
  Clock,
  Zap,
  Phone,
  Heart,
  Shield,
  TestTube,
  DollarSign
} from 'lucide-react';
import { User as UserType } from '../types';

interface LayoutProps {
  children: ReactNode;
  user: UserType;
}

const getNavigationForRole = (role: string) => {
  const baseNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  ];

  // Receptionist navigation - patient registration and assignment
  const receptionistNavigation = [
    ...baseNavigation,
    { name: 'Patients', href: '/patients', icon: Users },
    { name: 'Lab Requests', href: '/investigations', icon: TestTube },
    { name: 'Appointments', href: '/scheduling?view=appointments', icon: Calendar },
    { name: 'Specialists', href: '/specialists', icon: Activity },
    { name: 'Therapists', href: '/therapists', icon: Stethoscope },
    { name: 'Billers', href: '/billers', icon: CreditCard },
    // TODO: Re-enable Communication feature in the future
    // { name: 'Communication', href: '/communication', icon: MessageSquare },
  ];

  // Doctor navigation - review patients and assign to specialists
  const doctorNavigation = [
    ...baseNavigation,
    { name: 'My Schedule', href: '/my-schedule', icon: Calendar },
    { name: 'Patients', href: '/patients', icon: UserCheck },
    { name: 'Investigations', href: '/investigations', icon: TestTube },
    { name: 'Clinical Documentation', href: '/health-records', icon: FileText },
    { name: 'Schedule Session', href: '/scheduling', icon: Calendar },
  ];

  // Specialist navigation - treat patients and prepare for discharge
  const specialistNavigation = [
    ...baseNavigation,
    { name: 'My Schedule', href: '/my-schedule', icon: Calendar },
    { name: 'Patients', href: '/patients', icon: UserCheck },
    { name: 'Investigations', href: '/investigations', icon: TestTube },
    { name: 'Clinical Documentation', href: '/health-records', icon: FileText },
    { name: 'Schedule Session', href: '/scheduling', icon: Calendar },
  ];

  // Nurse navigation - vitals recording and patient management
  const nurseNavigation = [
    ...baseNavigation,
    { name: 'Patients', href: '/patients', icon: UserCheck },
  ];

  const adminNavigation = [
    ...baseNavigation,
    { name: 'Patients', href: '/patients', icon: UserCheck },
    { name: 'Receptionists', href: '/receptionists', icon: Users },
    { name: 'Specialists', href: '/specialists', icon: Activity },
    { name: 'Therapists', href: '/therapists', icon: Stethoscope },
    { name: 'Nurses', href: '/nurses', icon: Heart },
    { name: 'Lab Attendants', href: '/lab-attendants', icon: TestTube },
    { name: 'Billers', href: '/billers', icon: CreditCard },
    { name: 'Consultation rates', href: '/consultation-rates', icon: DollarSign },
    { name: 'Scheduling', href: '/scheduling', icon: Calendar },
    { name: 'Services', href: '/services', icon: Package },
    { name: 'Investigations', href: '/investigations', icon: TestTube },
    { name: 'Clinical Documentation', href: '/health-records', icon: FileText },
    { name: 'Billing', href: '/billing', icon: CreditCard },
    { name: 'Reports & Analytics', href: '/reports', icon: BarChart3 },
    { name: 'Training & Exams', href: '/training', icon: BookOpen },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  // Biller navigation - finance and billing focused
  const billerNavigation = [
    ...baseNavigation,
    { name: 'Patients', href: '/patients', icon: UserCheck },
    { name: 'Lab Requests', href: '/investigations', icon: TestTube },
    { name: 'Services', href: '/services', icon: Package },
    { name: 'Consultation rates', href: '/consultation-rates', icon: DollarSign },
    { name: 'Billing', href: '/billing', icon: CreditCard },
  ];

  // Lab attendant - investigations and lab samples
  const labAttendantNavigation = [
    ...baseNavigation,
    { name: 'Investigations', href: '/investigations', icon: TestTube },
    { name: 'Health Records & Lab', href: '/health-records', icon: FileText },
  ];

  switch (role) {
    case 'receptionist':
      return receptionistNavigation;
    case 'doctor':
      return doctorNavigation;
    case 'specialist':
      return specialistNavigation;
    case 'nurse':
      return nurseNavigation;
    case 'admin':
      return adminNavigation;
    case 'biller':
      return billerNavigation;
    case 'lab_attendant':
      return labAttendantNavigation;
    default:
      return baseNavigation;
  }
};

export default function Layout({ children, user }: LayoutProps) {
  const { logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigation = getNavigationForRole(user.role);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex h-full w-64 flex-col bg-white min-h-0">
          <div className="flex h-auto shrink-0 items-center justify-between px-4 py-2">
            <div className="flex items-center justify-center flex-1">
              <img 
                src={getLogoUrl()} 
                alt="Teamwork Physio International" 
                className="h-12 sm:h-14 md:h-16 w-auto object-contain max-w-full"
                onError={(e) => {
                  // Fallback to placeholder if logo fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = target.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
              <div className="h-8 w-8 bg-primary-500 rounded-lg flex items-center justify-center flex-shrink-0" style={{ display: 'none' }}>
                <span className="text-white font-bold text-sm">TH</span>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-400 hover:text-gray-600 ml-2 flex-shrink-0"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="min-h-0 flex-1 px-4 pt-2 pb-4 space-y-1 sidebar-scroll">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`sidebar-item ${isActive ? 'sidebar-item-active' : 'sidebar-item-inactive'}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col lg:h-full">
        <div className="flex min-h-0 flex-1 flex-col bg-white border-r border-gray-200">
          <div className="flex h-auto shrink-0 items-center justify-center px-4 py-2">
            <img 
              src={getLogoUrl()} 
              alt="Teamwork Physio International" 
              className="h-12 lg:h-14 xl:h-16 w-auto object-contain max-w-full"
              onError={(e) => {
                // Fallback to placeholder if logo fails to load
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const fallback = target.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
            <div className="h-8 w-8 bg-primary-500 rounded-lg flex items-center justify-center flex-shrink-0" style={{ display: 'none' }}>
              <span className="text-white font-bold text-sm">TH</span>
            </div>
          </div>
          <nav className="min-h-0 flex-1 px-4 pt-2 pb-4 space-y-1 sidebar-scroll">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`sidebar-item ${isActive ? 'sidebar-item-active' : 'sidebar-item-inactive'}`}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top navbar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="relative flex flex-1 items-center">
              <Search className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-gray-400 ml-3" />
              <input
                type="text"
                placeholder="Search..."
                className="block h-10 w-full rounded-lg border-0 py-1.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-500 sm:text-sm sm:leading-6"
              />
            </div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              {/* Notifications */}
              <NotificationCenter />

              {/* Profile dropdown */}
              <div className="flex items-center gap-x-2">
                <div className="h-8 w-8 bg-primary-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div className="hidden lg:block">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-gray-400 hover:text-gray-600"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
