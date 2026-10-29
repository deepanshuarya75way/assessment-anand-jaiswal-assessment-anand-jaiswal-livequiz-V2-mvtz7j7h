'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthLayout from '@/components/templates/AuthLayout';
import Button from '@/components/atoms/Button';
import Input from '@/components/atoms/Input';
import FormField from '@/components/molecules/FormField';
import Link from 'next/link';
import { MockAPI } from '@/lib/api';

export default function ForgotPasswordPage() {
  const router = useRouter();
  
  // States
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  const validate = () => {
    const errs: { [key: string]: string } = {};

    if (!otpSent) {
      if (!email.trim()) {
        errs.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(email)) {
        errs.email = 'Please enter a valid email address';
      }
    } else {
      if (!otp.trim()) {
        errs.otp = 'OTP is required';
      } else if (otp.trim().length !== 6 || !/^\d+$/.test(otp)) {
        errs.otp = 'OTP must be a 6-digit number';
      }

      if (!newPassword) {
        errs.newPassword = 'New password is required';
      } else if (newPassword.length < 6) {
        errs.newPassword = 'Password must be at least 6 characters';
      }
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await MockAPI.forgotPassword(email);
      setOtpSent(true);
      setSuccess(res.message || 'Reset code sent to your email.');
    } catch (err: any) {
      setError(err.message || 'Failed to request reset OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await MockAPI.resetPassword(email, otp, newPassword);
      setSuccess(res.message || 'Password reset successful!');
      // Reset form
      setEmail('');
      setOtp('');
      setNewPassword('');
      setOtpSent(false);
      // Redirect to login
      setTimeout(() => {
        router.push('/auth/login');
      }, 2500);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="glass-panel w-full max-w-md p-8 rounded-3xl border border-violet-500/10">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-white light:text-slate-800 tracking-tight mb-2">
            Reset Password
          </h2>
          <p className="text-gray-400 light:text-slate-500 text-sm">
            {otpSent 
              ? "Verify OTP and set your new password" 
              : "Enter your email address to receive a password reset OTP"}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium animate-slide-up">
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium animate-slide-up">
            ✓ {success}
          </div>
        )}

        {!otpSent ? (
          <form onSubmit={handleRequestOtp} className="flex flex-col gap-5">
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
              Send Reset OTP
            </Button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="flex flex-col gap-5">
            <FormField label="Verification OTP" error={fieldErrors.otp} required>
              <Input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                fullWidth
              />
            </FormField>

            <FormField label="New Password" error={fieldErrors.newPassword} required>
              <Input
                type="password"
                placeholder="Enter new password (min. 6 chars)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
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
              Verify & Reset Password
            </Button>
            
            <button
              type="button"
              onClick={handleRequestOtp}
              disabled={loading}
              className="text-xs text-left text-violet-400 hover:text-violet-300 font-semibold transition-colors mt-1"
            >
              Didn't receive OTP? Resend
            </button>
          </form>
        )}

        <div className="text-center mt-6 text-sm text-gray-500 light:text-slate-500 font-medium">
          Remembered your password?{" "}
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
