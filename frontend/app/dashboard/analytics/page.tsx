'use client';

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchQuizzes, fetchOverallAnalytics } from '@/store/quizSlice';
import { MockAPI } from '@/lib/api';
import StatsCard from '@/components/molecules/StatsCard';

export default function AnalyticsPage() {
  const dispatch = useAppDispatch();
  const { quizzes, overallAnalytics, loading } = useAppSelector((state) => state.quiz);
  const { user } = useAppSelector((state) => state.auth);

  const [selectedQuizId, setSelectedQuizId] = useState<string>('');
  const [quizRunsStats, setQuizRunsStats] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      dispatch(fetchQuizzes());
      dispatch(fetchOverallAnalytics());
    }
  }, [dispatch, user]);

  useEffect(() => {
    if (selectedQuizId) {
      MockAPI.getQuizAnalytics(selectedQuizId)
        .then(setQuizRunsStats)
        .catch(console.error);
    } else {
      setQuizRunsStats([]);
    }
  }, [selectedQuizId]);

  return (
    <div className="flex flex-col gap-6 animate-slide-up">
      <div className="border-b border-gray-900/60 light:border-slate-200 pb-5">
        <h1 className="text-2xl font-black text-white light:text-slate-800 tracking-tight">Performance Analytics</h1>
        <p className="text-gray-400 light:text-slate-500 text-xs mt-1">Review aggregated statistics across all quizzes and check question accuracy indexes.</p>
      </div>

      {/* Overall summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in">
        <StatsCard
          title="Total Quizzes"
          value={quizzes.length}
          icon="📚"
          description="Quiz collections"
          color="primary"
        />
        <StatsCard
          title="Sessions Hosted"
          value={overallAnalytics?.totalPlays || 0}
          icon="🎮"
          description="Sessions hosted live"
          color="secondary"
        />
        <StatsCard
          title="Avg Players"
          value={overallAnalytics?.avgParticipants || 0}
          icon="👥"
          description="Participants per run"
          color="accent"
        />
      </div>

      {/* Quiz performance detail selector */}
      <div className="glass-panel p-6 rounded-2xl border border-violet-500/10 light:border-slate-200 mt-2 animate-fade-in">
        <h3 className="text-lg font-bold text-white light:text-slate-800 mb-4">Correctness Breakdown by Quiz</h3>
        <div className="max-w-xs mb-6">
          <select
            value={selectedQuizId}
            onChange={(e) => setSelectedQuizId(e.target.value)}
            className="w-full bg-gray-950 light:bg-slate-100 border border-gray-800 light:border-slate-300 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-300 light:text-slate-700 focus:outline-none focus:border-violet-500 transition-all"
          >
            <option value="">-- Select a Quiz --</option>
            {quizzes.map((quiz) => (
              <option key={quiz.id} value={quiz.id}>
                {quiz.title}
              </option>
            ))}
          </select>
        </div>

        {!selectedQuizId ? (
          <div className="text-center py-10 border border-dashed border-gray-800 light:border-slate-200 rounded-xl text-gray-500 light:text-slate-400 text-sm font-semibold">
            Please select a quiz from the list above to view detailed statistics.
          </div>
        ) : loading && quizRunsStats.length === 0 ? (
          <div className="flex justify-center items-center py-10">
            <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : quizRunsStats.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-gray-800 light:border-slate-200 rounded-xl text-gray-500 light:text-slate-400 text-sm font-semibold">
            No session logs found for this quiz. Play it live first!
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {quizRunsStats.map((run: any) => (
              <div key={run.sessionCode} className="border-t border-gray-900/60 light:border-slate-200 pt-6 first:border-0 first:pt-0">
                <div className="flex justify-between items-center gap-4 mb-4">
                  <h4 className="font-bold text-white light:text-slate-800 text-sm">
                    Session PIN: <span className="font-mono text-violet-400 light:text-violet-600 tracking-wider font-bold">{run.sessionCode}</span> ({new Date(run.endedAt).toLocaleDateString()})
                  </h4>
                  <span className="text-xs text-gray-400 light:text-slate-500 font-bold uppercase tracking-wider bg-gray-950 light:bg-slate-100 px-3 py-1.5 rounded-lg border border-gray-900/60 light:border-slate-200">
                    {run.totalPlayers} Players • Avg Score: {run.averageScore.toLocaleString()} PTS
                  </span>
                </div>
                
                <div className="flex flex-col gap-3">
                  {run.questionStats.map((qStat: any, qIdx: number) => (
                    <div key={qIdx} className="bg-gray-950/40 light:bg-slate-100/50 border border-gray-900/40 light:border-slate-200 rounded-xl p-4 flex justify-between items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] text-gray-500 light:text-slate-400 font-black uppercase block tracking-wider">Question {qIdx + 1}</span>
                        <p className="text-white light:text-slate-800 text-sm font-bold mt-0.5 truncate">{qStat.questionText}</p>
                      </div>
                      
                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-gray-500 light:text-slate-400 font-black uppercase block tracking-wider">Accuracy</span>
                        <span className={`text-sm font-black mt-0.5 block ${
                          qStat.correctPercentage >= 70 ? 'text-emerald-400 light:text-emerald-600' : qStat.correctPercentage >= 40 ? 'text-yellow-400 light:text-yellow-600' : 'text-red-400 light:text-red-600'
                        }`}>
                          {qStat.correctPercentage}% ({qStat.totalAnswers} Answers)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
