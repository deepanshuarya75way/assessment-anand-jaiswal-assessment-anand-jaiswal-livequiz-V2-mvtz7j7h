'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchQuizzes, deleteQuiz } from '@/store/quizSlice';
import Button from '@/components/atoms/Button';

export default function QuestionSetsPage() {
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
    router.push(`/dashboard/quizzes/${id}/edit`);
  };

  const handleDeleteQuiz = (id: string) => {
    if (confirm('Are you sure you want to delete this quiz set?')) {
      dispatch(deleteQuiz(id));
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-slide-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-900/60 light:border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-white light:text-slate-800 tracking-tight">Question Sets</h1>
          <p className="text-gray-400 light:text-slate-500 text-xs mt-1">Design questions, customize options, set time limits, and write correct indices.</p>
        </div>
        <Button
          variant="secondary"
          onClick={handleCreateQuiz}
          className="flex items-center gap-2 py-2 px-5 text-sm font-bold shrink-0"
        >
          ✨ Create Question Set
        </Button>
      </div>

      {loading && quizzes.length === 0 ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : quizzes.length === 0 ? (
        <div className="glass-panel text-center py-20 rounded-2xl border border-gray-800/80">
          <span className="text-5xl block mb-4">📝</span>
          <h3 className="text-lg font-bold text-white light:text-slate-800 mb-1">No question sets</h3>
          <p className="text-gray-400 light:text-slate-500 text-sm max-w-sm mx-auto mb-6">Get started by creating your first question set structure.</p>
          <Button variant="outline" size="sm" onClick={handleCreateQuiz}>
            Create Set
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="glass-panel rounded-2xl p-6 border border-violet-500/10 flex flex-col justify-between h-full hover:border-violet-500/30 transition-all duration-300">
              <div>
                <div className="flex justify-between items-start gap-4 mb-3">
                  <h3 className="text-lg font-bold text-white light:text-slate-800 line-clamp-1">{quiz.title}</h3>
                  <Badge variant="secondary">{quiz.questions.length} Qs</Badge>
                </div>
                <p className="text-gray-400 light:text-slate-600 text-xs mb-5 line-clamp-2 min-h-8">
                  {quiz.description || 'No description provided.'}
                </p>
              </div>
              <div className="flex gap-2 border-t border-gray-800/60 light:border-slate-200 pt-4 mt-auto">
                <Button variant="primary" size="sm" className="flex-1" onClick={() => handleEditQuiz(quiz.id)}>
                  Edit Questions 📝
                </Button>
                <Button variant="outline" size="sm" className="hover:border-red-500 hover:text-red-400" onClick={() => handleDeleteQuiz(quiz.id)}>
                  Delete Set
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Badge({ children, variant = 'primary', className = '' }: { children: React.ReactNode; variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger'; className?: string }) {
  const styles = {
    primary: 'bg-violet-500/10 border-violet-500/20 text-violet-300',
    secondary: 'bg-pink-500/10 border-pink-500/20 text-pink-300',
    success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    warning: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
    danger: 'bg-red-500/10 border-red-500/20 text-red-400',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-xs font-black tracking-wider uppercase ${styles[variant]} ${className}`}>
      {children}
    </span>
  );
}
