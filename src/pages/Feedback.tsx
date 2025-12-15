import { useMemo, useState } from 'react';
import { Star, MessageSquare, Send, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useApi, useApiMutation } from '../hooks/useApi';
import { appointmentService } from '../services/appointments';
import { feedbackService, type SubmitFeedbackData } from '../services/feedback';
import { useNotifications } from '../contexts/NotificationContext';
import type { Appointment, Feedback as FeedbackType } from '../types';

export default function Feedback() {
  const [activeTab, setActiveTab] = useState<'give' | 'history'>('give');
  const [selectedAppointment, setSelectedAppointment] = useState<string>('');
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [categoryRatings, setCategoryRatings] = useState({
    professionalism: 0,
    punctuality: 0,
    communication: 0,
    careQuality: 0,
  });
  const [submitted, setSubmitted] = useState(false);
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  const {
    data: appointmentsData,
    loading: loadingAppointments,
    error: appointmentsError,
  } = useApi<{ appointments: Appointment[] } | null>(
    () => (user?.id ? appointmentService.getPatientAppointments(user.id, { limit: 100 }) : Promise.resolve({ appointments: [] })),
    [user?.id]
  );

  const {
    data: feedbackData,
    loading: loadingFeedback,
    error: feedbackError,
    refetch: refetchFeedback,
  } = useApi<FeedbackType[] | null>(
    () => (user?.id ? feedbackService.getPatientFeedbacks(user.id) : Promise.resolve([])),
    [user?.id]
  );

  const submitFeedbackMutation = useApiMutation(feedbackService.submitFeedback.bind(feedbackService));

  const appointments = appointmentsData?.appointments ?? [];

  const completedAppointments = useMemo(
    () => appointments.filter((appointment) => appointment.status === 'completed'),
    [appointments]
  );

  const patientFeedbacks = (feedbackData ?? []).slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleRatingChange = (newRating: number) => {
    setRating(newRating);
  };

  const handleCategoryRatingChange = (category: keyof typeof categoryRatings, newRating: number) => {
    setCategoryRatings((prev) => ({
      ...prev,
      [category]: newRating,
    }));
  };

  const getSelectedAppointmentDetails = () => completedAppointments.find((app) => app.id === selectedAppointment);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const renderStars = (
    currentRating: number,
    onRatingChange?: (rating: number) => void
  ) => (
    <div className="flex space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onRatingChange?.(star)}
          className={`transition-colors duration-200 ${
            star <= currentRating ? 'text-yellow-400' : 'text-gray-300'
          } ${onRatingChange ? 'hover:text-yellow-400' : ''}`}
          disabled={!onRatingChange}
        >
          <Star className="h-6 w-6 fill-current" />
        </button>
      ))}
    </div>
  );

  const handleSubmit = async () => {
    if (!user || !selectedAppointment) {
      return;
    }

    const appointment = getSelectedAppointmentDetails();
    if (!appointment) {
      return;
    }

    const payload: SubmitFeedbackData = {
      appointmentId: appointment.id,
      patientId: user.id,
      patientName: user.name,
      serviceId: appointment.serviceId,
      serviceName: appointment.serviceName,
      specialistId: appointment.specialistId,
      specialistName: appointment.specialistName,
      rating,
      comment,
      categories: categoryRatings,
    };

    try {
      await submitFeedbackMutation.mutate(payload);
      addNotification({
        title: 'Feedback submitted',
        message: 'Thank you for sharing your experience.',
        type: 'success',
        userId: user.id,
        priority: 'medium',
        category: 'feedback',
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setSelectedAppointment('');
        setRating(0);
        setComment('');
        setCategoryRatings({ professionalism: 0, punctuality: 0, communication: 0, careQuality: 0 });
      }, 3000);
      await refetchFeedback();
    } catch (error: any) {
      addNotification({
        title: 'Feedback not submitted',
        message: error?.message ?? 'Please try again later.',
        type: 'error',
        userId: user.id,
        priority: 'high',
        category: 'system',
      });
    }
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center py-12">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Please sign in</h2>
          <p className="text-gray-600 mt-2">You need to be signed in as a patient to submit feedback.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Thank You!</h2>
          <p className="text-gray-600 mb-6">
            Your feedback has been submitted successfully. We appreciate your input and will use it to improve our services.
          </p>
          <button onClick={() => setSubmitted(false)} className="btn-primary">
            Submit Another Review
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Feedback & Ratings</h1>
        <p className="text-gray-600">Share your experience and help us improve our services</p>
      </div>

      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('give')}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'give'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Give Feedback
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'history'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Star className="h-4 w-4 mr-2" />
              My Reviews ({patientFeedbacks.length})
            </button>
          </nav>
        </div>
      </div>

      {activeTab === 'give' && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Rate Your Experience</h2>

          {appointmentsError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700 mb-4">
              Unable to load appointments. Please try again later.
            </div>
          )}

          {loadingAppointments ? (
            <div className="text-sm text-gray-500">Loading completed appointments...</div>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Appointment to Review
                </label>
                <select
                  value={selectedAppointment}
                  onChange={(e) => setSelectedAppointment(e.target.value)}
                  className="input-field"
                >
                  <option value="">Choose an appointment...</option>
                  {completedAppointments.map((appointment) => (
                    <option key={appointment.id} value={appointment.id}>
                      {appointment.serviceName} - {formatDate(appointment.date)}
                    </option>
                  ))}
                </select>
              </div>

              {selectedAppointment && (
                <>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">Appointment Details</h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>
                        <strong>Service:</strong> {getSelectedAppointmentDetails()?.serviceName}
                      </p>
                      <p>
                        <strong>Date:</strong> {formatDate(getSelectedAppointmentDetails()?.date || '')}
                      </p>
                      <p>
                        <strong>Specialist:</strong> {getSelectedAppointmentDetails()?.specialistName ?? '—'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Overall Rating</label>
                    <div className="flex items-center space-x-4">
                      {renderStars(rating, handleRatingChange)}
                      <span className="text-sm text-gray-600">
                        {rating > 0 && (
                          rating === 1
                            ? 'Poor'
                            : rating === 2
                            ? 'Fair'
                            : rating === 3
                            ? 'Good'
                            : rating === 4
                            ? 'Very Good'
                            : 'Excellent'
                        )}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-4">
                      Rate Specific Aspects
                    </label>
                    <div className="space-y-4">
                      {[
                        { key: 'professionalism', label: 'Professionalism' },
                        { key: 'punctuality', label: 'Punctuality' },
                        { key: 'communication', label: 'Communication' },
                        { key: 'careQuality', label: 'Quality of Care' },
                      ].map((category) => (
                        <div key={category.key} className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">{category.label}</span>
                          {renderStars(
                            categoryRatings[category.key as keyof typeof categoryRatings],
                            (newRating) => handleCategoryRatingChange(category.key as keyof typeof categoryRatings, newRating)
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Comments (Optional)
                    </label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Tell us about your experience..."
                      className="input-field h-32 resize-none"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleSubmit}
                      disabled={submitFeedbackMutation.loading || rating === 0}
                      className="btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitFeedbackMutation.loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Submit Feedback
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}

              {!selectedAppointment && (
                <p className="text-sm text-gray-500">
                  Select a completed appointment to begin your review.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">My Reviews</h2>

          {feedbackError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700 mb-4">
              Unable to load feedback history.
            </div>
          )}

          {loadingFeedback ? (
            <div className="text-sm text-gray-500">Loading your reviews...</div>
          ) : patientFeedbacks.length === 0 ? (
            <div className="text-center py-12">
              <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
              <p className="text-gray-600">You haven't submitted any feedback yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {patientFeedbacks.map((feedback) => (
                <div key={feedback.id} className="card">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-medium text-gray-900">{feedback.serviceName}</h3>
                      <p className="text-sm text-gray-600">
                        with {feedback.specialistName ?? '—'} • {formatDate(feedback.date)}
                      </p>
                    </div>
                    <div className="flex items-center">
                      {renderStars(feedback.rating)}
                    </div>
                  </div>

                  {feedback.comment && <p className="text-gray-700 mb-4">{feedback.comment}</p>}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-xs text-gray-500 mb-1">Professionalism</p>
                      <div className="flex justify-center">
                        {renderStars(feedback.categories.professionalism)}
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500 mb-1">Punctuality</p>
                      <div className="flex justify-center">
                        {renderStars(feedback.categories.punctuality)}
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500 mb-1">Communication</p>
                      <div className="flex justify-center">
                        {renderStars(feedback.categories.communication)}
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500 mb-1">Quality of Care</p>
                      <div className="flex justify-center">
                        {renderStars(feedback.categories.careQuality)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

