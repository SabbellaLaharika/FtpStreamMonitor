"use client";

import React from 'react';
import { FtpFile } from '../types/ftp';
import { encodePath } from '../lib/utils';

interface FileTreeProps {
  files: FtpFile[];
  onFileClick: (file: FtpFile) => void;
}

export const FileTree: React.FC<FileTreeProps> = ({ files, onFileClick }) => {
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({ '/': true });

  const toggleExpand = (path: string) => {
    setExpanded(prev => ({ ...prev, [path]: !prev[path] }));
  };

  // Convert flat list to hierarchy
  const buildTree = (files: FtpFile[]) => {
    const root: any = { _file: null, _children: {} };
    files.forEach(file => {
      const parts = file.path.split('/').filter(p => p);
      let current = root;
      parts.forEach((part, index) => {
        if (!current._children[part]) {
          current._children[part] = {
            _file: null,
            _children: {}
          };
        }
        current = current._children[part];
        // Ensure folder file is set correctly even if sub-elements were processed first
        if (index === parts.length - 1) {
          current._file = file;
        }
      });
    });
    return root;
  };

  const tree = buildTree(files);

  const renderNode = (node: any, name: string, path: string) => {
    const file = node._file;
    const children = Object.keys(node._children);
    const isDirectory = file ? file.type === 'directory' : children.length > 0 || !name;
    const fullPath = path || '/';
    const isExpanded = expanded[fullPath] ?? false;

    return (
      <div key={fullPath} className="select-none">
        <div 
          className={`flex items-center justify-between py-1.5 px-2.5 my-0.5 rounded-lg cursor-pointer transition-all duration-150 group ${
            file?.type === 'file' 
              ? 'hover:bg-slate-800/60 text-slate-300 hover:text-cyan-400' 
              : 'hover:bg-slate-800/80 text-slate-200 hover:text-white'
          }`}
          data-test-id={`file-tree-item-${encodePath(file?.path || fullPath)}`}
          onClick={(e) => {
            if (isDirectory) {
              toggleExpand(fullPath);
            } else if (file) {
              onFileClick(file);
            }
          }}
        >
          <div className="flex items-center gap-2 truncate">
            {isDirectory ? (
              <span className={`transition-transform duration-200 text-slate-500 group-hover:text-slate-300 ${isExpanded ? 'rotate-90' : ''}`}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" />
                </svg>
              </span>
            ) : (
              <span className="w-3.5" />
            )}
            
            <span className="text-lg">
              {isDirectory ? '📁' : '📄'}
            </span>
            
            <span className={`text-sm truncate ${file?.type === 'file' ? 'font-medium' : 'font-semibold'}`}>
              {name || '/'}
            </span>
          </div>

          {file && file.size > 0 && (
            <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono group-hover:bg-slate-700">
              {(file.size / 1024).toFixed(1)} KB
            </span>
          )}
        </div>

        {isDirectory && isExpanded && children.length > 0 && (
          <div className="pl-4 border-l border-slate-800/80 ml-4 my-1">
            {children.map(childName => 
              renderNode(
                node._children[childName], 
                childName, 
                `${fullPath === '/' ? '' : fullPath}/${childName}`
              )
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-slate-900/40 backdrop-blur-md p-4 rounded-xl border border-slate-800/80 flex flex-col h-full min-h-[400px]">
      <h2 className="text-md font-bold text-slate-100 mb-3 flex items-center gap-2">
        <span>📂</span> Explorer
      </h2>
      <div className="overflow-y-auto flex-grow pr-1 max-h-[500px]">
        {files.length === 0 ? (
          <div className="text-slate-500 text-xs italic p-4 text-center">Empty directory</div>
        ) : (
          renderNode(tree, '', '')
        )}
      </div>
    </div>
  );
};
