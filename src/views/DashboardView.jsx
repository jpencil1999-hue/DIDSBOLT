import React, { useState, useEffect, useRef } from 'react';
import { BarChart3, Activity, TrendingUp, TrendingDown, Lock, Zap, ChevronDown, Timer } from 'lucide-react';
import { OTC_PAIRS, STANDARD_PAIRS, TIMEFRAMES } from '../constants';

// Parse timeframe string to seconds: S10 → 10, M1 → 60, D1 → 86400
function parseTFSeconds(tf) {
  const match = tf.match(/^([SMD])(\d+)$/);
  if (!match) return 60;
  const [, unit, num] = match;
  const n = parseInt(num);
  if (unit === 'S') return n;
  if (unit === 'M') return n * 60;
  if (unit === 'D') return n * 86400;
  return 60;
}

function formatCountdown(seconds) {
  if (seconds <= 0) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function DashboardView({ user, hasAccess, onUpgrade }) {
  const [marketMode, setMarketMode] = useState('otc'); // 'standard' | 'otc'
  const [activePair, setActivePair] = useState('AUD/CAD OTC');
  const [timeframe, setTimeframe] = useState('M1');
  const [signalState, setSignalState] = useState('idle'); // idle | analyzing | result
  const [currentSignal, setCurrentSignal] = useState(null);

  // Expiration countdown
  const [countdown, setCountdown] = useState(0);
  const [countdownTotal, setCountdownTotal] = useState(0);
  const countdownRef = useRef(null);

  // When market mode changes, reset pair to first of that list
  const currentPairs = marketMode === 'otc' ? OTC_PAIRS : STANDARD_PAIRS;

  useEffect(() => {
    setActivePair(currentPairs[0]);
  }, [marketMode]);

  // Live countdown ticker
  useEffect(() => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (countdown > 0) {
      countdownRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(countdownRef.current);
  }, [countdown > 0 && countdownTotal > 0]);

  const handleGenerateSignal = () => {
    if (!hasAccess) {
      onUpgrade();
      return;
    }

    setSignalState('analyzing');
    setCurrentSignal(null);
    setCountdown(0);

    setTimeout(() => {
      const isUp = Math.random() > 0.5;
      const tfSeconds = parseTFSeconds(timeframe);

      setCurrentSignal({
        direction: isUp ? 'CALL' : 'PUT',
        confidence: Math.floor(Math.random() * (98 - 85 + 1) + 85),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        pair: activePair,
        tf: timeframe,
        tfSeconds,
        mode: marketMode,
      });

      // Start expiration countdown
      setCountdownTotal(tfSeconds);
      setCountdown(tfSeconds);
      setSignalState('result');
    }, 4500);
  };

  const progressPct = countdownTotal > 0 ? (countdown / countdownTotal) * 100 : 0;
  const isExpired = signalState === 'result' && countdown === 0;

  // Color the countdown bar: green → amber → red
  const barColor =
    progressPct > 60
      ? 'from-green-400 to-emerald-500'
      : progressPct > 25
      ? 'from-amber-400 to-orange-500'
      : 'from-red-500 to-rose-600';

  return (
    <div className="flex-1 flex flex-col p-5 gap-5 pb-8 anim-fade-in">

      {/* Controls Card */}
      <div className="glass-card p-5 stagger">

        {/* Standard / OTC Toggle */}
        <div className="flex bg-slate-950/60 rounded-xl p-1 mb-5 border border-slate-800/80 shadow-inner">
          <button
            onClick={() => setMarketMode('standard')}
            className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${
              marketMode === 'standard'
                ? 'bg-blue-900/40 text-blue-300 border border-blue-500/30 shadow-[0_0_10px_rgba(96,165,250,0.1)]'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Standard
          </button>
          <button
            onClick={() => setMarketMode('otc')}
            className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${
              marketMode === 'otc'
                ? 'bg-cyan-900/40 text-cyan-400 border border-cyan-500/30 shadow-[0_0_10px_rgba(34,211,238,0.1)]'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            OTC Market
          </button>
        </div>

        {/* Market Mode Badge */}
        <div className={`text-[9px] font-black uppercase tracking-widest mb-4 px-1 flex items-center gap-1.5 ${
          marketMode === 'otc' ? 'text-cyan-500' : 'text-blue-400'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${marketMode === 'otc' ? 'bg-cyan-400' : 'bg-blue-400'} animate-pulse`}></span>
          {marketMode === 'otc' ? 'Over-The-Counter — 24/7 Weekend Trading' : 'Standard Market — Live Exchange Pairs'}
        </div>

        <div className="mb-5 space-y-4">
          {/* Asset Pair Selector */}
          <div>
            <label className="text-[10px] text-slate-400 font-bold mb-2 block uppercase tracking-widest ml-1">Asset Pair</label>
            <div className="relative group">
              <select
                value={activePair}
                onChange={(e) => setActivePair(e.target.value)}
                className="w-full bg-slate-900/80 text-white font-bold text-lg p-4 pl-5 rounded-2xl border border-slate-700/80 focus:border-cyan-500 focus:bg-slate-900 focus:ring-1 focus:ring-cyan-500/50 transition-all outline-none appearance-none"
              >
                {currentPairs.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 group-focus-within:text-cyan-400 transition-colors">
                <ChevronDown size={20} />
              </div>
            </div>
          </div>

          {/* Expiration Selector + Live Progress Bar */}
          <div>
            <label className="text-[10px] text-slate-400 font-bold mb-2 block uppercase tracking-widest ml-1">Expiration</label>
            <div className="relative group">
              <select
                value={timeframe}
                onChange={(e) => {
                  setTimeframe(e.target.value);
                  setCountdown(0); // reset bar on change
                }}
                className="w-full bg-slate-900/80 text-white font-bold text-lg p-4 pl-5 rounded-2xl border border-slate-700/80 focus:border-cyan-500 focus:bg-slate-900 focus:ring-1 focus:ring-cyan-500/50 transition-all outline-none appearance-none"
              >
                {TIMEFRAMES.map(tf => (
                  <option key={tf} value={tf}>{tf}</option>
                ))}
              </select>
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 group-focus-within:text-cyan-400 transition-colors">
                <ChevronDown size={20} />
              </div>
            </div>

            {/* Countdown progress bar — only visible while/after signal fires */}
            {signalState === 'result' && (
              <div className="mt-3 space-y-1.5 anim-fade-in">
                <div className="flex justify-between items-center px-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    <Timer size={11} className={countdown > 0 ? 'text-cyan-400 animate-pulse' : 'text-red-500'} />
                    {countdown > 0 ? 'Trade Window' : 'Expired'}
                  </div>
                  <span className={`text-[12px] font-mono font-black ${
                    isExpired ? 'text-red-400' :
                    progressPct > 60 ? 'text-green-400' :
                    progressPct > 25 ? 'text-amber-400' : 'text-red-400'
                  }`}>
                    {isExpired ? '00:00' : formatCountdown(countdown)}
                  </span>
                </div>

                {/* Progress track */}
                <div className="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden border border-slate-700/40">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r transition-all duration-1000 ease-linear ${barColor} ${
                      progressPct <= 0 ? '' : 'shadow-[0_0_8px_rgba(34,211,238,0.4)]'
                    }`}
                    style={{ width: `${Math.max(progressPct, 0)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Signal Display Area */}
      <div className="flex-1 bg-[#020617] border border-slate-800 rounded-3xl relative overflow-hidden flex flex-col items-center justify-center min-h-[320px] shadow-inner">
        {signalState === 'analyzing' && <div className="absolute inset-0 scanline-overlay z-20"></div>}

        {signalState === 'idle' && (
          <div className="z-10 text-center anim-fade-in p-6">
            <div className="w-20 h-20 bg-slate-900/50 rounded-full flex items-center justify-center mx-auto mb-5 border border-slate-800">
              <BarChart3 className="w-10 h-10 text-slate-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-200 mb-1">Awaiting Command</h3>
            <p className="text-slate-500 text-sm font-medium">Configure parameters and request signal.</p>
            <p className={`mt-3 text-[10px] uppercase tracking-widest font-bold ${marketMode === 'otc' ? 'text-cyan-600' : 'text-blue-500'}`}>
              {marketMode === 'otc' ? '⬤ OTC Mode Active' : '⬤ Standard Mode Active'}
            </p>
          </div>
        )}

        {signalState === 'analyzing' && (
          <div className="z-10 text-center w-full px-8">
            <div className="relative w-28 h-28 mx-auto mb-8">
              <div className="absolute inset-0 border-[3px] border-slate-800 rounded-full"></div>
              <div className="absolute inset-0 border-[3px] border-cyan-400 rounded-full border-t-transparent anim-spin"></div>
              <div className="absolute inset-0 border-[3px] border-blue-500/50 rounded-full border-b-transparent anim-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Activity className="w-10 h-10 text-cyan-400 anim-pulse-cyan" />
              </div>
            </div>
            <p className="text-cyan-400 font-mono tracking-widest uppercase text-xs anim-pulse-cyan mb-3">
              {marketMode === 'otc' ? 'Scanning OTC Exchange...' : 'Connecting to Market...'}
            </p>
            <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500" style={{ animation: 'progress-bar 4.5s linear forwards' }}></div>
            </div>
          </div>
        )}

        {signalState === 'result' && currentSignal && (
          <div className={`absolute inset-0 z-10 w-full flex flex-col items-center justify-center anim-zoom-in ${currentSignal.direction === 'CALL' ? 'signal-call' : 'signal-put'}`}>
            <div className="text-center mb-4 w-full px-8">
              <div className="bg-slate-950/80 backdrop-blur-md border border-slate-800/80 px-4 py-2 rounded-2xl inline-flex items-center gap-2 text-xs font-mono font-medium text-slate-300 shadow-xl">
                <span className={currentSignal.mode === 'otc' ? 'text-cyan-400' : 'text-blue-400'}>{currentSignal.pair}</span>
                <span className="text-slate-600">|</span>
                <span className="text-blue-400">{currentSignal.tf}</span>
                <span className="text-slate-600">|</span>
                <span className={`text-[9px] uppercase font-black ${currentSignal.mode === 'otc' ? 'text-cyan-600' : 'text-blue-600'}`}>
                  {currentSignal.mode === 'otc' ? 'OTC' : 'STD'}
                </span>
              </div>
            </div>

            <div className={`flex flex-col items-center justify-center mb-6 ${
              currentSignal.direction === 'CALL' ? 'text-green-400' : 'text-red-400'
            }`}>
              {currentSignal.direction === 'CALL' ? (
                <TrendingUp size={90} className="drop-shadow-[0_0_30px_rgba(34,197,94,0.5)] mb-2" />
              ) : (
                <TrendingDown size={90} className="drop-shadow-[0_0_30px_rgba(239,68,68,0.5)] mb-2" />
              )}
              <h2 className="text-[5rem] leading-none font-black tracking-tighter uppercase drop-shadow-xl">
                {currentSignal.direction}
              </h2>
            </div>

            {/* Confidence Bar */}
            <div className="w-full max-w-[200px] text-center bg-slate-950/60 p-3 rounded-2xl border border-slate-800/50 backdrop-blur-sm">
              <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-2">Confidence Level</div>
              <div className="text-2xl font-black text-white mb-2 font-mono">{currentSignal.confidence}%</div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="confidence-bar" style={{ '--target-width': `${currentSignal.confidence}%` }}></div>
              </div>
            </div>

            {/* Expired overlay */}
            {isExpired && (
              <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center anim-fade-in z-30">
                <div className="text-center">
                  <div className="text-red-400 text-5xl font-black tracking-tighter mb-2">EXPIRED</div>
                  <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">Signal window has closed</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerateSignal}
        disabled={signalState === 'analyzing'}
        className={`w-full py-5 rounded-2xl font-black text-lg transition-all btn-press flex items-center justify-center gap-3 uppercase tracking-wide mt-2 ${
          signalState === 'analyzing'
            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
            : hasAccess
              ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-black shadow-[0_0_30px_rgba(34,197,94,0.3)]'
              : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-[0_0_30px_rgba(34,211,238,0.3)]'
        }`}
      >
        {signalState === 'analyzing' ? (
          'ANALYZING MARKET...'
        ) : !hasAccess ? (
          <><Lock size={22}/> UNLOCK AI SIGNALS</>
        ) : (
          <><Zap size={22} fill="currentColor"/> GET NEXT SIGNAL</>
        )}
      </button>
    </div>
  );
}
