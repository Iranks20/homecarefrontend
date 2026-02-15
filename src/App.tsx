import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Layout from './components/Layout';
import { NotificationProvider } from './contexts/NotificationContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import Login from './pages/LoginNew';
import Dashboard from './pages/Dashboard';
import Nurses from './pages/Nurses';
import NurseProfile from './pages/NurseProfile';
import Patients from './pages/Patients';
import PatientProfile from './pages/PatientProfile';
import Training from './pages/Training';
import Exam from './pages/Exam';
import ExamTaking from './pages/ExamTaking';
import ExamResult from './pages/ExamResult';
import Scheduling from './pages/Scheduling';
import Services from './pages/Services';
import Billing from './pages/Billing';
import Reports from './pages/Reports';
import UsersPage from './pages/Users';
import Therapists from './pages/Therapists';

// New pages to be created
import BookAppointment from './pages/BookAppointment';
import MyAppointments from './pages/MyAppointments';
import HealthMonitoring from './pages/HealthMonitoring';
import Feedback from './pages/Feedback';
import MySchedule from './pages/MySchedule';
import ClinicalDocumentation from './pages/ClinicalDocumentation';
import IncidentReports from './pages/IncidentReports';
import Communication from './pages/Communication';
import Specialists from './pages/Specialists';
import Settings from './pages/Settings';
import PhoneReminders from './pages/PhoneReminders';
import HealthRecords from './pages/HealthRecords';
import BillerDashboard from './pages/BillerDashboard';
import Billers from './pages/Billers';
import ConsultationRates from './pages/ConsultationRates';
import Receptionists from './pages/Receptionists';
import LabAttendants from './pages/LabAttendants';
import Investigations from './pages/Investigations';

function AppContent() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Login />;
  }

  return (
    <Router>
      <Layout user={user}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/biller-dashboard" element={<BillerDashboard />} />
          
          {/* Patient Routes */}
          <Route path="/book-appointment" element={<BookAppointment />} />
          <Route path="/my-appointments" element={<MyAppointments />} />
          <Route path="/health-monitoring" element={<HealthMonitoring />} />
          <Route path="/feedback" element={<Feedback />} />
          
          {/* Nurse/Specialist Routes */}
          <Route path="/my-schedule" element={<MySchedule />} />
          <Route path="/documentation" element={<ClinicalDocumentation />} />
          <Route path="/incidents" element={<IncidentReports />} />
          {/* TODO: Re-enable Communication feature in the future */}
          {/* <Route path="/communication" element={<Communication />} /> */}
          
          {/* Admin Routes */}
          <Route path="/nurses" element={<Nurses />} />
          <Route path="/nurses/:id" element={<NurseProfile />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/specialists" element={<Specialists />} />
          <Route path="/therapists" element={<Therapists />} />
          <Route path="/billers" element={<Billers />} />
          <Route path="/consultation-rates" element={<ConsultationRates />} />
          <Route path="/receptionists" element={<Receptionists />} />
          <Route path="/lab-attendants" element={<LabAttendants />} />
          <Route path="/investigations" element={<Investigations />} />

          {/* Shared Routes */}
          <Route path="/health-records" element={<HealthRecords />} />
          <Route path="/phone-reminders" element={<PhoneReminders />} />
          <Route path="/scheduling" element={<Scheduling />} />
          <Route path="/services" element={<Services />} />
          <Route path="/training" element={<Training />} />
          <Route path="/training/exam/:id" element={<Exam />} />
          <Route path="/training/exam/:id/take" element={<ExamTaking />} />
          <Route path="/training/exam/:id/result/:attemptId?" element={<ExamResult />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/patients" element={<Patients />} />
          <Route path="/patients/:id" element={<PatientProfile />} />
        </Routes>
      </Layout>
    </Router>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <NotificationProvider>
        <AuthProvider>
          <AppContent />
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </AuthProvider>
      </NotificationProvider>
    </ErrorBoundary>
  );
}

export default App;
