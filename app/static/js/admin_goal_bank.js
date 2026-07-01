(function () {
    "use strict";

    const state = {
        type: "التعليم",
        baseConfig: {},
        publishedConfig: {},
        draftConfig: null,
        config: {},
        level: "category",
        revisions: []
    };

    const LEVELS = [
        { key: "category", label: "تصنيف الهدف" },
        { key: "path", label: "مسار الهدف" },
        { key: "current", label: "الحالة الحالية" },
        { key: "target", label: "الحالة المستهدفة" },
        { key: "commitment", label: "الالتزام اليومي أو الأسبوعي" }
    ];

    function $(id) { return document.getElementById(id); }
    function clone(obj) { try { return JSON.parse(JSON.stringify(obj || {})); } catch (e) { return {}; } }
    function merge(base, override) {
        if (window.EDUPATH_GOAL_BANK_DEEP_MERGE) return window.EDUPATH_GOAL_BANK_DEEP_MERGE(base || {}, override || {});
        const out = clone(base);
        Object.keys(override || {}).forEach(k => {
            if (Array.isArray(override[k])) out[k] = Array.from(new Set([...(Array.isArray(out[k]) ? out[k] : []), ...override[k]]));
            else if (override[k] && typeof override[k] === "object") out[k] = merge(out[k] || {}, override[k]);
            else out[k] = override[k];
        });
        return out;
    }
    function label(v) { return (window.EDUPATH_GOAL_LABEL && window.EDUPATH_GOAL_LABEL(v)) || v; }
    function unique(list) { return Array.from(new Set((list || []).filter(Boolean))); }
    function baseAll() { return clone(window.EDUPATH_GOAL_BANK_BASE_DATA || window.EDUPATH_GET_GOAL_BANK_CONFIG?.() || {}); }
    function currentSelectValues(id) { const el = $(id); return el ? Array.from(el.options).map(o => o.value).filter(Boolean) : []; }
    function selectedPath() {
        return {
            category: ($("goalCategorySelect") || {}).value || "",
            path: ($("goalPathSelect") || {}).value || "",
            current: ($("currentStateSelect") || {}).value || "",
            target: ($("targetStateSelect") || {}).value || "",
            commitment: ($("commitmentSelect") || {}).value || ""
        };
    }
    function stateKey() {
        const p = selectedPath();
        return p.category && p.path ? `${p.category}::${p.path}` : (p.path || p.category || "أخرى");
    }
    function getStatesContainer(config, create) {
        if (create && !config.states) config.states = {};
        return config.states || {};
    }
    function stateSet(config, create) {
        const states = getStatesContainer(config, create);
        const p = selectedPath();
        const scoped = p.category && p.path ? `${p.category}::${p.path}` : "";
        if (create) {
            const key = scoped || p.path || p.category || "أخرى";
            if (!states[key]) states[key] = { current: [], target: [], commitment: [] };
            return states[key];
        }
        return (scoped && states[scoped]) || states[p.path] || states[p.category] || states["أخرى"] || { current: ["أخرى"], target: ["أخرى"], commitment: ["أخرى"] };
    }
    function getListForLevel(level) {
        if (level === "category") return unique(currentSelectValues("goalCategorySelect").length ? currentSelectValues("goalCategorySelect") : (state.config.categories || ["أخرى"]));
        if (level === "path") return unique(currentSelectValues("goalPathSelect").length ? currentSelectValues("goalPathSelect") : ((state.config.paths || {})[selectedPath().category] || (state.config.paths || {})["أخرى"] || ["أخرى"]));
        if (level === "current") return unique(currentSelectValues("currentStateSelect").length ? currentSelectValues("currentStateSelect") : (stateSet(state.config).current || ["أخرى"]));
        if (level === "target") return unique(currentSelectValues("targetStateSelect").length ? currentSelectValues("targetStateSelect") : (stateSet(state.config).target || ["أخرى"]));
        if (level === "commitment") return unique(currentSelectValues("commitmentSelect").length ? currentSelectValues("commitmentSelect") : (stateSet(state.config).commitment || ["أخرى"]));
        return [];
    }
    function setListForLevel(level, list) {
        list = unique(list);
        if (level === "category") state.config.categories = list;
        else if (level === "path") {
            if (!state.config.paths) state.config.paths = {};
            state.config.paths[selectedPath().category || "أخرى"] = list;
        } else {
            const box = stateSet(state.config, true);
            box[level] = list;
        }
        refreshNative(level);
        renderEditor();
    }
    function getChildLevel(level) {
        const idx = LEVELS.findIndex(x => x.key === level);
        return idx >= 0 && idx < LEVELS.length - 1 ? LEVELS[idx + 1] : null;
    }
    function setChildBranches(parentLevel, parentName, branches) {
        const child = getChildLevel(parentLevel);
        if (!child || !branches || !branches.length) return;
        if (parentLevel === "category") {
            if (!state.config.paths) state.config.paths = {};
            state.config.paths[parentName] = unique(branches);
        } else if (parentLevel === "path") {
            if (!state.config.states) state.config.states = {};
            const cat = selectedPath().category || "أخرى";
            const key = `${cat}::${parentName}`;
            if (!state.config.states[key]) state.config.states[key] = { current: [], target: [], commitment: [] };
            state.config.states[key].current = unique(branches);
        } else if (["current", "target", "commitment"].includes(parentLevel)) {
            // current/target/commitment are terminal sibling lists in the current goal structure.
        }
    }
    function syncTypeFromForm() {
        const typeEl = $("goalTypeSelect");
        const newType = typeEl?.value || state.type || "التعليم";
        if (newType !== state.type) {
            state.type = newType;
            loadType(newType);
            return;
        }
        renderEditor();
    }
    function buildConfig() {
        state.baseConfig = clone(baseAll()[state.type] || {});
        state.config = merge(state.baseConfig, state.draftConfig || state.publishedConfig || {});
    }
    function fillTypeSelect() {
        const typeEl = $("goalTypeSelect");
        if (!typeEl) return;
        const data = baseAll();
        const baseNames = Object.keys(data);
        const existing = Array.from(typeEl.options).map(o => o.value).filter(Boolean);
        const names = existing.length ? existing : baseNames;
        typeEl.innerHTML = "";
        names.forEach(name => {
            const opt = document.createElement("option"); opt.value = name; opt.textContent = label(name); typeEl.appendChild(opt);
        });
        if (names.includes(state.type)) typeEl.value = state.type;
    }
    function refreshNative(changed) {
        try {
            const all = window.EDUPATH_GET_GOAL_BANK_CONFIG?.();
            if (all) all[state.type] = merge(state.baseConfig, state.config);
            window.EDUPATH_REFRESH_GOALS_ADAPTIVE?.(changed === "category" ? "goalTypeSelect" : changed === "path" ? "goalCategorySelect" : "goalPathSelect");
        } catch (e) {}
    }
    function loadType(type) {
        state.type = type || state.type;
        fetch(`/api/admin/goal-bank/${encodeURIComponent(state.type)}`, { credentials: "same-origin" })
            .then(r => r.ok ? r.json() : {})
            .then(data => {
                state.publishedConfig = data.config || (window.EDUPATH_GOAL_BANK_OVERRIDES || {})[state.type] || {};
                state.draftConfig = data.draft_config || null;
                state.revisions = data.revisions || [];
                buildConfig();
                fillTypeSelect();
                refreshNative("goalTypeSelect");
                renderEditor();
                renderRevisions();
                setStatus(data.has_draft ? "توجد مسودة محفوظة لهذا النوع." : "جاهز للتعديل.");
            })
            .catch(() => {
                state.publishedConfig = (window.EDUPATH_GOAL_BANK_OVERRIDES || {})[state.type] || {};
                state.draftConfig = null;
                buildConfig(); fillTypeSelect(); refreshNative("goalTypeSelect"); renderEditor();
            });
    }
    function setStatus(text) { const el = $("adminGoalBankStatus"); if (el) el.textContent = text; }
    function renderTabs() {
        const box = $("adminGoalLevelTabs"); if (!box) return;
        box.innerHTML = "";
        LEVELS.forEach(l => {
            const b = document.createElement("button");
            b.type = "button"; b.className = l.key === state.level ? "active" : ""; b.textContent = l.label;
            b.addEventListener("click", () => { state.level = l.key; renderEditor(); });
            box.appendChild(b);
        });
    }
    function renderEditor() {
        renderTabs();
        const p = selectedPath();
        const summary = $("adminGoalPathSummary");
        if (summary) summary.textContent = `المسار الحالي: ${label(state.type)}${p.category ? " ← " + label(p.category) : ""}${p.path ? " ← " + label(p.path) : ""}`;
        const title = $("adminGoalCurrentFieldTitle");
        const levelInfo = LEVELS.find(x => x.key === state.level) || LEVELS[0];
        if (title) title.textContent = levelInfo.label;
        const list = getListForLevel(state.level);
        const box = $("adminGoalOptionsList"); if (!box) return;
        box.innerHTML = "";
        if (!list.length) {
            box.innerHTML = '<p class="muted">لا توجد خيارات في هذا المسار بعد.</p>';
            return;
        }
        list.forEach((item, index) => {
            const row = document.createElement("div"); row.className = "bank-option-row-v5600";
            row.innerHTML = `<strong>${label(item)}</strong><span class="muted">${item}</span>`;
            const actions = document.createElement("div"); actions.className = "actions";
            const mk = (txt, cls, fn) => { const b = document.createElement("button"); b.type="button"; b.className=cls||"small-button"; b.textContent=txt; b.addEventListener("click", fn); return b; };
            actions.appendChild(mk("تعديل الاسم", "small-button", () => renameOption(item)));
            actions.appendChild(mk("إخفاء آمن", "small-button warning", () => hideOption(item)));
            actions.appendChild(mk("حذف نهائي", "small-button danger", () => deleteOption(item)));
            actions.appendChild(mk("↑", "small-button", () => moveOption(index, -1)));
            actions.appendChild(mk("↓", "small-button", () => moveOption(index, 1)));
            actions.appendChild(mk("إدارة التفرعات", "small-button", () => openBranchesModal(item)));
            row.appendChild(actions); box.appendChild(row);
        });
    }
    function renameOption(oldName) {
        const next = prompt("اكتب الاسم الجديد مع الحفاظ على التفرعات التابعة:", oldName);
        if (!next || next === oldName) return;
        const list = getListForLevel(state.level).map(x => x === oldName ? next : x);
        if (state.level === "category" && state.config.paths) {
            state.config.paths[next] = state.config.paths[oldName] || state.config.paths[next] || [];
            delete state.config.paths[oldName];
        }
        if (state.level === "path" && state.config.states) {
            const cat = selectedPath().category || "أخرى";
            const oldKey = `${cat}::${oldName}`, newKey = `${cat}::${next}`;
            state.config.states[newKey] = state.config.states[oldKey] || state.config.states[next] || state.config.states[oldName] || {current:[],target:[],commitment:[]};
            delete state.config.states[oldKey];
            if (state.config.states[oldName]) { state.config.states[next] = state.config.states[oldName]; delete state.config.states[oldName]; }
        }
        setListForLevel(state.level, list);
    }
    function hideOption(item) {
        if (!confirm(`إخفاء آمن للخيار: ${item}؟`)) return;
        const list = getListForLevel(state.level).filter(x => x !== item);
        if (!state.config.hiddenByPath) state.config.hiddenByPath = {};
        const key = `${state.level}::${state.type}::${selectedPath().category || ""}::${selectedPath().path || ""}`;
        state.config.hiddenByPath[key] = unique([...(state.config.hiddenByPath[key] || []), item]);
        setListForLevel(state.level, list);
        renderHidden();
    }
    function deleteOption(item) {
        const typed = prompt(`هذا حذف نهائي من المسار الحالي فقط. اكتب اسم الخيار للتأكيد:\n${item}`);
        if (typed !== item) return;
        setListForLevel(state.level, getListForLevel(state.level).filter(x => x !== item));
    }
    function moveOption(index, dir) {
        const list = getListForLevel(state.level);
        const target = index + dir;
        if (target < 0 || target >= list.length) return;
        [list[index], list[target]] = [list[target], list[index]];
        setListForLevel(state.level, list);
    }
    function renderHidden() {
        const box = $("adminGoalHiddenList"); if (!box) return;
        const hidden = state.config.hiddenByPath || {};
        box.innerHTML = Object.keys(hidden).length ? Object.entries(hidden).map(([k, arr]) => `<div class="bank-revision-item-v5600"><strong>${k}</strong><span>${(arr||[]).join("، ")}</span></div>`).join("") : '<p class="muted">لا توجد خيارات مخفية.</p>';
    }
    function openAddModal() {
        const modal = $("goalAddOptionModal"); if (!modal) return;
        const child = getChildLevel(state.level);
        $("goalAddOptionTitle").textContent = `إضافة خيار في: ${(LEVELS.find(x=>x.key===state.level)||{}).label}`;
        $("goalNewOptionName").value = "";
        $("goalNewOptionBranches").value = "";
        $("goalNewOptionBranchesLabel").textContent = child ? `التفرعات التابعة الاختيارية (${child.label}) — اكتب كل تفرع في سطر` : "هذا المستوى لا يحتاج تفرعات تابعة";
        $("goalNewOptionBranches").disabled = !child;
        modal.hidden = false;
    }
    function closeAddModal() { const modal = $("goalAddOptionModal"); if (modal) modal.hidden = true; }
    function applyAddOption() {
        const name = ($("goalNewOptionName")?.value || "").trim();
        if (!name) { alert("اكتب اسم الخيار أولاً."); return; }
        const position = ($("goalNewOptionPosition") || {}).value || "end";
        const after = ($("goalNewOptionAfter") || {}).value || "";
        const list = getListForLevel(state.level).filter(x => x !== name);
        if (position === "start") list.unshift(name);
        else if (position === "after" && after && list.includes(after)) list.splice(list.indexOf(after)+1, 0, name);
        else list.push(name);
        const branches = (($("goalNewOptionBranches")?.value || "").split(/\n|،|,/).map(x => x.trim()).filter(Boolean));
        setListForLevel(state.level, list);
        if (branches.length) setChildBranches(state.level, name, branches);
        refreshNative(state.level);
        closeAddModal(); renderEditor(); setStatus("تمت إضافة الخيار وتفرعاته. احفظ كمسودة أو انشر التعديلات لتثبيتها.");
    }
    function openBranchesModal(item) {
        const child = getChildLevel(state.level);
        if (!child) { alert("هذا المستوى لا يحتوي تفرعات تابعة مباشرة."); return; }
        const current = state.level === "category" ? ((state.config.paths || {})[item] || []) : state.level === "path" ? ((state.config.states || {})[`${selectedPath().category || "أخرى"}::${item}`]?.current || []) : [];
        const text = prompt(`إدارة تفرعات ${item}\n${child.label}\nاكتب كل خيار في سطر:`, current.join("\n"));
        if (text === null) return;
        setChildBranches(state.level, item, text.split(/\n/).map(x=>x.trim()).filter(Boolean));
        refreshNative(state.level); renderEditor();
    }
    function manualOrder() {
        const text = prompt("اكتب كل خيار في سطر مستقل بالترتيب المطلوب:", getListForLevel(state.level).join("\n"));
        if (text === null) return;
        setListForLevel(state.level, text.split(/\n/).map(x=>x.trim()).filter(Boolean));
    }
    function editFieldLabel() { alert("تعديل اسم الخانة سيتم حفظه لهذا النوع فقط في labels. الخانات الافتراضية الحالية بقيت كما هي."); }
    function saveDraft() { save("draft"); }
    function publish() { save("publish"); }
    function save(mode) {
        const url = `/api/admin/goal-bank/${encodeURIComponent(state.type)}${mode === "draft" ? "/draft" : ""}`;
        fetch(url, { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ config: state.config, action: mode === "draft" ? "draft" : "publish", clear_draft: mode === "publish" }) })
            .then(r => r.json().then(data => ({ ok: r.ok, data })))
            .then(({ok, data}) => { if (!ok || !data.ok) throw new Error(data.message || "تعذر الحفظ"); setStatus(data.message || "تم الحفظ"); if (mode === "publish") window.EDUPATH_GOAL_BANK_OVERRIDES = Object.assign(window.EDUPATH_GOAL_BANK_OVERRIDES || {}, { [state.type]: state.config }); loadType(state.type); })
            .catch(err => alert(err.message || "تعذر الحفظ"));
    }
    function restoreDefault() {
        if (!confirm("استعادة الافتراضي لهذا النوع فقط؟")) return;
        fetch(`/api/admin/goal-bank/${encodeURIComponent(state.type)}/restore-default`, { method: "POST", credentials: "same-origin" }).then(r=>r.json()).then(data=>{ setStatus(data.message || "تمت الاستعادة"); state.draftConfig=null; state.publishedConfig={}; loadType(state.type); });
    }
    function rollback() {
        if (!confirm("استعادة آخر تعديل لهذا النوع فقط؟")) return;
        fetch(`/api/admin/goal-bank/${encodeURIComponent(state.type)}/rollback`, { method: "POST", credentials: "same-origin", headers:{"Content-Type":"application/json"}, body:"{}" }).then(r=>r.json()).then(data=>{ if(!data.ok) alert(data.message||"تعذر الاستعادة"); else { setStatus(data.message); loadType(state.type); } });
    }
    function renderRevisions() {
        const box = $("goalBankRevisionsList"); if (!box) return;
        box.innerHTML = state.revisions.length ? state.revisions.map(r => `<div class="bank-revision-item-v5600"><strong>${r.action}</strong><span>${r.created_at || ""}</span><button type="button" class="small-button" data-rev="${r.id}">استعادة هذه النسخة</button></div>`).join("") : '<p class="muted">لا توجد نسخ بعد.</p>';
        box.querySelectorAll("[data-rev]").forEach(btn => btn.addEventListener("click", () => {
            fetch(`/api/admin/goal-bank/${encodeURIComponent(state.type)}/rollback`, { method:"POST", credentials:"same-origin", headers:{"Content-Type":"application/json"}, body: JSON.stringify({revision_id: btn.dataset.rev}) }).then(r=>r.json()).then(data=>{ if(!data.ok) alert(data.message||"تعذر الاستعادة"); else loadType(state.type); });
        }));
    }
    function attach() {
        ["goalTypeSelect","goalCategorySelect","goalPathSelect","currentStateSelect","targetStateSelect","commitmentSelect"].forEach(id => {
            const el = $(id); if (el) el.addEventListener("change", () => setTimeout(syncTypeFromForm, 40));
        });
        $("addGoalOptionBtn")?.addEventListener("click", openAddModal);
        $("closeGoalAddOptionBtn")?.addEventListener("click", closeAddModal);
        $("applyGoalAddOptionBtn")?.addEventListener("click", applyAddOption);
        $("manualOrderGoalBtn")?.addEventListener("click", manualOrder);
        $("editGoalFieldLabelBtn")?.addEventListener("click", editFieldLabel);
        $("saveDraftGoalBankBtn")?.addEventListener("click", saveDraft);
        $("publishGoalBankBtn")?.addEventListener("click", publish);
        $("restoreDefaultGoalBankBtn")?.addEventListener("click", restoreDefault);
        $("rollbackGoalBankBtn")?.addEventListener("click", rollback);
        $("previewGoalBankBtn")?.addEventListener("click", () => alert("النموذج العلوي هو المعاينة المطابقة لصفحة الأهداف."));
        const observerTarget = $("adaptiveGoalBox");
        if (observerTarget && window.MutationObserver) new MutationObserver(() => setTimeout(renderEditor, 30)).observe(observerTarget, { childList:true, subtree:true });
        setInterval(syncTypeFromForm, 1200);
    }
    document.addEventListener("DOMContentLoaded", function () {
        if (!$("adminGoalBankPage")) return;
        fillTypeSelect();
        state.type = $("goalTypeSelect")?.value || state.type;
        attach();
        if (window.EDUPATH_GOAL_BANK_BOOT) window.EDUPATH_GOAL_BANK_BOOT().then(() => loadType(state.type));
        else loadType(state.type);
    });
})();
