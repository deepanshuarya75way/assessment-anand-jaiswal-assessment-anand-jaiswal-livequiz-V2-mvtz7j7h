'use client';

import React, { useEffect, useState, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { MockAPI, QuizSession, Player, Question } from '@/lib/api';
import Navbar from '@/components/organisms/Navbar';
import Button from '@/components/atoms/Button';
import Input from '@/components/atoms/Input';
import FormField from '@/components/molecules/FormField';
import QuestionOption from '@/components/molecules/QuestionOption';
import ProgressBar from '@/components/atoms/ProgressBar';
import Badge from '@/components/atoms/Badge';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PlayQuizPage({ params }: PageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const sessionCode = resolvedParams.id;

  // Local storage keys
  const playerStorageKey = `ll_player_${sessionCode}`;
  const playerIdStorageKey = `ll_player_id_${sessionCode}`;

  // Game states
  const [session, setSession] = useState<QuizSession | null>(null);
  const [quizDetails, setQuizDetails] = useState<any>(null); // Safe questions list (correct indexes removed)
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [nickname, setNickname] = useState('');
  
  // Active playing states
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerLocked, setIsAnswerLocked] = useState(false);
  const [answerFeedback, setAnswerFeedback] = useState<{
    isCorrect: boolean;
    pointsScored: number;
    totalScore: number;
  } | null>(null);
  
  // Timer States
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const timeLeftRef = useRef(0); // Ref to fetch current value inside thunks/listeners

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Sync timer ref
  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  // Load session state on mount
  useEffect(() => {
    if (!sessionCode) return;
    
    // Check if player already registered in local storage for this code
    const cachedPlayerId = localStorage.getItem(playerIdStorageKey);
    const cachedNickname = localStorage.getItem(playerStorageKey);
    
    if (cachedPlayerId && cachedNickname) {
      setPlayerId(cachedPlayerId);
      setNickname(cachedNickname);

      // Load safe quiz questions immediately for registered player using public route
      MockAPI.getQuizByJoinCode(sessionCode)
        .then(setQuizDetails)
        .catch(console.error);
    }

    MockAPI.getSession(sessionCode)
      .then((sessionData) => {
        setSession(sessionData);
      })
      .catch((err) => {
        setError(err.message || 'Session not found.');
      });
  }, [sessionCode, playerIdStorageKey, playerStorageKey]);

  // Subscribe to real-time updates (BroadcastChannel + HTTP Polling sync)
  useEffect(() => {
    if (!sessionCode) return;

    const unsubscribe = MockAPI.subscribeToSessionUpdates(sessionCode, (event) => {
      // Fetch latest session
      MockAPI.getSession(sessionCode)
        .then((latestSession) => {
          setSession((prevSession) => {
            const prevIndex = prevSession?.currentQuestionIndex ?? -1;
            const newIndex = latestSession.currentQuestionIndex;
            const statusChanged = prevSession?.status !== latestSession.status;
            
            // Reset answer submission states if host advanced question or changed status
            if (newIndex !== prevIndex || statusChanged || event.type === 'QUESTION_CHANGED') {
              setSelectedOption(null);
              setIsAnswerLocked(false);
              setAnswerFeedback(null);
            }
            return latestSession;
          });
        })
        .catch(console.error);
    });

    return () => unsubscribe();
  }, [sessionCode]);

  // Active question timer countdown
  const currentQuestionIndex = session?.currentQuestionIndex ?? -1;
  const isQuestionActive = session?.status === 'active' && currentQuestionIndex >= 0;

  useEffect(() => {
    if (isQuestionActive && quizDetails && !isAnswerLocked) {
      const activeQuestion = quizDetails.questions[currentQuestionIndex] as Question;
      if (activeQuestion) {
        setTimeLeft(activeQuestion.timeLimit);
        
        if (timerRef.current) clearInterval(timerRef.current);
        
        timerRef.current = setInterval(() => {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              clearInterval(timerRef.current!);
              // Timeout - Auto submit empty answer
              handleAnswerSubmit(-1, 0);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isQuestionActive, currentQuestionIndex, quizDetails, isAnswerLocked]);

  const handleJoinLobby = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const name = nickname.trim();
    if (!name) {
      setError('Please enter a nickname.');
      setLoading(false);
      return;
    }

    try {
      const { playerId: newPlayerId, session: updatedSession, quiz } = await MockAPI.joinSession(sessionCode, name);
      
      localStorage.setItem(playerStorageKey, name);
      localStorage.setItem(playerIdStorageKey, newPlayerId);
      
      setPlayerId(newPlayerId);
      setSession(updatedSession);
      setQuizDetails(quiz);
    } catch (err: any) {
      setError(err.message || 'Failed to join game.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSubmit = async (optIdx: number, overrideTimeRemainingMs?: number) => {
    if (!session || !playerId || isAnswerLocked) return;
    
    setIsAnswerLocked(true);
    setSelectedOption(optIdx);
    
    if (timerRef.current) clearInterval(timerRef.current);

    const timeRemainingMs = overrideTimeRemainingMs !== undefined
      ? overrideTimeRemainingMs
      : timeLeftRef.current * 1000;

    try {
      const response = await MockAPI.submitAnswer(
        sessionCode,
        playerId,
        currentQuestionIndex,
        optIdx,
        timeRemainingMs
      );
      
      setAnswerFeedback({
        isCorrect: response.isCorrect,
        pointsScored: response.pointsScored,
        totalScore: response.totalScore,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to submit answer.');
    }
  };

  // Error views
  if (error && !session) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="glass-panel text-center p-8 rounded-3xl max-w-md w-full border border-gray-800 light:border-slate-200">
            <span className="text-4xl block mb-4">⚠️</span>
            <h2 className="text-xl font-bold text-white light:text-slate-800 mb-2">Game Error</h2>
            <p className="text-gray-400 light:text-slate-500 text-sm mb-6">{error}</p>
            <Button variant="outline" size="sm" onClick={() => router.push('/')} className="w-full">
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Phase 1: Join lobby input form
  if (!playerId) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4 relative py-12">
          <div className="absolute top-1/4 left-1/3 w-72 h-72 rounded-full bg-pink-600/10 blur-[100px] pointer-events-none pulse-glow" />
          <div className="absolute bottom-1/4 right-1/3 w-72 h-72 rounded-full bg-violet-600/10 blur-[100px] pointer-events-none pulse-glow" style={{ animationDelay: '2s' }} />

          <div className="glass-panel max-w-md w-full p-8 rounded-3xl border border-violet-500/15 light:border-slate-200 text-center animate-scale-in relative z-10">
            <span className="text-4xl block mb-4 animate-bounce">⚡</span>
            <h2 className="text-2xl font-black text-white light:text-slate-800 tracking-tight mb-2">
              Join Live Game
            </h2>
            <p className="text-gray-400 light:text-slate-500 text-xs font-bold uppercase tracking-wider mb-6">
              Quiz PIN: {sessionCode}
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium text-left">
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleJoinLobby} className="flex flex-col gap-4">
              <FormField label="Choose Nickname" required>
                <Input
                  type="text"
                  placeholder="e.g. CaptainQuiz"
                  maxLength={15}
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="text-center font-bold text-lg"
                  fullWidth
                />
              </FormField>
              <Button
                type="submit"
                variant="secondary"
                isLoading={loading}
                className="py-3.5 text-base font-bold w-full mt-2"
              >
                Enter Lobby 🎮
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const isLobby = session?.status === 'waiting';
  const isActive = session?.status === 'active';
  const isCompleted = session?.status === 'completed';
  const activeQuestion = quizDetails?.questions[currentQuestionIndex] as Question;

  // Phase 2: Waiting Lobby Screen
  if (isLobby) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto px-4 text-center">
          <div className="glass-panel p-8 rounded-3xl border border-violet-500/10 light:border-slate-200 w-full animate-scale-in">
            <span className="text-5xl block mb-6 animate-pulse">👥</span>
            <h2 className="text-2xl font-black text-white light:text-slate-800 mb-2">
              You are in the lobby!
            </h2>
            <p className="text-gray-400 light:text-slate-500 text-sm mb-6">
              Waiting for the host to start the live quiz...
            </p>
            
            <div className="bg-violet-950/20 light:bg-violet-100/50 border border-violet-500/15 light:border-violet-500/10 py-3 px-5 rounded-2xl mb-8 flex items-center justify-center gap-3">
              <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
              <span className="text-sm font-bold text-violet-300 light:text-violet-750">
                Logged in as: {nickname}
              </span>
            </div>
            
            <p className="text-xs text-gray-500 light:text-slate-400 font-bold uppercase tracking-wider leading-relaxed">
              Quiz PIN: {sessionCode}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Phase 3: Playing / Answering Questions
  if (isActive && activeQuestion) {
    const totalTime = activeQuestion.timeLimit;
    const answeredCount = session?.players[playerId]?.answers.length || 0;

    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 flex flex-col gap-6 select-none">
          {/* Top Panel */}
          <div className="flex justify-between items-center gap-4">
            <Badge variant="primary">Question {currentQuestionIndex + 1}</Badge>
            <div className="text-right">
              <span className="text-xs text-gray-400 light:text-slate-500 font-bold block">Score</span>
              <span className="text-base font-black text-violet-400 light:text-violet-600">
                {(session?.players[playerId]?.score || 0).toLocaleString()} pts
              </span>
            </div>
          </div>

          {/* Time Counter Bar */}
          {!isAnswerLocked && (
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center px-1 font-bold text-xs text-gray-400 light:text-slate-550 uppercase tracking-widest">
                <span>Timer Countdown</span>
                <span className={timeLeft <= 5 ? 'text-red-400 animate-pulse' : 'text-violet-400 light:text-violet-600'}>
                  {timeLeft}s
                </span>
              </div>
              <ProgressBar
                value={timeLeft}
                max={totalTime}
                color={timeLeft <= 5 ? 'danger' : 'primary'}
              />
            </div>
          )}

          {/* Question Text */}
          <div className="glass-panel p-8 rounded-3xl border border-violet-500/15 light:border-slate-200 text-center mt-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white light:text-slate-800 leading-snug">
              {activeQuestion.text}
            </h2>
            {activeQuestion.pointsWeight > 1 && (
              <Badge variant="secondary" className="mt-4">
                🔥 Double Points (2x)
              </Badge>
            )}
          </div>

          {/* Answer Feedback Banner */}
          {isAnswerLocked && answerFeedback && (
            <div
              className={`
                p-5 rounded-2xl border text-center animate-slide-up flex flex-col items-center gap-2
                ${answerFeedback.isCorrect 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-lg shadow-emerald-500/5' 
                  : 'bg-red-500/10 border-red-500/30 text-red-400 shadow-lg shadow-red-500/5'}
              `}
            >
              <span className="text-3xl block">{answerFeedback.isCorrect ? '🏆 Correct!' : '❌ Incorrect'}</span>
              <span className="text-sm font-bold">
                {answerFeedback.isCorrect 
                  ? `+${answerFeedback.pointsScored.toLocaleString()} points added!` 
                  : 'Better luck next time!'}
              </span>
              <span className="text-xs font-semibold text-gray-500 mt-1 uppercase tracking-widest">
                Waiting for the host to show the next question...
              </span>
            </div>
          )}

          {/* Choices Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            {activeQuestion.options.map((option, idx) => {
              if (!option.trim()) return null;
              
              let optionStatus: 'neutral' | 'correct' | 'incorrect' = 'neutral';
              
              // If locked and feedback revealed, show correctness
              if (isAnswerLocked && answerFeedback) {
                // Since details don't have correctOptionIndex on the client,
                // we simulate client-side option highlight:
                // selected option gets red if wrong, emerald if correct.
                if (idx === selectedOption) {
                  optionStatus = answerFeedback.isCorrect ? 'correct' : 'incorrect';
                } else {
                  optionStatus = 'neutral';
                }
              }

              return (
                <QuestionOption
                  key={idx}
                  text={option}
                  index={idx}
                  isSelected={idx === selectedOption}
                  isDisabled={isAnswerLocked}
                  status={optionStatus}
                  onClick={() => handleAnswerSubmit(idx)}
                />
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Phase 4: Completed Quiz Results
  if (isCompleted) {
    const player = session?.players[playerId];
    const totalScore = player?.score || 0;
    const correctCount = player?.answers.filter((a) => a.isCorrect).length || 0;
    const totalQuestions = quizDetails?.questions?.length || 0;
    
    // Calculate final rank
    const sortedScores = Object.values(session?.players || {})
      .map((p) => p.score)
      .sort((a, b) => b - a);
    const finalRank = sortedScores.indexOf(totalScore) + 1;

    const rankEmojis = { 1: '👑 1st', 2: '🥈 2nd', 3: '🥉 3rd' };
    const rankLabel = rankEmojis[finalRank as 1 | 2 | 3] || `${finalRank}th`;

    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4 py-12 relative">
          <div className="absolute top-1/4 left-1/3 w-72 h-72 rounded-full bg-violet-600/10 blur-[100px] pointer-events-none pulse-glow animate-pulse" />
          <div className="absolute bottom-1/4 right-1/3 w-72 h-72 rounded-full bg-pink-600/10 blur-[100px] pointer-events-none pulse-glow animate-pulse" style={{ animationDelay: '2s' }} />

          <div className="glass-panel max-w-md w-full p-8 rounded-3xl border border-violet-500/15 light:border-slate-200 text-center animate-scale-in relative z-10">
            <span className="text-5xl block mb-6 animate-bounce">🏆</span>
            <h2 className="text-3xl font-extrabold text-white light:text-slate-800 tracking-tight mb-1">
              Quiz Completed!
            </h2>
            <p className="text-sm font-semibold text-gray-400 light:text-slate-500 uppercase tracking-widest mb-6">
              Final Results
            </p>

            {/* Rank highlight */}
            <div className="bg-violet-950/20 light:bg-violet-100/50 border border-violet-500/15 light:border-violet-500/10 p-6 rounded-2xl mb-6">
              <span className="text-xs font-black text-gray-500 light:text-slate-450 uppercase tracking-widest block mb-1">Your Rank</span>
              <h3 className="text-4xl font-black text-violet-300 light:text-violet-750 tracking-tight">
                {rankLabel}
              </h3>
            </div>

            {/* Stats list */}
            <div className="flex flex-col gap-3.5 mb-8 text-left">
              <div className="flex justify-between items-center py-2 border-b border-gray-800/60 light:border-slate-200">
                <span className="text-sm text-gray-400 light:text-slate-500 font-semibold">Total Points</span>
                <span className="text-lg font-black text-white light:text-slate-850">{totalScore.toLocaleString()} PTS</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-800/60 light:border-slate-200">
                <span className="text-sm text-gray-400 light:text-slate-500 font-semibold">Accuracy</span>
                <span className="text-sm font-bold text-white light:text-slate-850">
                  {correctCount} / {totalQuestions} correct ({totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0}%)
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-400 light:text-slate-500 font-semibold">Nickname</span>
                <span className="text-sm font-bold text-white light:text-slate-850">{nickname}</span>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/')}
              className="w-full py-3"
            >
              Exit to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Loading phase
  return (
    <div className="min-h-screen flex flex-col bg-background-primary">
      <Navbar />
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 light:text-slate-500 text-sm font-semibold">Loading live game lobby...</p>
        </div>
      </div>
    </div>
  );
}
