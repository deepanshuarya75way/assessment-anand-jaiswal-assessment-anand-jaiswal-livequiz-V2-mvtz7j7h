'use client';

import React from 'react';
import StatsCard from '../molecules/StatsCard';
import Badge from '../atoms/Badge';
import ProgressBar from '../atoms/ProgressBar';

interface QuestionStat {
  questionText: string;
  correctPercentage: number;
  totalAnswers: number;
}

interface SessionAnalytic {
  quizId: string;
  quizTitle: string;
  sessionCode: string;
  endedAt: string;
  totalPlayers: number;
  averageScore: number;
  questionStats: QuestionStat[];
}

interface AnalyticsOverviewProps {
  analyticsData: SessionAnalytic[];
}

export default function AnalyticsOverview({ analyticsData }: AnalyticsOverviewProps) {
  if (!analyticsData || analyticsData.length === 0) {
    return (
      <div className="glass-panel text-center py-16 rounded-2xl border border-gray-800/80 light:border-slate-200">
        <span className="text-4xl block mb-3 opacity-60">📊</span>
        <h3 className="text-lg font-bold text-white light:text-slate-800 mb-1">No analytics data available yet</h3>
        <p className="text-gray-400 light:text-slate-500 text-sm max-w-sm mx-auto">
          Host a live session, invite players, and complete the quiz to generate analytics.
        </p>
      </div>
    );
  }

  // Calculate aggregated stats
  const totalSessions = analyticsData.length;
  const totalParticipants = analyticsData.reduce((acc, s) => acc + s.totalPlayers, 0);
  const averageParticipants = Math.round(totalParticipants / totalSessions);
  const averageScoreAcrossSessions = Math.round(
    analyticsData.reduce((acc, s) => acc + s.averageScore, 0) / totalSessions
  );

  return (
    <div className="flex flex-col gap-8 animate-slide-up">
      {/* Aggregated Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard
          title="Total Runs"
          value={totalSessions}
          icon="🎮"
          description="Total times this quiz was played live"
          color="primary"
        />
        <StatsCard
          title="Total Players"
          value={totalParticipants}
          icon="👥"
          description={`Average of ${averageParticipants} players per run`}
          color="accent"
        />
        <StatsCard
          title="Avg Player Score"
          value={`${averageScoreAcrossSessions.toLocaleString()}`}
          icon="📈"
          description="Average score of all participants"
          color="secondary"
        />
      </div>

      {/* History List */}
      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-bold text-white light:text-slate-800 px-1">Session Run History</h3>
        
        <div className="flex flex-col gap-4">
          {analyticsData.map((session, sIdx) => {
            const formattedDate = new Date(session.endedAt).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={session.sessionCode}
                className="glass-panel p-6 rounded-2xl border border-gray-800/80 light:border-slate-200 hover:border-gray-700/80 light:hover:border-slate-300 transition-all flex flex-col gap-5"
              >
                {/* Session Header */}
                <div className="flex flex-wrap justify-between items-center gap-3 border-b border-gray-800/60 light:border-slate-200 pb-3">
                  <div className="flex items-center gap-3">
                    <Badge variant="info">Session Code: {session.sessionCode}</Badge>
                    <span className="text-xs text-gray-500 light:text-slate-400 font-bold">{formattedDate}</span>
                  </div>
                  <div className="text-right flex items-center gap-6">
                    <div>
                      <span className="text-xs font-semibold text-gray-400 light:text-slate-500 mr-2">Players:</span>
                      <span className="text-sm font-bold text-white light:text-slate-800">{session.totalPlayers}</span>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-gray-400 light:text-slate-500 mr-2">Avg Score:</span>
                      <span className="text-sm font-bold text-violet-400 light:text-violet-600">{session.averageScore.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Questions Breakdown */}
                <div className="flex flex-col gap-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 light:text-slate-500">
                    Question-by-Question Accuracy Rates
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {session.questionStats.map((qStat, qIdx) => {
                      const pct = qStat.correctPercentage;
                      const progressColor = pct >= 70 ? 'accent' : pct >= 40 ? 'primary' : 'danger';
                      return (
                        <div
                          key={qIdx}
                          className="bg-gray-900/40 light:bg-slate-100/50 p-4 rounded-xl border border-gray-800 light:border-slate-200 flex flex-col gap-2"
                        >
                          <div className="flex justify-between items-start gap-3">
                            <span className="text-xs font-bold text-gray-500 light:text-slate-400">Q{qIdx + 1}</span>
                            <span className="text-xs font-bold text-white light:text-slate-800 truncate flex-1">
                              {qStat.questionText}
                            </span>
                            <Badge variant={progressColor === 'accent' ? 'success' : progressColor === 'primary' ? 'primary' : 'danger'}>
                              {pct}% correct
                            </Badge>
                          </div>
                          <ProgressBar value={pct} max={100} color={progressColor} />
                          <span className="text-[10px] text-gray-500 light:text-slate-450 block text-right font-medium">
                            {qStat.totalAnswers} total answers
                          </span>
                        </div>
                      );
                    })}
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
