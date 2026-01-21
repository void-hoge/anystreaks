// src/ui.js
import { countCheckedTasks, isAchieved, taskCount } from "./logic.js";

function el(tag, attrs={}, ...children){
    const e = document.createElement(tag);
    for (const [k,v] of Object.entries(attrs)){
        if (k === "class") e.className = v;
        else if (k === "onclick") e.addEventListener("click", v);
        else if (k.startsWith("on") && typeof v === "function") e.addEventListener(k.slice(2), v);
        else if (v !== null && v !== undefined) e.setAttribute(k, String(v));
    }
    for (const c of children){
        if (c === null || c === undefined) continue;
        if (typeof c === "string") e.appendChild(document.createTextNode(c));
        else e.appendChild(c);
    }
    return e;
}

function hasOwn(obj, key){
    return Object.prototype.hasOwnProperty.call(obj, key);
}

export function renderToday(root, state, todayKey, saveAndRerender){
    root.innerHTML = "";

    const streakNames = Object.keys(state.streaks);
    if (streakNames.length === 0){
        root.appendChild(el("div", {class:"card warn"},
                            el("div", {class:"title"}, "まだ連続記録がありません"),
                            el("div", {class:"small"}, "「設定」タブで連続記録とタスクを追加してください。"),
                           ));
        return;
    }

    for (const streakName of streakNames){
        const s = state.streaks[streakName];

        const checked = countCheckedTasks(s, todayKey);
        const total = taskCount(s);
        const required = Math.max(0, Number(s.requiredCount || 0));
        const achieved = isAchieved(s, todayKey);

        const header = el("div", {class:"row"},
                          el("div", {},
                             el("div", {class:"title"}, streakName),
                             el("div", {class:"muted"},
                                `streak: ${Number(s.streak || 0)} / `,
                                el("span", {class:"pill"}, achieved ? "達成" : "未達")
                               )
                            ),
                          el("div", {class:"right"},
                             el("span", {class:"pill"},
                                required === 0 ? `全${total}中 ${checked}` : `完了${checked} / 必要${required}`
                               )
                            )
                         );

        const tasksBox = el("div", {class:"tasks"});
        for (const taskName of Object.keys(s.tasks)){
            const t = s.tasks[taskName];

            const id = `chk_${encodeURIComponent(streakName)}_${encodeURIComponent(taskName)}`;
            const isChecked = (t.checkedDayKey === todayKey);

            const checkbox = el("input", {type:"checkbox", id});
            checkbox.checked = isChecked;
            checkbox.addEventListener("change", () => {
                t.checkedDayKey = checkbox.checked ? todayKey : null;
                saveAndRerender();
            });

            const delBtn = el("button", {type:"button", class:"danger small", onclick: () => {
                delete s.tasks[taskName];
                saveAndRerender();
            }}, "削除");

            tasksBox.appendChild(
                el("label", {class:"task", for:id},
                   checkbox,
                   el("span", {}, taskName),
                   el("span", {class:"right"}, delBtn)
                  )
            );
        }

        const addTaskInput = el("input", {type:"text", placeholder:"タスクを追加", style:"min-width:220px;"});
        const addTaskBtn = el("button", {type:"button", class:"primary", onclick: () => {
            const name = addTaskInput.value.trim();
            if (!name) return;
            if (hasOwn(s.tasks, name)){
                alert("同じ名前のタスクが既にあります");
                return;
            }
            s.tasks[name] = { checkedDayKey: null };
            addTaskInput.value = "";
            saveAndRerender();
        }}, "追加");

        root.appendChild(el("div", {class:"card"},
                            header,
                            el("div", {class:"hr"}),
                            tasksBox,
                            el("div", {class:"row", style:"margin-top:10px;"},
                               addTaskInput, addTaskBtn,
                              )
                           ));
    }
}

