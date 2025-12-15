import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { examService, Exam, ExamAttempt, ExamQuestion } from '../services/exam';
import { useApi, useApiMutation } from '../hooks/useApi';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';

export default function ExamTaking() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const { user } = useAuth();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, number>>(new Map());
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [attempt, setAttempt] = useState<ExamAttempt | null>(null);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [viewMode, setViewMode] = useState<'single' | 'list'>('single');

  const {
    data: exam,
    loading: loadingExam,
    error: examError,
  } = useApi<Exam | null>(
    async () => {
      if (!id) return null;
      return examService.getExam(id);
    },
    [id]
  );

  const startAttemptMutation = useApiMutation(async (examId: string) => {
    return examService.startAttempt(examId);
  });

  const submitAttemptMutation = useApiMutation(
    async (params: { attemptId: string; answers: { questionId: string; selectedAnswer: number }[] }) => {
      return examService.submitAttempt(params.attemptId, params.answers);
    }
  );

  useEffect(() => {
    if (!exam || !id || attempt) return;

    const startExam = async () => {
      try {
        const newAttempt = await startAttemptMutation.mutate(id);
        setAttempt(newAttempt);
        setTimeRemaining(exam.duration * 60);
      } catch (error: any) {
        addNotification({
          title: 'Unable to start exam',
          message: error?.message ?? 'Please try again later.',
          type: 'error',
          userId: 'system',
          priority: 'high',
          category: 'system',
        });
      }
    };

    startExam();
  }, [exam, id, attempt]);

  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0 || !attempt || !exam) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          handleAutoSubmitRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, attempt, exam]);

  const handleAnswerSelect = (questionId: string, answerIndex: number) => {
    setAnswers((prev) => {
      const newMap = new Map(prev);
      newMap.set(questionId, answerIndex);
      return newMap;
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleAutoSubmit = async () => {
    if (!attempt || !exam) return;

    const answerArray = Array.from(answers.entries()).map(([questionId, selectedAnswer]) => ({
      questionId,
      selectedAnswer,
    }));

    try {
      const result = await submitAttemptMutation.mutate({
        attemptId: attempt.id,
        answers: answerArray,
      });
      navigate(`/training/exam/${exam.id}/result/${result.id}`);
    } catch (error: any) {
      addNotification({
        title: 'Unable to submit exam',
        message: error?.message ?? 'Please try again later.',
        type: 'error',
        userId: 'system',
        priority: 'high',
        category: 'system',
      });
    }
  };

  const handleAutoSubmitRef = React.useRef(handleAutoSubmit);
  handleAutoSubmitRef.current = handleAutoSubmit;

  const handleSubmit = async () => {
    if (!attempt || totalQuestions === 0) return;

    const unanswered = orderedQuestions.filter((question) => question.id && !answers.has(question.id));
    if (unanswered.length > 0) {
      setShowConfirmSubmit(true);
      return;
    }

    await handleAutoSubmit();
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

const orderedQuestions = useMemo(() => {
  if (!exam?.questions) {
    return [] as ExamQuestion[];
  }

  if (attempt?.questionOrder && attempt.questionOrder.length > 0) {
    const questionMap = new Map<string, ExamQuestion>(
      exam.questions.map((question) => [question.id!, question])
    );
    const ordered = attempt.questionOrder
      .map((questionId) => questionMap.get(questionId))
      .filter((question): question is ExamQuestion => Boolean(question));

    if (ordered.length > 0) {
      return ordered;
    }
  }

  return exam.questions;
}, [exam, attempt]);

const totalQuestions = orderedQuestions.length;

const progress = useMemo(() => {
  if (totalQuestions === 0) return 0;
  return Math.round((answers.size / totalQuestions) * 100);
}, [answers.size, totalQuestions]);

  if (!id) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Exam not found</h3>
        <p className="mt-1 text-sm text-gray-500">The requested exam could not be found.</p>
        <button onClick={() => navigate('/training')} className="mt-4 btn-primary">
          Back to Training
        </button>
      </div>
    );
  }

  if (loadingExam || startAttemptMutation.loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Loading exam...</h3>
      </div>
    );
  }

  if (examError || !exam) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Unable to load exam</h3>
        <p className="mt-1 text-sm text-gray-500">
          {examError?.message ?? 'Please try again later.'}
        </p>
        <button onClick={() => navigate('/training')} className="mt-4 btn-primary">
          Back to Training
        </button>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Starting exam...</h3>
      </div>
    );
  }

  if (totalQuestions === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Exam has no questions</h3>
        <p className="mt-1 text-sm text-gray-500">Please contact the administrator.</p>
        <button onClick={() => navigate('/training')} className="mt-4 btn-primary">
          Back to Training
        </button>
      </div>
    );
  }

  const currentQuestion = orderedQuestions[currentQuestionIndex];
  const unansweredCount = totalQuestions - answers.size;

  const renderQuestionCard = (question: ExamQuestion, index: number, compact = false) => {
    const questionId = question.id!;
    return (
      <div>
        <p className={`${compact ? 'text-base' : 'text-lg'} font-medium text-gray-900 mb-3`}>
          {index + 1}. {question.question}
        </p>
        <div className="space-y-3">
          {question.options.map((option, optionIndex) => {
            const isSelected = answers.get(questionId) === optionIndex;
            return (
              <label
                key={optionIndex}
                className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  isSelected ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name={`question-${questionId}`}
                  checked={isSelected}
                  onChange={() => handleAnswerSelect(questionId, optionIndex)}
                  className="h-4 w-4 text-primary-600 mr-3"
                />
                <span className="flex-1">{option}</span>
              </label>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="card mb-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{exam.title}</h1>
            {exam.description && (
              <p className="text-sm text-gray-600 mt-1">{exam.description}</p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setViewMode((prev) => (prev === 'single' ? 'list' : 'single'))}
              className="btn-outline"
            >
              {viewMode === 'single' ? 'View All Questions' : 'View One Question'}
            </button>
            <div className="text-right">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <Clock className="h-5 w-5" />
                {timeRemaining !== null ? formatTime(timeRemaining) : '--:--'}
              </div>
              <div className="text-xs text-gray-500 mt-1">Time Remaining</div>
            </div>
          </div>
        </div>

        <div className="mb-2">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-600">Progress</span>
            <span className="text-gray-600">
              {answers.size} / {totalQuestions} answered
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-500 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {viewMode === 'single' ? (
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </h2>
            {unansweredCount > 0 && (
              <div className="flex items-center gap-2 text-sm text-amber-600">
                <AlertTriangle className="h-4 w-4" />
                {unansweredCount} unanswered
              </div>
            )}
          </div>

          {renderQuestionCard(currentQuestion, currentQuestionIndex)}

          <div className="flex items-center justify-between pt-4 border-t">
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className="btn-outline disabled:opacity-50"
            >
              Previous
            </button>
            <div className="flex gap-2 flex-wrap">
              {orderedQuestions.map((question, index) => (
                <button
                  key={question.id}
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`w-8 h-8 rounded text-sm ${
                    index === currentQuestionIndex
                      ? 'bg-primary-500 text-white'
                      : question.id && answers.has(question.id)
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
            {currentQuestionIndex < totalQuestions - 1 ? (
              <button onClick={handleNext} className="btn-primary">
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitAttemptMutation.loading}
                className="btn-primary"
              >
                {submitAttemptMutation.loading ? 'Submitting...' : 'Submit Exam'}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">All Questions</h2>
            {unansweredCount > 0 && (
              <div className="flex items-center gap-2 text-sm text-amber-600">
                <AlertTriangle className="h-4 w-4" />
                {unansweredCount} unanswered
              </div>
            )}
          </div>
          <div className="space-y-6">
            {orderedQuestions.map((question, index) => (
              <div key={question.id} className="border-b pb-6 last:border-b-0 last:pb-0">
                {renderQuestionCard(question, index, true)}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-end gap-3 pt-6 border-t mt-6">
            <button onClick={() => setViewMode('single')} className="btn-outline">
              Focus on One Question
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitAttemptMutation.loading}
              className="btn-primary"
            >
              {submitAttemptMutation.loading ? 'Submitting...' : 'Submit Exam'}
            </button>
          </div>
        </div>
      )}

      {showConfirmSubmit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Submission</h3>
            <p className="text-gray-600 mb-4">
              You have {unansweredCount} unanswered question(s). Are you sure you want to submit
              the exam?
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowConfirmSubmit(false)}
                className="btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setShowConfirmSubmit(false);
                  await handleAutoSubmit();
                }}
                className="btn-primary"
              >
                Submit Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

