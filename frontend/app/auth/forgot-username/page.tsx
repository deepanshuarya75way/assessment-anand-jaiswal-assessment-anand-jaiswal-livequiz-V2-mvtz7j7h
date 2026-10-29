'use client';

import React, { useState } from 'react';
import AuthLayout from '@/components/templates/AuthLayout';
import Button from '@/components/atoms/Button';
import Input from '@/components/atoms/Input';
import FormField from '@/components/molecules/FormField';
import Link from 'next/link';
import { MockAPI } from '@/lib/api';

export default function ForgotUsernamePage() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  const validate = () => {
    const errs: { [key: string]: string } = {};
    if (!email.trim()) {
      errs.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errs.email = 'Please enter a valid email address';
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRecoverUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError(null);
    setUsername(null);

    try {
      const res = await MockAPI.forgotUsername(email);
      setUsername(res.username);
    } catch (err: any) {
      setError(err.message || 'Failed to recover username.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="glass-panel w-full max-w-md p-8 rounded-3xl border border-violet-500/10">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-white light:text-slate-800 tracking-tight mb-2">
            Recover Username
          </h2>
          <p className="text-gray-400 light:text-slate-500 text-sm">
            Enter your email address to find the username associated with your account
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium animate-slide-up">
            ⚠️ {error}
          </div>
        )}

        {username ? (
          <div className="mb-6 p-6 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-center animate-slide-up">
            <p className="text-gray-400 text-sm mb-2">Registered Username:</p>
            <p className="text-xl font-bold text-white tracking-wide select-all">{username}</p>
            <p className="text-xs text-gray-500 mt-4">
              You can now use this username to log in or retrieve your email.
            </p>
          </div>
        ) : (
          <form onSubmit={handleRecoverUsername} className="flex flex-col gap-5">
            <FormField label="Email Address" error={fieldErrors.email} required>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                fullWidth
              />
            </FormField>

            <Button
              type="submit"
              variant="primary"
              isLoading={loading}
              fullWidth
              className="mt-2 py-3"
            >
              Find Username
            </Button>
          </form>
        )}

        <div className="text-center mt-6 text-sm text-gray-500 light:text-slate-500 font-medium">
          Ready to log in?{" "}
          <Link
            href="/auth/login"
            className="text-violet-400 light:text-violet-600 hover:text-violet-300 light:hover:text-violet-800 font-bold transition-colors"
          >
            Sign in
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
