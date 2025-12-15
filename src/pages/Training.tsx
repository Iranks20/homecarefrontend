import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Calendar,
  Clock,
  Users,
  BookOpen,
  Award,
  MapPin,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  Eye,
  FileText,
  CheckCircle,
} from 'lucide-react';
import { TrainingClass } from '../types';
import AddEditTrainingClassModal from '../components/AddEditTrainingClassModal';
import TrainingClassDetailsModal from '../components/TrainingClassDetailsModal';
import ExamBuilderModal from '../components/ExamBuilderModal';
import CertificatePreviewModal from '../components/CertificatePreviewModal';
import { trainingService } from '../services/training';
import {
  examService,
  Exam,
  CreateExamData,
  ExamAttempt,
  ExamCertificate,
  CertificateStatus,
} from '../services/exam';
import { useApi, useApiMutation } from '../hooks/useApi';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

export default function Training() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'classes' | 'exams' | 'attempts' | 'certificates'>('classes');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [examStatusFilter, setExamStatusFilter] = useState('PUBLISHED');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [isEditExamModalOpen, setIsEditExamModalOpen] = useState(false);
  const [selectedTrainingClass, setSelectedTrainingClass] = useState<TrainingClass | null>(null);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [certificateStatusFilter, setCertificateStatusFilter] = useState<CertificateStatus | 'all'>('PENDING');
  const [previewCertificate, setPreviewCertificate] = useState<ExamCertificate | null>(null);
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false);
  const [selectedExamIdFilter, setSelectedExamIdFilter] = useState<string | null>(null);
  const isAdmin = user?.role === 'admin';

  const {
    data: classesData,
    loading: loadingClasses,
    error: classesError,
    refetch: refetchClasses,
  } = useApi(() => trainingService.getClasses(), []);

  const {
    data: examsData,
    loading: loadingExams,
    error: examsError,
    refetch: refetchExams,
  } = useApi(() => trainingService.getExams(), []);

  const {
    data: newExamsData,
    loading: loadingNewExams,
    error: newExamsError,
    refetch: refetchNewExams,
  } = useApi(
    () => examService.getExams({ status: isAdmin ? undefined : 'PUBLISHED', limit: 100 }),
    [isAdmin]
  );

  const {
    data: attemptsData,
    loading: loadingAttempts,
    error: attemptsError,
    refetch: refetchAttempts,
  } = useApi(
    () => examService.getAttempts({ 
      userId: isAdmin ? undefined : user?.id, 
      examId: selectedExamIdFilter || undefined,
      limit: 100 
    }),
    [isAdmin, user?.id, selectedExamIdFilter]
  );

  const {
    data: certificatesResponse,
    loading: loadingCertificates,
    error: certificatesError,
    refetch: refetchCertificates,
  } = useApi(
    () =>
      isAdmin
        ? examService.getCertificates({ limit: 100 })
        : Promise.resolve({ certificates: [], pagination: undefined }),
    [isAdmin]
  );

  const classes = classesData?.classes ?? [];
  const exams = examsData?.exams ?? [];
  const newExams = newExamsData?.exams ?? [];
  const attempts = attemptsData?.attempts ?? [];
  const certificates = certificatesResponse?.certificates ?? [];

  const createClassMutation = useApiMutation(trainingService.createClass.bind(trainingService));
  const updateClassMutation = useApiMutation(
    (params: { id: string; data: Omit<TrainingClass, 'id'> }) =>
      trainingService.updateClass(params.id, params.data)
  );
  const deleteClassMutation = useApiMutation(trainingService.deleteClass.bind(trainingService));
  const enrollMutation = useApiMutation(trainingService.enrollInClass.bind(trainingService));

  const createExamMutation = useApiMutation(examService.createExam.bind(examService));
  const updateExamMutation = useApiMutation(
    (params: { id: string; data: Partial<CreateExamData> }) =>
      examService.updateExam(params.id, params.data)
  );
  const deleteExamMutation = useApiMutation(examService.deleteExam.bind(examService));
  const approveCertificateMutation = useApiMutation(examService.approveCertificate.bind(examService));

  const filteredClasses = useMemo(() => {
    if (!classes || classes.length === 0) return [];
    const normalizedSearch = (searchTerm || '').toLowerCase();
    return classes.filter((class_) => {
      const matchesSearch =
        (class_.title?.toLowerCase() ?? '').includes(normalizedSearch) ||
        (class_.instructor?.toLowerCase() ?? '').includes(normalizedSearch);
      const matchesStatus = statusFilter === 'all' || class_.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || class_.category === categoryFilter;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [classes, searchTerm, statusFilter, categoryFilter]);

  const categories = useMemo(
    () => Array.from(new Set(classes.map((class_) => class_.category))).filter(Boolean),
    [classes]
  );

  const handleAddTrainingClass = async (classData: Omit<TrainingClass, 'id'>) => {
    try {
      if (!user?.id) {
        throw new Error('You must be logged in to schedule a class');
      }

      // Transform frontend data to backend format
      const startDate = new Date(classData.date);
      const endDate = new Date(startDate);
      endDate.setHours(endDate.getHours() + (classData.duration || 2));

      const backendData = {
        name: classData.title,
        description: classData.description,
        instructorId: user.id,
        instructorName: classData.instructor, // Send instructor name from form
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        capacity: classData.maxParticipants,
        category: classData.category,
        location: classData.location,
        duration: classData.duration,
        status: classData.status,
      } as any;

      await createClassMutation.mutate(backendData);
      toast.success(`${classData.title} has been scheduled successfully.`);
      setIsAddModalOpen(false);
      await refetchClasses();
    } catch (error: any) {
      toast.error(error?.message ?? 'Unable to schedule class. Please try again later.');
      throw error;
    }
  };

  const handleEditTrainingClass = async (classData: Omit<TrainingClass, 'id'>) => {
    if (!selectedTrainingClass) {
      return;
    }

    try {
      if (!user?.id) {
        throw new Error('You must be logged in to update a class');
      }

      // Transform frontend data to backend format
      const startDate = new Date(classData.date);
      const endDate = new Date(startDate);
      endDate.setHours(endDate.getHours() + (classData.duration || 2));

      const backendData = {
        name: classData.title,
        description: classData.description,
        instructorId: user.id,
        instructorName: classData.instructor, // Send instructor name from form
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        capacity: classData.maxParticipants,
        category: classData.category,
        location: classData.location,
        duration: classData.duration,
        status: classData.status,
      } as any;

      await updateClassMutation.mutate({ id: selectedTrainingClass.id, data: backendData });
      toast.success(`${classData.title} has been updated.`);
      setIsEditModalOpen(false);
      setSelectedTrainingClass(null);
      await refetchClasses();
    } catch (error: any) {
      toast.error(error?.message ?? 'Unable to update class. Please try again later.');
      throw error;
    }
  };

  const handleDeleteTrainingClass = async (classId: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete the class "${title}"?`)) {
      return;
    }

    try {
      await deleteClassMutation.mutate(classId);
      toast.success(`${title} has been deleted.`);
      await refetchClasses();
    } catch (error: any) {
      toast.error(error?.message ?? 'Unable to delete class. Please try again later.');
    }
  };

  const handleEnroll = async (classId: string) => {
    try {
      await enrollMutation.mutate(classId);
      toast.success('You have been enrolled in the class.');
      await refetchClasses();
    } catch (error: any) {
      toast.error(error?.message ?? 'Unable to enroll. Please try again later.');
    }
  };

  const openViewModal = (trainingClass: TrainingClass) => {
    setSelectedTrainingClass(trainingClass);
    setIsViewModalOpen(true);
  };

  const openEditModal = (trainingClass: TrainingClass) => {
    setSelectedTrainingClass(trainingClass);
    setIsEditModalOpen(true);
  };

  const handleAddExam = async (examData: CreateExamData) => {
    try {
      await createExamMutation.mutate(examData);
      toast.success(`${examData.title} has been created successfully.`);
      setIsExamModalOpen(false);
      await refetchNewExams();
    } catch (error: any) {
      toast.error(error?.message ?? 'Unable to create exam. Please try again later.');
      throw error;
    }
  };

  const handleEditExam = async (examData: CreateExamData) => {
    if (!selectedExam) return;

    try {
      await updateExamMutation.mutate({ id: selectedExam.id, data: examData });
      toast.success(`${examData.title} has been updated.`);
      setIsEditExamModalOpen(false);
      setSelectedExam(null);
      await refetchNewExams();
    } catch (error: any) {
      toast.error(error?.message ?? 'Unable to update exam. Please try again later.');
      throw error;
    }
  };

  const handleDeleteExam = async (examId: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete the exam "${title}"?`)) {
      return;
    }

    try {
      await deleteExamMutation.mutate(examId);
      toast.success(`${title} has been deleted.`);
      await refetchNewExams();
    } catch (error: any) {
      toast.error(error?.message ?? 'Unable to delete exam. Please try again later.');
    }
  };

  const handleApproveCertificate = async (certificate: ExamCertificate) => {
    try {
      await approveCertificateMutation.mutate(certificate.id);
      toast.success(`${certificate.userName ?? 'Candidate'} now has an approved certificate.`);
      await Promise.all([refetchCertificates(), refetchAttempts()]);
    } catch (error: any) {
      toast.error(error?.message ?? 'Unable to approve certificate. Please try again later.');
    }
  };

  const openCertificatePreview = (certificate: ExamCertificate | null) => {
    setPreviewCertificate(certificate);
    setIsCertificateModalOpen(Boolean(certificate));
  };

  const openEditExamModal = (exam: Exam) => {
    setSelectedExam(exam);
    setIsEditExamModalOpen(true);
  };

  const filteredNewExams = useMemo(() => {
    if (!newExams || newExams.length === 0) return [];
    const normalizedSearch = (searchTerm || '').toLowerCase();
    return newExams.filter((exam) => {
      const matchesSearch = (exam.title?.toLowerCase() ?? '').includes(normalizedSearch);
      const matchesStatus = examStatusFilter === 'all' || exam.status === examStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [newExams, searchTerm, examStatusFilter]);

  const filteredCertificates = useMemo(() => {
    if (!certificates || certificates.length === 0) return [];
    const normalizedSearch = (searchTerm || '').trim().toLowerCase();
    return certificates.filter((certificate) => {
      const matchesStatus = certificateStatusFilter === 'all' || certificate.status === certificateStatusFilter;
      if (!normalizedSearch) {
        return matchesStatus;
      }
      const candidateName = certificate.userName?.toLowerCase() ?? '';
      const examTitle = certificate.examTitle?.toLowerCase() ?? '';
      const certNumber = certificate.certificateNumber?.toLowerCase() ?? '';
      const matchesSearch =
        candidateName.includes(normalizedSearch) ||
        examTitle.includes(normalizedSearch) ||
        certNumber.includes(normalizedSearch);
      return matchesStatus && matchesSearch;
    });
  }, [certificates, certificateStatusFilter, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Training & Examinations</h1>
          <p className="mt-1 text-sm text-gray-600">Manage training classes and certification exams</p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-2">
          {activeTab === 'classes' && (
          <button onClick={() => setIsAddModalOpen(true)} className="btn-primary flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            Schedule New Class
          </button>
          )}
          {activeTab === 'exams' && isAdmin && (
            <button onClick={() => setIsExamModalOpen(true)} className="btn-primary flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              Create New Exam
            </button>
          )}
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('classes')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'classes'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Training Classes
          </button>
          <button
            onClick={() => setActiveTab('exams')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'exams'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Exams
          </button>
          <button
            onClick={() => setActiveTab('attempts')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'attempts'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {isAdmin ? 'All Attempts' : 'My Attempts'}
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveTab('certificates')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'certificates'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Certificates
            </button>
          )}
        </nav>
      </div>

      <div className="card">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search classes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field"
            >
              <option value="all">All Status</option>
              <option value="upcoming">Upcoming</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="input-field"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {classesError && (
        <div className="card text-sm text-red-500 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" /> Unable to load training classes. Please try again later.
        </div>
      )}

      {activeTab === 'classes' && (
        <>
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Training Classes</h2>
        {loadingClasses ? (
          <div className="card text-sm text-gray-500">Loading training classes...</div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {filteredClasses.map((class_) => (
              <div key={class_.id} className="card hover:shadow-lg transition-shadow duration-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">{class_.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{class_.description}</p>
                  </div>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      class_.status === 'upcoming'
                        ? 'bg-blue-100 text-blue-800'
                        : class_.status === 'ongoing'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {class_.status}
                  </span>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-2" />
                    Instructor: {class_.instructor}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    {class_.date ? new Date(class_.date).toLocaleDateString() : 'Date TBD'}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-2" />
                    {class_.duration} hours
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    {class_.location}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-2" />
                    {class_.enrolledCount ?? 0}/{class_.maxParticipants} enrolled
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secondary-100 text-secondary-800">
                    {class_.category}
                  </span>
                  <div className="flex space-x-2">
                    {class_.status === 'upcoming' && (
                      <button className="btn-secondary text-sm" onClick={() => handleEnroll(class_.id)}>
                        Enroll
                      </button>
                    )}
                    <button
                      onClick={() => openViewModal(class_)}
                      className="btn-outline text-sm text-blue-600 hover:text-blue-800"
                    >
                      <Eye className="h-3 w-3 inline mr-1" />
                      View Details
                    </button>
                    <button
                      onClick={() => openEditModal(class_)}
                      className="btn-outline text-sm text-blue-600 hover:text-blue-800"
                    >
                      <Edit className="h-3 w-3 inline mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteTrainingClass(class_.id, class_.title)}
                      className="btn-outline text-sm text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-3 w-3 inline mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {filteredClasses.length === 0 && !loadingClasses && (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <Search className="h-12 w-12" />
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No classes found</h3>
          <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter criteria.</p>
        </div>
      )}

          </>
        )}

      {activeTab === 'exams' && (
        <>
          <div className="card mb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search exams..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input-field pl-10"
                  />
                </div>
              </div>
              {isAdmin && (
                <div>
                  <select
                    value={examStatusFilter}
                    onChange={(e) => setExamStatusFilter(e.target.value)}
                    className="input-field"
                  >
                    <option value="all">All Status</option>
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {newExamsError && (
          <div className="card text-sm text-red-500 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> Unable to load exams. Please try again later.
          </div>
        )}

          {loadingNewExams ? (
          <div className="card text-sm text-gray-500">Loading exams...</div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {filteredNewExams.map((exam) => (
              <div key={exam.id} className="card hover:shadow-lg transition-shadow duration-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">{exam.title}</h3>
                      {exam.description && (
                    <p className="text-sm text-gray-600 mt-1">{exam.description}</p>
                      )}
                  </div>
                  <Award className="h-6 w-6 text-primary-500" />
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-2" />
                      Duration: {exam.duration} minutes
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Award className="h-4 w-4 mr-2" />
                    Passing Score: {exam.passingScore}%
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <BookOpen className="h-4 w-4 mr-2" />
                      Questions: {exam.questions?.length ?? 0}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-2" />
                      Max Attempts: {exam.maxAttempts}
                    </div>
                    <div className="flex items-center">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          exam.status === 'PUBLISHED'
                            ? 'bg-green-100 text-green-800'
                            : exam.status === 'DRAFT'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {exam.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    {isAdmin ? (
                      <>
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditExamModal(exam)}
                            className="btn-outline text-sm text-blue-600 hover:text-blue-800"
                          >
                            <Edit className="h-3 w-3 inline mr-1" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteExam(exam.id, exam.title)}
                            className="btn-outline text-sm text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-3 w-3 inline mr-1" />
                            Delete
                          </button>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedExamIdFilter(exam.id);
                            setActiveTab('attempts');
                          }}
                          className="btn-outline text-sm"
                        >
                          <Eye className="h-3 w-3 inline mr-1" />
                          View Attempts
                        </button>
                      </>
                    ) : (
                      <>
                        {exam.status === 'PUBLISHED' && (
                          <button
                            onClick={() => navigate(`/training/exam/${exam.id}/take`)}
                            className="btn-primary text-sm"
                          >
                            Take Exam
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {filteredNewExams.length === 0 && !loadingNewExams && (
            <div className="text-center py-12">
              <div className="mx-auto h-12 w-12 text-gray-400">
                <BookOpen className="h-12 w-12" />
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No exams found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {isAdmin
                  ? 'Create your first exam to get started.'
                  : 'No exams are available at this time.'}
              </p>
            </div>
          )}
        </>
      )}

      {activeTab === 'attempts' && (
        <>
          {selectedExamIdFilter && (
            <div className="card mb-4 bg-blue-50 border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-blue-800">
                    Showing attempts for: <strong>{newExams.find(e => e.id === selectedExamIdFilter)?.title ?? 'Unknown Exam'}</strong>
                  </span>
                </div>
                <button
                  onClick={() => setSelectedExamIdFilter(null)}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear Filter
                </button>
              </div>
            </div>
          )}

          {attemptsError && (
            <div className="card text-sm text-red-500 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Unable to load attempts. Please try again later.
            </div>
          )}

          {loadingAttempts ? (
            <div className="card text-sm text-gray-500">Loading attempts...</div>
          ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Exam
                    </th>
                    {isAdmin && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Candidate
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted
                    </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Certificate
                  </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {attempts.map((attempt) => (
                    <tr key={attempt.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {attempt.examTitle ?? 'Unknown Exam'}
                        </div>
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{attempt.userName ?? 'Unknown'}</div>
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {attempt.score !== undefined ? `${attempt.score}%` : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            attempt.passed
                              ? 'bg-green-100 text-green-800'
                              : attempt.passed === false
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {attempt.passed === true
                            ? 'Passed'
                            : attempt.passed === false
                            ? 'Failed'
                            : attempt.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {attempt.submittedAt
                          ? new Date(attempt.submittedAt).toLocaleDateString()
                          : 'Not submitted'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {attempt.certificate ? (
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              attempt.certificate.status === 'APPROVED'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {attempt.certificate.status === 'APPROVED' ? 'Approved' : 'Pending'}
                  </span>
                        ) : (
                          <span className="text-sm text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => navigate(`/training/exam/${attempt.examId}/result/${attempt.id}`)}
                          className="text-primary-600 hover:text-primary-800"
                        >
                          <Eye className="h-4 w-4 inline mr-1" />
                          View
                        </button>
                        {attempt.certificate && (
                          <button
                            onClick={() => openCertificatePreview(attempt.certificate ?? null)}
                            className="ml-4 text-indigo-600 hover:text-indigo-800"
                          >
                            <Eye className="h-4 w-4 inline mr-1" />
                            Certificate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>

              {attempts.length === 0 && (
                <div className="text-center py-12">
                  <div className="mx-auto h-12 w-12 text-gray-400">
                    <FileText className="h-12 w-12" />
                  </div>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No attempts found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {selectedExamIdFilter
                      ? `No attempts found for this exam.`
                      : isAdmin
                      ? 'No exam attempts have been recorded yet.'
                      : "You haven't taken any exams yet."}
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {activeTab === 'certificates' && isAdmin && (
        <>
          <div className="card mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by candidate or exam..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input-field pl-10"
                  />
                </div>
              </div>
              <div>
                <select
                  value={certificateStatusFilter}
                  onChange={(e) =>
                    setCertificateStatusFilter(e.target.value === 'all' ? 'all' : (e.target.value as CertificateStatus))
                  }
                  className="input-field"
                >
                  <option value="all">All Status</option>
                  <option value="PENDING">Pending Approval</option>
                  <option value="APPROVED">Approved</option>
                </select>
              </div>
            </div>
          </div>

          {certificatesError && (
            <div className="card text-sm text-red-500 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Unable to load certificates. Please try again later.
            </div>
          )}

          {loadingCertificates ? (
            <div className="card text-sm text-gray-500">Loading certificates...</div>
          ) : (
            <div className="card overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Candidate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Exam
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Issued
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCertificates.map((certificate) => (
                    <tr key={certificate.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{certificate.userName ?? 'Unknown'}</div>
                        <div className="text-sm text-gray-500">#{certificate.certificateNumber}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{certificate.examTitle ?? 'Exam'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {certificate.score}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            certificate.status === 'APPROVED'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {certificate.status === 'APPROVED' ? 'Approved' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(certificate.issuedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                        <button
                          onClick={() => openCertificatePreview(certificate)}
                          className="text-primary-600 hover:text-primary-800"
                        >
                          <Eye className="h-4 w-4 inline mr-1" />
                          View
                        </button>
                        {certificate.status === 'PENDING' && (
                          <button
                            onClick={() => handleApproveCertificate(certificate)}
                            className="text-green-600 hover:text-green-800"
                          >
                            <CheckCircle className="h-4 w-4 inline mr-1" />
                            Approve
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredCertificates.length === 0 && (
                <div className="text-center py-12">
                  <div className="mx-auto h-12 w-12 text-gray-400">
                    <Award className="h-12 w-12" />
                  </div>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No certificates found</h3>
                  <p className="mt-1 text-sm text-gray-500">Approved certificates will appear here.</p>
          </div>
        )}
      </div>
          )}
        </>
      )}

      <AddEditTrainingClassModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddTrainingClass}
        mode="add"
      />

      <AddEditTrainingClassModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedTrainingClass(null);
        }}
        onSave={handleEditTrainingClass}
        trainingClass={selectedTrainingClass}
        mode="edit"
      />

      <TrainingClassDetailsModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedTrainingClass(null);
        }}
        trainingClass={selectedTrainingClass}
      />

      <ExamBuilderModal
        isOpen={isExamModalOpen}
        onClose={() => setIsExamModalOpen(false)}
        onSave={handleAddExam}
        mode="add"
      />

      <ExamBuilderModal
        isOpen={isEditExamModalOpen}
        onClose={() => {
          setIsEditExamModalOpen(false);
          setSelectedExam(null);
        }}
        onSave={handleEditExam}
        exam={selectedExam}
        mode="edit"
      />

      <CertificatePreviewModal
        isOpen={isCertificateModalOpen}
        certificate={previewCertificate}
        onClose={() => {
          setIsCertificateModalOpen(false);
          setPreviewCertificate(null);
        }}
      />
    </div>
  );
}
