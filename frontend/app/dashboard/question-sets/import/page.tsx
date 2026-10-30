'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/atoms/Button';
import { ImportQuestionAction, ImportQuestionRow, MockAPI, Quiz } from '@/lib/api';
import { fetchQuizzes } from '@/store/quizSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

interface PreviewRow extends ImportQuestionRow {
  rowNumber: number;
  errors: string[];
  duplicate?: { quizId: string; quizTitle: string };
}

const HEADER_ALIASES: Record<string, string> = {
  question: 'text',
  questiontext: 'text',
  correctanswer: 'correctAnswer',
  correctoption: 'correctAnswer',
  correctoptionindex: 'correctOptionIndex',
  timelimit: 'timeLimit',
  points: 'pointsWeight',
  pointsweight: 'pointsWeight',
};

function normalizeQuestionText(text: string) {
  return text.trim().replace(/\s+/g, ' ').toLowerCase();
}

function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = '';
  let quoted = false;

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    const nextCharacter = input[index + 1];
    if (character === '"' && quoted && nextCharacter === '"') {
      value += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === ',' && !quoted) {
      row.push(value.trim());
      value = '';
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && nextCharacter === '\n') index += 1;
      row.push(value.trim());
      if (row.some((cell) => cell !== '')) rows.push(row);
      row = [];
      value = '';
    } else {
      value += character;
    }
  }

  row.push(value.trim());
  if (row.some((cell) => cell !== '')) rows.push(row);
  return rows;
}

function parseNumber(value: string, label: string, rowNumber: number, errors: string[]) {
  const parsed = Number(value);
  if (!value || !Number.isInteger(parsed)) {
    errors.push(`Row ${rowNumber}: ${label} must be a whole number.`);
    return 0;
  }
  return parsed;
}

function parseImportRows(csv: string, quizzes: Quiz[]): { rows: PreviewRow[]; error?: string } {
  const records = parseCsv(csv);
  if (records.length < 2) return { rows: [], error: 'CSV must include a header row and at least one question.' };

  const headers = records[0].map((header) => {
    const normalized = header.toLowerCase().replace(/[^a-z0-9]/g, '');
    return HEADER_ALIASES[normalized] || normalized;
  });
  const textIndex = headers.indexOf('text');
  const correctIndex = headers.indexOf('correctOptionIndex');
  const correctAnswerIndex = headers.indexOf('correctAnswer');
  const timeIndex = headers.indexOf('timeLimit');
  if (textIndex === -1 || (correctIndex === -1 && correctAnswerIndex === -1) || timeIndex === -1) {
    return { rows: [], error: 'CSV headers must include text, timeLimit, and correctAnswer (1-based) or correctOptionIndex (0-based).' };
  }

  const optionsByColumn = headers
    .map((header, index) => ({ header, index }))
    .filter(({ header }) => /^option[1-9][0-9]*$/.test(header));
  const pipeOptionsIndex = headers.indexOf('options');
  if (optionsByColumn.length < 2 && pipeOptionsIndex === -1) {
    return { rows: [], error: 'CSV must include at least option1 and option2, or an options column using | separators.' };
  }

  const rows = records.slice(1).map((record, rowIndex): PreviewRow => {
    const rowNumber = rowIndex + 2;
    const errors: string[] = [];
    const text = record[textIndex] || '';
    const options = optionsByColumn.length >= 2
      ? optionsByColumn.map(({ index }) => record[index] || '')
      : (record[pipeOptionsIndex] || '').split('|').map((option) => option.trim());
    const timeLimit = parseNumber(record[timeIndex] || '', 'timeLimit', rowNumber, errors);
    if (!text.trim()) errors.push(`Row ${rowNumber}: question text cannot be empty.`);
    if (options.length < 2 || options.some((option) => !option.trim())) {
      errors.push(`Row ${rowNumber}: provide at least two non-empty answer options.`);
    }
    if (timeLimit <= 0) errors.push(`Row ${rowNumber}: timeLimit must be positive.`);

    const parsedCorrect = parseNumber(
      record[correctIndex === -1 ? correctAnswerIndex : correctIndex] || '',
      correctIndex === -1 ? 'correctAnswer' : 'correctOptionIndex',
      rowNumber,
      errors,
    );
    const correctOptionIndex = correctIndex === -1 ? parsedCorrect - 1 : parsedCorrect;
    if (correctOptionIndex < 0 || correctOptionIndex >= options.length) {
      errors.push(`Row ${rowNumber}: correct answer must point to an existing option.`);
    }

    const pointsWeight = Number(record[headers.indexOf('pointsWeight')] || 1);
    if (!Number.isFinite(pointsWeight) || pointsWeight <= 0) {
      errors.push(`Row ${rowNumber}: pointsWeight must be positive.`);
    }

    const duplicate = quizzes
      .flatMap((quiz) => quiz.questions.map((question) => ({ quiz, question })))
      .find(({ question }) => normalizeQuestionText(question.text) === normalizeQuestionText(text));

    return {
      rowNumber,
      text: text.trim(),
      options: options.map((option) => option.trim()),
      correctOptionIndex,
      timeLimit,
      pointsWeight,
      duplicateAction: duplicate ? 'skip' : 'copy',
      errors,
      duplicate: duplicate ? { quizId: duplicate.quiz.id, quizTitle: duplicate.quiz.title } : undefined,
    };
  });

  return { rows };
}

