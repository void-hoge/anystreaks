// src/main.js
import { getDayKey, loadState, trySaveState, defaultState, DAY_BOUNDARY_HOUR } from "./storage.js";
import { rollover } from "./logic.js";
import { renderToday, renderSettings, renderData } from "./ui.js";

const elTodayLabel = document.getElementById("todayLabel");

const viewToday = document.getElementById("viewToday");
const viewSettings = document.getElementById("viewSettings");
const viewData = document.getElementById("viewData");

const tabToday = document.getElementById("tabToday");
const tabSettings = document.getElementById("tabSettings");
const tabData = document.getElementById("tabData");

let state = loadState();
let lastSave = { ok: true, size: 0, raw: "" };

function setTab(tab){
    tabToday.classList.toggle("active", tab==="today");
    tabSettings.classList.toggle("active", tab==="settings");
    tabData.classList.toggle("active", tab==="data");

    viewToday.style.display = tab==="today" ? "" : "none";
    viewSettings.style.display = tab==="settings" ? "" : "none";
    viewData.style.display = tab==="data" ? "" : "none";
}

tabToday.addEventListener("click", () => setTab("today"));
tabSettings.addEventListener("click", () => setTab("settings"));
tabData.addEventListener("click", () => setTab("data"));

function saveAndRerender(){
    lastSave = trySaveState(state);
    renderAll();
}

function setStateAndRerender(newState){
    state = newState;
    lastSave = trySaveState(state);
    renderAll();
}

function resetStateAndRerender(){
    state = defaultState();
    lastSave = trySaveState(state);
    renderAll();
}

function renderAll(){
    const todayKey = getDayKey(new Date());
    elTodayLabel.textContent = `${todayKey} (更新時刻: 毎朝${DAY_BOUNDARY_HOUR}:00)`;

    renderToday(viewToday, state, todayKey, saveAndRerender);
    renderSettings(viewSettings, state, saveAndRerender);
    renderData(viewData, state, setStateAndRerender, resetStateAndRerender);
}

// ---- boot ----
const todayKey = getDayKey(new Date());
rollover(state, todayKey);
lastSave = trySaveState(state);
renderAll();
