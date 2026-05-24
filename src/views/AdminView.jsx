import React, { useState } from 'react';
import { Sliders, Users, Key, Settings as SettingsIcon, Plus, Copy, Trash2, ToggleRight, ToggleLeft, Save, RefreshCw, Database, Wifi, WifiOff } from 'lucide-react';

export default function AdminView({
  users, setUsers, codes, setCodes,
  onDeleteUser, onDeleteCode, onInsertCode,
  showToast, copyCode, appSettings, setAppSettings, dbOnline
}) {
  const [activeTab, setActiveTab]   = useState('users');
  const [newUserName, setNewUserName] = useState('');
  const [voucherDays, setVoucherDays] = useState(3);
  const [cmsForm, setCmsForm]       = useState(appSettings);

  // ── User Handlers ─────────────────────────────────────────────────────────────
  const handleToggleUserStatus = (userId) => {
    setUsers(prev => prev.map(u =>
      u.id === userId ? { ...u, is_active: !u.is_active } : u
    ));
    showToast('User status updated', 'success');
  };

  const handleExtendAccess = (userId, days) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const base = u.access_expires_at && u.access_expires_at > Date.now() ? u.access_expires_at : Date.now();
        return { ...u, access_expires_at: base + days * 86400000 };
      }
      return u;
    }));
    showToast(`Added ${days} Day${days > 1 ? 's' : ''} to user access.`, 'success');
  };

  const handleCreateUser = (e) => {
    e.preventDefault();
    if (!newUserName.trim()) return;
    const formattedName = newUserName.startsWith('@') ? newUserName.trim() : `@${newUserName.trim()}`;
    if (users.find(u => u.username?.toLowerCase() === formattedName.toLowerCase())) {
      showToast('User already exists in directory', 'error');
      return;
    }
    const newUser = {
      id: Math.random().toString(36).substring(2, 9).toUpperCase(),
      username: formattedName,
      access_expires_at: null,
      is_active: true,
    };
    setUsers(prev => [...prev, newUser]);
    setNewUserName('');
    showToast(`User ${formattedName} registered.`, 'success');
  };

  const handleDeleteUser = (username) => {
    if (window.confirm(`Remove user ${username} permanently?`)) {
      onDeleteUser(username);
      showToast(`User ${username} removed.`, 'info');
    }
  };

  const handleRegenerateCodeForUser = (user) => {
    if (!user.access_expires_at || user.access_expires_at <= Date.now()) {
      showToast('User does not have active access.', 'error');
      return;
    }
    const remainingDays = Math.ceil((user.access_expires_at - Date.now()) / 86400000);
    const randPart = Math.random().toString(36).substring(2, 6).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    const newCodeStr = `DIDS-REGEN-${randPart}`;
    const newCode = {
      code: newCodeStr,
      days: remainingDays,
      is_redeemed: false,
      redeemed_by: null,
      redeemed_on_device: null,
      redeemed_at: null,
      expires_at: null,
    };
    onInsertCode(newCode);
    showToast(`Code for ${user.username}: ${newCodeStr}`, 'success');
    copyCode(newCodeStr);
  };

  const handleResetDeviceLock = (username) => {
    let found = false;
    setCodes(prev => prev.map(c => {
      if (c.redeemed_by?.toLowerCase() === username.toLowerCase() && c.is_redeemed) {
        found = true;
        return { ...c, redeemed_on_device: null };
      }
      return c;
    }));
    showToast(found ? `Device lock cleared for ${username}.` : `No active voucher found for ${username}.`, found ? 'success' : 'error');
  };

  const handleResetDatabase = () => {
    if (window.confirm('RESET the system database to initial defaults? This will erase all custom data!')) {
      ['didsbolt_settings', 'didsbolt_users', 'didsbolt_codes', 'didsbolt_device_id'].forEach(k => localStorage.removeItem(k));
      window.location.reload();
    }
  };

  // ── Code Handlers ─────────────────────────────────────────────────────────────
  const handleGenerateCode = () => {
    const randPart = Math.random().toString(36).substring(2, 6).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    const newCodeStr = `DIDS-${randPart}`;
    const newCode = {
      code: newCodeStr,
      days: Number(voucherDays),
      is_redeemed: false,
      redeemed_by: null,
      redeemed_on_device: null,
      redeemed_at: null,
      expires_at: null,
    };
    onInsertCode(newCode);
    showToast(`Code generated: ${newCodeStr}`, 'success');
    copyCode(newCodeStr);
  };

  const handleDeleteCode = (codeStr) => {
    onDeleteCode(codeStr);
    showToast('Voucher revoked.', 'info');
  };

  // ── Settings Handler ──────────────────────────────────────────────────────────
  const handleSaveSettings = (e) => {
    e.preventDefault();
    setAppSettings(cmsForm);
  };

  const handlePlanChange = (index, field, value) => {
    const updatedPlans = [...cmsForm.plans];
    updatedPlans[index][field] = field === 'priceUSD' || field === 'days' ? Number(value) : value;
    setCmsForm({ ...cmsForm, plans: updatedPlans });
  };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col p-5 bg-[#020617] overflow-y-auto no-scrollbar anim-fade-in">

      {/* Title & DB Badge */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-2 text-cyan-400 uppercase">
            <Sliders className="w-6 h-6" /> Oversight Control
          </h2>
          <div className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-full border ${
            dbOnline
              ? 'bg-green-950/40 border-green-500/30 text-green-400'
              : 'bg-amber-950/40 border-amber-500/30 text-amber-400'
          }`}>
            {dbOnline ? <Wifi size={10} /> : <WifiOff size={10} />}
            {dbOnline ? 'Supabase' : 'Local DB'}
          </div>
        </div>

        {/* Rapid Metrics */}
        <div className="grid grid-cols-3 gap-3">
          <div className="glass-card p-4 text-center">
            <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1.5">Total Users</div>
            <div className="text-2xl font-black text-white font-mono">{users.length}</div>
          </div>
          <div className="glass-card p-4 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-green-500/5" />
            <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1.5 relative z-10">Active Pro</div>
            <div className="text-2xl font-black text-green-400 font-mono relative z-10">
              {users.filter(u => u.access_expires_at && u.access_expires_at > Date.now()).length}
            </div>
          </div>
          <div className="glass-card p-4 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-cyan-500/5" />
            <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1.5 relative z-10">Avail Codes</div>
            <div className="text-2xl font-black text-cyan-400 font-mono relative z-10">
              {codes.filter(c => !c.is_redeemed).length}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex glass-card p-1.5 mb-6">
        {[['users', Users, 'Registry'], ['codes', Key, 'Vouchers'], ['settings', SettingsIcon, 'App CMS']].map(([tab, Icon, label]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 rounded-xl font-bold text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
              activeTab === tab ? 'bg-cyan-500 text-[#020617] shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* ── USERS TAB ── */}
      {activeTab === 'users' && (
        <div className="space-y-6 flex-1 anim-slide-in-right">
          <form onSubmit={handleCreateUser} className="glass-card p-5 space-y-4">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Manually Register Trader</div>
            <div className="flex gap-3">
              <input
                type="text" required value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="@username"
                className="flex-1 bg-slate-900/80 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500 font-medium placeholder:text-slate-600 transition-all shadow-inner"
              />
              <button type="submit" className="bg-cyan-500 hover:bg-cyan-400 text-black px-4 rounded-xl text-[11px] font-black flex items-center gap-1.5 uppercase tracking-wider transition-colors btn-press">
                <Plus size={16} /> Add
              </button>
            </div>
          </form>

          <div className="space-y-4 pb-8">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Registered Accounts ({users.length})</div>
            {users.map((u, i) => {
              const isPro = u.access_expires_at && u.access_expires_at > Date.now();
              const daysLeft = isPro ? Math.ceil((u.access_expires_at - Date.now()) / 86400000) : 0;
              return (
                <div key={u.id || i} className="glass-card p-5 flex flex-col gap-4 anim-fade-in-up" style={{ animationDelay: `${i * 0.04}s` }}>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-white text-base">{u.username}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">ID: {u.id}</div>
                      {isPro && (
                        <div className="text-[10px] text-green-400 font-semibold mt-1">
                          ⏳ {daysLeft}d {Math.ceil(((u.access_expires_at - Date.now()) % 86400000) / 3600000)}h remaining
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-[9px] font-black px-2 py-1 rounded tracking-widest uppercase ${
                        isPro ? 'bg-green-950/50 text-green-400 border border-green-800' : 'bg-slate-900 text-slate-500 border border-slate-700'
                      }`}>
                        {isPro ? 'PRO' : 'FREE'}
                      </span>
                      <button onClick={() => handleToggleUserStatus(u.id)} title="Toggle Status">
                        {u.is_active ? <ToggleRight size={28} className="text-cyan-400" /> : <ToggleLeft size={28} className="text-slate-600" />}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u.username)}
                        className="text-slate-500 hover:text-red-400 bg-slate-950/40 hover:bg-red-500/10 p-1.5 rounded-lg border border-slate-800 hover:border-red-500/20 transition-all"
                        title="Remove User"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Access extension buttons */}
                  <div className="flex gap-2 border-t border-slate-800/60 pt-3">
                    {[1, 3, 7].map(d => (
                      <button
                        key={d}
                        onClick={() => handleExtendAccess(u.id, d)}
                        className="flex-1 bg-slate-900 border border-slate-700/80 hover:border-cyan-500 hover:text-cyan-400 py-2 rounded-lg text-[10px] uppercase tracking-widest font-bold text-slate-300 transition-all btn-press"
                      >
                        +{d}d
                      </button>
                    ))}
                    <button
                      onClick={() => handleExtendAccess(u.id, 30)}
                      className="flex-1 bg-slate-900 border border-slate-700/80 hover:border-cyan-500 hover:text-cyan-400 py-2 rounded-lg text-[10px] uppercase tracking-widest font-bold text-slate-300 transition-all btn-press"
                    >
                      +30d
                    </button>
                  </div>

                  {/* Pro-only tools */}
                  {isPro && (
                    <div className="flex gap-2 border-t border-slate-800/40 pt-3">
                      <button
                        onClick={() => handleRegenerateCodeForUser(u)}
                        className="flex-1 bg-cyan-950/40 border border-cyan-500/20 hover:border-cyan-500/50 hover:text-cyan-300 py-2 rounded-lg text-[9px] uppercase tracking-widest font-black text-cyan-400 transition-all btn-press flex items-center justify-center gap-1.5"
                      >
                        <RefreshCw size={11} /> Regen Code
                      </button>
                      <button
                        onClick={() => handleResetDeviceLock(u.username)}
                        className="flex-1 bg-amber-950/40 border border-amber-500/20 hover:border-amber-500/50 hover:text-amber-300 py-2 rounded-lg text-[9px] uppercase tracking-widest font-black text-amber-400 transition-all btn-press flex items-center justify-center gap-1.5"
                      >
                        <Sliders size={11} /> Clear Device Lock
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── CODES TAB ── */}
      {activeTab === 'codes' && (
        <div className="space-y-6 flex-1 anim-slide-in-right">
          <div className="glass-card p-5 space-y-5">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Create Access Voucher</div>
            <div className="space-y-3">
              <label className="text-[10px] text-slate-500 font-bold block uppercase tracking-widest ml-1">Access Duration</label>
              <select
                value={voucherDays}
                onChange={(e) => setVoucherDays(e.target.value)}
                className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl p-3.5 text-white focus:outline-none focus:border-cyan-500 font-medium appearance-none transition-all"
              >
                <option value="1">1 Day Premium Access</option>
                <option value="3">3 Days Premium Access</option>
                <option value="7">7 Days Premium Access</option>
                <option value="30">30 Days Premium Access</option>
              </select>
            </div>
            <button
              onClick={handleGenerateCode}
              className="w-full bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-[#020617] font-black py-4 rounded-xl transition-all shadow-lg text-xs uppercase tracking-widest btn-press"
            >
              Generate &amp; Copy Voucher
            </button>
          </div>

          <div className="space-y-3 pb-8">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">
              System Vouchers ({codes.length})
            </div>
            {codes.length === 0 ? (
              <p className="text-slate-600 text-sm text-center py-6 font-medium">No vouchers configured</p>
            ) : (
              codes.map((c, i) => (
                <div key={i} className="glass-card p-5 flex items-center justify-between anim-fade-in-up" style={{ animationDelay: `${i * 0.04}s` }}>
                  <div className="flex-1 mr-4">
                    <div className="font-mono text-cyan-400 font-bold text-sm flex items-center gap-2 mb-1.5">
                      {c.code}
                      <button onClick={() => copyCode(c.code)} className="text-slate-500 hover:text-white bg-slate-800 p-1.5 rounded transition-colors">
                        <Copy size={12} />
                      </button>
                    </div>
                    <div className="text-[11px] font-medium text-slate-400 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-[10px] text-slate-300 font-bold font-mono">{c.days}d</span>
                        {!c.is_redeemed ? (
                          <span className="text-green-400 font-black text-[9px] uppercase tracking-wider bg-green-950/40 border border-green-500/20 px-1.5 py-0.5 rounded">Unused</span>
                        ) : (
                          <span className="text-red-400 font-black text-[9px] uppercase tracking-wider bg-red-950/40 border border-red-500/20 px-1.5 py-0.5 rounded">Redeemed</span>
                        )}
                      </div>
                      {c.is_redeemed && (
                        <div className="space-y-1 border-t border-slate-800/40 pt-2 mt-1">
                          <div className="text-slate-500">
                            Locked to: <span className="text-amber-400 font-black">{c.redeemed_by}</span>
                          </div>
                          <div className="text-slate-500 text-[10px]">
                            Device: <span className="text-cyan-300 font-mono">{c.redeemed_on_device || 'N/A'}</span>
                          </div>
                          <div className="text-slate-500 flex items-center gap-1 flex-wrap">
                            <span>Expires:</span>
                            <span className="text-slate-300 font-semibold">{c.expires_at ? new Date(c.expires_at).toLocaleString() : 'N/A'}</span>
                            {c.expires_at && (
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${c.expires_at > Date.now() ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-500/25' : 'bg-red-950/80 text-red-400 border border-red-500/25'}`}>
                                {c.expires_at > Date.now() ? `${Math.ceil((c.expires_at - Date.now()) / 86400000)}d left` : 'Expired'}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteCode(c.code)}
                    className="text-slate-500 hover:text-red-500 bg-slate-800/50 hover:bg-red-500/10 p-2.5 rounded-xl transition-colors"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── SETTINGS TAB ── */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="space-y-6 flex-1 anim-slide-in-right pb-8">
          {/* DB Status Info */}
          <div className={`flex items-center gap-3 p-4 rounded-xl border text-xs font-semibold ${
            dbOnline ? 'bg-green-950/20 border-green-500/20 text-green-400' : 'bg-amber-950/20 border-amber-500/20 text-amber-400'
          }`}>
            <Database size={15} />
            {dbOnline
              ? 'Supabase database is connected. All changes are persisted in the cloud.'
              : 'Using localStorage fallback. Add Supabase credentials in .env to enable cloud sync.'}
          </div>

          <div className="glass-card p-5 space-y-5">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Global Variables</div>
            <div className="space-y-2">
              <label className="text-[10px] text-slate-500 font-bold block uppercase tracking-widest">Support Name</label>
              <input type="text" value={cmsForm.supportName} onChange={(e) => setCmsForm({ ...cmsForm, supportName: e.target.value })}
                className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] text-slate-500 font-bold block uppercase tracking-widest">Telegram Link URL</label>
              <input type="text" value={cmsForm.telegramLink} onChange={(e) => setCmsForm({ ...cmsForm, telegramLink: e.target.value })}
                className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-all" />
            </div>
          </div>

          <div className="glass-card p-5 space-y-5">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Plan Customization</div>
            {cmsForm.plans.map((plan, idx) => (
              <div key={idx} className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 space-y-4">
                <div className="font-bold text-amber-400 text-sm">{plan.name} (Plan {idx + 1})</div>
                <div className="space-y-2">
                  <label className="text-[9px] text-slate-500 font-bold block uppercase tracking-widest">Plan Name</label>
                  <input type="text" value={plan.name} onChange={(e) => handlePlanChange(idx, 'name', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500" />
                </div>
                <div className="flex gap-3">
                  <div className="space-y-2 flex-1">
                    <label className="text-[9px] text-slate-500 font-bold block uppercase tracking-widest">USD Price</label>
                    <input type="number" value={plan.priceUSD} onChange={(e) => handlePlanChange(idx, 'priceUSD', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500" />
                  </div>
                  <div className="space-y-2 flex-1">
                    <label className="text-[9px] text-slate-500 font-bold block uppercase tracking-widest">Days</label>
                    <input type="number" value={plan.days} onChange={(e) => handlePlanChange(idx, 'days', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] text-slate-500 font-bold block uppercase tracking-widest">Description</label>
                  <input type="text" value={plan.desc} onChange={(e) => handlePlanChange(idx, 'desc', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500" />
                </div>
              </div>
            ))}
          </div>

          <button type="submit"
            className="w-full bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-black font-black py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(251,191,36,0.2)] text-xs uppercase tracking-widest btn-press flex justify-center items-center gap-2">
            <Save size={17} /> Save All Changes
          </button>

          <button type="button" onClick={handleResetDatabase}
            className="w-full bg-red-950/40 border border-red-500/30 hover:border-red-500 hover:text-red-400 text-red-500 font-black py-4 rounded-xl transition-all text-xs uppercase tracking-widest btn-press flex justify-center items-center gap-2">
            Reset System to Defaults
          </button>
        </form>
      )}

    </div>
  );
}
