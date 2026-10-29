import { redirect } from 'next/navigation';
import { use } from 'react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function Page({ params }: PageProps) {
  const resolvedParams = use(params);
  redirect(`/dashboard/quizzes/${resolvedParams.id}/stats`);
}
