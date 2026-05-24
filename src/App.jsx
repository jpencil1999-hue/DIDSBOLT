import React, { useState, useEffect, useCallback } from 'react';
import { Zap, Sliders, ShieldCheck, Lock, Settings, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import LoginView from './views/LoginView';
import DashboardView from './views/DashboardView';
import PaywallView from './views/PaywallView';
import SettingsView from './views/SettingsView';
import AdminView from './views/AdminView';
import { ADMIN_SECRET_KEY, SUPPORT_NAME as DEFAULT_SUPPORT, TELEGRAM_LINK as DEFAULT_TELEGRAM, PLANS as DEFAULT_PLANS } from './constants';
import { fetchUsers, upsertUser, updateUser, deleteUser, fetchCodes, insertCode, updateCode, deleteCode, fetchSettings, saveSettings } from './lib/db';
import { isSupabaseReady } from './lib/supabase';

// ── Device Fingerprint ────────────────────────────────────────────────────────
const getDeviceFingerprint = () => {
  let deviceId = localStorage.getItem('didsbolt_device_id');
  if (!deviceId) {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      ctx.textBaseline = 'top';
      ctx.font = "14px 'Arial'";
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('DIDSBOLT-V1', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('DIDSBOLT-V1', 4, 17);
      const canvasHash = canvas.toDataURL().slice(-40).replace(/[^A-Za-z0-9]/g, '');
      const parts = [navigator.userAgent, screen.width + 'x' + screen.height, new Date().getTimezoneOffset(), navigator.language || 'en', canvasHash];
      let hash = 5381;
      for (let i = 0; i < parts.join('||').length; i++) hash = ((hash << 5) + hash) + parts.join('||').charCodeAt(i);
      deviceId = `DEV-${Math.abs(hash).toString(36).toUpperCase().substring(0, 8)}`;
    } catch {
      deviceId = `DEV-FB${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    }
    localStorage.setItem('didsbolt_device_id', deviceId);
  }
  return deviceId;
};

const DEFAULT_SETTINGS = { supportName: DEFAULT_SUPPORT, telegramLink: DEFAULT_TELEGRAM, plans: DEFAULT_PLANS };
const DEFAULT_CODES = [
  { code: 'DIDS-FREE-PASS', days: 1, is_redeemed: false, redeemed_by: null, redeemed_on_device: null, redeemed_at: null, expires_at: null },
  { code: 'DIDS-PRO-WK99', days: 7, is_redeemed: false, redeemed_by: null, redeemed_on_device: null, redeemed_at: null, expires_at: null },
];
const DEFAULT_USERS = [
  { id: '1', username: '@trader_joe', access_expires_at: Date.now() + 86400000 * 2, is_active: true },
  { id: '2', username: '@binary_king', access_expires_at: null, is_active: true },
  { id: '3', username: '@dids_fan', access_expires_at: Date.now() - 3600000, is_active: false },
];

export default function App() {
  const [view, setView]               = useState('login');
  const [currentUser, setCurrentUser] = useState(null);
  const [toast, setToast]             = useState(null);
  const [pendingPlan, setPendingPlan] = useState(null);
  const [appLoading, setAppLoading]   = useState(true);
  const [dbOnline, setDbOnline]       = useState(false);

  // ── Shared Data State ────────────────────────────────────────────────────────
  const [appSettings, setAppSettings] = useState(DEFAULT_SETTINGS);
  const [usersDb, setUsersDb]         = useState(DEFAULT_USERS);
  const [activationCodes, setActivationCodes] = useState(DEFAULT_CODES);

  // ── Boot: load all data from DB (or localStorage) ────────────────────────────
  useEffect(() => {
    const boot = async () => {
      setAppLoading(true);
      const ready = isSupabaseReady();
      setDbOnline(ready);
      try {
        const [loadedUsers, loadedCodes, loadedSettings] = await Promise.all([
          fetchUsers(),
          fetchCodes(),
          fetchSettings(DEFAULT_SETTINGS),
        ]);

        // Merge defaults so demo users/codes always exist on first run
        const mergedUsers = [...loadedUsers];
        DEFAULT_USERS.forEach(def => {
          if (!mergedUsers.some(u => u.username?.toLowerCase() === def.username.toLowerCase())) {
            mergedUsers.push(def);
            upsertUser(def); // persist to DB quietly
          }
        });

        const mergedCodes = [...loadedCodes];
        DEFAULT_CODES.forEach(def => {
          if (!mergedCodes.some(c => c.code?.toUpperCase() === def.code.toUpperCase())) {
            mergedCodes.push(def);
            insertCode(def);
          }
        });

        setUsersDb(mergedUsers);
        setActivationCodes(mergedCodes);
        setAppSettings(loadedSettings || DEFAULT_SETTINGS);
      } catch (err) {
        console.error('Boot error:', err);
      } finally {
        setAppLoading(false);
      }
    };
    boot();
  }, []);

  // ── Toast helper ─────────────────────────────────────────────────────────────
  const showToast = useCallback((msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => showToast('Copied: ' + text, 'success'))
      .catch(() => showToast('Could not auto-copy', 'error'));
  };

  // ── Auth ──────────────────────────────────────────────────────────────────────
  const handleLogin = async (username, isAdminMode = false, accessKey = '') => {
    if (isAdminMode) {
      if (accessKey === ADMIN_SECRET_KEY) {
        setCurrentUser({ username: 'Administrator', role: 'admin' });
        setView('admin');
        showToast('Admin authority confirmed', 'success');
      } else {
        showToast('Invalid Admin secret key', 'error');
      }
      return;
    }

    let userRecord = usersDb.find(u => u.username?.toLowerCase() === username.toLowerCase());
    if (!userRecord) {
      userRecord = {
        id: Math.random().toString(36).substring(2, 9).toUpperCase(),
        username: username.startsWith('@') ? username : `@${username}`,
        access_expires_at: null,
        is_active: true,
      };
      const saved = await upsertUser(userRecord);
      setUsersDb(prev => [...prev, saved || userRecord]);
    }

    if (!userRecord.is_active) {
      showToast('This account has been deactivated by administration.', 'error');
      return;
    }

    setCurrentUser(userRecord);
    setView('dashboard');
    showToast(`Welcome, ${userRecord.username}!`, 'success');
  };

  const handleLogout = () => { setCurrentUser(null); setView('login'); };
  const handleSelectPlan = (plan) => setPendingPlan(plan);

  // ── Voucher Redemption ────────────────────────────────────────────────────────
  const handleRedeemVoucher = async (codeStr) => {
    const deviceId = getDeviceFingerprint();
    const username = currentUser.username;
    const cleanCode = codeStr.trim().toUpperCase();

    const voucher = activationCodes.find(v => v.code?.trim().toUpperCase() === cleanCode);
    if (!voucher) { showToast('Invalid activation code.', 'error'); return; }

    if (voucher.is_redeemed) {
      const isSameUser   = voucher.redeemed_by?.toLowerCase() === username.toLowerCase();
      const isSameDevice = voucher.redeemed_on_device === deviceId;
      if (isSameUser && isSameDevice) {
        if (voucher.expires_at && voucher.expires_at > Date.now()) {
          await updateUser(username, { access_expires_at: voucher.expires_at });
          setUsersDb(prev => prev.map(u => u.username?.toLowerCase() === username.toLowerCase() ? { ...u, access_expires_at: voucher.expires_at } : u));
          setCurrentUser(prev => ({ ...prev, access_expires_at: voucher.expires_at }));
          showToast('Access restored successfully!', 'success');
          setView('dashboard');
        } else {
          showToast('This activation code has expired.', 'error');
        }
      } else {
        showToast('This code is locked to another account or device.', 'error');
      }
      return;
    }

    // Fresh redemption
    const redeemedAt = Date.now();
    const currentExpiry = currentUser.access_expires_at && currentUser.access_expires_at > Date.now() ? currentUser.access_expires_at : Date.now();
    const expiresAt = currentExpiry + (voucher.days * 86400000);

    const patch = { is_redeemed: true, redeemed_by: username, redeemed_on_device: deviceId, redeemed_at: redeemedAt, expires_at: expiresAt };

    await updateCode(cleanCode, patch);
    await updateUser(username, { access_expires_at: expiresAt });

    setActivationCodes(prev => prev.map(v => v.code?.trim().toUpperCase() === cleanCode ? { ...v, ...patch } : v));
    setUsersDb(prev => prev.map(u => u.username?.toLowerCase() === username.toLowerCase() ? { ...u, access_expires_at: expiresAt } : u));
    setCurrentUser(prev => ({ ...prev, access_expires_at: expiresAt }));
    showToast(`Access activated for ${voucher.days} Day${voucher.days > 1 ? 's' : ''}!`, 'success');
    setView('dashboard');
  };

  // ── Admin: wrapped DB-aware setters ──────────────────────────────────────────
  const adminSetUsers = async (updater) => {
    const next = typeof updater === 'function' ? updater(usersDb) : updater;
    setUsersDb(next);
    // Sync changes to DB: find diffs and upsert
    for (const u of next) { await upsertUser(u); }
  };

  const adminSetCodes = async (updater) => {
    const next = typeof updater === 'function' ? updater(activationCodes) : updater;
    setActivationCodes(next);
    for (const c of next) { await updateCode(c.code, c).catch(() => insertCode(c)); }
  };

  const adminDeleteUser = async (username) => {
    await deleteUser(username);
    setUsersDb(prev => prev.filter(u => u.username?.toLowerCase() !== username.toLowerCase()));
  };

  const adminDeleteCode = async (codeStr) => {
    await deleteCode(codeStr);
    setActivationCodes(prev => prev.filter(c => c.code !== codeStr));
  };

  const adminInsertCode = async (code) => {
    const saved = await insertCode(code);
    setActivationCodes(prev => [saved || code, ...prev]);
  };

  const handleSaveSettings = async (newSettings) => {
    await saveSettings(newSettings);
    setAppSettings(newSettings);
    showToast('Application settings saved globally.', 'success');
  };

  // ── Access Check ─────────────────────────────────────────────────────────────
  const hasAccess = () => {
    if (currentUser?.role === 'admin') return true;
    return currentUser?.access_expires_at && currentUser.access_expires_at > Date.now();
  };

  // ── Loading Screen ────────────────────────────────────────────────────────────
  if (appLoading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(34,211,238,0.4)] animate-pulse">
            <Zap className="text-[#020617] w-7 h-7" fill="currentColor" />
          </div>
          <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
          <p className="text-slate-500 text-xs font-mono tracking-widest uppercase">Connecting to Database...</p>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-sans selection:bg-cyan-500 selection:text-black flex justify-center items-center overflow-hidden relative">

      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="orb w-[500px] h-[500px] bg-cyan-900/10 -top-40 -left-40 mix-blend-screen"></div>
        <div className="orb w-[600px] h-[600px] bg-blue-900/10 top-20 right-[-10%] mix-blend-screen"></div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-full shadow-2xl flex items-center gap-3 anim-fade-in-down font-medium text-sm border backdrop-blur-md ${
          toast.type === 'success' ? 'bg-green-950/80 border-green-500/50 text-green-100' :
          toast.type === 'error'   ? 'bg-red-950/80 border-red-500/50 text-red-100' :
                                     'bg-cyan-950/80 border-cyan-500/50 text-cyan-100'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="text-green-400" size={18} /> : <AlertCircle className="text-red-400" size={18} />}
          {toast.msg}
        </div>
      )}

      {/* App Container */}
      <div className="w-full h-[100dvh] md:h-[90vh] md:max-w-[420px] bg-slate-900/90 md:rounded-3xl relative shadow-[0_0_50px_rgba(0,0,0,0.5)] border-x md:border border-slate-800/80 flex flex-col overflow-hidden backdrop-blur-3xl z-10">

        {/* Header */}
        {currentUser && (
          <div className="p-5 flex justify-between items-center bg-slate-950/40 backdrop-blur-xl z-40 border-b border-slate-800/50 transition-all">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setView(currentUser.role === 'admin' ? 'admin' : 'dashboard')}>
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.3)] group-hover:shadow-[0_0_20px_rgba(34,211,238,0.5)] transition-shadow">
                <Zap className="text-[#020617] w-5 h-5" fill="currentColor" />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-xl tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-400 leading-none">
                  DIDS<span className="text-white">BOLT</span>
                </span>
                {currentUser.role === 'admin' && (
                  <span className="text-[9px] text-cyan-400 font-black tracking-widest uppercase mt-1">Admin Mode</span>
                )}
              </div>
            </div>
            <div className="flex gap-2 items-center">
              {/* DB status dot */}
              <div title={dbOnline ? 'Supabase connected' : 'Using local storage'} className={`w-2 h-2 rounded-full ${dbOnline ? 'bg-green-400 shadow-[0_0_6px_#4ade80]' : 'bg-amber-400 shadow-[0_0_6px_#fbbf24]'}`} />

              {currentUser.role === 'admin' ? (
                <div className="bg-cyan-900/40 border border-cyan-500/50 px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs text-cyan-300 font-semibold shadow-inner">
                  <Sliders size={12} /> Root
                </div>
              ) : hasAccess() ? (
                <div className="bg-green-900/30 border border-green-500/40 p-2.5 rounded-full flex items-center justify-center cursor-pointer shadow-[0_0_10px_rgba(34,197,94,0.2)] anim-pulse-green" title="Pro Active">
                  <ShieldCheck className="w-4 h-4 text-green-400" />
                </div>
              ) : (
                <div className="bg-red-900/30 border border-red-500/40 p-2.5 rounded-full flex items-center justify-center cursor-pointer anim-pulse-red" onClick={() => setView('paywall')} title="No Access">
                  <Lock className="w-4 h-4 text-red-400" />
                </div>
              )}
              <div className="bg-slate-800/80 hover:bg-slate-700/80 p-2.5 rounded-full cursor-pointer transition-colors border border-slate-700" onClick={() => setView('settings')}>
                <Settings className="w-4 h-4 text-slate-300" />
              </div>
            </div>
          </div>
        )}

        {/* Views */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar relative flex flex-col">
          {view === 'login' && <LoginView onLogin={handleLogin} />}
          {view === 'dashboard' && <DashboardView user={currentUser} hasAccess={hasAccess()} onUpgrade={() => setView('paywall')} />}
          {view === 'paywall' && (
            <PaywallView
              pendingPlan={pendingPlan}
              onSelectPlan={handleSelectPlan}
              onRedeem={handleRedeemVoucher}
              onBack={() => setView('dashboard')}
              appSettings={appSettings}
            />
          )}
          {view === 'settings' && (
            <SettingsView
              user={currentUser}
              onLogout={handleLogout}
              onBack={() => setView(currentUser.role === 'admin' ? 'admin' : 'dashboard')}
              showToast={showToast}
              appSettings={appSettings}
            />
          )}
          {view === 'admin' && (
            <AdminView
              users={usersDb}
              setUsers={adminSetUsers}
              codes={activationCodes}
              setCodes={adminSetCodes}
              onDeleteUser={adminDeleteUser}
              onDeleteCode={adminDeleteCode}
              onInsertCode={adminInsertCode}
              showToast={showToast}
              copyCode={copyToClipboard}
              appSettings={appSettings}
              setAppSettings={handleSaveSettings}
              dbOnline={dbOnline}
            />
          )}
        </div>
      </div>
    </div>
  );
}
