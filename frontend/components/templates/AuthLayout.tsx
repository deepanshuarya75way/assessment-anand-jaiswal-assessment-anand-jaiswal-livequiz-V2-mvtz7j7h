'use client';

import React from 'react';
import Navbar from '../organisms/Navbar';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-canvas text-ink">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full flex justify-center">
          {children}
        </div>
      </div>
    </div>
  );
}
