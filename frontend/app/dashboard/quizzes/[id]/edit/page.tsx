"use client";

import React, { useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchQuizById, saveQuiz } from "@/store/quizSlice";
import QuizEditor from "@/components/organisms/QuizEditor";
import Button from "@/components/atoms/Button";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function QuizEditPage({ params }: PageProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const resolvedParams = use(params);
  const quizId = resolvedParams.id;

  const { currentQuiz, loading } = useAppSelector((state) => state.quiz);

  useEffect(() => {
    if (quizId) {
      dispatch(fetchQuizById(quizId));
    }
  }, [dispatch, quizId]);

  const handleSave = async (quizData: any) => {
    try {
      await dispatch(saveQuiz(quizData)).unwrap();
      alert("Quiz successfully updated!");
      router.push(`/dashboard/quizzes/${quizId}/stats`);
    } catch (err: any) {
      alert(err || "Failed to save updates");
    }
  };

  const handleCancel = () => {
    router.push(`/dashboard/quizzes/${quizId}/stats`);
  };

  if (loading && !currentQuiz) {
    return (
      <div className="flex justify-center items-center py-32">
        <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentQuiz) {
    return (
      <div className="glass-panel text-center py-20 rounded-2xl border border-gray-800/85 light:border-slate-200">
        <span className="text-4xl block mb-4">⚠️</span>
        <h2 className="text-xl font-bold text-white light:text-slate-800 mb-2">
          Quiz not found
        </h2>
        <p className="text-gray-400 light:text-slate-500 text-sm mb-6">
          The quiz you are looking for does not exist or you do not have
          permission to view it.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/dashboard/quizzes")}
        >
          Back to Quizzes
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto animate-slide-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-800/60 light:border-slate-200">
        <div>
          <h1 className="text-3xl font-extrabold text-white light:text-slate-800 tracking-tight">
            Edit: {currentQuiz.title}
          </h1>
          <p className="text-gray-400 light:text-slate-550 text-sm mt-1">
            Build questions, change choice configurations, and select correct
            answer indices.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/dashboard/quizzes/${quizId}/stats`)}
        >
          📊 View Stats
        </Button>
      </div>

      <div className="mt-4">
        <QuizEditor
          initialQuiz={currentQuiz}
          onSave={handleSave}
          onCancel={handleCancel}
          isLoading={loading}
        />
      </div>
    </div>
  );
}
