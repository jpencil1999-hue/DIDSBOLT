import React, { useState, useEffect } from 'react';
import { CreditCard, ChevronLeft, ShieldCheck, Zap, Globe2, ExternalLink } from 'lucide-react';

export default function PaywallView({ pendingPlan, onSelectPlan, onRedeem, onBack, appSettings }) {
  const [voucherInput, setVoucherInput] = useState('');
  
  // Currency State
  const [currency, setCurrency] = useState('USD');
  const [exchangeRate, setExchangeRate] = useState(1);
  const [isLoadingCurrency, setIsLoadingCurrency] = useState(true);

  useEffect(() => {
    // Attempt to auto-detect global location currency (e.g., NGN for Nigeria)
    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => {
        const userCurrency = data.currency || 'NGN'; // Default to NGN if undefined
        setCurrency(userCurrency);
        return fetch('https://api.exchangerate-api.com/v4/latest/USD')
          .then(res => res.json())
          .then(ratesData => {
             setExchangeRate(ratesData.rates[userCurrency] || 1);
             setIsLoadingCurrency(false);
          });
      })
      .catch(err => {
        console.error("Currency detection failed, falling back to NGN", err);
        // Fallback to NGN (Nigeria) as requested
        setCurrency('NGN');
        fetch('https://api.exchangerate-api.com/v4/latest/USD')
          .then(res => res.json())
          .then(ratesData => {
             setExchangeRate(ratesData.rates['NGN'] || 1500); // Fallback approximate rate
             setIsLoadingCurrency(false);
          }).catch(() => {
             setExchangeRate(1500); // Hard fallback for NGN
             setIsLoadingCurrency(false);
          });
      });
  }, []);

  const formatPrice = (priceUSD) => {
    if (isLoadingCurrency) return '...';
    const converted = priceUSD * exchangeRate;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: currency === 'NGN' ? 0 : 2 // NGN usually doesn't display kobo for large amounts
    }).format(converted);
  };

  const handleVoucherSubmit = (e) => {
    e.preventDefault();
    if (!voucherInput.trim()) return;
    onRedeem(voucherInput.trim());
    setVoucherInput('');
  };

  const handlePurchaseCode = () => {
    window.open(appSettings.telegramLink, '_blank');
  };

  return (
    <div className="flex-1 flex flex-col p-5 bg-[#020617] overflow-y-auto no-scrollbar anim-slide-in-right relative">
      
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-cyan-900/10 rounded-full blur-[80px] pointer-events-none mix-blend-screen"></div>

      <div className="space-y-6 relative z-10">
        <div className="flex justify-between items-center">
          <button onClick={onBack} className="text-slate-400 text-xs font-bold uppercase tracking-widest hover:text-white flex items-center gap-1 transition-colors">
            <ChevronLeft size={16} /> Back
          </button>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-900/50 px-2 py-1 rounded border border-slate-800">
            <Globe2 size={12} className="text-cyan-400" />
            {isLoadingCurrency ? 'Detecting Location...' : `Local Currency: ${currency}`}
          </div>
        </div>

        <div className="text-center py-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400/20 to-blue-500/20 border border-cyan-500/30 mb-4">
            <Zap className="text-cyan-400 w-8 h-8" fill="currentColor"/>
          </div>
          <h2 className="text-3xl font-black mb-2 tracking-tight text-white">Activate Pro</h2>
          <p className="text-slate-400 text-sm font-medium">Instant automation and live prediction capabilities.</p>
        </div>

        {/* Voucher Activation Section */}
        <form onSubmit={handleVoucherSubmit} className="glass-card p-5 space-y-4 shadow-[0_0_20px_rgba(34,211,238,0.05)] border-cyan-900/50">
           <div className="text-[11px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck size={16} className="text-cyan-400"/> Insert Access Code
           </div>
           <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
             If you have purchased a plan, enter your unique voucher code below to unlock dashboard access instantly.
           </p>
           <div className="flex gap-3 pt-2">
              <input
                type="text"
                value={voucherInput}
                onChange={(e) => setVoucherInput(e.target.value)}
                placeholder="e.g., DIDS-XXXX"
                className="flex-1 bg-slate-900/80 border border-cyan-900/50 rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-cyan-400 focus:bg-slate-900 uppercase font-mono tracking-widest font-bold placeholder:text-slate-600 transition-all shadow-inner"
              />
              <button type="submit" className="bg-gradient-to-r from-cyan-400 to-blue-500 text-[#020617] font-black px-6 rounded-xl text-sm hover:from-cyan-300 hover:to-blue-400 transition-all shadow-lg btn-press uppercase tracking-wide">
                Unlock
              </button>
           </div>
        </form>

        <div className="space-y-4">
          <div className="text-[11px] font-black text-slate-500 uppercase tracking-widest px-1">Purchase A Plan Code</div>
          <div className="grid gap-4 pb-8">
            {appSettings.plans.map((plan, idx) => (
              <div
                key={idx}
                onClick={handlePurchaseCode}
                className="p-6 rounded-2xl border border-slate-700/80 bg-slate-900/50 cursor-pointer hover:border-cyan-400 hover:bg-slate-900 transition-all relative overflow-hidden group shadow-lg backdrop-blur-md flex flex-col gap-3"
              >
                {plan.badge && (
                  <div className="absolute top-0 right-0 bg-gradient-to-l from-cyan-500 to-blue-500 text-[#020617] text-[9px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest shadow-md">
                    {plan.badge}
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-lg text-slate-100 group-hover:text-cyan-300 transition-colors">{plan.name}</h3>
                  <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                    {formatPrice(plan.priceUSD)}
                  </span>
                </div>
                <div className="flex justify-between items-end">
                  <p className="text-slate-400 text-sm font-medium">{plan.desc}</p>
                  <div className="text-[10px] uppercase font-black tracking-widest text-cyan-500 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Buy Code <ExternalLink size={12}/>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
