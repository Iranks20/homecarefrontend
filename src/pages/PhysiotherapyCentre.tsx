import { useMemo, useState } from 'react';
import {
  Calendar,
  FileText,
  BarChart3,
  Users,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Clock,
  Target,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import {
  PhysiotherapyAssessment,
  TreatmentPlan,
  PhysiotherapySession,
} from '../types';
import AddEditAssessmentModal from '../components/AddEditAssessmentModal';
import AddEditTreatmentPlanModal from '../components/AddEditTreatmentPlanModal';
import AddEditSessionModal from '../components/AddEditSessionModal';
import AssessmentDetailsModal from '../components/AssessmentDetailsModal';
import TreatmentPlanDetailsModal from '../components/TreatmentPlanDetailsModal';
import SessionDetailsModal from '../components/SessionDetailsModal';
import { physiotherapyService } from '../services/physiotherapy';
import { useApi, useApiMutation } from '../hooks/useApi';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';

export default function PhysiotherapyCentre() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isAddAssessmentModalOpen, setIsAddAssessmentModalOpen] = useState(false);
  const [isEditAssessmentModalOpen, setIsEditAssessmentModalOpen] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<PhysiotherapyAssessment | null>(null);
  const [isAddTreatmentPlanModalOpen, setIsAddTreatmentPlanModalOpen] = useState(false);
  const [isEditTreatmentPlanModalOpen, setIsEditTreatmentPlanModalOpen] = useState(false);
  const [selectedTreatmentPlan, setSelectedTreatmentPlan] = useState<TreatmentPlan | null>(null);
  const [isViewTreatmentPlanModalOpen, setIsViewTreatmentPlanModalOpen] = useState(false);
  const [viewingTreatmentPlan, setViewingTreatmentPlan] = useState<TreatmentPlan | null>(null);
  const [isAddSessionModalOpen, setIsAddSessionModalOpen] = useState(false);
  const [isEditSessionModalOpen, setIsEditSessionModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<PhysiotherapySession | null>(null);
  const [isViewAssessmentModalOpen, setIsViewAssessmentModalOpen] = useState(false);
  const [viewingAssessment, setViewingAssessment] = useState<PhysiotherapyAssessment | null>(null);
  const [isViewSessionModalOpen, setIsViewSessionModalOpen] = useState(false);
  const [viewingSession, setViewingSession] = useState<PhysiotherapySession | null>(null);
  const { addNotification } = useNotifications();
  const { user } = useAuth();

  const {
    data: assessmentsData,
    loading: loadingAssessments,
    error: assessmentsError,
    refetch: refetchAssessments,
  } = useApi(() => physiotherapyService.getAssessments({ limit: 200 }), []);

  const {
    data: plansData,
    loading: loadingPlans,
    error: plansError,
    refetch: refetchPlans,
  } = useApi(() => physiotherapyService.getTreatmentPlans({ limit: 200 }), []);

  const {
    data: sessionsData,
    loading: loadingSessions,
    error: sessionsError,
    refetch: refetchSessions,
  } = useApi(() => physiotherapyService.getSessions({ limit: 200 }), []);

  const assessments = assessmentsData?.assessments ?? [];
  const treatmentPlans = plansData?.plans ?? [];
  const sessions = sessionsData?.sessions ?? [];

  const createAssessmentMutation = useApiMutation(physiotherapyService.createAssessment.bind(physiotherapyService));
  const updateAssessmentMutation = useApiMutation(
    (params: { id: string; data: Partial<PhysiotherapyAssessment> }) =>
      physiotherapyService.updateAssessment(params.id, params.data)
  );
  const deleteAssessmentMutation = useApiMutation(physiotherapyService.deleteAssessment.bind(physiotherapyService));

  const createPlanMutation = useApiMutation(physiotherapyService.createTreatmentPlan.bind(physiotherapyService));
  const updatePlanMutation = useApiMutation(
    (params: { id: string; data: Partial<TreatmentPlan> }) =>
      physiotherapyService.updateTreatmentPlan(params.id, params.data)
  );
  const deletePlanMutation = useApiMutation(physiotherapyService.deleteTreatmentPlan.bind(physiotherapyService));

  const createSessionMutation = useApiMutation(physiotherapyService.createSession.bind(physiotherapyService));
  const updateSessionMutation = useApiMutation(
    (params: { id: string; data: Partial<PhysiotherapySession> }) =>
      physiotherapyService.updateSession(params.id, params.data)
  );
  const deleteSessionMutation = useApiMutation(physiotherapyService.deleteSession.bind(physiotherapyService));

  const handleAddAssessment = async (assessmentData: Omit<PhysiotherapyAssessment, 'id'>) => {
    try {
      // Use physiotherapistId from form (selected by admin) or fallback to current user
      const specialistId = assessmentData.physiotherapistId || user?.id;
      
      if (!specialistId) {
        throw new Error('Specialist ID is required');
      }

      // Debug: Log the received assessment data
      console.log('handleAddAssessment - Received data:', {
        currentMedications: assessmentData.currentMedications,
        affectedArea: assessmentData.affectedArea,
        functionalLimitations: assessmentData.functionalLimitations,
        recommendations: assessmentData.recommendations,
        goals: assessmentData.goals,
        medicalHistory: assessmentData.medicalHistory,
        assessmentNotes: assessmentData.assessmentNotes,
      });

      // Helper function to check if a string has actual content
      const hasContent = (value: string | undefined | null): boolean => {
        return value !== undefined && value !== null && typeof value === 'string' && value.trim().length > 0;
      };

      // Helper function to check if array has valid items
      const hasValidArrayItems = (arr: string[] | undefined | null): boolean => {
        if (!Array.isArray(arr) || arr.length === 0) {
          return false;
        }
        return arr.some(item => item && typeof item === 'string' && item.trim().length > 0);
      };

      // Map frontend fields to backend structure
      const chiefComplaint = assessmentData.injuryType || 'Not specified';
      
      // Build history components with proper validation
      const medicalHistoryValue = hasContent(assessmentData.medicalHistory) ? assessmentData.medicalHistory!.trim() : 'None';
      const medicationsValue = hasValidArrayItems(assessmentData.currentMedications) 
        ? assessmentData.currentMedications!.filter(m => m && m.trim()).join(', ') 
        : 'None';
      const affectedAreasValue = hasValidArrayItems(assessmentData.affectedArea)
        ? assessmentData.affectedArea!.filter(a => a && a.trim()).join(', ')
        : 'None';
      const limitationsValue = hasValidArrayItems(assessmentData.functionalLimitations)
        ? assessmentData.functionalLimitations!.filter(f => f && f.trim()).join(', ')
        : 'None';
      
      const history = [
        `Medical History: ${medicalHistoryValue}`,
        `Current Medications: ${medicationsValue}`,
        `Affected Areas: ${affectedAreasValue}`,
        `Functional Limitations: ${limitationsValue}`,
      ].join('\n');
      
      const examination = [
        `Pain Scale: ${assessmentData.painScale || 0}/10`,
        `Mobility Level: ${assessmentData.mobilityLevel || 'independent'}`,
        `Assessment Notes: ${hasContent(assessmentData.assessmentNotes) ? assessmentData.assessmentNotes!.trim() : 'None'}`,
      ].join('\n');
      
      const diagnosis = assessmentData.injuryType || 'Not specified';
      const recommendations = hasValidArrayItems(assessmentData.recommendations)
        ? assessmentData.recommendations!.filter(r => r && r.trim()).join('\n')
        : 'No specific recommendations';

      // Debug: Log the final payload being sent
      console.log('handleAddAssessment - Final payload:', {
        history,
        examination,
        recommendations,
        medicationsValue,
        affectedAreasValue,
        limitationsValue,
      });

      await createAssessmentMutation.mutate({
        patientId: assessmentData.patientId,
        specialistId, // Use selected specialist (for admin) or current user (for non-admin)
        assessmentDate: assessmentData.assessmentDate,
        chiefComplaint,
        history,
        examination,
        diagnosis,
        recommendations,
        // Send each modal field separately so backend can persist them individually
        injuryType: assessmentData.injuryType,
        affectedArea: assessmentData.affectedArea,
        painScale: assessmentData.painScale,
        mobilityLevel: assessmentData.mobilityLevel,
        functionalLimitations: assessmentData.functionalLimitations,
        medicalHistory: assessmentData.medicalHistory,
        currentMedications: assessmentData.currentMedications,
        assessmentNotes: assessmentData.assessmentNotes,
        goals: hasValidArrayItems(assessmentData.goals) ? assessmentData.goals : undefined,
        nextAppointment: assessmentData.nextAppointment || undefined,
      } as any); // Type cast needed due to frontend/backend structure mismatch
      addNotification({
        title: 'Assessment added',
        message: 'A new assessment has been recorded.',
        type: 'success',
        userId: 'system',
        priority: 'medium',
        category: 'general',
      });
      setIsAddAssessmentModalOpen(false);
      await refetchAssessments();
    } catch (error: any) {
      addNotification({
        title: 'Unable to add assessment',
        message: error?.message ?? 'Please try again later.',
        type: 'error',
        userId: 'system',
        priority: 'high',
        category: 'system',
      });
      throw error;
    }
  };

  const handleEditAssessment = async (assessmentData: Omit<PhysiotherapyAssessment, 'id'>) => {
    if (!selectedAssessment) return;
    try {
      // Use physiotherapistId from form (selected by admin) or fallback to current user or existing assessment
      const specialistId = assessmentData.physiotherapistId || user?.id || selectedAssessment.physiotherapistId;
      
      if (!specialistId) {
        throw new Error('Specialist ID is required');
      }

      // Helper function to check if a string has actual content
      const hasContent = (value: string | undefined | null): boolean => {
        return value !== undefined && value !== null && typeof value === 'string' && value.trim().length > 0;
      };

      // Helper function to check if array has valid items
      const hasValidArrayItems = (arr: string[] | undefined | null): boolean => {
        return Array.isArray(arr) && arr.length > 0 && arr.some(item => item && typeof item === 'string' && item.trim().length > 0);
      };

      // Map frontend fields to backend structure
      const chiefComplaint = assessmentData.injuryType || 'Not specified';
      
      // Build history string - only use actual values, not empty strings
      const medicalHistoryValue = hasContent(assessmentData.medicalHistory) ? assessmentData.medicalHistory!.trim() : 'None';
      const medicationsValue = hasValidArrayItems(assessmentData.currentMedications) 
        ? assessmentData.currentMedications!.filter(m => m && m.trim()).join(', ') 
        : 'None';
      const affectedAreasValue = hasValidArrayItems(assessmentData.affectedArea)
        ? assessmentData.affectedArea!.filter(a => a && a.trim()).join(', ')
        : 'None';
      const limitationsValue = hasValidArrayItems(assessmentData.functionalLimitations)
        ? assessmentData.functionalLimitations!.filter(f => f && f.trim()).join(', ')
        : 'None';
      
      const history = [
        `Medical History: ${medicalHistoryValue}`,
        `Current Medications: ${medicationsValue}`,
        `Affected Areas: ${affectedAreasValue}`,
        `Functional Limitations: ${limitationsValue}`,
      ].join('\n');
      
      // Build examination string
      const assessmentNotesValue = hasContent(assessmentData.assessmentNotes) ? assessmentData.assessmentNotes!.trim() : 'None';
      const examination = [
        `Pain Scale: ${assessmentData.painScale || 0}/10`,
        `Mobility Level: ${assessmentData.mobilityLevel || 'independent'}`,
        `Assessment Notes: ${assessmentNotesValue}`,
      ].join('\n');
      
      const diagnosis = assessmentData.injuryType || 'Not specified';
      
      // Build recommendations - check if we have valid recommendations
      const recommendationsValue = hasValidArrayItems(assessmentData.recommendations)
        ? assessmentData.recommendations!.filter(r => r && r.trim()).join('\n')
        : 'No specific recommendations';

      // Debug: Log what we're sending
      console.log('Edit Assessment - Sending to API:', {
        medicalHistory: medicalHistoryValue,
        medications: medicationsValue,
        affectedAreas: affectedAreasValue,
        limitations: limitationsValue,
        assessmentNotes: assessmentNotesValue,
        recommendations: recommendationsValue,
        formDataArrays: {
          currentMedications: assessmentData.currentMedications,
          affectedArea: assessmentData.affectedArea,
          functionalLimitations: assessmentData.functionalLimitations,
          recommendations: assessmentData.recommendations,
        }
      });

      await updateAssessmentMutation.mutate({
        id: selectedAssessment.id,
        data: {
          patientId: assessmentData.patientId,
          specialistId, // Use selected specialist (for admin) or current user (for non-admin)
          assessmentDate: assessmentData.assessmentDate,
          chiefComplaint,
          history,
          examination,
          diagnosis,
          recommendations: recommendationsValue,
          // Ensure all modal fields are updated individually
          injuryType: assessmentData.injuryType,
          affectedArea: assessmentData.affectedArea,
          painScale: assessmentData.painScale,
          mobilityLevel: assessmentData.mobilityLevel,
          functionalLimitations: assessmentData.functionalLimitations,
          medicalHistory: assessmentData.medicalHistory,
          currentMedications: assessmentData.currentMedications,
          assessmentNotes: assessmentData.assessmentNotes,
          goals: hasValidArrayItems(assessmentData.goals) ? assessmentData.goals : undefined,
          nextAppointment: assessmentData.nextAppointment || undefined,
        } as any, // Type cast needed due to frontend/backend structure mismatch
      });
      addNotification({
        title: 'Assessment updated',
        message: 'Assessment details have been updated.',
        type: 'success',
        userId: 'system',
        priority: 'medium',
        category: 'general',
      });
      setIsEditAssessmentModalOpen(false);
      setSelectedAssessment(null);
      await refetchAssessments();
    } catch (error: any) {
      addNotification({
        title: 'Unable to update assessment',
        message: error?.message ?? 'Please try again later.',
        type: 'error',
        userId: 'system',
        priority: 'high',
        category: 'system',
      });
      throw error;
    }
  };

  const handleDeleteAssessment = async (assessmentId: string) => {
    if (!window.confirm('Are you sure you want to delete this assessment?')) {
      return;
    }
    try {
      await deleteAssessmentMutation.mutate(assessmentId);
      addNotification({
        title: 'Assessment removed',
        message: 'The assessment has been deleted.',
        type: 'info',
        userId: 'system',
        priority: 'medium',
        category: 'general',
      });
      await refetchAssessments();
    } catch (error: any) {
      addNotification({
        title: 'Unable to delete assessment',
        message: error?.message ?? 'Please try again later.',
        type: 'error',
        userId: 'system',
        priority: 'high',
        category: 'system',
      });
    }
  };

  const handleAddTreatmentPlan = async (
    planData: Omit<TreatmentPlan, 'id' | 'createdAt' | 'patientName' | 'physiotherapistName'> & {
      patientName?: string;
      physiotherapistName?: string;
    }
  ) => {
    try {
      const specialistId = planData.physiotherapistId || user?.id;
      
      if (!specialistId) {
        throw new Error('Specialist ID is required');
      }

      const cleanArray = <T,>(arr: T[] | undefined | null): T[] => {
        return Array.isArray(arr) ? arr : [];
      };

      const goalsAsStrings = cleanArray(planData.goals).map(goal => 
        typeof goal === 'string' ? goal : goal.description || ''
      ).filter(g => g.trim().length > 0);

      console.log('handleAddTreatmentPlan - Received planData:', {
        exercises: planData.exercises,
        modalities: planData.modalities,
        goals: planData.goals,
        exercisesLength: planData.exercises?.length,
        modalitiesLength: planData.modalities?.length,
        goalsLength: planData.goals?.length,
      });

      const exercisesArray = cleanArray(planData.exercises);
      const modalitiesArray = cleanArray(planData.modalities);

      console.log('handleAddTreatmentPlan - Cleaned arrays:', {
        exercises: exercisesArray,
        modalities: modalitiesArray,
        goals: goalsAsStrings,
        exercisesLength: exercisesArray.length,
        modalitiesLength: modalitiesArray.length,
        goalsLength: goalsAsStrings.length,
      });

      await createPlanMutation.mutate({
        assessmentId: planData.assessmentId,
        patientId: planData.patientId,
        specialistId,
        planName: planData.planName,
        startDate: planData.startDate,
        endDate: planData.endDate,
        status: planData.status,
        progressNotes: planData.progressNotes,
        frequency: planData.frequency,
        duration:
          typeof planData.duration === 'string'
            ? parseInt(planData.duration, 10)
            : planData.duration,
        exercises: exercisesArray,
        modalities: modalitiesArray,
        goals: goalsAsStrings,
      } as any);
      addNotification({
        title: 'Treatment plan created',
        message: `${planData.planName} has been created successfully.`,
        type: 'success',
        userId: 'system',
        priority: 'medium',
        category: 'general',
      });
      setIsAddTreatmentPlanModalOpen(false);
      await Promise.all([refetchPlans(), refetchAssessments()]);
    } catch (error: any) {
      addNotification({
        title: 'Unable to create plan',
        message: error?.message ?? 'Please try again later.',
        type: 'error',
        userId: 'system',
        priority: 'high',
        category: 'system',
      });
      throw error;
    }
  };

  const handleEditTreatmentPlan = async (
    planData: Omit<TreatmentPlan, 'id' | 'createdAt' | 'patientName' | 'physiotherapistName'>
  ) => {
    if (!selectedTreatmentPlan) return;
    try {
      await updatePlanMutation.mutate({
        id: selectedTreatmentPlan.id,
        data: {
          assessmentId: planData.assessmentId,
          patientId: planData.patientId,
          physiotherapistId: planData.physiotherapistId,
          planName: planData.planName,
          startDate: planData.startDate,
          endDate: planData.endDate,
          frequency: planData.frequency,
          duration: planData.duration,
          exercises: planData.exercises,
          modalities: planData.modalities,
          goals: planData.goals,
          status: planData.status,
          progressNotes: planData.progressNotes,
        },
      });
      addNotification({
        title: 'Treatment plan updated',
        message: `${planData.planName} has been updated.`,
        type: 'success',
        userId: 'system',
        priority: 'medium',
        category: 'general',
      });
      setIsEditTreatmentPlanModalOpen(false);
      setSelectedTreatmentPlan(null);
      await refetchPlans();
    } catch (error: any) {
      addNotification({
        title: 'Unable to update plan',
        message: error?.message ?? 'Please try again later.',
        type: 'error',
        userId: 'system',
        priority: 'high',
        category: 'system',
      });
      throw error;
    }
  };

  const handleDeleteTreatmentPlan = async (planId: string, planName: string) => {
    if (!window.confirm(`Delete treatment plan "${planName}"?`)) {
      return;
    }
    try {
      await deletePlanMutation.mutate(planId);
      addNotification({
        title: 'Treatment plan removed',
        message: `${planName} has been deleted.`,
        type: 'info',
        userId: 'system',
        priority: 'medium',
        category: 'general',
      });
      await refetchPlans();
    } catch (error: any) {
      addNotification({
        title: 'Unable to delete plan',
        message: error?.message ?? 'Please try again later.',
        type: 'error',
        userId: 'system',
        priority: 'high',
        category: 'system',
      });
    }
  };

  const handleAddSession = async (
    sessionData: Omit<PhysiotherapySession, 'id' | 'patientName' | 'physiotherapistName'>
  ) => {
    try {
      const specialistId = sessionData.physiotherapistId || user?.id;
      if (!specialistId) {
        throw new Error('Specialist ID is required');
      }

      await createSessionMutation.mutate({
        // Backend expects specialistId and exercises/modalities/notes fields
        treatmentPlanId: sessionData.treatmentPlanId,
        patientId: sessionData.patientId,
        specialistId,
        sessionDate: sessionData.sessionDate,
        duration: sessionData.duration,
        status: sessionData.status,
        exercises: sessionData.exercisesCompleted,
        modalities: sessionData.modalitiesUsed,
        notes: sessionData.therapistNotes,
        sessionTime: sessionData.sessionTime,
        painLevelBefore: sessionData.painLevelBefore,
        painLevelAfter: sessionData.painLevelAfter,
        functionalImprovement: sessionData.functionalImprovement,
        patientFeedback: sessionData.patientFeedback,
        nextSessionDate: sessionData.nextSessionDate,
      } as any);
      addNotification({
        title: 'Session scheduled',
        message: 'A new session has been added to the calendar.',
        type: 'success',
        userId: 'system',
        priority: 'medium',
        category: 'general',
      });
      setIsAddSessionModalOpen(false);
      await refetchSessions();
    } catch (error: any) {
      addNotification({
        title: 'Unable to schedule session',
        message: error?.message ?? 'Please try again later.',
        type: 'error',
        userId: 'system',
        priority: 'high',
        category: 'system',
      });
      throw error;
    }
  };

  const handleEditSession = async (
    sessionData: Omit<PhysiotherapySession, 'id' | 'patientName' | 'physiotherapistName'>
  ) => {
    if (!selectedSession) return;
    try {
      const specialistId = sessionData.physiotherapistId || user?.id || selectedSession.physiotherapistId;
      if (!specialistId) {
        throw new Error('Specialist ID is required');
      }

      await updateSessionMutation.mutate({
        id: selectedSession.id,
        data: {
          treatmentPlanId: sessionData.treatmentPlanId,
          patientId: sessionData.patientId,
          specialistId,
          sessionDate: sessionData.sessionDate,
          duration: sessionData.duration,
          status: sessionData.status,
          exercises: sessionData.exercisesCompleted,
          modalities: sessionData.modalitiesUsed,
          notes: sessionData.therapistNotes,
          sessionTime: sessionData.sessionTime,
          painLevelBefore: sessionData.painLevelBefore,
          painLevelAfter: sessionData.painLevelAfter,
          functionalImprovement: sessionData.functionalImprovement,
          patientFeedback: sessionData.patientFeedback,
          nextSessionDate: sessionData.nextSessionDate,
        } as any,
      });
      addNotification({
        title: 'Session updated',
        message: 'Session details have been updated.',
        type: 'success',
        userId: 'system',
        priority: 'medium',
        category: 'general',
      });
      setIsEditSessionModalOpen(false);
      setSelectedSession(null);
      await refetchSessions();
    } catch (error: any) {
      addNotification({
        title: 'Unable to update session',
        message: error?.message ?? 'Please try again later.',
        type: 'error',
        userId: 'system',
        priority: 'high',
        category: 'system',
      });
      throw error;
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!window.confirm('Are you sure you want to delete this session?')) {
      return;
    }
    try {
      await deleteSessionMutation.mutate(sessionId);
      addNotification({
        title: 'Session removed',
        message: 'The session has been deleted.',
        type: 'info',
        userId: 'system',
        priority: 'medium',
        category: 'general',
      });
      await refetchSessions();
    } catch (error: any) {
      addNotification({
        title: 'Unable to delete session',
        message: error?.message ?? 'Please try again later.',
        type: 'error',
        userId: 'system',
        priority: 'high',
        category: 'system',
      });
    }
  };

  const openEditAssessmentModal = (assessment: PhysiotherapyAssessment) => {
    setSelectedAssessment(assessment);
    setIsEditAssessmentModalOpen(true);
  };

  const openEditTreatmentPlanModal = (plan: TreatmentPlan) => {
    setSelectedTreatmentPlan(plan);
    setIsEditTreatmentPlanModalOpen(true);
  };

  const openEditSessionModal = (session: PhysiotherapySession) => {
    setSelectedSession(session);
    setIsEditSessionModalOpen(true);
  };

  const filteredAssessments = useMemo(
    () =>
      assessments.filter((assessment) => {
        const matchesSearch =
          (assessment.patientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (assessment.physiotherapistName || '').toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
      }),
    [assessments, searchTerm]
  );

  const filteredTreatmentPlans = useMemo(
    () =>
      treatmentPlans.filter((plan) => {
        const matchesSearch =
          (plan.patientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (plan.physiotherapistName || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || plan.status === filterStatus;
        return matchesSearch && matchesStatus;
      }),
    [treatmentPlans, searchTerm, filterStatus]
  );

  const filteredSessions = useMemo(
    () =>
      sessions.filter((session) => {
        const matchesSearch =
          (session.patientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (session.physiotherapistName || '').toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
      }),
    [sessions, searchTerm]
  );

  const getRecentSessions = useMemo(() => {
    const today = new Date();
    return sessions
      .filter((session) => new Date(session.sessionDate) <= today)
      .slice()
      .sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime())
      .slice(0, 5);
  }, [sessions]);

  const getUpcomingSessions = useMemo(() => {
    const today = new Date();
    return sessions
      .filter((session) => new Date(session.sessionDate) > today)
      .sort((a, b) => new Date(a.sessionDate).getTime() - new Date(b.sessionDate).getTime())
      .slice(0, 5);
  }, [sessions]);

  const activePatients = treatmentPlans.filter((plan) => plan.status === 'active').length;

  const sessionsToday = useMemo(() => {
    const today = new Date();
    return sessions.filter((session) => {
      const sessionDate = new Date(session.sessionDate);
      return sessionDate.toDateString() === today.toDateString();
    }).length;
  }, [sessions]);

  const goalsAchieved = useMemo(() => {
    return treatmentPlans
      .flatMap((plan) => plan.goals)
      .filter(
        (goal: any) => goal && typeof goal === 'object' && goal.status === 'achieved'
      ).length;
  }, [treatmentPlans]);

  const averageProgress = useMemo(() => {
    const allGoals = treatmentPlans
      .flatMap((plan) => plan.goals)
      .filter(
        (goal: any) =>
          goal &&
          typeof goal === 'object' &&
          typeof goal.progress === 'number' &&
          !Number.isNaN(goal.progress)
      );

    if (allGoals.length === 0) {
      return 0;
    }

    const total = allGoals.reduce((acc: number, goal: any) => acc + goal.progress, 0);
    return total / allGoals.length;
  }, [treatmentPlans]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return CheckCircle;
      case 'completed':
        return CheckCircle;
      case 'paused':
        return AlertCircle;
      case 'cancelled':
        return XCircle;
      default:
        return Clock;
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-primary-100 rounded-lg">
              <Users className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Patients</p>
              <p className="text-2xl font-bold text-gray-900">{activePatients}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-secondary-100 rounded-lg">
              <Calendar className="h-6 w-6 text-secondary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Sessions Today</p>
              <p className="text-2xl font-bold text-gray-900">{sessionsToday}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <Target className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Goals Achieved</p>
              <p className="text-2xl font-bold text-gray-900">{goalsAchieved}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg. Progress</p>
              <p className="text-2xl font-bold text-gray-900">{Math.round(averageProgress)}%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Sessions</h3>
            <span className="text-sm text-primary-600">Latest updates</span>
          </div>
          <div className="space-y-3">
            {getRecentSessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{session.patientName}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(session.sessionDate).toLocaleDateString()} at {session.sessionTime}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    Pain: {session.painLevelBefore} → {session.painLevelAfter}
                  </p>
                  <p className="text-xs text-gray-600">{session.duration} min</p>
                </div>
              </div>
            ))}
            {getRecentSessions.length === 0 && (
              <p className="text-sm text-gray-500">No recent sessions recorded.</p>
            )}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Upcoming Sessions</h3>
            <span className="text-sm text-primary-600">Next appointments</span>
          </div>
          <div className="space-y-3">
            {getUpcomingSessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{session.patientName}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(session.sessionDate).toLocaleDateString()} at {session.sessionTime}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{session.physiotherapistName}</p>
                  <p className="text-xs text-gray-600">{session.duration} min</p>
                </div>
              </div>
            ))}
            {getUpcomingSessions.length === 0 && (
              <p className="text-sm text-gray-500">No upcoming sessions scheduled.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderAssessments = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Patient Assessments</h2>
        <button onClick={() => setIsAddAssessmentModalOpen(true)} className="btn-primary flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          New Assessment
        </button>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search assessments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 input-field"
            />
          </div>
        </div>
        <button className="btn-outline flex items-center" disabled>
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </button>
      </div>

      {(loadingAssessments && (
        <div className="card text-sm text-gray-500">Loading assessments...</div>
      )) ||
        (assessmentsError && (
          <div className="card text-sm text-red-500 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" /> Unable to load assessments.
          </div>
        ))}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Patient
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Specialist
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Injury Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pain Scale
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mobility
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAssessments.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                  No assessments found
                </td>
              </tr>
            ) : (
              filteredAssessments.map((assessment) => (
                <tr key={assessment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{assessment.patientName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{assessment.physiotherapistName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(assessment.assessmentDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {assessment.injuryType}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                      {assessment.painScale}/10
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 capitalize">{assessment.mobilityLevel}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => {
                          setViewingAssessment(assessment);
                          setIsViewAssessmentModalOpen(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 p-1"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openEditAssessmentModal(assessment)}
                        className="text-gray-600 hover:text-gray-900 p-1"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteAssessment(assessment.id)}
                        className="text-red-600 hover:text-red-900 p-1"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loadingAssessments && !assessmentsError && filteredAssessments.length === 0 && (
        <p className="text-sm text-gray-500">No assessments match your search.</p>
      )}
    </div>
  );

  const renderTreatmentPlans = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Treatment Plans</h2>
        <button onClick={() => setIsAddTreatmentPlanModalOpen(true)} className="btn-primary flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          New Treatment Plan
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="sm:col-span-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search treatment plans..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 input-field"
            />
          </div>
        </div>
        <div>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input-field">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="paused">Paused</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div>
          <button className="btn-outline w-full" disabled>
            <Filter className="h-4 w-4 mr-2 inline" />
            Advanced Filters
          </button>
        </div>
      </div>

      {(loadingPlans && <div className="card text-sm text-gray-500">Loading treatment plans...</div>) ||
        (plansError && (
          <div className="card text-sm text-red-500 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" /> Unable to load treatment plans.
          </div>
        ))}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Patient
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Plan
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Specialist
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Schedule
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredTreatmentPlans.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                  No treatment plans found
                </td>
              </tr>
            ) : (
              filteredTreatmentPlans.map((plan) => {
                const StatusIcon = getStatusIcon(plan.status);
                return (
                  <tr key={plan.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{plan.patientName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{plan.planName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{plan.physiotherapistName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {plan.frequency} • {plan.duration} weeks
                      </div>
                      <div className="text-xs text-gray-500">
                        {plan.startDate && `Start: ${new Date(plan.startDate).toLocaleDateString()}`}
                        {plan.endDate &&
                          ` • End: ${new Date(plan.endDate).toLocaleDateString()}`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`status-badge ${getStatusColor(plan.status)}`}>{plan.status}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => {
                            setViewingTreatmentPlan(plan);
                            setIsViewTreatmentPlanModalOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openEditTreatmentPlanModal(plan)}
                          className="text-gray-600 hover:text-gray-900 p-1"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTreatmentPlan(plan.id, plan.planName)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {!loadingPlans && !plansError && filteredTreatmentPlans.length === 0 && (
        <p className="text-sm text-gray-500">No treatment plans match your search.</p>
      )}
    </div>
  );

  const renderSessions = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Therapy Sessions</h2>
        <button onClick={() => setIsAddSessionModalOpen(true)} className="btn-primary flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Schedule Session
        </button>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search sessions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 input-field"
            />
          </div>
        </div>
        <button className="btn-outline flex items-center" disabled>
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </button>
      </div>

      {(loadingSessions && <div className="card text-sm text-gray-500">Loading sessions...</div>) ||
        (sessionsError && (
          <div className="card text-sm text-red-500 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" /> Unable to load sessions.
          </div>
        ))}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Patient
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Specialist
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date / Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pain
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Duration
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredSessions.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                  No sessions match your search.
                </td>
              </tr>
            ) : (
              filteredSessions.map((session) => (
                <tr key={session.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{session.patientName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{session.physiotherapistName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(session.sessionDate).toLocaleDateString()} at {session.sessionTime}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {session.painLevelBefore} → {session.painLevelAfter}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{session.duration} minutes</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`status-badge ${getStatusColor(session.status)}`}>
                      {session.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => {
                          setViewingSession(session);
                          setIsViewSessionModalOpen(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 p-1"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openEditSessionModal(session)}
                        className="text-gray-600 hover:text-gray-900 p-1"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSession(session.id)}
                        className="text-red-600 hover:text-red-900 p-1"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Physiotherapy Centre</h1>
          <p className="mt-1 text-sm text-gray-600">Manage assessments, treatment plans, and therapy sessions</p>
        </div>
        <div className="flex space-x-2">
          <button className="btn-outline" disabled>
            <BarChart3 className="h-4 w-4 mr-2 inline" />
            Reports
          </button>
          <button className="btn-outline" disabled>
            <FileText className="h-4 w-4 mr-2 inline" />
            Export
          </button>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'assessments', label: 'Assessments' },
            { key: 'plans', label: 'Treatment Plans' },
            { key: 'sessions', label: 'Sessions' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'assessments' && renderAssessments()}
      {activeTab === 'plans' && renderTreatmentPlans()}
      {activeTab === 'sessions' && renderSessions()}

      <AddEditAssessmentModal
        isOpen={isAddAssessmentModalOpen}
        onClose={() => setIsAddAssessmentModalOpen(false)}
        onSave={handleAddAssessment}
        mode="add"
      />

      <AddEditAssessmentModal
        isOpen={isEditAssessmentModalOpen}
        onClose={() => {
          setIsEditAssessmentModalOpen(false);
          setSelectedAssessment(null);
        }}
        onSave={handleEditAssessment}
        assessment={selectedAssessment}
        mode="edit"
      />

      <AddEditTreatmentPlanModal
        isOpen={isAddTreatmentPlanModalOpen}
        onClose={() => setIsAddTreatmentPlanModalOpen(false)}
        onSave={handleAddTreatmentPlan}
        mode="add"
        assessments={assessments}
      />

      <AddEditTreatmentPlanModal
        isOpen={isEditTreatmentPlanModalOpen}
        onClose={() => {
          setIsEditTreatmentPlanModalOpen(false);
          setSelectedTreatmentPlan(null);
        }}
        onSave={handleEditTreatmentPlan}
        plan={selectedTreatmentPlan}
        mode="edit"
        assessments={assessments}
      />

      <TreatmentPlanDetailsModal
        isOpen={isViewTreatmentPlanModalOpen}
        onClose={() => {
          setIsViewTreatmentPlanModalOpen(false);
          setViewingTreatmentPlan(null);
        }}
        plan={viewingTreatmentPlan}
      />

      <AddEditSessionModal
        isOpen={isAddSessionModalOpen}
        onClose={() => setIsAddSessionModalOpen(false)}
        onSave={handleAddSession}
        mode="add"
        treatmentPlans={treatmentPlans}
      />

      <AddEditSessionModal
        isOpen={isEditSessionModalOpen}
        onClose={() => {
          setIsEditSessionModalOpen(false);
          setSelectedSession(null);
        }}
        onSave={handleEditSession}
        session={selectedSession}
        mode="edit"
        treatmentPlans={treatmentPlans}
      />

      <AssessmentDetailsModal
        isOpen={isViewAssessmentModalOpen}
        onClose={() => {
          setIsViewAssessmentModalOpen(false);
          setViewingAssessment(null);
        }}
        assessment={viewingAssessment}
      />

      <SessionDetailsModal
        isOpen={isViewSessionModalOpen}
        onClose={() => {
          setIsViewSessionModalOpen(false);
          setViewingSession(null);
        }}
        session={viewingSession}
      />
    </div>
  );
}
