"use client";

import React from 'react';
import { FtpFile } from '../types/ftp';
import { encodePath } from '../lib/utils';

interface FileTreeProps {
  files: FtpFile[];
  onFileClick: (file: FtpFile) => void;
}

export const FileTree: React.FC<FileTreeProps> = ({ files, onFileClick }) => {
  // Convert flat list to hierarchy
  const buildTree = (files: FtpFile[]) => {
    const root: any = { _file: null, _children: {} };
    files.forEach(file => {
      const parts = file.path.split('/').filter(p => p);
      let current = root;
      parts.forEach((part, index) => {
        if (!current._children[part]) {
          current._children[part] = {
            _file: index === parts.length - 1 ? file : null,
            _children: {}
          };
        }
        current = current._children[part];
      });
    });
    return root;
  };

  const tree = buildTree(files);

  const renderNode = (node: any, name: string, path: string) => {
    const file = node._file;
    const children = Object.keys(node._children);
    const isDirectory = file ? file.type === 'directory' : true;
    const fullPath = path || '/';

    return (
      <div key={fullPath} className="ml-4">
        <div 
          className={`flex items-center p-1 cursor-pointer hover:bg-gray-100 rounded ${file?.type === 'file' ? 'text-blue-600' : 'font-bold text-gray-800'}`}
          data-test-id={`file-tree-item-${encodePath(file?.path || fullPath)}`}
          onClick={() => file && file.type === 'file' && onFileClick(file)}
        >
          {isDirectory ? '📁' : '📄'} {name || '/'}
        </div>
        {children.map(childName => renderNode(node._children[childName], childName, `${fullPath === '/' ? '' : fullPath}/${childName}`))}
      </div>
    );
  };

  return (
    <div className="bg-white p-4 rounded shadow border border-gray-200 overflow-auto max-h-[600px]">
      <h2 className="text-xl font-bold mb-4">File Tree</h2>
      {renderNode(tree, '', '')}
    </div>
  );
};
