'use client';

import React from 'react';
import AuthLayout from '@/components/templates/AuthLayout';
import AuthForm from '@/components/organisms/AuthForm';

export default function SignupPage() {
  return (
    <AuthLayout>
      <AuthForm type="signup" />
    </AuthLayout>
  );
}
