import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { trainingService } from '../services/training';
import { useApi, useApiMutation } from '../hooks/useApi';
import { useNotifications } from '../contexts/NotificationContext';
import type { Exam as ExamType } from '../types';

interface ExamResultState {
  score: number;
  passed: boolean;
}

export default function Exam() {
  const { id } = useParams<{ id: string }>();
  const { addNotification } = useNotifications();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [result, setResult] = useState<ExamResultState | null>(null);

  const {
    data: exam,
    loading,
    error,
    refetch,
  } = useApi<ExamType | null>(
    async () => {
      if (!id) {
        return null;
      }
      return trainingService.getExam(id);
    },
    [id]
  );

  const submitExamMutation = useApiMutation(
    async (payload: { examId: string; answers: number[] }) => {
      return trainingService.submitExam(payload.examId, {
        answers: exam?.questions.map((question, index) => ({
          questionId: question.id,
          answer: payload.answers[index],
        })) ?? [],
      });
    }
  );

  useEffect(() => {
    if (exam) {
      setAnswers(new Array(exam.questions.length).fill(-1));
      setCurrentQuestion(0);
      setShowResults(false);
      setResult(null);
    }
  }, [exam]);

  const handleAnswerSelect = (answerIndex: number) => {
    setAnswers((prev) => {
      const updated = [...prev];
      updated[currentQuestion] = answerIndex;
      return updated;
    });
  };

  const handleNext = () => {
    if (!exam) {
      return;
    }
    if (currentQuestion < exam.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const calculateScore = useMemo(() => {
    if (!exam || answers.length === 0) {
      return 0;
    }
    let correct = 0;
    exam.questions.forEach((question, index) => {
      if (answers[index] === question.correctAnswer) {
        correct++;
      }
    });
    return exam.questions.length === 0 ? 0 : Math.round((correct / exam.questions.length) * 100);
  }, [exam, answers]);

  const handleSubmit = async () => {
    if (!id || !exam) {
      return;
    }

    try {
      const submission = await submitExamMutation.mutate({ examId: id, answers });
      const computedScore = submission?.score ?? calculateScore;
      const didPass = submission?.passed ?? computedScore >= exam.passingScore;
      setResult({ score: computedScore, passed: didPass });
      setShowResults(true);
      addNotification({
        title: 'Exam submitted',
        message: 'Your responses have been recorded.',
        type: 'success',
        userId: 'system',
        priority: 'medium',
        category: 'training',
      });
    } catch (submitError: any) {
      addNotification({
        title: 'Unable to submit exam',
        message: submitError?.message ?? 'Please try again later.',
        type: 'error',
        userId: 'system',
        priority: 'high',
        category: 'system',
      });
    }
  };

  if (!id) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Exam not found</h3>
        <p className="mt-1 text-sm text-gray-500">The requested exam could not be found.</p>
        <Link to="/training" className="mt-4 btn-primary inline-block">
          Back to Training
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Loading exam...</h3>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Unable to load exam</h3>
        <p className="mt-1 text-sm text-gray-500">{error?.message ?? 'Please try again later.'}</p>
        <button onClick={refetch} className="mt-4 btn-primary">
          Retry
        </button>
      </div>
    );
  }

  const computedScore = result?.score ?? calculateScore;
  const passed = result?.passed ?? computedScore >= exam.passingScore;
  const currentQ = exam.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / exam.questions.length) * 100;

  if (showResults) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center space-x-4">
          <Link to="/training" className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Exam Results</h1>
            <p className="text-sm text-gray-600">{exam.title}</p>
          </div>
        </div>

        <div className="card text-center">
          <div className="mb-6">
            {passed ? (
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            ) : (
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            )}
            <h2 className={`text-2xl font-bold ${passed ? 'text-green-600' : 'text-red-600'}`}>
              {passed ? 'Congratulations!' : 'Try Again'}
            </h2>
            <p className="text-gray-600 mt-2">
              {passed ? 'You have passed the exam!' : 'You need to score higher to pass.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{computedScore}%</div>
              <div className="text-sm text-gray-600">Your Score</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{exam.passingScore}%</div>
              <div className="text-sm text-gray-600">Passing Score</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">
                {
                  answers.filter((answer, index) => answer === exam.questions[index].correctAnswer).length
                }
              </div>
              <div className="text-sm text-gray-600">Correct Answers</div>
            </div>
          </div>

          <div className="flex space-x-4 justify-center">
            <Link to="/training" className="btn-outline">
              Back to Training
            </Link>
            {!passed && (
              <button
                onClick={() => {
                  setShowResults(false);
                  setCurrentQuestion(0);
                  setAnswers(new Array(exam.questions.length).fill(-1));
                  setResult(null);
                }}
                className="btn-primary"
              >
                Retake Exam
              </button>
            )}
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Question Review</h3>
          <div className="space-y-6">
            {exam.questions.map((question, index) => {
              const userAnswer = answers[index];
              const isCorrect = userAnswer === question.correctAnswer;

              return (
                <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    {isCorrect ? (
                      <CheckCircle className="h-5 w-5 text-green-500 mt-1" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500 mt-1" />
                    )}
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-2">
                        Question {index + 1}: {question.question}
                      </h4>
                      <div className="space-y-2">
                        {question.options.map((option, optionIndex) => {
                          let className = 'p-2 rounded border ';
                          if (optionIndex === question.correctAnswer) {
                            className += 'bg-green-50 border-green-200 text-green-800';
                          } else if (optionIndex === userAnswer && !isCorrect) {
                            className += 'bg-red-50 border-red-200 text-red-800';
                          } else {
                            className += 'bg-gray-50 border-gray-200 text-gray-700';
                          }
                          return (
                            <div key={optionIndex} className={className}>
                              {option}
                            </div>
                          );
                        })}
                      </div>
                      {question.explanation && (
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                          <p className="text-sm text-blue-800">
                            <strong>Explanation:</strong> {question.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const timeLeft = exam.timeLimit;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/training" className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{exam.title}</h1>
            <p className="text-sm text-gray-600">
              Question {currentQuestion + 1} of {exam.questions.length}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Clock className="h-4 w-4" />
          <span>{timeLeft} minutes</span>
        </div>
      </div>

      <div className="card">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600">Progress</span>
          <span className="font-medium">{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-primary-500 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-medium text-gray-900 mb-6">{currentQ.question}</h2>
        <div className="space-y-3">
          {currentQ.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswerSelect(index)}
              className={`w-full text-left p-4 rounded-lg border-2 transition-colors duration-200 ${
                answers[currentQuestion] === index
                  ? 'border-primary-500 bg-primary-50 text-primary-900'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
          className="btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <div className="flex space-x-2">
          {currentQuestion === exam.questions.length - 1 ? (
            <button
              onClick={handleSubmit}
              className="btn-primary"
              disabled={submitExamMutation.loading}
            >
              {submitExamMutation.loading ? 'Submitting...' : 'Submit Exam'}
            </button>
          ) : (
            <button onClick={handleNext} className="btn-primary">
              Next
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Question Navigation</h3>
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
          {exam.questions.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentQuestion(index)}
              className={`p-2 text-sm rounded border ${
                index === currentQuestion
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : answers[index] !== -1
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
