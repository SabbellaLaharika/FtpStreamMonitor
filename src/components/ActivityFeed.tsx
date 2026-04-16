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
    <div className="bg-gray-50 p-4 rounded shadow border border-gray-200" data-test-id="activity-feed">
      <h2 className="text-xl font-bold mb-4">Activity Feed</h2>
      <div className="space-y-2 overflow-y-auto max-h-[400px]">
        {activities.length === 0 && <p className="text-gray-500 italic">No activity detected yet.</p>}
        {activities.map((activity, index) => (
          <div 
            key={`${activity.timestamp}-${index}`}
            className={`p-3 rounded border-l-4 ${
              activity.type === 'added' ? 'bg-green-50 border-green-500' :
              activity.type === 'modified' ? 'bg-yellow-50 border-yellow-500' :
              'bg-red-50 border-red-500'
            }`}
            data-test-id={`activity-item-${activity.type}-${encodePath(activity.file.path)}`}
          >
            <div className="flex justify-between items-start">
              <span className="font-semibold capitalize text-gray-700">{activity.type}</span>
              <span className="text-xs text-gray-400">{new Date(activity.timestamp).toLocaleTimeString()}</span>
            </div>
            <div className="text-sm truncate font-mono mt-1" title={activity.file.path}>
              {activity.file.path}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Size: {activity.file.size} bytes
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
