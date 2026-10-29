'use client';

import React, { useState } from 'react';
import { Quiz, Question } from '@/lib/api';
import Button from '../atoms/Button';
import Input from '../atoms/Input';
import FormField from '../molecules/FormField';

interface QuizEditorProps {
  initialQuiz?: Quiz | null;
  onSave: (quizData: any) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function QuizEditor({
  initialQuiz = null,
  onSave,
  onCancel,
  isLoading = false,
}: QuizEditorProps) {
  // Main quiz details
  const [title, setTitle] = useState(initialQuiz?.title || '');
  const [description, setDescription] = useState(initialQuiz?.description || '');
  
  // Questions array
  const [questions, setQuestions] = useState<Question[]>(() => {
    if (initialQuiz?.questions) {
      return initialQuiz.questions.map((q) => ({
        ...q,
        id: q.id || (q as any)._id || Math.random().toString(36).substring(2, 9),
      }));
    }
    return [
      {
        id: Math.random().toString(36).substring(2, 9),
        text: '',
        options: ['', '', '', ''],
        correctOptionIndex: 0,
        timeLimit: 20,
        pointsWeight: 1,
      },
    ];
  });

  const [validationError, setValidationError] = useState<string | null>(null);

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: Math.random().toString(36).substring(2, 9),
        text: '',
        options: ['', '', '', ''],
        correctOptionIndex: 0,
        timeLimit: 20,
        pointsWeight: 1,
      },
    ]);
  };

  const handleRemoveQuestion = (qIdx: number) => {
    if (questions.length <= 1) {
      setValidationError('A quiz must have at least one question.');
      return;
    }
    const newQuestions = [...questions];
    newQuestions.splice(qIdx, 1);
    setQuestions(newQuestions);
    setValidationError(null);
  };

  const handleQuestionTextChange = (qIdx: number, text: string) => {
    const newQuestions = [...questions];
    newQuestions[qIdx] = { ...newQuestions[qIdx], text };
    setQuestions(newQuestions);
  };

  const handleOptionTextChange = (qIdx: number, optIdx: number, optText: string) => {
    const newQuestions = [...questions];
    const newOptions = [...newQuestions[qIdx].options];
    newOptions[optIdx] = optText;
    newQuestions[qIdx] = { ...newQuestions[qIdx], options: newOptions };
    setQuestions(newQuestions);
  };

  const handleCorrectOptionChange = (qIdx: number, optIdx: number) => {
    const newQuestions = [...questions];
    newQuestions[qIdx] = { ...newQuestions[qIdx], correctOptionIndex: optIdx };
    setQuestions(newQuestions);
  };

  const handleTimeLimitChange = (qIdx: number, limit: number) => {
    const newQuestions = [...questions];
    newQuestions[qIdx] = { ...newQuestions[qIdx], timeLimit: limit };
    setQuestions(newQuestions);
  };

  const handlePointsWeightChange = (qIdx: number, weight: number) => {
    const newQuestions = [...questions];
    newQuestions[qIdx] = { ...newQuestions[qIdx], pointsWeight: weight };
    setQuestions(newQuestions);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Form validations
    if (!title.trim()) {
      setValidationError('Quiz title is required.');
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) {
        setValidationError(`Question ${i + 1} text cannot be empty.`);
        return;
      }
      
      const filledOptions = q.options.filter((o) => o.trim() !== '');
      if (filledOptions.length < 2) {
        setValidationError(`Question ${i + 1} must have at least 2 non-empty options.`);
        return;
      }
    }

    onSave({
      id: initialQuiz?.id,
      title,
      description,
      questions,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8 pb-12 animate-slide-up">
      {/* Quiz details card */}
      <div className="glass-panel p-6 rounded-2xl border border-violet-500/10 light:border-slate-200 flex flex-col gap-5">
        <h3 className="text-xl font-bold text-white light:text-slate-800 mb-2">Quiz Information</h3>
        <FormField label="Quiz Title" required>
          <Input
            type="text"
            placeholder="e.g. React hooks basics, Trivia Night..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
          />
        </FormField>
        <FormField label="Description">
          <textarea
            rows={3}
            placeholder="Enter a brief description explaining what this quiz covers..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-3 bg-gray-900/60 light:bg-slate-100 border border-gray-800 light:border-slate-300 rounded-xl text-white light:text-slate-900 placeholder-gray-500 light:placeholder-slate-400 transition-all outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
          />
        </FormField>
      </div>

      {/* Questions list */}
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-xl font-bold text-white light:text-slate-800">Questions Set</h3>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleAddQuestion}
          >
            ➕ Add Question
          </Button>
        </div>

        {questions.map((q, qIdx) => (
          <div
            key={q.id}
            className="glass-panel p-6 rounded-2xl border border-gray-800/80 light:border-slate-200 relative flex flex-col gap-5 group"
          >
            {/* Header / Remove question */}
            <div className="flex justify-between items-center border-b border-gray-800/60 light:border-slate-200 pb-3">
              <span className="text-sm font-bold text-violet-400 light:text-violet-600">
                Question {qIdx + 1}
              </span>
              <button
                type="button"
                onClick={() => handleRemoveQuestion(qIdx)}
                className="text-gray-500 light:text-slate-500 hover:text-red-400 light:hover:text-red-600 text-xs font-semibold px-2 py-1 rounded bg-gray-900 light:bg-slate-100 border border-gray-800 light:border-slate-300 hover:border-red-950 transition-all cursor-pointer"
              >
                Delete Question
              </button>
            </div>

            {/* Question Text */}
            <FormField label="Question text" required>
              <Input
                type="text"
                placeholder="What is the output of...?"
                value={q.text}
                onChange={(e) => handleQuestionTextChange(qIdx, e.target.value)}
                fullWidth
              />
            </FormField>

            {/* Timers & Multiplier Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Time Limit (seconds)">
                <select
                  value={q.timeLimit}
                  onChange={(e) => handleTimeLimitChange(qIdx, parseInt(e.target.value))}
                  className="w-full px-4 py-3 bg-gray-900 light:bg-slate-100 border border-gray-800 light:border-slate-300 rounded-xl text-white light:text-slate-900 outline-none focus:border-violet-500"
                >
                  <option value={5}>5 seconds</option>
                  <option value={10}>10 seconds</option>
                  <option value={20}>20 seconds</option>
                  <option value={30}>30 seconds</option>
                  <option value={60}>60 seconds</option>
                  <option value={120}>2 minutes</option>
                </select>
              </FormField>
              <FormField label="Points Multiplier">
                <select
                  value={q.pointsWeight}
                  onChange={(e) => handlePointsWeightChange(qIdx, parseFloat(e.target.value))}
                  className="w-full px-4 py-3 bg-gray-900 light:bg-slate-100 border border-gray-800 light:border-slate-300 rounded-xl text-white light:text-slate-900 outline-none focus:border-violet-500"
                >
                  <option value={1}>1x (Standard)</option>
                  <option value={1.5}>1.5x (Bonus)</option>
                  <option value={2}>2x (Double Points)</option>
                </select>
              </FormField>
            </div>

            {/* Options list */}
            <div className="flex flex-col gap-3">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400 light:text-slate-500">
                Answer Options (Mark correct radio button)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {q.options.map((opt, optIdx) => {
                  const colors = [
                    'border-red-500/20 focus:border-red-500/50',
                    'border-cyan-500/20 focus:border-cyan-500/50',
                    'border-amber-500/20 focus:border-amber-500/50',
                    'border-emerald-500/20 focus:border-emerald-500/50',
                  ];
                  return (
                    <div
                      key={optIdx}
                      className="flex items-center gap-3 p-3 bg-gray-900/40 light:bg-slate-100 rounded-xl border border-gray-800 light:border-slate-200"
                    >
                      <input
                        type="radio"
                        name={`correct-option-${q.id}`}
                        checked={q.correctOptionIndex === optIdx}
                        onChange={() => handleCorrectOptionChange(qIdx, optIdx)}
                        className="w-5 h-5 text-violet-600 focus:ring-violet-500 border-gray-800 light:border-slate-350 bg-gray-900 light:bg-white cursor-pointer"
                      />
                      <input
                        type="text"
                        placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                        value={opt}
                        onChange={(e) => handleOptionTextChange(qIdx, optIdx, e.target.value)}
                        className={`flex-1 bg-transparent text-white light:text-slate-900 border-b ${colors[optIdx]} py-1 px-1 outline-none text-sm`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {validationError && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
          ⚠️ {validationError}
        </div>
      )}

      {/* Editor Controls */}
      <div className="flex gap-4 sticky bottom-4 z-40 bg-gray-950/80 light:bg-white/95 backdrop-blur border border-gray-800/80 light:border-slate-200 p-4 rounded-2xl shadow-xl">
        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
          className="flex-1 py-3"
        >
          💾 Save Quiz Set
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          className="py-3"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
