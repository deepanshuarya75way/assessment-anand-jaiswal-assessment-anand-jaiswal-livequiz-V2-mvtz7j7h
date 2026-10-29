'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { initializeAuth, logoutUser } from '@/store/authSlice';
import ThemeToggler from '../atoms/ThemeToggler';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

function DashboardContent({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { isAuthenticated, loading, user } = useAppSelector((state) => state.auth);

  // Sidebar collapsible state
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Initialize auth from localStorage on mount
  useEffect(() => {
    dispatch(initializeAuth());
    setMounted(true);
  }, [dispatch]);

  // Protect dashboard routes
  useEffect(() => {
    if (!mounted) return;
    const token = localStorage.getItem('ll_access_token');
    if (!token && !loading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, loading, router, mounted]);

  // Determine active view from pathname instead of query params
  const getActiveView = () => {
    if (pathname.startsWith('/dashboard/quizzes') || pathname.startsWith('/dashboard/leaderboards')) {
      return 'quizzes';
    }
    if (pathname.startsWith('/dashboard/sessions')) {
      return 'sessions';
    }
    if (pathname.startsWith('/dashboard/analytics')) {
      return 'analytics';
    }
    return 'quizzes'; // Fallback
  };

  const activeView = getActiveView();

  const token = typeof window !== 'undefined' ? localStorage.getItem('ll_access_token') : null;
  
  if (!mounted || (!isAuthenticated && !token)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted text-sm font-semibold">Verifying your session...</p>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    dispatch(logoutUser());
    router.push('/auth/login');
  };

  const navItems = [
    {
      id: 'quizzes',
      label: 'Quizzes',
      route: '/dashboard/quizzes',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      id: 'sessions',
      label: 'Live Sessions',
      route: '/dashboard/sessions',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      id: 'analytics',
      label: 'Analytics',
      route: '/dashboard/analytics',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10a2 2 0 01-2 2h-2a2 2 0 01-2-2zm9-3h-2a2 2 0 00-2 2v3a2 2 0 002 2h2a2 2 0 002-2v-3a2 2 0 00-2-2z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex h-screen bg-canvas text-ink overflow-hidden">
      {/* LEFT SIDEBAR */}
      <aside 
        className={`flex flex-col bg-surface-soft border-r border-hairline h-full transition-all duration-300 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Sidebar Header / Logo */}
        <div className="flex items-center justify-between px-6 py-6 border-b border-hairline">
          <div className="flex items-center gap-3 overflow-hidden">
            <span className="text-lg shrink-0">⚡</span>
            {!isCollapsed && (
              <span className="text-sm font-bold text-ink tracking-widest uppercase animate-fade-in">
                LiveQuiz
              </span>
            )}
          </div>
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-muted hover:text-ink p-1.5 rounded-md hover:bg-surface-card transition-colors cursor-pointer"
          >
            {isCollapsed ? '➡️' : '⬅️'}
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => router.push(item.route)}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-md font-semibold text-sm transition-all duration-200 group cursor-pointer ${
                  isActive 
                    ? 'bg-primary text-on-primary shadow-sm' 
                    : 'text-muted hover:text-ink hover:bg-surface-card'
                }`}
              >
                <div className={`shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                  isActive ? 'text-on-primary' : 'text-muted group-hover:text-ink'
                }`}>
                  {item.icon}
                </div>
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>
        
        {/* Theme Toggler Option */}
        <div className="p-4 border-t border-hairline flex flex-col justify-center">
          <ThemeToggler showLabel={!isCollapsed} />
        </div>

        {/* Sidebar Footer / User Profile Card */}
        <div className="p-4 border-t border-hairline bg-surface-card">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-md bg-primary text-on-primary flex items-center justify-center font-bold text-sm shrink-0">
              {user?.username?.substring(0, 2).toUpperCase() || 'U'}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0 animate-fade-in">
                <h4 className="text-xs font-bold text-ink truncate">{user?.username}</h4>
                <p className="text-[9px] text-muted truncate font-semibold uppercase tracking-wider">{user?.email}</p>
              </div>
            )}
            {!isCollapsed && (
              <button 
                onClick={handleLogout}
                className="text-muted hover:text-error p-1.5 rounded-md hover:bg-error/5 transition-colors shrink-0 cursor-pointer text-xs font-bold"
                title="Logout Account"
              >
                Logout
              </button>
            )}
          </div>
          {isCollapsed && (
            <button 
              onClick={handleLogout}
              className="w-full mt-3 text-center text-muted hover:text-error py-2 rounded-md hover:bg-error/5 transition-colors block text-xs font-semibold"
              title="Logout Account"
            >
              Logout
            </button>
          )}
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Mobile Header / Quick Navbar */}
        <header className="flex md:hidden items-center justify-between px-6 py-4 bg-surface-soft border-b border-hairline">
          <span className="text-lg font-black text-ink">⚡ LiveQuiz</span>
          <button onClick={handleLogout} className="text-sm text-error font-bold">Logout</button>
        </header>

        <main className="flex-1 overflow-y-auto px-6 sm:px-10 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <DashboardContent>{children}</DashboardContent>
    </Suspense>
  );
}
