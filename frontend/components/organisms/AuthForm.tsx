'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loginUser, registerUserWithOtp, clearAuthError } from '@/store/authSlice';
import Button from '../atoms/Button';
import Input from '../atoms/Input';
import FormField from '../molecules/FormField';
import Link from 'next/link';
import { MockAPI } from '@/lib/api';

interface AuthFormProps {
  type: 'login' | 'signup';
}

export default function AuthForm({ type }: AuthFormProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { loading, error, isAuthenticated } = useAppSelector((state) => state.auth);

  // Form states
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  // Clear slice and local errors on mount/unmount/type change
  useEffect(() => {
    dispatch(clearAuthError());
    setLocalError(null);
    setSuccessMessage(null);
    setOtpSent(false);
    setOtp('');
    return () => {
      dispatch(clearAuthError());
    };
  }, [dispatch, type]);

  // If authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!otpSent) {
      if (type === 'signup' && !username.trim()) {
        errors.username = 'Username is required';
      }
      
      if (!email.trim()) {
        errors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(email)) {
        errors.email = 'Please enter a valid email address';
      }

      if (!password) {
        errors.password = 'Password is required';
      } else if (password.length < 6) {
        errors.password = 'Password must be at least 6 characters';
      }
    } else {
      if (!otp.trim()) {
        errors.otp = 'OTP is required';
      } else if (otp.trim().length !== 6 || !/^\d+$/.test(otp)) {
        errors.otp = 'OTP must be a 6-digit number';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSendOtp = async () => {
    if (!validateForm()) return;
    setOtpLoading(true);
    setLocalError(null);
    setSuccessMessage(null);
    try {
      const response = await MockAPI.signupSendOtp(username, email, password);
      setOtpSent(true);
      setSuccessMessage(response.message || 'Verification OTP sent to your email.');
    } catch (err: any) {
      setLocalError(err.message || 'Failed to send OTP.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLocalError(null);
    if (type === 'login') {
      dispatch(loginUser({ email, password }));
    } else {
      if (!otpSent) {
        await handleSendOtp();
      } else {
        dispatch(registerUserWithOtp({ username, email, password, otp }));
      }
    }
  };

  const activeError = error || localError;

  return (
    <div className="w-full max-w-md p-8 rounded-lg border border-hairline bg-canvas shadow-md">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-ink tracking-tight mb-2 font-display-sm">
          {type === "login" ? "Welcome Back" : "Create Account"}
        </h2>
        <p className="text-muted text-sm font-medium">
          {type === "login"
            ? "Sign in to manage and launch your quizzes"
            : otpSent 
              ? "Verify your email to complete registration"
              : "Register to start hosting live interactive quizzes"}
        </p>
      </div>

      {activeError && (
        <div className="mb-6 p-4 rounded-md bg-error/10 border border-error/20 text-error text-xs font-semibold animate-slide-up">
          ⚠️ {activeError}
        </div>
      )}

      {successMessage && (
        <div className="mb-6 p-4 rounded-md bg-success/10 border border-success/20 text-success text-xs font-semibold animate-slide-up">
          ✓ {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {type === "signup" && !otpSent && (
          <FormField label="Username" error={fieldErrors.username} required>
            <Input
              type="text"
              placeholder="e.g. quizmaster99"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              fullWidth
            />
          </FormField>
        )}

        {(!otpSent || type === 'login') && (
          <FormField label="Email Address" error={fieldErrors.email} required>
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
            />
          </FormField>
        )}

        {(!otpSent || type === 'login') && (
          <FormField label="Password" error={fieldErrors.password} required>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
            />
          </FormField>
        )}

        {type === "login" && (
          <div className="flex justify-end text-xs -mt-2">
            <Link href="/auth/forgot-password" className="text-accent font-semibold hover:underline">
              Forgot password?
            </Link>
          </div>
        )}

        {type === "signup" && otpSent && (
          <FormField label="Verification OTP" error={fieldErrors.otp} required>
            <Input
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              fullWidth
            />
          </FormField>
        )}

        {type === "signup" && otpSent && (
          <button
            type="button"
            onClick={handleSendOtp}
            disabled={otpLoading}
            className="text-xs text-left text-accent font-semibold hover:underline"
          >
            {otpLoading ? "Resending..." : "Didn't receive OTP? Resend"}
          </button>
        )}

        <Button
          type="submit"
          variant="primary"
          isLoading={loading || otpLoading}
          fullWidth
          className="mt-2"
        >
          {type === "login" ? "Sign In" : otpSent ? "Verify & Register" : "Send Verification OTP"}
        </Button>
      </form>

      <div className="text-center mt-6 text-xs text-muted font-medium">
        {type === "login" ? (
          <>
            <div>
              Don&apos;t have an account?{" "}
              <Link
                href="/auth/signup"
                className="text-ink font-bold hover:underline"
              >
                Sign up
              </Link>
            </div>
            <div className="mt-3 text-[11px] text-muted-soft">
              Forgot{" "}
              <Link href="/auth/forgot-username" className="text-accent font-semibold hover:underline">
                username
              </Link>{" "}
              or{" "}
              <Link href="/auth/forgot-email" className="text-accent font-semibold hover:underline">
                email
              </Link>
              ?
            </div>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="text-ink font-bold hover:underline"
            >
              Sign in
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
