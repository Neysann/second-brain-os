'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from '@/context/ThemeContext';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';

const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-96 rounded-xl border border-zinc-800 bg-zinc-900/50 flex flex-col items-center justify-center text-zinc-500 animate-pulse">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-sm font-medium">Chargement de l'éditeur Markdown...</span>
      </div>
    ),
  }
);

interface MarkdownEditorWrapperProps {
  value: string;
  onChange: (val?: string) => void;
  height?: number | string;
  placeholder?: string;
}

export const MarkdownEditorWrapper: React.FC<MarkdownEditorWrapperProps> = ({
  value,
  onChange,
  height = 500,
}) => {
  const { theme } = useTheme();

  return (
    <div
      data-color-mode={theme === 'dark' ? 'dark' : 'light'}
      className={`second-brain-md-wrapper rounded-xl overflow-hidden border shadow-inner transition-colors ${
        theme === 'dark' ? 'border-zinc-800/80 bg-zinc-900/90' : 'border-zinc-200 bg-white'
      }`}
    >
      <MDEditor
        value={value}
        onChange={onChange}
        height={height}
        preview="live"
        className={`w-full transition-colors ${
          theme === 'dark'
            ? '!bg-zinc-900/90 !text-zinc-100'
            : '!bg-white !text-zinc-900'
        }`}
        textareaProps={{
          placeholder: 'Commencez à rédiger vos réflexions en Markdown...',
        }}
      />
    </div>
  );
};

export default MarkdownEditorWrapper;
