"use client";

import {
  RefreshCcw,
  ExternalLink,
  Bot,
  FileText,
  Calendar,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Play,
  Database,
  Trash2,
  Code2
} from "lucide-react";
import { useEffect, useState, useCallback } from "react"; // Added useCallback
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";

export default function DashboardPage() {
  // 🔴 SPLASH SCREEN STATE
  const [showSplash, setShowSplash] = useState(true);

  const [articles, setArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [activeTab, setActiveTab] = useState("updated");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [liveStatus, setLiveStatus] = useState(null);
  
  // LOGGING & PROGRESS
  const [showLogs, setShowLogs] = useState(false);
  const [logs, setLogs] = useState([]);
  const [progress, setProgress] = useState(0); 
  const [running, setRunning] = useState(false);

  const [deleting, setDeleting] = useState(false);

  // ---------------- SPLASH SCREEN TIMER ----------------
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // ---------------- FETCH DATA ----------------
  // Wrapped in useCallback to ensure stable reference
  const fetchData = useCallback(async () => {
    // Only set loading on initial fetch, not updates
    if (articles.length === 0) setLoading(true);
    setError(null);

    try {
      const [origRes, updRes] = await Promise.all([
        fetch("/api/articles"),
        fetch("/api/updated-articles")
      ]);

      const origJson = await origRes.json();
      const updJson = await updRes.json();

      if (!origJson.success || !updJson.success) {
        throw new Error("API response invalid");
      }

      const merged = origJson.data.map((orig) => {
        const updated = updJson.data.find(
          (u) => u.originalArticleId?._id === orig._id
        );

        return {
          id: orig._id,
          title: orig.title,
          original: orig,
          updated: updated || null,
          status: updated ? "Published" : "Pending"
        };
      });

      setArticles(merged);
      
      // 🟢 CRITICAL FIX: Sync selection with new data using functional state update
      setSelectedArticle((prev) => {
        // 1. If nothing selected, logic depends on device width
        if (!prev) {
            // On Desktop, select first. On Mobile, stay null (List View).
            return window.innerWidth >= 1024 ? merged[0] || null : null;
        }

        // 2. If something selected, check if it still exists in the new list
        const found = merged.find(a => a.id === prev.id);

        // 3. If missing (deleted), return null. This forces mobile view to close details.
        if (!found) return null;

        // 4. If found, return the updated object (so we see new AI status etc)
        return found;
      });
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [articles.length]); // Dependencies

  useEffect(() => {
    fetchData();
  }, []); // Run once on mount

  // ---------------- SCRAPE OLD ARTICLES ----------------
  const updateAllOldArticles = () => {
    setLiveStatus("Scraping...");
    setLogs([]);
    setProgress(0);
    setShowLogs(true);
    setRunning(true);
    setError(null);

    const es = new EventSource("/api/scrape-old-articles");

    es.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if(window.innerWidth > 768) setLiveStatus(data.stage || "Processing…");
      
      setLogs((prev) => [...prev.slice(-300), data]);

      if (data.stage === "LINKS_FETCHED") setProgress(10);
      if (data.stage === "PROCESSING_ARTICLE")
        setProgress((p) => Math.min(p + 20, 90));
      if (data.stage === "ARTICLE_SAVED")
        setProgress((p) => Math.min(p + 20, 95));

      if (data.stage === "COMPLETED") {
        setProgress(100);
        setLiveStatus("Done");
        es.close();
        setRunning(false);
        fetchData();
        setTimeout(() => setProgress(0), 3000);
      }

      if (data.stage === "FATAL_ERROR") {
        setLiveStatus("Error");
        es.close();
        setRunning(false);
      }
    };

    es.onerror = () => {
      setLiveStatus("Error");
      es.close();
      setRunning(false);
    };
  };

  // ---------------- SSE AI UPDATE ----------------
  const startAIUpdate = () => {
    setLiveStatus("Updating AI...");
    setLogs([]);
    setProgress(0);
    setShowLogs(true);
    setRunning(true);
    setError(null);

    const es = new EventSource("/api/update-articles");

    es.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if(window.innerWidth > 768) setLiveStatus(data.stage || "Processing…");
      setLogs((prev) => [...prev.slice(-300), data]);

      if (data.stage === "ARTICLES_FETCHED") setProgress(10);
      if (data.stage === "PROCESSING_ARTICLE")
        setProgress((p) => Math.min(p + 15, 90));
      if (data.stage === "REWRITING_WITH_LLM")
        setProgress((p) => Math.min(p + 10, 90));
      if (data.stage === "ARTICLE_UPDATED")
        setProgress((p) => Math.min(p + 15, 95));

      if (data.stage === "COMPLETED") {
        setProgress(100);
        setLiveStatus("Done");
        es.close();
        setRunning(false);
        fetchData();
        setTimeout(() => setProgress(0), 3000);
      }

      if (data.stage === "FATAL_ERROR") {
        setLiveStatus("Error");
        es.close();
        setRunning(false);
      }
    };

    es.onerror = () => {
      setLiveStatus("Error");
      es.close();
      setRunning(false);
    };
  };

  // ---------------- DIRECT DELETE HANDLER ----------------
  const deleteArticle = async (type) => {
    if (!selectedArticle) return;

    const isConfirmed = window.confirm(
      `Are you sure you want to delete the ${type === 'original' ? 'ORIGINAL' : 'AI UPDATED'} article? This cannot be undone.`
    );
    if (!isConfirmed) return;

    setDeleting(true);
    setError(null);

    try {
      // 🟢 OPTIMISTIC UPDATE: If deleting original, clear immediately for snappy mobile UI
      if (type === 'original') {
         setSelectedArticle(null);
      }

      const endpoint =
        type === "original"
          ? `/api/articles/${selectedArticle.id}`
          : selectedArticle.updated
          ? `/api/updated-articles/${selectedArticle.updated._id}`
          : null;

      if (!endpoint) return;

      const res = await fetch(endpoint, { method: "DELETE" });
      const json = await res.json();

      if (!json.success) {
        throw new Error(json.message || "Delete failed");
      }

      // If we deleted the AI version, switch tab to original automatically
      if (type === 'updated') {
        setActiveTab('original');
      }
      
      await fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const stripHtml = (html) => {
    const el = document.createElement("div");
    el.innerHTML = html || "";
    return el.textContent || "";
  };

  // 🔴 SPLASH SCREEN
  if (showSplash) {
    return (
      <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500">
        <div className="flex flex-col items-center gap-6 animate-pulse px-4">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center relative">
             <Image 
                src={'https://beyondchats.com/wp-content/uploads/2023/12/Beyond_Chats_Logo-removebg-preview.png'} 
                alt="logo" 
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
             />
          </div>
          
          <div className="text-center space-y-2">
             <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-widest font-sans">
               BeyondChat
             </h1>
             <p className="text-indigo-400 text-[10px] sm:text-xs tracking-[0.3em] uppercase opacity-80">
               Article Scraper & Updater
             </p>
          </div>
        </div>

        <div className="absolute bottom-8 sm:bottom-12 flex flex-col items-center text-center opacity-70">
            <p className="text-[10px] text-slate-500 font-mono mb-2 uppercase tracking-widest">
                Developed By
            </p>
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/50 rounded-full border border-slate-800">
               <Code2 className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-500" />
               <span className="text-xs sm:text-sm font-semibold text-slate-300">
                  Manan Vyas
               </span>
            </div>
        </div>
      </div>
    );
  }

  // ---------------- LOADING STATE ----------------
  if (loading && articles.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-slate-950">
        <RefreshCcw className="w-6 h-6 animate-spin text-indigo-500" />
      </div>
    );
  }

  // ---------------- MAIN RENDER ----------------
  return (
    <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950 text-slate-200">

      {/* HEADER */}
      <header className="h-16 border-b border-slate-800 flex items-center justify-between px-4 sm:px-6 shrink-0 bg-slate-950 z-20">
        <h2 className="text-base sm:text-lg font-semibold text-white truncate max-w-[100px] sm:max-w-none">
            Dashboard
        </h2>

        <div className="flex items-center gap-2 sm:gap-4">
          
          {/* Status & Progress - Responsive Layout */}
          <div className="flex items-center gap-3 justify-end">
             {error && (
                <span className="hidden sm:flex text-red-400 text-xs items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> Error
                </span>
              )}

              {liveStatus && (
                <span className="hidden md:block text-xs text-indigo-400 font-mono">{liveStatus}</span>
              )}

              {/* Progress Bar - Smaller on mobile */}
              {(running || progress > 0) && (
                <div className="flex items-center gap-2">
                  <div className="w-16 sm:w-24 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                    <div 
                      className="h-full bg-indigo-500 transition-all duration-300 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-[10px] sm:text-xs font-mono text-slate-400 w-[3ch] text-right">
                    {progress}%
                  </span>
                </div>
              )}
          </div>

          <div className="h-4 sm:h-6 w-px bg-slate-800 mx-1 sm:mx-2" />

          {/* Action Buttons - Icon Only on Mobile */}
          <button
            onClick={updateAllOldArticles}
            disabled={running}
            title="Scrape 5 Old Articles"
            className="p-2 sm:px-3 sm:py-1.5 text-xs bg-lime-700/80 hover:bg-lime-600 text-white rounded-md transition disabled:opacity-50 flex items-center justify-center"
          >
            <Database className="w-4 h-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Scrape 5 Old</span>
          </button>

          <button
            onClick={startAIUpdate}
            disabled={running}
            title="Run AI Update"
            className="p-2 sm:px-3 sm:py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded-md transition disabled:opacity-50 flex items-center justify-center"
          >
            <Play className="w-4 h-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Run AI</span>
          </button>
        </div>
      </header>

      {/* BODY CONTENT - Split View Logic */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* LEFT COLUMN (Article List) 
            Logic: 
            - Mobile: Hidden if an article is selected. Width 100% if showing.
            - Desktop (lg): Always width 1/3.
        */}
        <div className={`
            border-r border-slate-800 overflow-y-auto bg-slate-900/30 transition-all duration-300
            ${selectedArticle ? 'hidden lg:block w-full lg:w-1/3' : 'w-full lg:w-1/3'}
        `}>
          <div className="p-4 space-y-3">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2 mb-2">
              Oldest Five Articles ({articles.length})
            </div>

            {articles.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  setSelectedArticle(item);
                  setActiveTab(item.updated ? "updated" : "original");
                }}
                className={`p-4 rounded-xl border cursor-pointer transition-all active:scale-[0.98] ${
                  selectedArticle?.id === item.id
                    ? "bg-indigo-500/10 border-indigo-500/50"
                    : "bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-800"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${
                      item.status === "Published"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    }`}
                  >
                    {item.status === "Published" ? "Updated" : "Pending"}
                  </span>

                  {item.original.createdAt && (
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDistanceToNow(
                        new Date(item.original.createdAt)
                      )}
                    </span>
                  )}
                </div>

                <h4 className="font-medium text-sm mb-1 line-clamp-2 text-slate-200">
                  {item.title}
                </h4>

                <p className="text-xs text-slate-500 line-clamp-2">
                  {stripHtml(item.original.content).slice(0, 90)}…
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN (Article Detail) 
            Logic:
            - Mobile: Hidden if no article selected. Width 100% if showing.
            - Desktop (lg): Always flex-1.
        */}
        <div className={`
            overflow-y-auto bg-slate-950 relative transition-all duration-300
            ${!selectedArticle ? 'hidden lg:flex lg:flex-1' : 'w-full lg:flex-1'}
        `}>
          {selectedArticle ? (
            <div className="max-w-4xl mx-auto p-4 sm:p-8 pb-24">
                
              {/* MOBILE NAV: Back Button */}
              <button 
                onClick={() => setSelectedArticle(null)}
                className="lg:hidden mb-6 flex items-center gap-2 text-xs font-medium text-indigo-400 hover:text-indigo-300"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to List
              </button>

              {/* TITLE AREA */}
              <div className="mb-6 sm:mb-8">
                <h1 className="text-xl sm:text-2xl font-bold text-white mb-2 leading-tight">
                  {selectedArticle.title}
                </h1>

                <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-slate-400">
                  <span className="flex items-center gap-1">
                    <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                    {selectedArticle.original.author || "Unknown Author"}
                  </span>

                  {selectedArticle.updated && (
                    <span className="flex items-center gap-1 text-emerald-400">
                      <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      AI Enhanced
                    </span>
                  )}
                </div>
              </div>

              {/* STICKY TABS & ACTIONS */}
              <div className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur py-3 mb-6 border-b border-slate-800 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 transition-all">
                
                {/* Tabs - Full width on mobile */}
                <div className="flex bg-slate-900 p-1 rounded-lg w-full sm:w-fit">
                  <button
                    onClick={() => setActiveTab("updated")}
                    disabled={!selectedArticle.updated}
                    className={`flex-1 sm:flex-none px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition text-center ${
                      activeTab === "updated"
                        ? "bg-indigo-600 text-white"
                        : "text-slate-400 hover:text-white disabled:opacity-50"
                    }`}
                  >
                    🤖 AI Enhanced
                  </button>

                  <button
                    onClick={() => setActiveTab("original")}
                    className={`flex-1 sm:flex-none px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition text-center ${
                      activeTab === "original"
                        ? "bg-slate-700 text-white"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    📄 Original
                  </button>
                </div>

                {/* Contextual Delete Buttons - Full width on mobile */}
                <div className="w-full sm:w-auto">
                  {activeTab === 'original' && (
                      <button 
                        onClick={() => deleteArticle('original')}
                        disabled={deleting}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-red-400 border border-red-900/50 bg-red-950/20 rounded hover:bg-red-900/40 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {deleting ? 'Deleting...' : 'Delete Original'}
                      </button>
                  )}

                  {activeTab === 'updated' && selectedArticle.updated && (
                      <button 
                        onClick={() => deleteArticle('updated')}
                        disabled={deleting}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-red-400 border border-red-900/50 bg-red-950/20 rounded hover:bg-red-900/40 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {deleting ? 'Deleting...' : 'Delete AI Version'}
                      </button>
                  )}
                </div>

              </div>

              {/* ARTICLE CONTENT */}
              <div className="animate-in fade-in duration-300">
                {activeTab === "updated" && !selectedArticle.updated ? (
                  <div className="p-8 sm:p-12 border border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center text-slate-500">
                    <Bot className="w-10 h-10 sm:w-12 sm:h-12 mb-4 opacity-50" />
                    <p className="text-sm sm:text-base text-center">This article has not been processed by AI yet.</p>
                  </div>
                ) : (
                  <>
                    {/* Typography: prose-base on mobile, prose-lg on desktop */}
                    <article className="prose prose-invert prose-base sm:prose-lg max-w-none prose-headings:text-indigo-100 prose-a:text-indigo-400 prose-img:rounded-xl">
                      <div
                        dangerouslySetInnerHTML={{
                          __html:
                            activeTab === "updated"
                              ? selectedArticle.updated.content
                              : selectedArticle.original.content
                        }}
                      />
                    </article>

                    {/* REFERENCES */}
                    {activeTab === "updated" &&
                      selectedArticle.updated?.references?.length > 0 && (
                        <div className="mt-8 sm:mt-12 pt-8 border-t border-slate-800">
                          <h3 className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
                            References & Sources
                          </h3>

                          <div className="grid gap-2 sm:gap-3">
                            {selectedArticle.updated.references.map(
                              (ref, idx) => (
                                <a
                                  key={idx}
                                  href={ref}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-3 p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition group"
                                >
                                  <div className="p-2 bg-slate-800 rounded text-indigo-400 group-hover:text-white transition">
                                    <ExternalLink className="w-4 h-4" />
                                  </div>
                                  <span className="text-xs sm:text-sm text-slate-300 truncate w-full">
                                    {ref}
                                  </span>
                                </a>
                              )
                            )}
                          </div>
                        </div>
                      )}
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-600 p-6 text-center">
              <ArrowRight className="w-10 h-10 sm:w-12 sm:h-12 mb-4 opacity-20 hidden lg:block" />
              <Bot className="w-10 h-10 mb-4 opacity-20 lg:hidden" />
              <p className="text-sm sm:text-base">Select an article from the list to view details</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}