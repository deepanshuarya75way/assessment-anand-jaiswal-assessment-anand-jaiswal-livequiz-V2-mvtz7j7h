import React from 'react';

interface QuestionOptionProps {
  text: string;
  index: number;
  isSelected?: boolean;
  isDisabled?: boolean;
  status?: 'correct' | 'incorrect' | 'neutral';
  onClick?: () => void;
}

export default function QuestionOption({
  text,
  index,
  isSelected = false,
  isDisabled = false,
  status = 'neutral',
  onClick,
}: QuestionOptionProps) {
  const letters = ['A', 'B', 'C', 'D'];
  const symbols = ['▲', '◆', '●', '■'];

  // Base theme colors for Kahoot/Quizizz style gamified UI
  const themes = [
    // Option A: Red-Orange
    {
      base: 'border-red-500/20 bg-red-950/10 hover:bg-red-950/20 hover:border-red-500/40 text-red-100 light:text-red-900 light:bg-red-50 light:border-red-200/50 light:hover:bg-red-100/60',
      selected: 'border-red-500 bg-red-600 text-white shadow-lg shadow-red-500/30 ring-4 ring-red-500/10',
      badge: 'bg-red-500 text-white',
      symbol: '▲',
    },
    // Option B: Blue
    {
      base: 'border-cyan-500/20 bg-cyan-950/10 hover:bg-cyan-950/20 hover:border-cyan-500/40 text-cyan-100 light:text-cyan-900 light:bg-cyan-50 light:border-cyan-200/50 light:hover:bg-cyan-100/60',
      selected: 'border-cyan-500 bg-cyan-600 text-white shadow-lg shadow-cyan-500/30 ring-4 ring-cyan-500/10',
      badge: 'bg-cyan-500 text-white',
      symbol: '◆',
    },
    // Option C: Yellow/Amber
    {
      base: 'border-amber-500/20 bg-amber-950/10 hover:bg-amber-950/20 hover:border-amber-500/40 text-amber-100 light:text-amber-900 light:bg-amber-50/50 light:border-amber-200/50 light:hover:bg-amber-100/60',
      selected: 'border-amber-500 bg-amber-600 text-white shadow-lg shadow-amber-500/30 ring-4 ring-amber-500/10',
      badge: 'bg-amber-500 text-amber-950 light:text-white',
      symbol: '●',
    },
    // Option D: Green/Emerald
    {
      base: 'border-emerald-500/20 bg-emerald-950/10 hover:bg-emerald-950/20 hover:border-emerald-500/40 text-emerald-100 light:text-emerald-900 light:bg-emerald-50 light:border-emerald-200/50 light:hover:bg-emerald-100/60',
      selected: 'border-emerald-500 bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 ring-4 ring-emerald-500/10',
      badge: 'bg-emerald-500 text-white',
      symbol: '■',
    },
  ];

  const currentTheme = themes[index % 4];

  let containerStyle = isSelected ? currentTheme.selected : currentTheme.base;
  let badgeStyle = currentTheme.badge;

  // Answer reveals override standard selected theme
  if (status === 'correct') {
    containerStyle = 'border-emerald-500 bg-emerald-600 text-white shadow-lg shadow-emerald-500/40';
    badgeStyle = 'bg-white text-emerald-600';
  } else if (status === 'incorrect') {
    containerStyle = 'border-red-500 bg-red-900/40 text-red-300 opacity-60';
    badgeStyle = 'bg-red-500 text-white';
  } else if (isDisabled && !isSelected) {
    containerStyle += ' opacity-40 pointer-events-none';
  }

  return (
    <button
      disabled={isDisabled}
      onClick={onClick}
      className={`
        w-full text-left p-5 rounded-2xl border-2 flex items-center gap-4
        transition-all duration-200 select-none cursor-pointer active:scale-98
        ${containerStyle}
      `}
    >
      <div
        className={`
          w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg select-none shrink-0
          ${badgeStyle}
        `}
      >
        <span className="mr-0.5 text-xs opacity-75">{currentTheme.symbol}</span>
        {letters[index % 4]}
      </div>
      <span className="text-lg font-bold tracking-wide break-words">
        {text}
      </span>
    </button>
  );
}
