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
      <div className="bg-white p-6 rounded shadow border border-gray-200 h-full flex items-center justify-center text-gray-400 italic">
        Select a file from the tree to view its content.
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded shadow border border-gray-200 h-full flex flex-col" data-test-id="file-preview-panel">
      <div className="border-bottom mb-4 pb-2 border-b border-gray-100 flex justify-between items-center">
        <h2 className="text-xl font-bold truncate pr-4">{file.name}</h2>
        <span className="text-sm text-gray-400 font-mono">{file.path}</span>
      </div>
      
      <div className="flex-grow overflow-auto bg-gray-900 text-gray-100 p-4 rounded font-mono text-sm">
        {loading ? (
          <div className="flex items-center justify-center h-full">Loading...</div>
        ) : error ? (
          <div className="text-red-400">{error}</div>
        ) : (
          <pre className="whitespace-pre-wrap">{content || 'File is empty.'}</pre>
        )}
      </div>
    </div>
  );
};
