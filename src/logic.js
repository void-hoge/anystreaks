// src/logic.js
import { addDays, diffDays } from "./storage.js";

export function countCheckedTasks(streakItem, dayKey){
    let n = 0;
    for (const t of streakItem.tasks){
        if (t.checkedDayKey === dayKey) n++;
    }
    return n;
}

export function isAchieved(streakItem, dayKey){
    const checked = countCheckedTasks(streakItem, dayKey);
    const required = Math.max(0, Number(streakItem.requiredCount || 0));
    if (streakItem.tasks.length === 0) return false;
    // requiredCount=0 => all tasks
    if (required === 0) return checked === streakItem.tasks.length;
    return checked >= required;
}

export function rollover(state, nowDayKey){
    if (!state.lastSeenDayKey){
        state.lastSeenDayKey = nowDayKey;
        return;
    }
    if (state.lastSeenDayKey === nowDayKey) return;

    const d = diffDays(state.lastSeenDayKey, nowDayKey);
    if (d <= 0){
        state.lastSeenDayKey = nowDayKey;
        return;
    }

    // Close each day from lastSeenDayKey up to day before nowDayKey
    for (let i=0; i<d; i++){
        const closingDayKey = addDays(state.lastSeenDayKey, i);

        for (const s of state.streaks){
            if (s.lastClosedDayKey === closingDayKey) continue;

            const achieved = isAchieved(s, closingDayKey);
            if (achieved) s.streak = Number(s.streak || 0) + 1;
            else s.streak = 0;

            s.lastClosedDayKey = closingDayKey;
        }
    }

    state.lastSeenDayKey = nowDayKey;
}
