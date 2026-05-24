import React from 'react';
import { User, LogOut, ShieldCheck, ChevronLeft, Bell, Key, Zap, ExternalLink, Settings } from 'lucide-react';

export default function SettingsView({ user, onLogout, onBack, showToast, appSettings }) {
  const isPro = user?.access_expires_at && user.access_expires_at > Date.now();
  const isAdmin = user?.role === 'admin';

  const formatExpiry = (timestamp) => {
    if (!timestamp) return 'No Access';
    if (timestamp < Date.now()) return 'Expired';
    const days = Math.ceil((timestamp - Date.now()) / 86400000);
    return `${days} Days Remaining`;
  };

  const handleSupportClick = () => {
    window.open(appSettings.telegramLink, '_blank');
  };

  return (
    <div className="flex-1 flex flex-col p-5 bg-[#020617] overflow-y-auto no-scrollbar anim-slide-in-right relative">
      
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-cyan-900/10 rounded-full blur-[80px] pointer-events-none mix-blend-screen"></div>

      <div className="space-y-6 relative z-10 pb-8">
        <div className="flex items-center justify-between">
           <button onClick={onBack} className="text-slate-400 text-xs font-bold uppercase tracking-widest hover:text-white flex items-center gap-1 transition-colors">
             <ChevronLeft size={16} /> Back
           </button>
           <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1">
             <Settings size={12} className="text-cyan-400" /> Preferences
           </div>
        </div>

        {/* Profile Card */}
        <div className="glass-card p-6 text-center space-y-4">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-cyan-400/20 to-blue-500/20 border border-cyan-500/30 rounded-full flex items-center justify-center relative shadow-[0_0_20px_rgba(34,211,238,0.1)]">
            <User className="text-cyan-400 w-10 h-10" />
            {isPro && !isAdmin && (
               <div className="absolute -bottom-1 -right-1 bg-green-500 border-2 border-[#020617] rounded-full p-1 shadow-lg">
                 <ShieldCheck className="w-4 h-4 text-[#020617]" />
               </div>
            )}
            {isAdmin && (
               <div className="absolute -bottom-1 -right-1 bg-amber-500 border-2 border-[#020617] rounded-full p-1 shadow-lg">
                 <Key className="w-4 h-4 text-[#020617]" />
               </div>
            )}
          </div>

          <div>
            <h3 className="text-xl font-black text-white">{user?.username}</h3>
            <p className="text-cyan-400 text-xs font-bold tracking-widest uppercase mt-1">
              {isAdmin ? 'System Administrator' : 'Trader Account'}
            </p>
          </div>

          {!isAdmin && (
             <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-700/50 flex flex-col items-center">
               <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Access Status</div>
               {isPro ? (
                 <div className="text-green-400 font-black flex items-center gap-2">
                   <ShieldCheck size={16} /> {formatExpiry(user?.access_expires_at)}
                 </div>
               ) : (
                 <div className="text-red-400 font-black flex items-center gap-2">
                   Expired / Inactive
                 </div>
               )}
             </div>
          )}
        </div>

        {/* Options */}
        <div className="space-y-3">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Application Settings</div>
          
          <button className="w-full glass-card p-4 flex items-center justify-between hover:border-cyan-400/50 transition-colors group">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                <Bell size={16} />
              </div>
              <div className="text-left">
                <div className="font-bold text-slate-200 text-sm">Notifications</div>
                <div className="text-[10px] text-slate-500 font-medium">Signal alerts & updates</div>
              </div>
            </div>
            <div className="w-8 h-4 bg-cyan-500 rounded-full relative shadow-[0_0_10px_rgba(34,211,238,0.3)]">
              <div className="w-3 h-3 bg-white rounded-full absolute right-0.5 top-0.5"></div>
            </div>
          </button>

          <button 
            onClick={handleSupportClick}
            className="w-full glass-card p-4 flex items-center justify-between hover:border-blue-400/50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                <Zap size={16} />
              </div>
              <div className="text-left">
                <div className="font-bold text-slate-200 text-sm">Contact Support</div>
                <div className="text-[10px] text-slate-500 font-medium tracking-wide">@{appSettings.supportName}</div>
              </div>
            </div>
            <ExternalLink size={16} className="text-slate-500 group-hover:text-blue-400 transition-colors" />
          </button>
        </div>

        {/* Logout */}
        <button
          onClick={onLogout}
          className="w-full mt-6 bg-red-950/30 border border-red-900/50 hover:bg-red-900/50 text-red-400 font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-all uppercase tracking-widest text-xs btn-press"
        >
          <LogOut size={16} /> Disconnect Session
        </button>
      </div>
    </div>
  );
}
