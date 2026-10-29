'use client';

import React, { useEffect, useState } from 'react';

export default function ThemeToggler({ showLabel = false }: { showLabel?: boolean }) {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('ll_theme') as 'dark' | 'light' || 'dark';
    setTheme(savedTheme);
    if (savedTheme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('ll_theme', newTheme);
    if (newTheme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2.5 rounded-xl bg-gray-900/40 border border-violet-500/10 hover:border-violet-500/30 text-gray-400 hover:text-violet-400 transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer shrink-0 light:text-foreground"
      title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      <span className="text-lg shrink-0">{theme === "dark" ? "☀️" : "🌙"}</span>
      {showLabel && (
        <span className="text-sm font-bold truncate">
          {theme === "dark" ? "Light Theme" : "Dark Theme"}
        </span>
      )}
    </button>
  );
}
