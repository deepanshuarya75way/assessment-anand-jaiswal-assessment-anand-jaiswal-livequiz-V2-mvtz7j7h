'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logoutUser } from '@/store/authSlice';
import Button from '../atoms/Button';
import Link from 'next/link';
import ThemeToggler from '../atoms/ThemeToggler';

export default function Navbar() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logoutUser());
    router.push('/');
  };

  return (
    <header className="w-full bg-canvas border-b border-hairline sticky top-0 z-50 h-16 flex items-center transition-all duration-200">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 select-none group">
          <span className="text-xl font-black tracking-tight text-ink">
            livequiz<span className="text-accent font-bold">.</span>
          </span>
        </Link>

        {/* Navigation Actions */}
        <div className="flex items-center gap-4">
          <ThemeToggler />
          {isAuthenticated && user ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm font-semibold text-muted hover:text-ink transition-colors duration-200"
              >
                Dashboard
              </Link>
              <div className="h-4 w-px bg-hairline" />
              <div className="flex items-center gap-3">
                <div className="flex flex-col text-right hidden sm:flex">
                  <span className="text-[10px] font-semibold text-muted uppercase tracking-wider">Host</span>
                  <span className="text-xs font-bold text-ink truncate max-w-32">
                    {user.username}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-full bg-surface-card border border-hairline flex items-center justify-center text-xs font-semibold text-ink select-none">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="hover:text-error hover:bg-error/5"
                >
                  Logout
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">
                  Login
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button variant="primary" size="sm">
                  Sign Up
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
