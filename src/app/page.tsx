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

      // Fix bug: prepend all new activities, not just the first one
      setActivities(prev => [...newActivities, ...prev].slice(0, 50)); 
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

  const totalFiles = files.filter(f => f.type === 'file');
  const totalDirectories = files.filter(f => f.type === 'directory').length;
  const totalSize = totalFiles.reduce((acc, curr) => acc + curr.size, 0);

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 p-6 md:p-8 font-sans antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      <header className="relative mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-900 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-3xl">📡</span>
            <h1 className="text-2xl font-black text-slate-50 tracking-tight bg-gradient-to-r from-slate-50 to-slate-400 bg-clip-text text-transparent">
              FTP Stream Monitor
            </h1>
          </div>
          <div className="flex items-center mt-2 gap-2">
            <span className={`relative flex h-2.5 w-2.5`}>
              {connected && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${connected ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
            </span>
            <span className={`text-xs font-semibold ${connected ? 'text-emerald-400' : 'text-rose-400'}`}>
              {connected ? 'Real-Time Sync Active' : 'WebSocket Disconnected'}
            </span>
          </div>
        </div>
        
        <div className="bg-slate-900/60 backdrop-blur-md px-4 py-2.5 rounded-xl border border-slate-800/80 flex items-center space-x-3.5">
          <label className="text-xs font-semibold text-slate-400">Interval:</label>
          <div className="relative flex items-center">
            <input 
              type="number" 
              value={pollingInterval}
              onChange={(e) => setPollingInterval(parseInt(e.target.value))}
              onBlur={(e) => handleUpdateInterval(e.target.value)}
              className="w-20 bg-slate-950 text-slate-100 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500/50 text-center"
            />
            <span className="text-[10px] text-slate-500 ml-2 font-mono">ms</span>
          </div>
        </div>
      </header>

      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 relative">
        <div className="bg-slate-900/30 backdrop-blur-md p-4 rounded-xl border border-slate-800/60 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Directories</p>
            <h3 className="text-xl font-bold text-slate-200 mt-1">{totalDirectories}</h3>
          </div>
          <span className="text-2xl opacity-60">📁</span>
        </div>
        <div className="bg-slate-900/30 backdrop-blur-md p-4 rounded-xl border border-slate-800/60 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Files Tracked</p>
            <h3 className="text-xl font-bold text-slate-200 mt-1">{totalFiles.length}</h3>
          </div>
          <span className="text-2xl opacity-60">📄</span>
        </div>
        <div className="bg-slate-900/30 backdrop-blur-md p-4 rounded-xl border border-slate-800/60 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Total Size</p>
            <h3 className="text-xl font-bold text-slate-200 mt-1">
              {(totalSize / 1024).toFixed(1)} <span className="text-xs font-mono text-slate-450">KB</span>
            </h3>
          </div>
          <span className="text-2xl opacity-60">💾</span>
        </div>
      </div>

      <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Sidebar: File Tree */}
        <div className="lg:col-span-3 h-full">
          <FileTree files={files} onFileClick={setSelectedFile} />
        </div>

        {/* Center: Preview */}
        <div className="lg:col-span-6 h-full min-h-[400px]">
          <FilePreview file={selectedFile} />
        </div>

        {/* Right: Activity Feed */}
        <div className="lg:col-span-3 h-full">
          <ActivityFeed activities={activities} />
        </div>
      </div>
    </div>
  );
}
