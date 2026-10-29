import React from 'react';
import { Quiz } from '@/lib/api';
import Button from '../atoms/Button';
import Badge from '../atoms/Badge';

interface QuizCardProps {
  quiz: Quiz;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onLaunch: (id: string) => void;
}

export default function QuizCard({
  quiz,
  onEdit,
  onDelete,
  onLaunch,
}: QuizCardProps) {
  const formattedDate = new Date(quiz.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="glass-panel rounded-2xl p-6 flex flex-col justify-between h-full border border-violet-500/10 hover:border-violet-500/30 transition-all duration-300">
      <div>
        <div className="flex justify-between items-start gap-4 mb-3">
          <h3 className="text-xl font-bold text-white light:text-slate-800 tracking-tight line-clamp-1">
            {quiz.title}
          </h3>
          <Badge variant={quiz.isPublished ? 'success' : 'warning'}>
            {quiz.isPublished ? 'Published' : 'Draft'}
          </Badge>
        </div>
        
        <p className="text-gray-400 light:text-slate-600 text-sm mb-6 line-clamp-2 min-h-10">
          {quiz.description || 'No description provided.'}
        </p>

        <div className="flex gap-4 mb-6 text-xs text-gray-500 light:text-slate-500 font-medium">
          <div className="flex items-center gap-1.5">
            <span className="text-violet-400">⚡</span>
            <span>{quiz.questions.length} Questions</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-pink-400">📅</span>
            <span>Created {formattedDate}</span>
          </div>
          {quiz.joinCode && (
            <div className="flex items-center gap-1.5 ml-auto text-emerald-400 light:text-emerald-600">
              <span>Code:</span>
              <span className="font-mono font-bold tracking-wider">{quiz.joinCode}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2 border-t border-gray-800/80 pt-4 mt-auto">
        <Button
          variant="primary"
          size="sm"
          className="flex-1"
          onClick={() => onLaunch(quiz.id)}
        >
          {quiz.isPublished ? 'Enter Live' : 'Launch Quiz'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(quiz.id)}
        >
          Edit / Stats
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="hover:bg-red-950/20 hover:text-red-400 text-gray-500 border border-transparent hover:border-red-900/30"
          onClick={() => onDelete(quiz.id)}
        >
          🗑️
        </Button>
      </div>
    </div>
  );
}
