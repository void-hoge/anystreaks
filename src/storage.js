// src/storage.js

export const APP_TITLE = "AnyStreaks";
export const COOKIE_KEY = "any_streaks_app";
export const DAY_BOUNDARY_HOUR = 5;

function pad2(n){ return String(n).padStart(2,"0"); }

// ---- dayKey (05:00 boundary) ----
export function getDayKey(d = new Date()){
    const local = new Date(d.getTime());
    if (local.getHours() < DAY_BOUNDARY_HOUR){
        local.setDate(local.getDate() - 1);
    }
    const y = local.getFullYear();
    const m = pad2(local.getMonth()+1);
    const dd = pad2(local.getDate());
    return `${y}-${m}-${dd}`;
}

export function addDays(dayKey, delta){
    const [y,m,d] = dayKey.split("-").map(Number);
    const dt = new Date(y, m-1, d);
    dt.setDate(dt.getDate() + delta);
    // noon avoids edge cases around DST + 05:00 rule
    return getDayKey(new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), 12, 0, 0));
}

export function diffDays(aKey, bKey){
    const [ay,am,ad] = aKey.split("-").map(Number);
    const [by,bm,bd] = bKey.split("-").map(Number);
    const a = new Date(ay, am-1, ad, 12,0,0);
    const b = new Date(by, bm-1, bd, 12,0,0);
    return Math.round((b.getTime() - a.getTime()) / (24*60*60*1000));
}

// ---- cookie helpers ----
export function setCookie(name, value, days=365){
    const maxAge = days*24*60*60;
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
}

export function getCookie(name){
    const target = encodeURIComponent(name) + "=";
    const parts = document.cookie.split("; ");
    for (const p of parts){
        if (p.startsWith(target)){
            return decodeURIComponent(p.slice(target.length));
        }
    }
    return null;
}

// ---- state ----
export function uid(){
    return Math.random().toString(36).slice(2, 10);
}

export function defaultState(){
    return {
        version: 1,
        lastSeenDayKey: null,
        streaks: []
        // streak: { id, name, requiredCount, streak, lastClosedDayKey, tasks: [{id,name,checkedDayKey}] }
    };
}

export function loadState(){
    const raw = getCookie(COOKIE_KEY);
    if (!raw) return defaultState();
    try{
        const st = JSON.parse(raw);
        if (!st || typeof st !== "object") return defaultState();
        if (!Array.isArray(st.streaks)) st.streaks = [];
        return st;
    } catch {
        return defaultState();
    }
}

export function trySaveState(state){
    const raw = JSON.stringify(state);
    setCookie(COOKIE_KEY, raw, 365);

    const verify = getCookie(COOKIE_KEY);
    return { ok: (verify === raw), size: raw.length, raw };
}
