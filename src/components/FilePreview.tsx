"use client";

import React, { useEffect, useState } from 'react';
import { FtpFile } from '../types/ftp';

interface FilePreviewProps {
  file: FtpFile | null;
}

export const FilePreview: React.FC<FilePreviewProps> = ({ file }) => {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setContent(null);
      return;
    }

    const fetchPreview = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/ftp/preview?path=${encodeURIComponent(file.path)}`);
        if (!response.ok) {
          throw new Error('Failed to load preview');
        }
        const text = await response.text();
        setContent(text);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPreview();
  }, [file]);

  if (!file) {
    return (
      <div className="bg-slate-900/40 backdrop-blur-md p-6 rounded-xl border border-slate-800/80 h-full flex flex-col items-center justify-center text-slate-500 italic min-h-[400px]">
        <span className="text-3xl mb-2">🔍</span>
        <span className="text-xs">Select a file from the explorer to preview its content</span>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/40 backdrop-blur-md p-4 rounded-xl border border-slate-800/80 h-full flex flex-col min-h-[400px]" data-test-id="file-preview-panel">
      <div className="flex justify-between items-center border-b border-slate-800/80 pb-3 mb-3">
        <div className="flex items-center gap-2 truncate">
          <span className="text-lg">📄</span>
          <div>
            <h2 className="text-sm font-bold text-slate-100 truncate max-w-[200px]" title={file.name}>
              {file.name}
            </h2>
            <p className="text-[10px] text-slate-500 font-mono truncate max-w-[280px]" title={file.path}>
              {file.path}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-slate-400 font-mono bg-slate-800/50 px-2 py-0.5 rounded border border-slate-850">
            {(file.size / 1024).toFixed(2)} KB
          </span>
          <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
            Modified: {new Date(file.modifiedAt).toLocaleTimeString()}
          </span>
        </div>
      </div>
      
      <div className="flex-grow overflow-auto bg-slate-950/80 text-slate-300 p-4 rounded-lg font-mono text-xs border border-slate-850 relative min-h-[280px]">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm z-10">
            <div className="flex flex-col items-center gap-2">
              <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-[10px] text-slate-400">Loading Preview...</span>
            </div>
          </div>
        ) : error ? (
          <div className="text-rose-400 bg-rose-950/10 border border-rose-900/30 p-3 rounded-lg flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        ) : (
          <pre className="whitespace-pre-wrap leading-relaxed select-text pr-2">{content || 'File is empty.'}</pre>
        )}
      </div>
    </div>
  );
};
