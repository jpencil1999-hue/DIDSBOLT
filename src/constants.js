// --- APP CONSTANTS ---

export const OTC_PAIRS = [
  'EUR/USD OTC', 'GBP/USD OTC', 'AUD/CAD OTC', 'USD/JPY OTC',
  'EUR/GBP OTC', 'AUD/USD OTC', 'BTC/USD OTC', 'ETH/USD OTC',
  'EUR/CHF OTC', 'NZD/USD OTC', 'USD/CAD OTC', 'GBP/JPY OTC',
];

// Keep PAIRS as alias so other components don't break
export const PAIRS = OTC_PAIRS;

export const STANDARD_PAIRS = [
  'EUR/USD', 'GBP/USD', 'AUD/CAD', 'USD/JPY',
  'EUR/GBP', 'AUD/USD', 'USD/CHF', 'NZD/USD',
  'USD/CAD', 'GBP/JPY', 'EUR/JPY', 'BTC/USD',
];


export const TIMEFRAMES = [
  'S5', 'S10', 'S15', 'S30',
  'M1', 'M2', 'M3', 'M5', 'M10',
  'D1', 'D2', 'D3', 'D5'
];

export const SUPPORT_NAME = 'DIDSBOLT';
export const TELEGRAM_LINK = 'https://t.me/+2347016435125';
export const ADMIN_SECRET_KEY = 'DIDSBOLT2026';

export const PLANS = [
  {
    name: '24 Hour Pass',
    days: 1,
    price: '$5.00',
    priceUSD: 5,
    desc: 'Test the algorithm accuracy',
    badge: null,
  },
  {
    name: '3 Day Pro Pass',
    days: 3,
    price: '$10.00',
    priceUSD: 10,
    desc: 'Most selected package',
    badge: 'POPULAR',
  },
  {
    name: 'Weekly Access Pass',
    days: 7,
    price: '$20.00',
    priceUSD: 20,
    desc: 'Best value configuration',
    badge: 'BEST VALUE',
  },
];

export const MOCK_HISTORY = [
  { pair: 'EUR/USD OTC', dir: 'CALL', res: 'WIN',  tf: 'M1', time: '10:45 AM' },
  { pair: 'AUD/CAD OTC', dir: 'PUT',  res: 'LOSS', tf: 'M5', time: '09:30 AM' },
  { pair: 'GBP/JPY OTC', dir: 'CALL', res: 'WIN',  tf: 'M3', time: 'Yesterday' },
  { pair: 'BTC/USD OTC', dir: 'PUT',  res: 'WIN',  tf: 'S30', time: 'Yesterday' },
  { pair: 'USD/JPY OTC', dir: 'CALL', res: 'WIN',  tf: 'M1', time: '2 days ago' },
  { pair: 'NZD/USD OTC', dir: 'PUT',  res: 'LOSS', tf: 'M2', time: '2 days ago' },
];
