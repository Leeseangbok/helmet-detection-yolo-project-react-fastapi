import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Upload, ShieldCheck, ShieldAlert, Download, Activity, Loader2, Video, ChevronRight, FileVideo } from 'lucide-react';

const API_URL = 'http://localhost:8000';

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [captures, setCaptures] = useState<{ safe: string[], violation: string[] }>({ safe: [], violation: [] });
  const [activeTab, setActiveTab] = useState<'violation' | 'safe'>('violation');
  const [isProcessing, setIsProcessing] = useState(false);

  // Poll for captures when a video is processing
  useEffect(() => {
    let interval: number;
    if (isProcessing) {
      interval = setInterval(async () => {
        try {
          const res = await axios.get(`${API_URL}/api/captures`);
          setCaptures(res.data);
        } catch (error) {
          console.error("Error fetching captures:", error);
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isProcessing]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API_URL}/api/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setVideoId(response.data.video_id);
      setIsProcessing(true);

    } catch (error) {
      console.error("Upload failed", error);
      alert("Failed to upload video");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05050A] text-slate-300 font-sans relative overflow-hidden selection:bg-indigo-500/30">

      {/* Dynamic Background Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/20 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/20 blur-[150px] pointer-events-none" />

      <div className="relative z-10 max-w-[1600px] mx-auto p-4 md:p-8 flex flex-col h-screen max-h-screen">

        {/* Header */}
        <header className="flex-none mb-8 flex items-center justify-between bg-white/[0.02] border border-white/[0.05] backdrop-blur-2xl px-8 py-5 rounded-3xl shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-[0_0_20px_rgba(99,102,241,0.4)]">
              <Activity size={24} className="text-white" />
              <div className="absolute inset-0 rounded-xl ring-1 ring-white/20" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent tracking-tight">
                HelmetGuard AI
              </h1>
              <p className="text-xs font-medium text-indigo-400 uppercase tracking-widest mt-0.5">Real-Time Traffic Safety</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
              System Online
            </div>
            <div className="h-4 w-px bg-white/10" />
            <div className="flex items-center gap-2">
              <ShieldAlert size={16} className="text-red-400" />
              {captures.violation.length} Violations
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">

          {/* Left Column: Video Processing (Spans 8 cols on large screens) */}
          <div className="lg:col-span-8 flex flex-col min-h-0 bg-white/[0.02] border border-white/[0.05] backdrop-blur-xl rounded-3xl p-6 shadow-2xl">

            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Video size={20} className="text-indigo-400" />
                Live Inference Stream
              </h2>
              {videoId && isProcessing && (
                <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-full">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                  </span>
                  <span className="text-xs font-medium text-indigo-300 uppercase tracking-wider">Processing Frame</span>
                </div>
              )}
            </div>

            <div className="flex-1 relative rounded-2xl overflow-hidden bg-black/50 border border-white/5 flex items-center justify-center group">
              {!videoId ? (
                // Upload UI
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 transition-all hover:bg-white/[0.02]">
                  <div className="w-24 h-24 mb-6 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(99,102,241,0.2)] transition-all duration-500">
                    <Upload size={40} className="text-indigo-400 group-hover:text-indigo-300 transition-colors" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">Upload Traffic Video</h3>
                  <p className="text-slate-400 mb-10 max-w-md text-center leading-relaxed">
                    Select an MP4 or AVI file to begin YOLOv8 real-time helmet detection and violation tracking.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                    <label className="flex-1 relative overflow-hidden rounded-xl cursor-pointer group/btn">
                      <div className="absolute inset-0 bg-gradient-to-r from-slate-800 to-slate-700 transition-transform group-hover/btn:scale-105" />
                      <div className="relative flex items-center justify-center gap-3 py-4 px-6 border border-white/10 rounded-xl hover:border-white/20 transition-colors">
                        <FileVideo size={20} className="text-slate-300" />
                        <span className="font-medium text-white truncate max-w-[200px]">
                          {file ? file.name : "Choose Video File"}
                        </span>
                      </div>
                      <input type="file" className="hidden" accept="video/mp4,video/x-m4v,video/*" onChange={handleFileChange} />
                    </label>

                    <button
                      onClick={handleUpload}
                      disabled={!file || isUploading}
                      className="relative overflow-hidden rounded-xl disabled:opacity-50 disabled:cursor-not-allowed group/process"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 transition-transform group-hover/process:scale-105" />
                      <div className="relative flex items-center justify-center gap-2 py-4 px-8 font-semibold text-white">
                        {isUploading ? (
                          <>
                            <Loader2 className="animate-spin" size={20} />
                            Uploading...
                          </>
                        ) : (
                          <>
                            Process <ChevronRight size={20} />
                          </>
                        )}
                      </div>
                    </button>
                  </div>
                </div>
              ) : (
                // Video Stream UI
                <>
                  <img
                    src={`${API_URL}/api/stream/${videoId}`}
                    alt="Live Inference Stream"
                    className="absolute inset-0 w-full h-full object-contain"
                    onError={() => {
                      if (isProcessing) setIsProcessing(false);
                    }}
                  />

                  {/* Download Overlay (Always visible when stopped, hover when running) */}
                  <div className={`absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent transition-opacity duration-300 flex justify-end ${isProcessing ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
                    <a
                      href={`${API_URL}/outputs/out_${videoId}`}
                      download
                      className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white font-medium py-3 px-6 rounded-xl flex items-center gap-3 transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                    >
                      <Download size={18} />
                      Download Result Video
                    </a>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right Column: Captures & Stats (Spans 4 cols on large screens) */}
          <div className="lg:col-span-4 flex flex-col min-h-0 bg-white/[0.02] border border-white/[0.05] backdrop-blur-xl rounded-3xl p-6 shadow-2xl">

            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <Activity size={20} className="text-purple-400" />
              Event Timeline
            </h3>

            {/* Elegant Tabs */}
            <div className="flex bg-black/40 rounded-xl p-1.5 mb-6 border border-white/5 backdrop-blur-sm">
              <button
                onClick={() => setActiveTab('violation')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${activeTab === 'violation'
                  ? 'bg-red-500/15 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.15)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
              >
                <ShieldAlert size={18} />
                Violations ({captures.violation.length})
              </button>
              <button
                onClick={() => setActiveTab('safe')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${activeTab === 'safe'
                  ? 'bg-emerald-500/15 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
              >
                <ShieldCheck size={18} />
                Safe ({captures.safe.length})
              </button>
            </div>

            {/* Gallery Area */}
            <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-4 custom-scrollbar">

              {activeTab === 'violation' && captures.violation.map((src, i) => (
                <div key={i} className="group relative rounded-2xl overflow-hidden border border-red-500/20 bg-black/40 p-2 transition-all hover:border-red-500/40 hover:bg-white/[0.02]">
                  <div className="relative rounded-xl overflow-hidden aspect-video">
                    <img src={`${API_URL}${src}`} alt="Violation" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="absolute top-4 right-4 bg-red-500/90 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.5)] flex items-center gap-1.5">
                    <ShieldAlert size={12} />
                    No Helmet
                  </div>
                </div>
              ))}

              {activeTab === 'safe' && captures.safe.map((src, i) => (
                <div key={i} className="group relative rounded-2xl overflow-hidden border border-emerald-500/20 bg-black/40 p-2 transition-all hover:border-emerald-500/40 hover:bg-white/[0.02]">
                  <div className="relative rounded-xl overflow-hidden aspect-video">
                    <img src={`${API_URL}${src}`} alt="Safe" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="absolute top-4 right-4 bg-emerald-500/90 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)] flex items-center gap-1.5">
                    <ShieldCheck size={12} />
                    Compliant
                  </div>
                </div>
              ))}

              {/* Empty States */}
              {(activeTab === 'violation' ? captures.violation.length : captures.safe.length) === 0 && (
                <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-slate-500">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 border ${activeTab === 'violation' ? 'bg-red-500/5 border-red-500/10 text-red-400/50' : 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400/50'}`}>
                    {activeTab === 'violation' ? <ShieldAlert size={32} /> : <ShieldCheck size={32} />}
                  </div>
                  <p className="text-sm font-medium">No {activeTab}s captured yet</p>
                  <p className="text-xs text-slate-600 mt-1">Upload a video to begin analysis</p>
                </div>
              )}
            </div>

          </div>
        </main>
      </div>

      {/* Custom Global Styles for Animations & Scrollbars */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .custom-scrollbar > div {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

export default App;