export function renderSettings(root, state, saveAndRerender){
    root.innerHTML = "";

    const addName = el("input", {type:"text", placeholder:"連続記録名（例: 運動）", style:"min-width:240px;"});
    const addReq = el("input", {type:"number", min:"0", value:"0", style:"width:120px;", title:"0は「全タスク」扱い"});
    const addBtn = el("button", {type:"button", class:"primary", onclick: () => {
        const name = addName.value.trim();
        if (!name) return;
        if (hasOwn(state.streaks, name)){
            alert("同じ名前の連続記録が既にあります");
            return;
        }
        state.streaks[name] = {
            requiredCount: Number(addReq.value || 0),
            streak: 0,
            lastClosedDayKey: null,
            tasks: {}
        };
        addName.value = "";
        addReq.value = "0";
        saveAndRerender();
    }}, "追加");

    root.appendChild(el("div", {class:"card"},
                        el("div", {class:"title"}, "連続記録を追加"),
                        el("div", {class:"muted"}, "requiredCount: 0 は「全タスク完了で達成」"),
                        el("div", {class:"row", style:"margin-top:10px;"}, addName, addReq, addBtn)
                       ));

    for (const streakName of Object.keys(state.streaks)){
        const s = state.streaks[streakName];

        const nameInput = el("input", {type:"text", value: streakName, style:"min-width:240px;"});
        const reqInput = el("input", {type:"number", min:"0", value: String(s.requiredCount ?? 0), style:"width:120px;"});

        const saveBtn = el("button", {type:"button", class:"primary", onclick: () => {
            const newName = nameInput.value.trim();
            if (!newName){
                alert("名称は空にできません");
                nameInput.value = streakName;
                return;
            }
            const newReq = Number(reqInput.value || 0);

            // rename if needed
            if (newName !== streakName){
                if (hasOwn(state.streaks, newName)){
                    alert("同じ名前の連続記録が既にあります");
                    nameInput.value = streakName;
                    return;
                }
                // move object under new key
                delete state.streaks[streakName];
                state.streaks[newName] = s;
            }
            s.requiredCount = newReq;

            saveAndRerender();
        }}, "保存");

        const delBtn = el("button", {type:"button", class:"danger", onclick: () => {
            delete state.streaks[streakName];
            saveAndRerender();
        }}, "削除");

        root.appendChild(el("div", {class:"card"},
                            el("div", {class:"row"},
                               el("div", {},
                                  el("div", {class:"title"}, streakName),
                                  el("div", {class:"muted"}, `tasks: ${Object.keys(s.tasks).length} / streak: ${Number(s.streak||0)}`)
                                 ),
                               el("div", {class:"right row"}, delBtn)
                              ),
                            el("div", {class:"hr"}),
                            el("div", {class:"row"},
                               el("span", {class:"small"}, "名称"),
                               nameInput,
                               el("span", {class:"small"}, "requiredCount"),
                               reqInput,
                               saveBtn
                              ),
                           ));
    }
}

export function renderData(root, state, setStateAndRerender, resetStateAndRerender){
    root.innerHTML = "";

    const exportArea = el("textarea", {readonly:"readonly"});
    exportArea.value = JSON.stringify(state, null, 2);

    const refreshBtn = el("button", {type:"button", onclick: () => {
        exportArea.value = JSON.stringify(state, null, 2);
    }}, "更新");

    const copyBtn = el("button", {type:"button", class:"primary", onclick: async () => {
        try{
            await navigator.clipboard.writeText(exportArea.value);
            alert("コピーしました");
        } catch {
            alert("コピーできませんでした（ブラウザ権限を確認）");
        }
    }}, "コピー");

    const importArea = el("textarea", {placeholder:"ここにJSONを貼り付けてインポート"});
    const importBtn = el("button", {type:"button", class:"primary", onclick: () => {
        try{
            const obj = JSON.parse(importArea.value);
            if (!obj || typeof obj !== "object" || !obj.streaks || typeof obj.streaks !== "object" || Array.isArray(obj.streaks)){
                alert("形式が不正です");
                return;
            }
            setStateAndRerender(obj);
            alert("インポートしました");
        } catch {
            alert("JSONとして読めませんでした");
        }
    }}, "インポート");

    const resetBtn = el("button", {type:"button", class:"danger", onclick: () => {
        if (!confirm("全データを消します。OK?")) return;
        resetStateAndRerender();
    }}, "全削除");

    root.appendChild(el("div", {class:"card"},
                        el("div", {class:"title"}, "エクスポート / インポート"),
                        el("div", {class:"row", style:"margin-top:10px;"}, refreshBtn, copyBtn, resetBtn),
                        el("div", {class:"hr"}),
                        exportArea,
                        el("div", {class:"hr"}),
                        importArea,
                        el("div", {class:"row", style:"margin-top:10px;"}, importBtn)
                       ));
}
