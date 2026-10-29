'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { saveQuiz } from '@/store/quizSlice';
import DashboardLayout from '@/components/templates/DashboardLayout';
import QuizEditor from '@/components/organisms/QuizEditor';

export default function CreateQuizPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector((state) => state.quiz);

  const handleSave = async (quizData: any) => {
    try {
      await dispatch(saveQuiz(quizData)).unwrap();
      router.push('/dashboard');
    } catch (err: any) {
      alert(err || 'Failed to save quiz');
    }
  };

  const handleCancel = () => {
    router.push('/dashboard');
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold text-white light:text-slate-800 tracking-tight">
          Create New Quiz
        </h1>
        <p className="text-gray-400 light:text-slate-550 text-sm mt-1">
          Build customized questions, options, select correct answers, and set timers.
        </p>
      </div>
      
      <QuizEditor
        onSave={handleSave}
        onCancel={handleCancel}
        isLoading={loading}
      />
    </div>
  );
}
