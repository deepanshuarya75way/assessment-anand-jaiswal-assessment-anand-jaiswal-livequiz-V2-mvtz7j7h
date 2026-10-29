'use client';

import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchOverallAnalytics } from '@/store/quizSlice';

export default function SessionsPage() {
  const dispatch = useAppDispatch();
  const { overallAnalytics, loading } = useAppSelector((state) => state.quiz);
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (user) {
      dispatch(fetchOverallAnalytics());
    }
  }, [dispatch, user]);

  const mySessions = overallAnalytics?.quizzesStats || [];

  return (
    <div className="flex flex-col gap-6 animate-slide-up">
      <div className="border-b border-gray-900/60 light:border-slate-200 pb-5">
        <h1 className="text-2xl font-black text-white light:text-slate-800 tracking-tight">Live Session Logs</h1>
        <p className="text-gray-400 light:text-slate-500 text-xs mt-1">Logs of all live quiz runs hosted, participant counts, and average points scored.</p>
      </div>

      {loading && mySessions.length === 0 ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : mySessions.length === 0 ? (
        <div className="glass-panel text-center py-20 rounded-2xl border border-gray-800/80">
          <span className="text-5xl block mb-4">🎮</span>
          <h3 className="text-lg font-bold text-white light:text-slate-800 mb-1">No sessions hosted yet</h3>
          <p className="text-gray-400 light:text-slate-500 text-sm max-w-sm mx-auto">Launch one of your quizzes from the Quizzes tab to invite participants and host your first session!</p>
        </div>
      ) : (
        <div className="glass-panel border border-violet-500/10 light:border-slate-200 rounded-2xl overflow-hidden animate-fade-in">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-950/80 light:bg-slate-100 border-b border-violet-500/10 light:border-slate-200 text-gray-400 light:text-slate-600 font-bold">
                <th className="px-6 py-4">Quiz Title</th>
                <th className="px-6 py-4">Session PIN</th>
                <th className="px-6 py-4">Host Date</th>
                <th className="px-6 py-4">Players</th>
                <th className="px-6 py-4">Avg Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-900/60 light:divide-slate-200">
              {mySessions.map((session: any) => (
                <tr key={session.sessionCode} className="hover:bg-gray-900/10 light:hover:bg-slate-100/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-white light:text-slate-800">{session.quizTitle}</td>
                  <td className="px-6 py-4 font-mono font-bold text-violet-400 light:text-violet-600 tracking-wider">{session.sessionCode}</td>
                  <td className="px-6 py-4 text-gray-400 light:text-slate-500">
                    {new Date(session.endedAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="px-6 py-4 text-gray-300 light:text-slate-700 font-bold">{session.totalPlayers} Players</td>
                  <td className="px-6 py-4 text-emerald-400 light:text-emerald-600 font-black">{session.averageScore.toLocaleString()} PTS</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
