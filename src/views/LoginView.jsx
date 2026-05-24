import React, { useState, useEffect } from 'react';
import { Zap, User, Key } from 'lucide-react';

export default function LoginView({ onLogin }) {
  const [username, setUsername] = useState('');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [accessKey, setAccessKey] = useState('');
  const [clickCount, setClickCount] = useState(0);

  // Secret dot handler: 3 clicks within 2 seconds activates Admin mode
  const handleSecretClick = () => {
    setClickCount(prev => prev + 1);
  };

  useEffect(() => {
    if (clickCount >= 3) {
      setIsAdminMode(true);
      setClickCount(0); // Reset after triggering
    }

    if (clickCount > 0) {
      const timer = setTimeout(() => {
        setClickCount(0); // Reset if they don't click 3 times fast enough
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [clickCount]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isAdminMode) {
      if (accessKey.trim() === '') return;
      onLogin('admin', true, accessKey);
    } else {
      if (username.trim().length < 3) return;
      onLogin(username, false, '');
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 relative h-full">
      <div className="z-10 w-full max-w-sm space-y-10 anim-zoom-in">
        
        {/* Logo Section */}
        <div className="text-center stagger">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-cyan-400 via-blue-500 to-blue-700 rounded-3xl flex items-center justify-center shadow-[0_0_40px_rgba(34,211,238,0.4)] mb-8 anim-float relative">
            <div className="absolute inset-0 bg-white/20 rounded-3xl blur-md mix-blend-overlay"></div>
            <Zap className="text-[#020617] w-12 h-12 relative z-10" fill="currentColor" />
          </div>
          <h1 className="text-4xl font-black tracking-tight mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
            DIDSBOLT
          </h1>
          <p className="text-cyan-400 text-sm font-medium tracking-wide uppercase">
            {isAdminMode ? 'System Oversight Protocol' : 'Pro OTC Analytics'}
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5 glass-card p-7 stagger relative">
          
          {/* Back button for Admin Mode */}
          {isAdminMode && (
            <button 
              type="button" 
              onClick={() => { setIsAdminMode(false); setAccessKey(''); }}
              className="absolute -top-3 -right-3 bg-slate-800 text-slate-400 hover:text-white rounded-full w-8 h-8 flex items-center justify-center border border-slate-700 transition-colors shadow-lg"
            >
              ✕
            </button>
          )}

          {!isAdminMode ? (
            <div className="anim-fade-in">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">
                Telegram ID / Username
              </label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-700/80 text-white pl-12 pr-4 py-3.5 rounded-2xl focus:outline-none focus:border-cyan-500 focus:bg-slate-900 transition-all font-medium placeholder:text-slate-600 shadow-inner"
                  placeholder="@username"
                />
              </div>
            </div>
          ) : (
            <div className="anim-fade-in-down">
              <label className="block text-[11px] font-bold text-amber-400 uppercase tracking-widest mb-2 ml-1">Admin Secret Key</label>
              <div className="relative group">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-amber-400 transition-colors" />
                <input
                  type="password"
                  required
                  value={accessKey}
                  onChange={(e) => setAccessKey(e.target.value)}
                  className="w-full bg-slate-900/80 border border-amber-900/50 text-white pl-12 pr-4 py-3.5 rounded-2xl focus:outline-none focus:border-amber-500 focus:bg-slate-900 transition-all font-medium placeholder:text-slate-600 shadow-inner"
                  placeholder="••••••••••••"
                />
              </div>
            </div>
          )}
          
          <button
            type="submit"
            className={`w-full text-black font-black py-4 rounded-2xl transition-all btn-press text-sm tracking-wide uppercase mt-2 ${
              isAdminMode
                ? 'bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 shadow-[0_0_20px_rgba(251,191,36,0.3)]'
                : 'bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 shadow-[0_0_20px_rgba(34,211,238,0.3)]'
            }`}
          >
            {isAdminMode ? 'Authorize Session' : 'Access Analytics'}
          </button>
        </form>

      </div>

      {/* Secret Admin Dot */}
      <div 
        onClick={handleSecretClick}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full cursor-pointer bg-slate-800/20 hover:bg-slate-700/50 transition-colors"
        title="Hidden Trigger"
      ></div>
    </div>
  );
}
