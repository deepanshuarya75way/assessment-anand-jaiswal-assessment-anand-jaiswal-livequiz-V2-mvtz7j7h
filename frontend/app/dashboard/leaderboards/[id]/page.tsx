'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchSession, advanceSessionQuestion, terminateSession, syncSessionState } from '@/store/leaderboardSlice';
import { MockAPI, Quiz } from '@/lib/api';
import DashboardLayout from '@/components/templates/DashboardLayout';
import RealTimeLeaderboard from '@/components/organisms/RealTimeLeaderboard';
import Button from '@/components/atoms/Button';
import Badge from '@/components/atoms/Badge';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function HostLeaderboardPage({ params }: PageProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const resolvedParams = use(params);
  const sessionCode = resolvedParams.id;

  const { session, loading, error } = useAppSelector((state) => state.leaderboard);
  const [quizDetails, setQuizDetails] = useState<Quiz | null>(null);
  const [joinUrl, setJoinUrl] = useState('');

  // Dynamically resolve full join url on client side
  useEffect(() => {
    if (typeof window !== 'undefined' && sessionCode) {
      setJoinUrl(`${window.location.origin}/quiz/${sessionCode}`);
    }
  }, [sessionCode]);

  // Load session on mount
  useEffect(() => {
    if (sessionCode) {
      dispatch(fetchSession(sessionCode));
    }
  }, [dispatch, sessionCode]);

  // Load quiz details once session is fetched
  useEffect(() => {
    if (session?.quizId) {
      MockAPI.getQuizById(session.quizId)
        .then(setQuizDetails)
        .catch(console.error);
    }
  }, [session?.quizId]);

  // Subscribe to real-time updates (BroadcastChannel + LocalStorage storage events)
  useEffect(() => {
    if (!sessionCode) return;

    const unsubscribe = MockAPI.subscribeToSessionUpdates(sessionCode, (event) => {
      // Re-fetch full session to ensure data accuracy and integrity
      MockAPI.getSession(sessionCode)
        .then((latestSession) => {
          dispatch(syncSessionState(latestSession));
        })
        .catch(console.error);
    });

    return () => unsubscribe();
  }, [dispatch, sessionCode]);

  const handleStartQuiz = () => {
    dispatch(advanceSessionQuestion(sessionCode));
  };

  const handleNextQuestion = () => {
    dispatch(advanceSessionQuestion(sessionCode));
  };

  const handleEndQuiz = () => {
    if (confirm('Are you sure you want to end the session now?')) {
      dispatch(terminateSession(sessionCode));
    }
  };

  const handleAbandonQuiz = async () => {
    if (confirm('⚠️ WARNING: Are you sure you want to destroy this live session? All players will be disconnected and no analytics will be saved.')) {
      try {
        await MockAPI.abandonSession(sessionCode);
        alert('Session successfully destroyed.');
        router.push('/dashboard/quizzes');
      } catch (err: any) {
        alert(err.message || 'Failed to destroy session');
      }
    }
  };

  if (loading && !session) {
    return (
      <div className="flex justify-center items-center py-32">
        <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="glass-panel text-center py-20 rounded-2xl border border-gray-800">
        <span className="text-4xl block mb-4">⚠️</span>
        <h2 className="text-xl font-bold text-white mb-2">Session Error</h2>
        <p className="text-gray-400 text-sm mb-6">
          {error || 'The live session you requested could not be found.'}
        </p>
        <Button variant="outline" size="sm" onClick={() => router.push('/dashboard')}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const playersList = Object.values(session.players);
  const totalQuestions = quizDetails?.questions.length || 0;
  const isLobby = session.status === 'waiting';
  const isActive = session.status === 'active';
  const isCompleted = session.status === 'completed';

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
        {/* Header controller banner */}
        <div className="glass-panel p-6 rounded-3xl border border-violet-500/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <Badge variant={isActive ? 'success' : isCompleted ? 'danger' : 'warning'}>
                {session.status.toUpperCase()}
              </Badge>
              {isActive && quizDetails && (
                <span className="text-xs text-gray-400 light:text-slate-500 font-bold">
                  Question {session.currentQuestionIndex + 1} of {totalQuestions}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white light:text-slate-800 tracking-tight truncate">
              {session.quizTitle}
            </h1>
            <p className="text-xs text-gray-500 light:text-slate-400 font-medium mt-1">
              Share the Join PIN with your audience to participate.
            </p>
          </div>

          {/* Large Join pin display */}
          <div className="flex items-center gap-4 bg-gray-950/40 light:bg-slate-100/50 border border-gray-800/80 light:border-slate-200 px-6 py-3 rounded-2xl shrink-0">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-500 light:text-slate-450 font-extrabold tracking-widest uppercase">Join Code</span>
              <span className="text-3xl font-black tracking-widest text-violet-400 light:text-violet-600 font-mono">
                {session.code}
              </span>
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex gap-2 shrink-0">
            {!isCompleted && (
              <Button
                variant="outline"
                onClick={handleAbandonQuiz}
                className="hover:bg-red-950/20 light:hover:bg-red-50 hover:text-red-400 light:hover:text-red-600 hover:border-red-900/30 text-gray-400 light:text-slate-500 font-bold"
              >
                🚫 Cancel Session
              </Button>
            )}

            {isLobby && (
              <Button
                variant="secondary"
                onClick={handleStartQuiz}
                disabled={playersList.length === 0}
              >
                🎮 Start Quiz
              </Button>
            )}

            {isActive && (
              <>
                <Button
                  variant="primary"
                  onClick={handleNextQuestion}
                >
                  {session.currentQuestionIndex + 1 >= totalQuestions ? '🏁 Finish Quiz' : '➡️ Next Question'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleEndQuiz}
                  className="hover:border-red-500 hover:text-red-400"
                >
                  End Game
                </Button>
              </>
            )}

            {isCompleted && (
              <Button variant="outline" onClick={() => router.push('/dashboard')}>
                Close Session
              </Button>
            )}
          </div>
        </div>

        {/* Lobby/Leaderboard rendering */}
        {isLobby ? (
          <div className="flex flex-col gap-6">
            {/* Direct Join Link UI */}
            {joinUrl && (
              <div className="glass-panel p-6 rounded-3xl border border-violet-500/10 light:border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-scale-in">
                <div className="flex-1 min-w-0 w-full">
                  <span className="text-[10px] text-gray-500 light:text-slate-450 font-extrabold tracking-widest uppercase block mb-1">Direct Game Link</span>
                  <input
                    type="text"
                    readOnly
                    value={joinUrl}
                    className="w-full bg-gray-950 light:bg-slate-100 border border-gray-900 light:border-slate-200 rounded-xl px-4 py-2.5 text-sm text-violet-300 light:text-violet-600 font-mono focus:outline-none"
                    id="joinUrlInput"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const copyText = document.getElementById("joinUrlInput") as HTMLInputElement;
                    if (copyText) {
                      copyText.select();
                      copyText.setSelectionRange(0, 99999);
                      navigator.clipboard.writeText(copyText.value);
                      alert("Direct join link copied to clipboard!");
                    }
                  }}
                  className="w-full md:w-auto shrink-0 py-2.5 px-5 font-bold"
                >
                  Copy Link 📋
                </Button>
              </div>
            )}

            <div className="flex justify-between items-center px-1">
              <h3 className="text-xl font-bold text-white light:text-slate-800">
                Players Lobby ({playersList.length})
              </h3>
            </div>
            {playersList.length === 0 ? (
              <div className="glass-panel text-center py-24 rounded-3xl border border-gray-800/80 light:border-slate-200">
                <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <h4 className="text-lg font-bold text-white light:text-slate-800 mb-1">Waiting for players to join...</h4>
                <p className="text-gray-400 light:text-slate-500 text-sm max-w-sm mx-auto">
                  Go to <span className="text-violet-300 light:text-violet-600 font-mono font-bold">homepage</span> and enter PIN <span className="text-violet-300 light:text-violet-600 font-mono font-bold">{sessionCode}</span> in another tab to join.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {playersList.map((player) => (
                  <div
                    key={player.id}
                    className="glass-panel border border-violet-500/10 light:border-violet-500/25 px-4 py-3 rounded-xl text-center font-bold text-sm text-violet-300 light:text-violet-600 bg-gray-950/20 light:bg-slate-50 animate-scale-in"
                  >
                    👤 {player.nickname}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <RealTimeLeaderboard
            players={playersList}
            totalQuestions={totalQuestions}
          />
        )}
      </div>
  );
}
