"use client";

import { useEffect, useState } from "react";
import { socket } from "@/lib/socket-client";
import { FtpFile, SnapshotDiff } from "@/types/ftp";
import { FileTree } from "@/components/FileTree";
import { ActivityFeed, ActivityEntry } from "@/components/ActivityFeed";
import { FilePreview } from "@/components/FilePreview";

export default function Dashboard() {
  const [files, setFiles] = useState<FtpFile[]>([]);
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [selectedFile, setSelectedFile] = useState<FtpFile | null>(null);
  const [connected, setConnected] = useState(false);
  const [pollingInterval, setPollingInterval] = useState<number>(5000);

  useEffect(() => {
    // Initial fetch of current config
    fetch('/api/config')
      .then(res => res.json())
      .then(data => setPollingInterval(data.pollingIntervalMs))
      .catch(err => console.error('Failed to fetch config', err));

    socket.on("connect", () => {
      setConnected(true);
      console.log("Connected to WebSocket");
    });

    socket.on("disconnect", () => {
      setConnected(false);
      console.log("Disconnected from WebSocket");
    });

    socket.on("fs:snapshot", (data: { snapshot: FtpFile[] }) => {
      console.log("Received snapshot", data.snapshot);
      setFiles(data.snapshot);
    });

    socket.on("fs:diff", (diff: SnapshotDiff) => {
      console.log("Received diff", diff);
      
      const newActivities: ActivityEntry[] = [];
      const timestamp = new Date().toISOString();

      setFiles(prev => {
        let current = [...prev];

        // Handle deletions
        diff.deleted.forEach(file => {
          current = current.filter(f => f.path !== file.path);
          newActivities.push({ type: 'deleted', file, timestamp });
        });

        // Handle additions
        diff.added.forEach(file => {
          if (!current.find(f => f.path === file.path)) {
            current.push(file);
          }
          newActivities.push({ type: 'added', file, timestamp });
        });

        // Handle modifications
        diff.modified.forEach(file => {
          current = current.map(f => f.path === file.path ? file : f);
          newActivities.push({ type: 'modified', file, timestamp });
        });

        return current;
      });

      setActivities(prev => [newActivities[0], ...prev].slice(0, 50)); // Keep last 50
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("fs:snapshot");
      socket.off("fs:diff");
    };
  }, []);

  const handleUpdateInterval = async (val: string) => {
    const num = parseInt(val);
    if (isNaN(num)) return;
    
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pollingIntervalMs: num })
      });
      if (res.ok) {
        const data = await res.json();
        setPollingInterval(data.pollingIntervalMs);
      }
    } catch (err) {
      console.error('Failed to update interval', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">FTP Stream Monitor</h1>
          <div className="flex items-center mt-2">
            <span className={`inline-block w-3 h-3 rounded-full mr-2 ${connected ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span className="text-sm text-gray-600 font-medium">{connected ? 'Live' : 'Disconnected'}</span>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center space-x-4">
          <label className="text-sm font-semibold text-gray-700">Polling Interval (ms):</label>
          <input 
            type="number" 
            value={pollingInterval}
            onChange={(e) => setPollingInterval(parseInt(e.target.value))}
            onBlur={(e) => handleUpdateInterval(e.target.value)}
            className="w-24 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Sidebar: File Tree */}
        <div className="lg:col-span-3">
          <FileTree files={files} onFileClick={setSelectedFile} />
        </div>

        {/* Center: Preview */}
        <div className="lg:col-span-6 h-[600px]">
          <FilePreview file={selectedFile} />
        </div>

        {/* Right: Activity Feed */}
        <div className="lg:col-span-3">
          <ActivityFeed activities={activities} />
        </div>
      </div>
    </div>
  );
}
