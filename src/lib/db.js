// src/lib/db.js
// All database read/write operations for DIDSBOLT
// Falls back to localStorage if Supabase is not yet configured.

import { supabase, isSupabaseReady } from './supabase';

// ─────────────────────────────────────────────────
// USERS
// ─────────────────────────────────────────────────

export async function fetchUsers() {
  if (!isSupabaseReady()) return getLocalUsers();
  const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
  if (error) { console.error('fetchUsers:', error); return getLocalUsers(); }
  return data;
}

export async function upsertUser(user) {
  if (!isSupabaseReady()) return saveLocalUser(user);
  const { data, error } = await supabase
    .from('users')
    .upsert({ ...user }, { onConflict: 'username' })
    .select()
    .single();
  if (error) { console.error('upsertUser:', error); return saveLocalUser(user); }
  return data;
}

export async function updateUser(username, patch) {
  if (!isSupabaseReady()) return patchLocalUser(username, patch);
  const { data, error } = await supabase
    .from('users')
    .update(patch)
    .eq('username', username)
    .select()
    .single();
  if (error) { console.error('updateUser:', error); return patchLocalUser(username, patch); }
  return data;
}

export async function deleteUser(username) {
  if (!isSupabaseReady()) return removeLocalUser(username);
  const { error } = await supabase.from('users').delete().eq('username', username);
  if (error) { console.error('deleteUser:', error); return removeLocalUser(username); }
}

// ─────────────────────────────────────────────────
// ACTIVATION CODES
// ─────────────────────────────────────────────────

export async function fetchCodes() {
  if (!isSupabaseReady()) return getLocalCodes();
  const { data, error } = await supabase.from('codes').select('*').order('created_at', { ascending: false });
  if (error) { console.error('fetchCodes:', error); return getLocalCodes(); }
  return data;
}

export async function insertCode(code) {
  if (!isSupabaseReady()) return addLocalCode(code);
  const { data, error } = await supabase.from('codes').insert(code).select().single();
  if (error) { console.error('insertCode:', error); return addLocalCode(code); }
  return data;
}

export async function updateCode(codeStr, patch) {
  if (!isSupabaseReady()) return patchLocalCode(codeStr, patch);
  const { data, error } = await supabase
    .from('codes')
    .update(patch)
    .eq('code', codeStr)
    .select()
    .single();
  if (error) { console.error('updateCode:', error); return patchLocalCode(codeStr, patch); }
  return data;
}

export async function deleteCode(codeStr) {
  if (!isSupabaseReady()) return removeLocalCode(codeStr);
  const { error } = await supabase.from('codes').delete().eq('code', codeStr);
  if (error) { console.error('deleteCode:', error); return removeLocalCode(codeStr); }
}

// ─────────────────────────────────────────────────
// APP SETTINGS
// ─────────────────────────────────────────────────

export async function fetchSettings(defaultVal) {
  if (!isSupabaseReady()) return getLocalSettings(defaultVal);
  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'app_config')
    .single();
  if (error || !data) return getLocalSettings(defaultVal);
  return data.value;
}

export async function saveSettings(settingsObj) {
  if (!isSupabaseReady()) return setLocalSettings(settingsObj);
  const { error } = await supabase
    .from('settings')
    .upsert({ key: 'app_config', value: settingsObj }, { onConflict: 'key' });
  if (error) console.error('saveSettings:', error);
  setLocalSettings(settingsObj); // keep local in sync
}

// ─────────────────────────────────────────────────
// LOCALSTORAGE FALLBACK HELPERS
// ─────────────────────────────────────────────────

function getLocalUsers() {
  try { return JSON.parse(localStorage.getItem('didsbolt_users') || '[]'); } catch { return []; }
}
function saveLocalUser(user) {
  const users = getLocalUsers();
  const idx = users.findIndex(u => u.username?.toLowerCase() === user.username?.toLowerCase());
  if (idx >= 0) users[idx] = { ...users[idx], ...user };
  else users.unshift(user);
  localStorage.setItem('didsbolt_users', JSON.stringify(users));
  return user;
}
function patchLocalUser(username, patch) {
  const users = getLocalUsers().map(u =>
    u.username?.toLowerCase() === username.toLowerCase() ? { ...u, ...patch } : u
  );
  localStorage.setItem('didsbolt_users', JSON.stringify(users));
}
function removeLocalUser(username) {
  const users = getLocalUsers().filter(u => u.username?.toLowerCase() !== username.toLowerCase());
  localStorage.setItem('didsbolt_users', JSON.stringify(users));
}

function getLocalCodes() {
  try { return JSON.parse(localStorage.getItem('didsbolt_codes') || '[]'); } catch { return []; }
}
function addLocalCode(code) {
  const codes = getLocalCodes();
  codes.unshift(code);
  localStorage.setItem('didsbolt_codes', JSON.stringify(codes));
  return code;
}
function patchLocalCode(codeStr, patch) {
  const codes = getLocalCodes().map(c =>
    c.code?.toUpperCase() === codeStr.toUpperCase() ? { ...c, ...patch } : c
  );
  localStorage.setItem('didsbolt_codes', JSON.stringify(codes));
}
function removeLocalCode(codeStr) {
  const codes = getLocalCodes().filter(c => c.code?.toUpperCase() !== codeStr.toUpperCase());
  localStorage.setItem('didsbolt_codes', JSON.stringify(codes));
}

function getLocalSettings(defaultVal) {
  try {
    const saved = localStorage.getItem('didsbolt_settings');
    return saved ? JSON.parse(saved) : defaultVal;
  } catch { return defaultVal; }
}
function setLocalSettings(obj) {
  localStorage.setItem('didsbolt_settings', JSON.stringify(obj));
}
