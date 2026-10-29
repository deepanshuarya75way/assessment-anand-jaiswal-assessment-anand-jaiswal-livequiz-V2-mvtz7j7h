'use client';

import React from 'react';
import { Player } from '@/lib/api';
import LeaderboardRow from '../molecules/LeaderboardRow';

interface RealTimeLeaderboardProps {
  players: Player[];
  activePlayerId?: string;
  totalQuestions?: number;
}

export default function RealTimeLeaderboard({
  players,
  activePlayerId,
  totalQuestions = 0,
}: RealTimeLeaderboardProps) {
  // Sort players by score desc, then by nickname (alphabetical)
  const sortedPlayers = [...players].sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.nickname.localeCompare(b.nickname);
  });

  const topThree = sortedPlayers.slice(0, 3);
  const remainingPlayers = sortedPlayers.slice(3);

  // Position mappings for the podium rendering (2nd, 1st, 3rd)
  const podiumOrder = [
    { rank: 2, player: topThree[1] },
    { rank: 1, player: topThree[0] },
    { rank: 3, player: topThree[2] },
  ];

  return (
    <div className="flex flex-col gap-8 w-full max-w-4xl mx-auto px-4 py-6">
      {sortedPlayers.length === 0 ? (
        <div className="glass-panel text-center py-20 rounded-3xl border border-gray-800/80">
          <span className="text-5xl block mb-4 animate-bounce">⏳</span>
          <h3 className="text-xl font-bold text-white light:text-slate-800 mb-2">Waiting for players to join...</h3>
          <p className="text-gray-400 light:text-slate-500 text-sm max-w-md mx-auto">
            Share the 6-digit Join Code with your participants to see them appear here in real-time.
          </p>
        </div>
      ) : (
        <>
          {/* Podium Area */}
          <div className="flex items-end justify-center gap-3 sm:gap-6 pt-10 pb-6 border-b border-gray-800/40 light:border-slate-200">
            {podiumOrder.map(({ rank, player }) => {
              if (!player) return <div key={rank} className="flex-1 max-w-[150px] sm:max-w-[200px]" />;

              const isFirst = rank === 1;
              const cardHeight = isFirst ? 'h-52 sm:h-64' : rank === 2 ? 'h-40 sm:h-48' : 'h-36 sm:h-44';
              const borderTheme = isFirst 
                ? 'border-amber-500/30 shadow-amber-500/5 glow-border' 
                : rank === 2 
                  ? 'border-slate-400/25 shadow-slate-500/5' 
                  : 'border-amber-700/20 shadow-amber-700/5';
              const medalEmoji = rank === 1 ? '👑' : rank === 2 ? '🥈' : '🥉';
              const podiumBg = isFirst ? 'bg-amber-500/10' : rank === 2 ? 'bg-slate-300/5' : 'bg-amber-700/5';

              return (
                <div
                  key={rank}
                  className={`
                    flex-1 max-w-[150px] sm:max-w-[200px] flex flex-col items-center justify-end
                    animate-scale-in
                  `}
                >
                  {/* Name and avatar above podium */}
                  <div className="text-center mb-3 max-w-full">
                    <span className="text-2xl mb-1 block">{medalEmoji}</span>
                    <h4 className="font-extrabold text-white light:text-slate-800 text-sm sm:text-base truncate max-w-full px-1">
                      {player.nickname}
                    </h4>
                    <span className="text-xs text-violet-400 light:text-violet-600 font-bold block">
                      {player.score.toLocaleString()} pts
                    </span>
                  </div>

                  {/* Podium Stand */}
                  <div
                    className={`
                      w-full glass-panel rounded-t-2xl border-t border-x flex flex-col items-center justify-center
                      ${cardHeight} ${borderTheme} ${podiumBg}
                    `}
                  >
                    <span className={`text-4xl sm:text-6xl font-black select-none opacity-20 text-white light:text-slate-650`}>
                      {rank}
                    </span>
                    <span className="text-[10px] text-gray-500 light:text-slate-450 block font-bold uppercase tracking-widest mt-2">
                      RANK
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Leaderboard scrolling area for Rank 4+ */}
          {remainingPlayers.length > 0 && (
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-bold text-gray-400 light:text-slate-500 uppercase tracking-wider px-1">
                Leaderboard Standings
              </h3>
              <div className="flex flex-col gap-2.5 max-h-[400px] overflow-y-auto pr-1">
                {remainingPlayers.map((player, idx) => {
                  const rankNum = idx + 4;
                  const correctAnswers = player.answers.filter((a) => a.isCorrect).length;
                  return (
                    <LeaderboardRow
                      key={player.id}
                      rank={rankNum}
                      nickname={player.nickname}
                      score={player.score}
                      isCurrentUser={player.id === activePlayerId}
                      totalQuestions={totalQuestions}
                      correctAnswers={correctAnswers}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
