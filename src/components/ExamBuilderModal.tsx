import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { Exam, ExamQuestion, CreateExamData } from '../services/exam';

interface ExamBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (exam: CreateExamData) => Promise<void>;
  exam?: Exam | null;
  mode: 'add' | 'edit';
}

export default function ExamBuilderModal({
  isOpen,
  onClose,
  onSave,
  exam,
  mode,
}: ExamBuilderModalProps) {
  const [formData, setFormData] = useState<CreateExamData>({
    title: '',
    description: '',
    duration: 60,
    passingScore: 70,
    maxAttempts: 3,
    status: 'DRAFT',
    questions: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setError(null);
    setIsSubmitting(false);
    setEditingQuestionIndex(null);

    if (exam && mode === 'edit') {
      setFormData({
        title: exam.title,
        description: exam.description ?? '',
        duration: exam.duration,
        passingScore: exam.passingScore,
        maxAttempts: exam.maxAttempts,
        status: exam.status,
        questions: exam.questions ?? [],
      });
    } else {
      setFormData({
        title: '',
        description: '',
        duration: 60,
        passingScore: 70,
        maxAttempts: 3,
        status: 'DRAFT',
        questions: [],
      });
    }
  }, [exam, mode, isOpen]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (['duration', 'passingScore', 'maxAttempts'].includes(name)) {
      setFormData((prev) => ({ ...prev, [name]: Number(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const addQuestion = () => {
    const newQuestion: ExamQuestion = {
      question: '',
      type: 'MULTIPLE_CHOICE',
      options: ['', '', '', ''],
      correctAnswer: 0,
      points: 1,
      explanation: '',
    };
    setFormData((prev) => ({
      ...prev,
      questions: [...prev.questions, newQuestion],
    }));
    setEditingQuestionIndex(formData.questions.length);
  };

  const updateQuestion = (index: number, updates: Partial<ExamQuestion>) => {
    setFormData((prev) => {
      const newQuestions = [...prev.questions];
      newQuestions[index] = { ...newQuestions[index], ...updates };
      return { ...prev, questions: newQuestions };
    });
  };

  const deleteQuestion = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
    if (editingQuestionIndex === index) {
      setEditingQuestionIndex(null);
    } else if (editingQuestionIndex !== null && editingQuestionIndex > index) {
      setEditingQuestionIndex(editingQuestionIndex - 1);
    }
  };

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === formData.questions.length - 1)
    ) {
      return;
    }

    setFormData((prev) => {
      const newQuestions = [...prev.questions];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      [newQuestions[index], newQuestions[targetIndex]] = [
        newQuestions[targetIndex],
        newQuestions[index],
      ];
      return { ...prev, questions: newQuestions };
    });
  };

  const addOption = (questionIndex: number) => {
    updateQuestion(questionIndex, {
      options: [...formData.questions[questionIndex].options, ''],
    });
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const question = formData.questions[questionIndex];
    const newOptions = [...question.options];
    newOptions[optionIndex] = value;
    updateQuestion(questionIndex, { options: newOptions });
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const question = formData.questions[questionIndex];
    if (question.options.length <= 2) {
      return;
    }
    const newOptions = question.options.filter((_, i) => i !== optionIndex);
    updateQuestion(questionIndex, {
      options: newOptions,
      correctAnswer:
        question.correctAnswer >= optionIndex
          ? Math.max(0, question.correctAnswer - 1)
          : question.correctAnswer,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!formData.title.trim()) {
      setError('Exam title is required');
      setIsSubmitting(false);
      return;
    }

    if (formData.questions.length === 0) {
      setError('Exam must have at least one question');
      setIsSubmitting(false);
      return;
    }

    for (let i = 0; i < formData.questions.length; i++) {
      const q = formData.questions[i];
      if (!q.question.trim()) {
        setError(`Question ${i + 1} text is required`);
        setIsSubmitting(false);
        return;
      }
      if (q.options.length < 2) {
        setError(`Question ${i + 1} must have at least 2 options`);
        setIsSubmitting(false);
        return;
      }
      if (q.options.some((opt) => !opt.trim())) {
        setError(`Question ${i + 1} has empty options`);
        setIsSubmitting(false);
        return;
      }
      if (q.correctAnswer < 0 || q.correctAnswer >= q.options.length) {
        setError(`Question ${i + 1} has invalid correct answer`);
        setIsSubmitting(false);
        return;
      }
    }

    try {
      await onSave(formData);
      setIsSubmitting(false);
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err?.message ?? 'Unable to save exam. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === 'add' ? 'Create New Exam' : 'Edit Exam'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Exam Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="input-field"
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="input-field"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration (minutes) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                min="1"
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Passing Score (%) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="passingScore"
                value={formData.passingScore}
                onChange={handleInputChange}
                min="0"
                max="100"
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Attempts <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="maxAttempts"
                value={formData.maxAttempts}
                onChange={handleInputChange}
                min="1"
                className="input-field"
                required
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Questions ({formData.questions.length})
              </h3>
              <button
                type="button"
                onClick={addQuestion}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Question
              </button>
            </div>

            {formData.questions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No questions added yet. Click "Add Question" to get started.
              </div>
            ) : (
              <div className="space-y-4">
                {formData.questions.map((question, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-4 bg-gray-50"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-700">Question {index + 1}</span>
                        <button
                          type="button"
                          onClick={() => moveQuestion(index, 'up')}
                          disabled={index === 0}
                          className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveQuestion(index, 'down')}
                          disabled={index === formData.questions.length - 1}
                          className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteQuestion(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Question Text <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          value={question.question}
                          onChange={(e) => updateQuestion(index, { question: e.target.value })}
                          rows={2}
                          className="input-field"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Type
                          </label>
                          <select
                            value={question.type}
                            onChange={(e) =>
                              updateQuestion(index, {
                                type: e.target.value as 'MULTIPLE_CHOICE' | 'TRUE_FALSE',
                              })
                            }
                            className="input-field"
                          >
                            <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                            <option value="TRUE_FALSE">True/False</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Points
                          </label>
                          <input
                            type="number"
                            value={question.points ?? 1}
                            onChange={(e) =>
                              updateQuestion(index, { points: Number(e.target.value) })
                            }
                            min="1"
                            className="input-field"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Options <span className="text-red-500">*</span>
                        </label>
                        <div className="space-y-2">
                          {question.options.map((option, optIndex) => (
                            <div key={optIndex} className="flex items-center gap-2">
                              <input
                                type="radio"
                                name={`correct-${index}`}
                                checked={question.correctAnswer === optIndex}
                                onChange={() => updateQuestion(index, { correctAnswer: optIndex })}
                                className="h-4 w-4"
                              />
                              <input
                                type="text"
                                value={option}
                                onChange={(e) => updateOption(index, optIndex, e.target.value)}
                                placeholder={`Option ${optIndex + 1}`}
                                className="input-field flex-1"
                                required
                              />
                              {question.options.length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => removeOption(index, optIndex)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => addOption(index)}
                            className="text-sm text-primary-600 hover:text-primary-800"
                          >
                            + Add Option
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Explanation (optional)
                        </label>
                        <textarea
                          value={question.explanation ?? ''}
                          onChange={(e) => updateQuestion(index, { explanation: e.target.value })}
                          rows={2}
                          className="input-field"
                          placeholder="Explain why this is the correct answer..."
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="btn-outline">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? 'Saving...' : mode === 'add' ? 'Create Exam' : 'Update Exam'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