function toImportRow(row: PreviewRow): ImportQuestionRow {
  return {
    text: row.text,
    options: row.options,
    correctOptionIndex: row.correctOptionIndex,
    timeLimit: row.timeLimit,
    pointsWeight: row.pointsWeight,
    duplicateAction: row.duplicateAction,
  };
}

export default function ImportQuestionSetsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const quizzes = useAppSelector((state) => state.quiz.quizzes);
  const user = useAppSelector((state) => state.auth.user);
  const [title, setTitle] = useState('Imported Question Bank');
  const [description, setDescription] = useState('');
  const [targetQuizId, setTargetQuizId] = useState('');
  const [rows, setRows] = useState<PreviewRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user && quizzes.length === 0) {
      dispatch(fetchQuizzes());
    }
  }, [dispatch, quizzes.length, user]);

  const invalidRows = useMemo(() => rows.filter((row) => row.errors.length > 0), [rows]);
  const duplicateRows = useMemo(() => rows.filter((row) => row.duplicate), [rows]);

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);
    setFileName(file.name);
    const parsed = parseImportRows(await file.text(), quizzes);
    setRows(parsed.rows);
    setError(parsed.error || null);
    if (parsed.rows.length > 0) setTitle(file.name.replace(/\.csv$/i, '') || 'Imported Question Bank');
  };

  const setAction = (rowNumber: number, duplicateAction: ImportQuestionAction) => {
    setRows((currentRows) => currentRows.map((row) => (
      row.rowNumber === rowNumber ? { ...row, duplicateAction } : row
    )));
  };

  const handleImport = async () => {
    if (!title.trim()) {
      setError('Question set title is required.');
      return;
    }
    if (rows.length === 0 || invalidRows.length > 0) {
      setError('Fix all invalid rows before importing.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const result = await MockAPI.importQuestions({
        targetQuizId: targetQuizId || undefined,
        title: title.trim(),
        description: description.trim(),
        rows: rows.map(toImportRow),
      });
      const { created, updated, skipped, copied } = result.summary;
      alert(`Import complete: ${created} new, ${updated} updated, ${copied} copied, ${skipped} skipped.`);
      router.push('/dashboard/question-sets');
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : 'Unable to import questions.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto animate-slide-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-900/60 light:border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-white light:text-slate-800 tracking-tight">Import Question Bank</h1>
          <p className="text-gray-400 light:text-slate-500 text-xs mt-1">Upload a CSV, review every row, and reconcile existing questions before saving.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/question-sets')}>Back to Question Sets</Button>
      </div>

      <div className="glass-panel p-6 rounded-2xl border border-violet-500/10 flex flex-col gap-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex flex-col gap-2 text-sm font-semibold text-gray-300 light:text-slate-700">
            Question set title
            <input value={title} onChange={(event) => setTitle(event.target.value)} className="px-4 py-3 rounded-xl bg-gray-900/60 light:bg-slate-100 border border-gray-800 light:border-slate-300 text-white light:text-slate-900 outline-none focus:border-violet-500" />
          </label>
          <label className="flex flex-col gap-2 text-sm font-semibold text-gray-300 light:text-slate-700">
            Save imported questions to
            <select value={targetQuizId} onChange={(event) => setTargetQuizId(event.target.value)} className="px-4 py-3 rounded-xl bg-gray-900/60 light:bg-slate-100 border border-gray-800 light:border-slate-300 text-white light:text-slate-900 outline-none focus:border-violet-500">
              <option value="">Create a new question set</option>
              {quizzes.map((quiz) => <option key={quiz.id} value={quiz.id}>{quiz.title}</option>)}
            </select>
          </label>
        </div>
        <label className="flex flex-col gap-2 text-sm font-semibold text-gray-300 light:text-slate-700">
          Description
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={2} className="px-4 py-3 rounded-xl bg-gray-900/60 light:bg-slate-100 border border-gray-800 light:border-slate-300 text-white light:text-slate-900 outline-none focus:border-violet-500" />
        </label>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <label className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold cursor-pointer transition-colors">
            Choose CSV file
            <input type="file" accept=".csv,text/csv" onChange={handleFile} className="sr-only" />
          </label>
          <span className="text-sm text-gray-400 light:text-slate-600">{fileName || 'Required columns: text, option1, option2, correctAnswer, timeLimit'}</span>
        </div>
      </div>

      {error && <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">{error}</div>}

      {rows.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-3 text-sm text-gray-300 light:text-slate-700">
            <span>{rows.length} rows</span>
            <span className={invalidRows.length ? 'text-red-400' : 'text-emerald-400'}>{invalidRows.length} invalid</span>
            <span className="text-amber-400">{duplicateRows.length} duplicates</span>
          </div>
          <div className="overflow-x-auto glass-panel rounded-2xl border border-gray-800 light:border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-900/70 light:bg-slate-100 text-gray-300 light:text-slate-700">
                <tr><th className="p-3">Row</th><th className="p-3 min-w-64">Question</th><th className="p-3">Options</th><th className="p-3">Time</th><th className="p-3">Review</th></tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.rowNumber} className="border-t border-gray-800/70 light:border-slate-200 align-top">
                    <td className="p-3 text-gray-400">{row.rowNumber}</td>
                    <td className="p-3 text-white light:text-slate-900 font-medium">{row.text || <span className="text-red-400">Empty</span>}
                      {row.errors.map((rowError) => <div key={rowError} className="text-xs text-red-400 mt-1">{rowError}</div>)}
                    </td>
                    <td className="p-3 text-gray-400 light:text-slate-600">{row.options.join(' | ')}</td>
                    <td className="p-3 text-gray-400 light:text-slate-600">{row.timeLimit}s</td>
                    <td className="p-3 min-w-52">
                      {row.duplicate ? (
                        <div className="flex flex-col gap-2">
                          <span className="text-xs text-amber-400">Matches “{row.duplicate.quizTitle}”</span>
                          <select value={row.duplicateAction} onChange={(event) => setAction(row.rowNumber, event.target.value as ImportQuestionAction)} className="px-2 py-2 rounded-lg bg-gray-900 light:bg-slate-100 border border-gray-700 light:border-slate-300 text-white light:text-slate-900 text-xs">
                            <option value="skip">Skip existing</option>
                            <option value="update">Update existing</option>
                            <option value="copy">Save as new copy</option>
                          </select>
                        </div>
                      ) : <span className="text-emerald-400 text-xs">New question</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => router.push('/dashboard/question-sets')}>Cancel</Button>
            <Button variant="primary" onClick={handleImport} disabled={saving || invalidRows.length > 0}>{saving ? 'Importing...' : 'Import Questions'}</Button>
          </div>
        </div>
      )}
    </div>
  );
}