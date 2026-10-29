'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchQuizzes, deleteQuiz } from '@/store/quizSlice';
import { MockAPI } from '@/lib/api';
import QuizCard from '@/components/molecules/QuizCard';
import Button from '@/components/atoms/Button';

export default function QuizzesPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { quizzes, loading } = useAppSelector((state) => state.quiz);
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (user) {
      dispatch(fetchQuizzes());
    }
  }, [dispatch, user]);

  const handleCreateQuiz = () => {
    router.push('/dashboard/quizzes/create');
  };

  const handleEditQuiz = (id: string) => {
    router.push(`/dashboard/quizzes/${id}/stats`);
  };

  const handleDeleteQuiz = (id: string) => {
    if (confirm('Are you sure you want to delete this quiz set?')) {
      dispatch(deleteQuiz(id));
    }
  };

  const handleLaunchQuiz = async (id: string) => {
    try {
      const quiz = quizzes.find((q) => q.id === id);
      if (quiz && quiz.joinCode) {
        try {
          const session = await MockAPI.getSession(quiz.joinCode);
          if (session && session.isActive) {
            router.push(`/dashboard/leaderboards/${quiz.joinCode}`);
            return;
          }
        } catch (err) {
          // Session not active, proceed to publish
        }
      }
      
      const code = await MockAPI.publishQuiz(id);
      dispatch(fetchQuizzes());
      router.push(`/dashboard/leaderboards/${code}`);
    } catch (err: any) {
      alert(err.message || 'Failed to launch quiz');
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-slide-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-900/60 light:border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-white light:text-slate-800 tracking-tight">Active Live Play</h1>
          <p className="text-gray-400 light:text-slate-500 text-xs mt-1">Launch quiz sessions, generate PIN codes, and conduct live leaderboards.</p>
        </div>
        <Button
          variant="secondary"
          onClick={handleCreateQuiz}
          className="flex items-center gap-2 py-2 px-5 text-sm font-bold shrink-0"
        >
          ✨ Launch New Game
        </Button>
      </div>

      {loading && quizzes.length === 0 ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : quizzes.length === 0 ? (
        <div className="glass-panel text-center py-20 rounded-2xl border border-gray-800/80">
          <span className="text-5xl block mb-4">📝</span>
          <h3 className="text-lg font-bold text-white mb-1">No quizzes found</h3>
          <p className="text-gray-400 text-sm max-w-sm mx-auto mb-6">Create your first quiz question collection in the Question Sets menu to start playing!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => (
            <QuizCard
              key={quiz.id}
              quiz={quiz}
              onEdit={handleEditQuiz}
              onDelete={handleDeleteQuiz}
              onLaunch={handleLaunchQuiz}
            />
          ))}
        </div>
      )}
    </div>
  );
}
