import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Sparkles, Ghost, MessageCircle, RefreshCcw, Hash } from 'lucide-react';

interface Confession {
  confes: string;
  likes: number;
}

const COLORS = [
  { name: 'emerald', class: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' },
  { name: 'violet', class: 'bg-violet-500/20 border-violet-500/50 text-violet-400' },
  { name: 'amber', class: 'bg-amber-500/20 border-amber-500/50 text-amber-400' },
  { name: 'rose', class: 'bg-rose-500/20 border-rose-500/50 text-rose-400' },
  { name: 'cyan', class: 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400' },
];

export default function App() {
  const [confessions, setConfessions] = useState<Confession[]>([]);
  const [newConfession, setNewConfession] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchConfessions = async () => {
    try {
      const res = await fetch('/api/confessions');
      const data = await res.json();
      if (data.error) {
        setErrorMsg(data.details || data.error);
      } else {
        setConfessions(Array.isArray(data) ? data : []);
        setErrorMsg(null);
      }
    } catch (err) {
      console.error('Failed to fetch:', err);
      setErrorMsg('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfessions();
    const interval = setInterval(fetchConfessions, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newConfession.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/confessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newConfession }),
      });
      if (res.ok) {
        setNewConfession('');
        fetchConfessions();
      }
    } catch (err) {
      console.error('Failed to submit:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (confession: Confession) => {
    try {
      const res = await fetch(`/api/confessions/like`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: confession.confes })
      });
      if (res.ok) {
        setConfessions(prev => prev.map(c => 
          (c.confes === confession.confes) 
            ? { ...c, likes: (c.likes || 0) + 1 } 
            : c
        ));
      }
    } catch (err) {
      console.error('Failed to like:', err);
    }
  };

  return (
    <div className="min-h-screen font-sans p-4 md:p-8 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      {/* Header & Input Section */}
      <motion.section 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="sticky top-8 space-y-8"
      >
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-mono text-sm uppercase tracking-widest">
            <Sparkles size={16} />
            <span>Anonymous Wall</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter leading-none">
            SPILL <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">THE TEA.</span>
          </h1>
          <p className="text-zinc-500 text-lg max-w-md">
            No names. No judgment. Just pure, unadulterated truth. What's on your mind?
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative group">
            <textarea
              value={newConfession}
              onChange={(e) => setNewConfession(e.target.value)}
              placeholder="Type your confession here..."
              className="w-full h-48 p-6 glass rounded-3xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all resize-none text-xl placeholder:text-zinc-700"
              maxLength={500}
            />
            <div className="absolute bottom-4 right-4 text-zinc-600 font-mono text-xs">
              {newConfession.length}/500
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setSelectedColor(c)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    selectedColor.name === c.name ? 'scale-125 border-white' : 'border-transparent opacity-50 hover:opacity-100'
                  } ${c.class.split(' ')[0]}`}
                />
              ))}
            </div>

            <button
              disabled={isSubmitting || !newConfession.trim()}
              className="group relative px-8 py-4 bg-white text-black font-bold rounded-full overflow-hidden transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
            >
              <div className="relative z-10 flex items-center gap-2">
                <span>{isSubmitting ? 'SENDING...' : 'SEND IT'}</span>
                <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </div>
              <div className="absolute inset-0 bg-emerald-400 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </button>
          </div>
        </form>

        <div className="pt-8 flex items-center gap-6 text-zinc-600">
          <div className="flex items-center gap-2">
            <Ghost size={20} />
            <span className="text-sm font-medium">Fully Anonymous</span>
          </div>
          <div className="flex items-center gap-2">
            <MessageCircle size={20} />
            <span className="text-sm font-medium">{confessions.length} Confessions</span>
          </div>
        </div>
      </motion.section>

      {/* Feed Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <RefreshCcw size={20} className={isLoading ? 'animate-spin' : ''} />
            LATEST TEA
          </h2>
          <div className="px-3 py-1 glass rounded-full text-xs font-mono text-zinc-400">
            LIVE FEED
          </div>
        </div>

        <div className="space-y-4" ref={scrollRef}>
          {errorMsg && (
            <div className="p-4 bg-rose-500/20 border border-rose-500/50 rounded-2xl text-rose-400 text-sm font-mono">
              <p className="font-bold mb-1">ERROR DETECTED:</p>
              <p>{errorMsg}</p>
              <p className="mt-2 text-[10px] opacity-50 italic">Check if table 'confess' exists with columns 'confes' and 'likes'.</p>
            </div>
          )}
          <AnimatePresence mode="popLayout">
            {confessions.map((c, index) => {
              // We'll cycle through colors since Supabase doesn't store them now
              const colorClass = COLORS[index % COLORS.length].class;
              return (
                <motion.div
                  key={c.confes}
                  layout
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-6 rounded-3xl border ${colorClass} relative overflow-hidden group`}
                >
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Hash size={48} />
                  </div>
                  <p className="text-lg md:text-xl font-medium leading-relaxed relative z-10 whitespace-pre-wrap">
                    {c.confes}
                  </p>
                  <div className="mt-4 flex items-center justify-between text-xs font-mono opacity-60">
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => handleLike(c)}
                        className="flex items-center gap-1 hover:text-white transition-colors"
                      >
                        <Sparkles size={14} />
                        {c.likes || 0}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {confessions.length === 0 && !isLoading && (
            <div className="text-center py-20 glass rounded-3xl border-dashed">
              <Ghost size={48} className="mx-auto mb-4 text-zinc-700" />
              <p className="text-zinc-500">The wall is empty. Be the first to spill?</p>
            </div>
          )}
        </div>
      </section>

      {/* Background Decor */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full animate-float" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-500/10 blur-[120px] rounded-full animate-float" style={{ animationDelay: '1.5s' }} />
      </div>
    </div>
  );
}
