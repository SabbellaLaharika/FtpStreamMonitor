"use client";

import React from 'react';
import { FtpFile } from '../types/ftp';
import { encodePath } from '../lib/utils';

export interface ActivityEntry {
  type: 'added' | 'modified' | 'deleted';
  file: FtpFile;
  timestamp: string;
}

interface ActivityFeedProps {
  activities: ActivityEntry[];
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities }) => {
  return (
    <div className="bg-slate-900/40 backdrop-blur-md p-4 rounded-xl border border-slate-800/80 flex flex-col h-full min-h-[400px]" data-test-id="activity-feed">
      <h2 className="text-md font-bold text-slate-100 mb-3 flex items-center gap-2">
        <span>⚡</span> Live Activity
      </h2>
      <div className="space-y-2.5 overflow-y-auto flex-grow pr-1 max-h-[500px]">
        {activities.length === 0 && (
          <div className="text-slate-500 text-xs italic p-4 text-center">
            No filesystem activity detected yet.
          </div>
        )}
        {activities.map((activity, index) => (
          <div 
            key={`${activity.timestamp}-${index}`}
            className={`p-3 rounded-lg border transition-all duration-150 ${
              activity.type === 'added' ? 'bg-emerald-950/20 border-emerald-900/50 text-emerald-400' :
              activity.type === 'modified' ? 'bg-amber-950/20 border-amber-900/50 text-amber-400' :
              'bg-rose-950/20 border-rose-900/50 text-rose-400'
            }`}
            data-test-id={`activity-item-${activity.type}-${encodePath(activity.file.path)}`}
          >
            <div className="flex justify-between items-start gap-2">
              <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                activity.type === 'added' ? 'bg-emerald-500/10 text-emerald-300' :
                activity.type === 'modified' ? 'bg-amber-500/10 text-amber-300' :
                'bg-rose-500/10 text-rose-300'
              }`}>
                {activity.type}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {new Date(activity.timestamp).toLocaleTimeString()}
              </span>
            </div>
            
            <div className="text-xs truncate font-mono mt-2 text-slate-300" title={activity.file.path}>
              {activity.file.path}
            </div>
            
            <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1.5 font-mono">
              <span>Size: {activity.file.size} B</span>
              <span>{activity.file.type}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
